#!/bin/bash

# PlanIt Environment Setup Script
echo "🚀 Setting up PlanIt development environment..."

# Check if Python 3.8+ is installed
python_version=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.8+ is required. Current version: $python_version"
    echo "Please install Python 3.8 or higher and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check Node.js version
node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 16 ]; then
    echo "❌ Node.js 16+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Python and Node.js versions are compatible"

# Check if conda environment exists
if ! conda env list | grep -q "^PlanIt "; then
    echo "❌ Conda environment 'PlanIt' not found."
    echo "Please create it with: conda env create -f env.yml"
    exit 1
fi

echo "✅ Conda environment 'PlanIt' found"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p images
mkdir -p models
mkdir -p logs



echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Create a creds directory and add creds.py file with the following variables: GOOGLE_MAPS_API_KEY, ZILLIZ_URI, ZILLIZ_TOKEN, ZILLIZ_COLLECTION"
echo "2. Create a creds.js file with the following variables: GOOGLE_MAPS_API_KEY"
echo ""
echo "Available commands:"
echo "  ./start.sh          - Start both frontend and backend"
echo "  ./start-backend.sh  - Start only backend"
echo "  ./start-frontend.sh - Start only frontend"
echo "  ./stop.sh           - Stop all services"
