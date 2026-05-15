const express = require('express');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000; // ✅ Render-compatible port

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ✅ Production-ready database path
const isProduction = process.env.NODE_ENV === 'production';
const dbPath = isProduction 
  ? '/app/data/auth_study.db'  // Render's writable path
  : path.join(__dirname, '../data/auth_study.db'); // Local dev

// Ensure data directory exists (critical for Render)
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`📁 Created data directory: ${dataDir}`);
}

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to SQLite database:', err.message);
    return;
  }
  console.log(`✅ Connected to SQLite database at ${dbPath}`);
  
  // Create tables if they don't exist
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('❌ Error creating users table:', err.message);
    else console.log('✅ Users table ready');
  });
});

// ✅ Health check endpoint (for Render uptime monitoring)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      `INSERT INTO users (username, password) VALUES (?, ?)`,
      [username, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(409).json({ error: 'Username already exists' });
          }
          console.error('❌ Registration error:', err.message);
          return res.status(500).json({ error: 'Registration failed' });
        }
        res.status(201).json({ 
          message: 'User registered successfully', 
          userId: this.lastID 
        });
      }
    );
  } catch (error) {
    console.error('❌ Server error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    async (err, user) => {
      if (err) {
        console.error('❌ Login query error:', err.message);
        return res.status(500).json({ error: 'Login failed' });
      }
      
      if (!user) {
        // Generic message prevents user enumeration
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // ✅ Success - in production, add JWT/session here
      res.json({ 
        message: 'Login successful', 
        user: { id: user.id, username: user.username }
      });
    }
  );
});

// Get all users (for testing only - remove in production!)
app.get('/api/users', (req, res) => {
  db.all(`SELECT id, username, created_at FROM users`, [], (err, rows) => {
    if (err) {
      console.error('❌ Fetch users error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    res.json({ users: rows });
  });
});

// Catch-all for SPA routing (if you add React/Vue later)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ✅ Graceful shutdown for production
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, closing database...');
  db.close((err) => {
    if (err) console.error('❌ Error closing database:', err.message);
    else console.log('✅ Database closed');
    process.exit(0);
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} in ${isProduction ? 'production' : 'development'} mode`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app; // For testing
