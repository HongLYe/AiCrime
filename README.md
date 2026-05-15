# 🔐 AiCrime - Authentication Study Project

A secure, Express.js-based authentication system built for learning and portfolio demonstration. Features user registration, login with bcrypt password hashing, and SQLite database integration.

> 🎓 **Purpose**: Educational project to practice secure authentication patterns, API design, and deployment workflows.

[![Render](https://img.shields.io/badge/Deployed%20on-Render-44cc11?logo=render)](https://render.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

- 🔐 **User Registration**: Secure signup with bcrypt(10) password hashing
- 🔑 **Login System**: Authentication with generic error messages (prevents user enumeration)
- 🛡️ **SQL Injection Protection**: Parameterized queries with SQLite
- 📦 **SQLite Database**: Lightweight, file-based storage for local development
- 🌐 **Static Frontend Serving**: Express serves HTML/CSS/JS from `/public`
- 🩺 **Health Check Endpoint**: `/api/health` for uptime monitoring
- 🔄 **Production-Ready**: Environment variable support, dynamic paths, graceful shutdown
- 📚 **Well-Documented**: Clear code comments and API documentation

---

## 🚀 Live Demo

> 🔗 **Demo URL**: [https://aicrime-auth.onrender.com](https://aicrime-auth.onrender.com)  
> *(Replace with your actual Render URL after deployment)*

> ⚠️ **Note**: On Render's free tier, the SQLite database resets after redeploy or 15 minutes of inactivity. This is expected behavior for demo purposes.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js 18+ |
| **Framework** | Express.js 4.x |
| **Database** | SQLite3 (local) / PostgreSQL (production-ready) |
| **Security** | bcrypt 5.x (password hashing) |
| **Package Manager** | npm |
| **Deployment** | Render.com (free tier) |
| **Testing** | Manual + Postman (automated tests planned) |

---

## 📦 Installation (Local Development)

### Prerequisites
- Node.js 18 or higher ([Download](https://nodejs.org))
- npm (comes with Node.js)
- Git

### Steps
```bash
# 1. Clone the repository
git clone https://github.com/HongLYe/AiCrime.git
cd AiCrime

# 2. Install dependencies
npm install

# 3. Create environment file (optional for local dev)
cp .env.example .env

# 4. Start the development server
npm start

## 🚀 Running the Project

```bash
npm install
npm start
# Server: http://localhost:3000
# Health: http://localhost:3000/api/health
