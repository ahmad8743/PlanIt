#!/bin/bash

# PlanIt Backend Server Startup Script
echo "🔧 Starting PlanIt backend server..."

# Initialize conda for bash shell
eval "$(conda shell.bash hook)"

# Activate conda environment
echo "🐍 Activating conda environment 'PlanIt'..."
conda activate PlanIt

if [ $? -ne 0 ]; then
    echo "❌ Failed to activate conda environment 'PlanIt'"
    echo "Please make sure the environment exists and run './setup.sh' first."
    exit 1
fi


# Start backend
cd backend
echo "🚀 Starting FastAPI server on http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
