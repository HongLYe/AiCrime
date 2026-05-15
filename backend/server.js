const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 🎯 Auto-detect: PostgreSQL for production, SQLite for local dev
const isProduction = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;

let db; // Will hold either pg Pool or sqlite3 Database

async function initDatabase() {
  if (isProduction) {
    // ✅ PostgreSQL (Render)
    const { Pool } = require('pg');
    db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    // Test connection & create table
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      console.log('✅ Connected to PostgreSQL');
    } catch (err) {
      console.error('❌ PostgreSQL init failed:', err.message);
      process.exit(1);
    }
  } else {
    // ✅ SQLite (local development)
    try {
      const sqlite3 = require('sqlite3').verbose();
      const dbPath = path.join(__dirname, '../data/auth_study.db');
      
      // Ensure data directory exists
      const dataDir = path.dirname(dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      db = new sqlite3.Database(dbPath, (err) => {
        if (err) throw err;
        console.log(`✅ Connected to SQLite at ${dbPath}`);
      });
      
      // Create table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) console.error('❌ SQLite table creation failed:', err.message);
      });
    } catch (err) {
      console.warn('⚠️ SQLite not available (optional for local dev). App will work with PostgreSQL only.');
      console.warn('   To enable SQLite locally: npm install sqlite3');
    }
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// ✅ Health check for Render
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: isProduction ? 'postgresql' : (db ? 'sqlite3' : 'none'),
    timestamp: new Date().toISOString() 
  });
});

// 🔐 Login endpoint (works with both databases)
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    let user;
    if (isProduction) {
      // PostgreSQL query
      const result = await db.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      user = result.rows[0];
    } else if (db) {
      // SQLite query
      user = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
          if (err) reject(err); else resolve(row);
        });
      });
    } else {
      return res.status(503).json({ error: 'Database not available' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ 
      message: 'Login successful', 
      user: { id: user.id, username: user.username } 
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔐 Register endpoint (works with both databases)
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    let existing;
    if (isProduction) {
      const result = await db.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      existing = result.rows[0];
    } else if (db) {
      existing = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
          if (err) reject(err); else resolve(row);
        });
      });
    } else {
      return res.status(503).json({ error: 'Database not available' });
    }

    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    if (isProduction) {
      await db.query(
        'INSERT INTO users (username, password) VALUES ($1, $2)',
        [username, hashedPassword]
      );
    } else if (db) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (username, password) VALUES (?, ?)',
          [username, hashedPassword],
          function(err) {
            if (err) reject(err); else resolve(this);
          }
        );
      });
    } else {
      return res.status(503).json({ error: 'Database not available' });
    }

    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    // Handle unique constraint errors
    if (error.message?.includes('unique') || error.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Optional: Get users endpoint (for testing - remove in production)
app.get('/api/users', async (req, res) => {
  try {
    let rows;
    if (isProduction) {
      const result = await db.query(
        'SELECT id, username, created_at FROM users ORDER BY created_at DESC'
      );
      rows = result.rows;
    } else if (db) {
      rows = await new Promise((resolve, reject) => {
        db.all('SELECT id, username, created_at FROM users ORDER BY created_at DESC', [], (err, results) => {
          if (err) reject(err); else resolve(results);
        });
      });
    } else {
      return res.status(503).json({ error: 'Database not available' });
    }
    res.json({ users: rows });
  } catch (error) {
    console.error('❌ Fetch users error:', error.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Catch-all for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// ✅ Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down...');
  if (isProduction && db) {
    await db.end();
  } else if (db) {
    db.close();
  }
  process.exit(0);
});

// 🚀 Start server
async function start() {
  await initDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
    console.log(`🗄️  Database: ${isProduction ? 'PostgreSQL (production)' : (db ? 'SQLite (local)' : 'None')}`);
  });
}

start().catch(err => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});

module.exports = app;
