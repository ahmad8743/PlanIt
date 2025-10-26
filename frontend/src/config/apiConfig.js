// API Configuration for different environments
const apiConfig = {
  // Environment detection
  isProduction: process.env.NODE_ENV === 'production',
  isAWS: process.env.REACT_APP_DEPLOYMENT === 'aws',
  
  // API Base URLs
  local: {
    baseUrl: 'http://localhost:8000',
    apiUrl: 'http://localhost:8000/api'
  },
  
  aws: {
    baseUrl: process.env.REACT_APP_AWS_API_URL || 'https://your-aws-api-domain.com',
    apiUrl: process.env.REACT_APP_AWS_API_URL || 'https://your-aws-api-domain.com/api'
  },
  
  // Get current API configuration
  getCurrentConfig() {
    if (this.isAWS) {
      return this.aws;
    }
    return this.local;
  },
  
  // Get API base URL
  getApiUrl() {
    return this.getCurrentConfig().apiUrl;
  },
  
  // Get base URL
  getBaseUrl() {
    return this.getCurrentConfig().baseUrl;
  },
  
  // Get full endpoint URL
  getEndpoint(endpoint) {
    const baseUrl = this.getBaseUrl();
    return `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  },
  
  // Get API endpoint URL
  getApiEndpoint(endpoint) {
    const apiUrl = this.getApiUrl();
    return `${apiUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  }
};

// Export the configuration
export default apiConfig;

// Export commonly used functions for convenience
export const getApiUrl = () => apiConfig.getApiUrl();
export const getBaseUrl = () => apiConfig.getBaseUrl();
export const getEndpoint = (endpoint) => apiConfig.getEndpoint(endpoint);
export const getApiEndpoint = (endpoint) => apiConfig.getApiEndpoint(endpoint);
export const isAWS = () => apiConfig.isAWS;
export const isProduction = () => apiConfig.isProduction;
