#!/bin/bash

# Clean up old database
rm -f ../data/auth_study.db

# Start the server
node ../backend/server.js &

# Wait for server to start
sleep 2

# Test registration
curl -X POST http://localhost:3000/api/register -H "Content-Type: application/json" -d '{"username":"testuser","password":"testpass"}'

# Test login
curl -X POST http://localhost:3000/api/login -H "Content-Type: application/json" -d '{"username":"testuser","password":"testpass"}'

# Wait for user input
read -p "Press Enter to stop the server..."

# Terminate server process
pkill -f 'node ../server.js'