const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs'); // ✅ Matches your package.json

const app = express();

// ✅ Render-compatible port
const PORT = process.env.PORT || 3000;

// ✅ Production-ready database path
const isProduction = process.env.NODE_ENV === 'production';
const dbPath = isProduction 
  ? '/app/data/auth_study.db'  // Render's writable path
  : path.join(__dirname, '../data/auth_study.db'); // Local dev

// ✅ Ensure data directory exists (critical for Render)
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`📁 Created data directory: ${dataDir}`);
}

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to SQLite:', err.message);
    return;
  }
  console.log(`✅ Connected to SQLite at ${dbPath}`);
  
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('❌ Table creation error:', err.message);
    else console.log('✅ Users table ready');
  });
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Fallback route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// ✅ Health check for Render uptime monitoring
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isValid = await new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) reject(err); else resolve(result);
      });
    });

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ message: 'Login successful', user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
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

    const existing = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) reject(err); else resolve(row);
      });
    });

    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const hashedPassword = await new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => { // ✅ Cost factor 10 (matches code)
        if (err) reject(err); else resolve(hash);
      });
    });

    await new Promise((resolve, reject) => {
      db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, 
        [username, hashedPassword], 
        function(err) {
          if (err) reject(err); else resolve(this);
        }
      );
    });

    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Graceful shutdown for production
process.on('SIGTERM', () => {
  console.log('🔄 Shutting down gracefully...');
  db.close((err) => {
    if (err) console.error('❌ DB close error:', err.message);
    process.exit(0);
  });
});

// Start server - bind to 0.0.0.0 for Render
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
  console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;
