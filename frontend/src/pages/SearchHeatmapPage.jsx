import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GoogleMapsHeatmapV2 from '../components/GoogleMapsHeatmapV2';
import { searchConfig } from '../config/searchConfig';
import '../styles/Landing.css';

const API = "https://ec2-3-21-204-210.us-east-2.compute.amazonaws.com:8000";

export default function SearchHeatmapPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [heatmapScores, setHeatmapScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get search query from navigation state
    const query = location.state?.query || '';
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [location.state]);

  const performSearch = async (query) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          top_k: searchConfig.topK,
          softmax_temperature: searchConfig.softmaxTemperature
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        console.log('Search results received:', data.results.length, 'results');
        console.log('First result:', data.results[0]);
        console.log('Heatmap scores:', data.heatmap_scores);
        setSearchResults(data.results);
        setHeatmapScores(data.heatmap_scores);
      } else {
        throw new Error('Search failed');
      }
    } catch (err) {
      setError(err.message);
      console.error('Search error:', err);
      console.error('Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNewSearch();
    }
  };



  return (
    <div className="App">
      <nav className="navbar">
        <div className="container">
          <a href="#hero" className="nav-brand">PlanIt</a>
          <div className="nav-links">
            <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
            <a href="/chat" onClick={(e) => { e.preventDefault(); navigate('/chat'); }}>Chat</a>
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '100px' }}>
        <div className="search-heatmap-container">
          <h1>Search Results Heatmap</h1>
          
          {/* Search Input */}
          <div className="search-container" style={{ marginBottom: '30px' }}>
            <input
              type="text"
              className="search-bar"
              placeholder="Search for locations (e.g., 'schools near parks')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button 
              className="search-button" 
              onClick={handleNewSearch}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div style={{ 
              color: 'red', 
              backgroundColor: '#ffe6e6', 
              padding: '10px', 
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              Error: {error}
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <div style={{ fontSize: '18px' }}>🔍 Searching locations...</div>
            </div>
          )}

              {/* Google Maps Heatmap Visualization */}
              {!loading && heatmapScores.length > 0 && (
                <div className="heatmap-section">
                  <h2>Location Heatmap on Google Maps</h2>
                  <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
                    Heatmap overlay showing search relevance across geographic locations. 
                    Red areas indicate higher relevance to your search query.
                  </p>
                  
                  <GoogleMapsHeatmapV2 
                    searchResults={searchResults}
                    heatmapScores={heatmapScores}
                    loading={loading}
                  />
                  
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                      Showing {heatmapScores.length} locations • 
                      Use controls on the map to adjust heatmap • 
                      Higher intensity = better match
                    </p>
                  </div>
                </div>
              )}



          {/* No Results */}
          {!loading && searchResults.length === 0 && searchQuery && (
            <div style={{ textAlign: 'center', margin: '40px 0' }}>
              <h3>No results found</h3>
              <p>Try a different search query or check your connection to the search service.</p>
            </div>
          )}

          {/* Instructions */}
          {!loading && !searchQuery && (
            <div style={{ textAlign: 'center', margin: '40px 0' }}>
              <h3>Search for Locations</h3>
              <p>Enter a search query to find and visualize locations using AI-powered search.</p>
              <p>Examples:</p>
              <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                <li>"schools near parks"</li>
                <li>"restaurants with outdoor seating"</li>
                <li>"quiet residential areas"</li>
                <li>"busy commercial districts"</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
