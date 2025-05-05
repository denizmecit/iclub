#!/bin/bash

# Start MongoDB and backend server
echo "Starting backend server..."
cd backend
npm run dev &

# Wait for backend to start (reduced wait time)
echo "Waiting for backend to start..."
sleep 3

# Start the frontend server
echo "Starting frontend server..."
cd ../frontend
npm start 