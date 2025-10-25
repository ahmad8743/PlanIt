# PlanIt Makefile - Development and deployment commands

.PHONY: help setup start stop clean test build deploy

# Default target
help:
	@echo "PlanIt Development Commands"
	@echo "=========================="
	@echo ""
	@echo "Setup:"
	@echo "  setup          - Set up development environment"
	@echo "  install        - Install all dependencies"
	@echo ""
	@echo "Development:"
	@echo "  start          - Start all development servers"
	@echo "  start-backend  - Start only backend server"
	@echo "  start-frontend - Start only frontend server"
	@echo "  stop           - Stop all servers"
	@echo ""
	@echo "Docker:"
	@echo "  docker-dev     - Start development with Docker"
	@echo "  docker-prod    - Start production with Docker"
	@echo "  docker-build - Build Docker images"
	@echo ""
	@echo "Testing:"
	@echo "  test           - Run all tests"
	@echo "  test-backend   - Run backend tests"
	@echo "  test-frontend  - Run frontend tests"
	@echo ""
	@echo "Utilities:"
	@echo "  clean          - Clean up generated files"
	@echo "  lint           - Run linting"
	@echo "  format         - Format code"

# Setup commands
setup:
	@echo "🚀 Setting up PlanIt development environment..."
	./setup.sh

install:
	@echo "📦 Installing dependencies..."
	pip install -r requirements.txt
	cd frontend && npm install

# Development commands
start:
	@echo "🚀 Starting PlanIt development servers..."
	./start.sh

start-backend:
	@echo "🔧 Starting backend server..."
	./start-backend.sh

start-frontend:
	@echo "🎨 Starting frontend server..."
	./start-frontend.sh

stop:
	@echo "🛑 Stopping all servers..."
	./stop.sh

# Docker commands
docker-dev:
	@echo "🐳 Starting development environment with Docker..."
	docker-compose -f docker-compose.dev.yml up --build

docker-prod:
	@echo "🐳 Starting production environment with Docker..."
	docker-compose up --build

docker-build:
	@echo "🔨 Building Docker images..."
	docker-compose build

docker-clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down --volumes --remove-orphans
	docker system prune -f

# Testing commands
test: test-backend test-frontend

test-backend:
	@echo "🧪 Running backend tests..."
	cd backend && python -m pytest

test-frontend:
	@echo "🧪 Running frontend tests..."
	cd frontend && npm test

# Code quality commands
lint:
	@echo "🔍 Running linting..."
	flake8 backend/ app/
	cd frontend && npm run lint

format:
	@echo "✨ Formatting code..."
	black backend/ app/
	cd frontend && npm run format

# Utility commands
clean:
	@echo "🧹 Cleaning up generated files..."
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf frontend/build
	rm -rf frontend/node_modules
	rm -rf venv
	rm -rf .pytest_cache
	rm -rf logs/*.log

# Development workflow
dev: setup start

# Production deployment
deploy:
	@echo "🚀 Deploying to production..."
	docker-compose -f docker-compose.yml up -d

# Street View sampling
streetview:
	@echo "📸 Running Street View sampling..."
	docker-compose --profile streetview up streetview
