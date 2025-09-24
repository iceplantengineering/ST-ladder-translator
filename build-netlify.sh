#!/bin/bash

echo "Starting Netlify build..."

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "Error: frontend directory not found"
    exit 1
fi

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Build the project
echo "Building frontend..."
npm run build

# Check if build succeeded
if [ $? -ne 0 ]; then
    echo "Error: Frontend build failed"
    exit 1
fi

echo "Build completed successfully!"