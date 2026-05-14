# Authentication Study Project

## Overview
This is a local-only authentication study project using Express, SQLite, and bcryptjs. The project demonstrates a complete authentication flow with user registration, login, and real-time form validation.
## Features
- User registration with bcrypt(12) hashing
- User login with validation
- Simple HTML form with real-time validation
- Clean, beginner-friendly code
- Persistent user data using SQLite
- Password hashing and verification using bcryptjs
- Session-based authentication for logged-in users

## Web Functionality Details

### 1. User Registration
- Accepts username and password input from the HTML form
- Validates that the username is unique
- Hashes the password using bcryptjs with a cost factor of 12
- Stores the hashed password and username in an SQLite database
- Displays success or error messages to the user

### 2. User Login
- Accepts username and password input from the HTML form
- Validates that the username exists in the database
- Verifies the password against the stored hash using bcryptjs
- Creates a session for authenticated users
- Redirects to a protected page if authentication is successful
- Displays error messages for invalid credentials

### 3. Real-Time Form Validation
- Validates username and password fields as the user types
- Ensures username is not empty and is unique
- Ensures password meets minimum length requirements
- Provides immediate feedback to the user

### 4. Protected Routes
- Displays a welcome message for authenticated users
- Shows user details (username and login time)
- Provides a logout functionality to end the session

## Getting Started
1. Clone the repository
2. Install dependencies
3. Run the server

## Installation

## Running the Project
```bash
node app.js
``` 

## Technologies Used
- **Express.js**: For building the web server
- **SQLite**: For storing user data
- **bcryptjs**: For secure password hashing
- **HTML/CSS/JavaScript**: For the front-end interface and real-time validation

## NPM Commands
- `npm install`: Installs all required dependencies
- `npm start`: Starts the development server (equivalent to `node app.js`)
- `npm test`: Runs any test scripts (if implemented)
- `npm run build`: Builds the project (if applicable)

This project is ideal for learning about authentication fundamentals, including password security, session management, and database integration.

