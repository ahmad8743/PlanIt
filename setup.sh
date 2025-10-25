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

# Create virtual environment for Python
echo "📦 Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

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

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file and add your Google Maps API key"
fi

# Create creds.py for street view sampling
if [ ! -f street-view-sampling/creds.py ]; then
    echo "📝 Creating creds.py template..."
    cat > street-view-sampling/creds.py << EOF
# Add your Google Maps API key here
GOOGLE_MAPS_API_KEY = "your_google_maps_api_key_here"
EOF
    echo "⚠️  Please edit street-view-sampling/creds.py and add your Google Maps API key"
fi

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your Google Maps API key"
echo "2. Edit street-view-sampling/creds.py and add your Google Maps API key"
echo "3. Run './start.sh' to start the development servers"
echo ""
echo "Available commands:"
echo "  ./start.sh          - Start both frontend and backend"
echo "  ./start-backend.sh  - Start only backend"
echo "  ./start-frontend.sh - Start only frontend"
echo "  ./stop.sh           - Stop all services"
