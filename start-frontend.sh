#!/bin/bash

# PlanIt Frontend Server Startup Script
echo "🎨 Starting PlanIt frontend server..."

# Check if node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "❌ Frontend dependencies not found. Please run './setup.sh' first."
    exit 1
fi

# Start frontend
cd frontend
echo "🚀 Starting React development server on http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
npm start
