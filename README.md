# Authentication Study Project (AiCrime)

## Overview
A local-first authentication study project using Express, SQLite, and bcryptjs. Demonstrates user registration, login, and real-time form validation.

> 🔐 **Security Note**: This project uses SQLite for local development. The `data/` folder is excluded from version control. For production deployments, consider migrating to PostgreSQL.

## Features
- ✅ User registration with bcrypt password hashing (cost factor: 10)
- ✅ User login with credential validation
- ✅ Simple HTML form with client-side validation
- ✅ Clean, beginner-friendly Express.js code
- ✅ Persistent user data using SQLite (local only)
- ✅ Parameterized SQL queries (safe from injection)

## ⚠️ Important Notes
- **No session management**: This is a stateless API demo. Sessions are not implemented.
- **SQLite is ephemeral on cloud platforms**: User data resets on redeploy when using free-tier hosting like Render.
- **For production**: Migrate to PostgreSQL and add environment variable management.

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
git clone https://github.com/HongLYe/AiCrime.git
cd AiCrime
npm install
