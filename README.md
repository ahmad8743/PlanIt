# PlanIt - Intelligent Location Planning Platform

PlanIt is a full-stack application that combines machine learning, street view analysis, and interactive mapping to help users find optimal locations based on their preferences.

## 🏗️ Architecture

- **Frontend**: React 19 with React Router for dynamic UI
- **Backend**: FastAPI with Python for high-performance API
- **Machine Learning**: PyTorch-based feature extractors (CLIP, SigLIP)
- **Street View**: Google Street View API integration for location analysis
- **Data Processing**: NumPy, Pandas for efficient data manipulation

## 🚀 Quick Start

### Prerequisites

- Python 3.8+ 
- Node.js 16+
- Google Maps API Key

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd PlanIt

# Run the setup script
./setup.sh

# Start development servers
./start.sh
```

### Option 2: Manual Setup

#### Backend Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
cd backend
uvicorn main:app --reload
```

#### Frontend Setup

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm start
```

### Option 3: Docker Setup

```bash
# Development with Docker Compose
docker-compose -f docker-compose.dev.yml up

# Production with Docker Compose
docker-compose up
```

## 📁 Project Structure

```
PlanIt/
├── backend/                 # FastAPI backend
│   ├── logic/              # Business logic
│   └── routers/            # API routes
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   └── services/      # API services
├── app/                    # Machine learning modules
├── street-view-sampling/   # Google Street View integration
├── requirements.txt        # Python dependencies
├── package.json           # Node.js dependencies
└── docker-compose.yml     # Docker configuration
```

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
```

Required variables:
- `GOOGLE_MAPS_API_KEY`: Your Google Maps API key
- `ZILLIZ_URI`: Your Zilliz vector database URI
- `ZILLIZ_TOKEN`: Your Zilliz API token
- `ZILLIZ_COLLECTION`: Collection name (default: planit_siglip2)
- `BACKEND_PORT`: Backend server port (default: 8000)
- `FRONTEND_PORT`: Frontend server port (default: 3000)

### Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps JavaScript API
   - Street View Static API
   - Geocoding API
3. Create an API key
4. Add the key to your `.env` file

### Zilliz Vector Database Setup

1. Sign up for [Zilliz Cloud](https://cloud.zilliz.com/)
2. Create a new cluster
3. Get your cluster URI and API token
4. Add them to your `.env` file
5. Ensure your collection contains location embeddings with the following schema:
   - `id`: Primary key
   - `embedding`: Vector field (768 dimensions for SigLIP2)
   - `caption`: Text description
   - `path`: File path or location identifier

## 🛠️ Development

### Available Scripts

```bash
# Setup environment
./setup.sh

# Start all services
./start.sh

# Start only backend
./start-backend.sh

# Start only frontend  
./start-frontend.sh

# Stop all services
./stop.sh
```

### Docker Commands

```bash
# Development environment
docker-compose -f docker-compose.dev.yml up

# Production environment
docker-compose up

# Street View sampling
docker-compose --profile streetview up streetview

# Build images
docker-compose build
```

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📊 API Documentation

Once the backend is running, visit:
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔍 Search Functionality

The application includes a powerful AI-powered search system:

### Search Page (`/search`)
- **Natural Language Search**: Search locations using descriptive text
- **SigLIP2 Embeddings**: Uses Google's SigLIP2 model for semantic understanding
- **Heatmap Visualization**: Displays top 50 results as an interactive heatmap
- **Softmax Scoring**: Applies softmax normalization for better visualization
- **Interactive Results**: Click on heatmap cells to see detailed information

### API Endpoints
- `POST /api/search`: Search locations using text queries
- `GET /api/search/health`: Health check for search service

### Example Queries
- "schools near parks"
- "restaurants with outdoor seating"
- "quiet residential areas"
- "busy commercial districts"

## 🎯 Features

- **Interactive Heatmaps**: Visualize location preferences
- **AI-Powered Search**: Search locations using natural language with SigLIP2 embeddings
- **Search Results Heatmap**: Visualize top 50 search results with softmax scoring
- **Street View Analysis**: AI-powered location assessment
- **Filter System**: Customizable location criteria
- **Real-time Updates**: Dynamic filtering and visualization
- **Machine Learning**: Advanced feature extraction using CLIP/SigLIP models

## 🔍 Machine Learning Models

The application supports multiple feature extractors:

- **OpenAI CLIP**: Vision-language understanding
- **SigLIP**: Google's vision-language model
- **OpenCLIP**: Open-source CLIP implementation

## 📈 Performance

- **Backend**: FastAPI with async support
- **Frontend**: React 19 with optimized rendering
- **ML**: GPU-accelerated inference (CUDA support)
- **Caching**: Intelligent model and data caching

## 🚀 Deployment

### Production Deployment

```bash
# Build production image
docker build -t planit:latest .

# Run production container
docker run -p 8000:8000 --env-file .env planit:latest
```

### Environment-Specific Configuration

- **Development**: Hot reload, debug mode
- **Production**: Optimized builds, security headers
- **Testing**: Isolated test environment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000 and 8000 are available
2. **API key issues**: Verify your Google Maps API key is valid
3. **Dependencies**: Run `./setup.sh` to ensure all dependencies are installed
4. **Docker issues**: Check Docker daemon is running

### Getting Help

- Check the API documentation at http://localhost:8000/docs
- Review the logs in the `logs/` directory
- Ensure all environment variables are properly set