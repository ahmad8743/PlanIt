#!/bin/bash

# PlanIt Backend Server Startup Script
echo "🔧 Starting PlanIt backend server..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run './setup.sh' first."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please run './setup.sh' first."
    exit 1
fi

# Start backend
cd backend
echo "🚀 Starting FastAPI server on http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
