#!/bin/bash

# PlanIt Development Server Startup Script
echo "🚀 Starting PlanIt development environment..."

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


# Start backend in background
echo "🔧 Starting backend server..."
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Save PIDs for cleanup
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

echo ""
echo "🎉 Development servers started!"
echo ""
echo "📊 Backend API: http://localhost:8000"
echo "📊 API Docs: http://localhost:8000/docs"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo "Or run './stop.sh' to stop services"

# Wait for user interrupt
trap 'echo ""; echo "🛑 Stopping services..."; ./stop.sh; exit 0' INT

# Keep script running
wait
