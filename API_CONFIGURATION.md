# API Configuration Guide

This guide explains how to configure the API endpoints for different deployment environments.

## Configuration Files

### `frontend/src/config/apiConfig.js`
This file contains the main API configuration logic that automatically detects the environment and uses the appropriate API URLs.

### `frontend/env.example`
Example environment variables file showing how to configure for different deployments.

## Environment Detection

The configuration automatically detects the environment based on:

1. **`NODE_ENV`**: Set by Create React App (`development` or `production`)
2. **`REACT_APP_DEPLOYMENT`**: Custom environment variable (`aws` for AWS deployment)

## Configuration Options

### Local Development (Default)
- **API URL**: `http://localhost:8000/api`
- **Base URL**: `http://localhost:8000`
- **Environment**: `development`

### AWS Deployment
- **API URL**: `https://your-aws-api-domain.com/api`
- **Base URL**: `https://your-aws-api-domain.com`
- **Environment**: `production`

## Setup Instructions

### For Local Development
1. Start your backend server on `http://localhost:8000`
2. Start your frontend with `npm start`
3. The configuration will automatically use local URLs

### For AWS Deployment
1. Set environment variables in your deployment platform:
   ```bash
   REACT_APP_DEPLOYMENT=aws
   REACT_APP_AWS_API_URL=https://your-actual-aws-domain.com
   REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

2. Build the frontend:
   ```bash
   npm run build
   ```

3. Deploy the `build` folder to your hosting platform

## Usage in Components

All pages now use the configuration automatically:

```javascript
import { getApiEndpoint } from '../config/apiConfig';

// This will automatically use the correct API URL
const response = await fetch(getApiEndpoint('/search'), {
  method: 'POST',
  // ... rest of your fetch config
});
```

## Available Functions

- `getApiUrl()`: Returns the full API URL
- `getBaseUrl()`: Returns the base URL without `/api`
- `getApiEndpoint(endpoint)`: Returns full API endpoint URL
- `getEndpoint(endpoint)`: Returns base endpoint URL
- `isAWS()`: Returns true if deployed to AWS
- `isProduction()`: Returns true if in production mode

## Pages Updated

✅ **ChatPage.jsx** - Now uses `getApiEndpoint('/update-from-sliders')`
✅ **LandingPage.jsx** - Now uses `getApiEndpoint('/process-filters')`
✅ **SearchHeatmapPage.jsx** - Now uses `getApiEndpoint('/search')`

All hardcoded API URLs have been replaced with dynamic configuration.
