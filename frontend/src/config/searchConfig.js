// Search configuration settings
export const searchConfig = {
  // Number of search results to return
  topK: 2500,
  
  // Softmax temperature for score normalization
  softmaxTemperature: 0.01,
  
  // Heatmap intensity multiplier for visualization
  heatmapIntensityMultiplier: 1000,
  
  // Default search parameters
  defaultParams: {
    top_k: 1000,
    softmax_temperature: 1.0
  },
  
  // Heatmap visualization settings
  heatmap: {
    defaultRadius: 40,
    defaultOpacity: 0.8,
    minRadius: 10,
    maxRadius: 100,
    minOpacity: 0.1,
    maxOpacity: 1.0
  },
  
  // Map settings
  map: {
    defaultCenter: {
      lat: 38.6270, // St. Louis coordinates
      lng: -90.1994
    },
    defaultZoom: 11,
    mapTypeId: 'roadmap'
  }
};

// Helper function to get current config
export const getSearchConfig = () => {
  return {
    ...searchConfig,
    // You can add runtime overrides here if needed
  };
};

// Helper function to update config (for future use)
export const updateSearchConfig = (updates) => {
  Object.assign(searchConfig, updates);
};
