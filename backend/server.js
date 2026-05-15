// backend/server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();

// ✅ Production-ready: Use env var for port (Render sets this automatically)
const PORT = process.env.PORT || 3000;

// ✅ Production-ready: Use writable path for Render + fallback for local dev
const dbPath = process.env.NODE_ENV === 'production'
  ? '/app/data/auth_study.db'  // Render's persistent writable path
  : path.join(__dirname, '../data/auth_study.db'); // Local development

// Create SQLite database and table
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to SQLite database:', err.message);
    return;
  }
  console.log('✅ Connected to SQLite database at:', dbPath);

  // Create users table if it doesn't exist
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating users table:', err.message);
    } else {
      console.log('✅ Users table is ready');
    }
  });
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Fallback route to serve login.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// API routes
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username
    const userRow = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!userRow) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare password
    const isValid = await new Promise((resolve, reject) => {
      bcrypt.compare(password, userRow.password, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ message: 'Login successful', username: userRow.username });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if username already exists
    const userRow = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (userRow) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password - ✅ Using cost factor 10 (matches your current code)
    const hashedPassword = await new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) reject(err);
        else resolve(hash);
      });
    });

    // Insert new user
    const insertQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    const result = await new Promise((resolve, reject) => {
      db.run(insertQuery, [username, hashedPassword], function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });

    res.json({ message: 'Registration successful', userId: result.lastID });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// ✅ Graceful shutdown for production
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) console.error('Error closing database:', err.message);
    console.log('Database connection closed');
    process.exit(0);
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Authentication Study Server running on port ${PORT}`);
  console.log(`📁 Database path: ${dbPath}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});
