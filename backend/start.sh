#!/bin/bash

# Start MongoDB
echo "Starting MongoDB..."
mongod --dbpath ~/data/db &

# Wait for MongoDB to start
echo "Waiting for MongoDB to start..."
sleep 5

# Start the backend server
echo "Starting backend server..."
cd /Users/denizmecit/Desktop/grad\ project/iclub/backend
npm run dev 