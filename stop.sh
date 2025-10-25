#!/bin/bash

# PlanIt Development Server Stop Script
echo "🛑 Stopping PlanIt development servers..."

# Stop backend if PID file exists
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "🛑 Stopping backend server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
    fi
    rm .backend.pid
fi

# Stop frontend if PID file exists
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "🛑 Stopping frontend server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
    fi
    rm .frontend.pid
fi

# Kill any remaining processes on the ports
echo "🧹 Cleaning up any remaining processes on ports 3000 and 8000..."

# Kill processes on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Kill processes on port 8000 (backend)
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

echo "✅ All services stopped"
