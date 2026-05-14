const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();

// Create SQLite database and table
const db = new sqlite3.Database(path.join(__dirname, '../data/auth_study.db'), (err) => {
    if (err) {
    console.error('Error connecting to SQLite database:', err.message);
    return;
  }
  console.log('Connected to SQLite database');

  // Create users table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
        )`, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            } else {
      console.log('Users table is ready (or already exists)');
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

  // Find user by username
  const userRow = await new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
        });
    });

  if (!userRow) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Compare password
  const isValid = await new Promise((resolve, reject) => {
    bcrypt.compare(password, userRow.password, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  res.json({ message: 'Login successful' });
});

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

  // Check if username already exists
  const userRow = await new Promise((resolve, reject) => {
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
                resolve(row);
      }
            });
        });

  if (userRow) {
    return res.status(400).json({ error: 'Username already exists' });
        }

  // Hash password
  const hashedPassword = await new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });

  // Insert new user
  const insertQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
  const insertStmt = db.prepare(insertQuery);
  const result = insertStmt.run([username, hashedPassword]);

  if (result.changes === 0) {
    return res.status(500).json({ error: 'Registration failed' });
  }

  res.json({ message: 'Registration successful' });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Authentication Study Server running securely on http://localhost:${PORT}`);
    console.log(`Database file: auth_study.db`);
});
