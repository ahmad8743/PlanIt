import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiEndpoint } from '../config/apiConfig';
import GoogleMapsHeatmapV2 from '../components/GoogleMapsHeatmapV2';
import '../styles/Landing.css';
import { searchConfig } from '../config/searchConfig';


const amenities = [
  { id: 'bus', label: 'Bus Stops', icon: '🚌' },
  { id: 'school', label: 'Schools', icon: '🏫' },
  { id: 'store', label: 'Grocery', icon: '🛒' },
  { id: 'restaurant', label: 'Restaurants', icon: '🍽️' },
  { id: 'park', label: 'Parks', icon: '🌳' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌃' },
];

export default function SearchHeatmapWithSliders() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [parsedCity, setParsedCity] = useState('');
  const [amenityRadii, setAmenityRadii] = useState({});
  const [activeFilters, setActiveFilters] = useState(() => {
    const initial = {};
    amenities.forEach(({ id }) => (initial[id] = true));
    return initial;
  });
  const [heatmapArray, setHeatmapArray] = useState([]);
const [searchResults, setSearchResults] = useState([]);
const [returnedQuery, setReturnedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [updateTimeout, setUpdateTimeout] = useState(null);

const [hasInitialized, setHasInitialized] = useState(false);

useEffect(() => {
  if (!hasInitialized && location.state?.query) {
    setHasInitialized(true);
    setQuery(location.state.query);
    //simulateChatGPTAndSend(location.state.query);
  }
}, [hasInitialized, location.state]);

  const simulateChatGPT = (input) => {
    return {
      city: "Austin",
      filters: {
        bus: Math.floor(Math.random() * 10) + 1,
        school: Math.floor(Math.random() * 10) + 1,
        park: Math.floor(Math.random() * 10) + 1,
        grocery: Math.floor(Math.random() * 10) + 1,
        nightlife: Math.floor(Math.random() * 10) + 1,
        restaurant: Math.floor(Math.random() * 10) + 1,
      },
    };
  };

const simulateChatGPTAndSend = async (inputText) => {
  if (!inputText || inputText.trim() === '') return;

  const simulatedParsed = simulateChatGPT(inputText);
  setParsedCity(simulatedParsed.city);
  setAmenityRadii(simulatedParsed.filters);

  const initialActive = {};
  Object.keys(simulatedParsed.filters).forEach((key) => {
    initialActive[key] = true;
  });
  setActiveFilters((prev) => ({ ...prev, ...initialActive }));

  callBackendWithCurrentFilters(simulatedParsed.filters, initialActive, simulatedParsed.city);
};

  const handleNewQuerySubmit = () => {
    if (query.trim()) {
      simulateChatGPTAndSend(query);
    }
  };

  const toggleAmenity = (id) => {
    setActiveFilters((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      setTimeout(() => {
        callBackendWithCurrentFilters(amenityRadii, updated, parsedCity);
      }, 0);
      return updated;
    });
  };

  const handleRadiusChange = (id, value) => {
    const updatedRadii = { ...amenityRadii, [id]: value };
    setAmenityRadii(updatedRadii);

    if (updateTimeout) clearTimeout(updateTimeout);
    const timeout = setTimeout(() => {
      callBackendWithCurrentFilters(updatedRadii, activeFilters);
    }, 1000);
    setUpdateTimeout(timeout);
  };

  const callBackendWithCurrentFilters = async (filtersObj, filtersState, cityOverride = null) => {
  const city = cityOverride || parsedCity;
  const active = {};
  for (const key in filtersObj) {
    if (filtersState[key]) {
      active[key] = filtersObj[key];
    }
  }
  try {
    const res = await fetch('http://localhost:8000/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        top_k: searchConfig.topK,
        softmax_temperature: searchConfig.softmaxTemperature
      }),
    });
    const data = await res.json();

    setReturnedQuery(data.query);
    setSearchResults(data.results);
    setHeatmapArray(data.heatmap_scores);
  } catch (err) {
    console.error('Backend update failed:', err);
  }
};

  return (
    <div className="App chat-page">
      <nav className="navbar">
        <div className="container">
          <a href="/" className="nav-brand">PlanIt</a>
        </div>
      </nav>

      {/* --- Heatmap --- */}
      <div className="chat-heatmap-container">
        <div className="container">
          <h1 className="heatmap-title">AI-Generated Heatmap</h1>
          <p className="heatmap-subtitle">
            Based on: <strong>{parsedCity || '...'}</strong>
          </p>

          <div className="heatmap-box">
            {/* --- Display Search Results --- */}
              {searchResults.length > 0 && (
                <div className="container" style={{ marginTop: '20px' }}>
                  <h3>Returned Results</h3>
                  <p><strong>Query:</strong> {returnedQuery}</p>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
                    {searchResults.slice(0, 5).map((res, i) => (
                      <li key={res.id}>
                        <strong>{res.caption}</strong> (Score: {res.score.toFixed(2)}, 
                        Lat: {res.coordinates?.lat}, Lng: {res.coordinates?.lng})
                      </li>
                    ))}
                  </ul>
                  <p style={{ fontSize: '0.9em', color: '#888' }}>
                    Showing top {Math.min(searchResults.length, 5)} of {searchResults.length} results
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* --- Text Input --- */}
      <div className="container">
        <input
          type="text"
          className="search-bar"
          placeholder="Type new request to update city or filters..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="search-button search-button-chat" onClick={handleNewQuerySubmit}>
          Update from Text
        </button>
      </div>

      {/* --- Sliders --- */}
      <div className="chat-sliders-section">
        <div className="container">
          <h2>Adjust Preferences</h2>
          <div className="amenities-container">
            {amenities.map(({ id, label, icon }) => (
              <div key={id} className="amenity-item">
                <div className="amenity-checkbox-row">
                  <label htmlFor={`${id}-checkbox`} className="amenity-label">
                    <input
                      id={`${id}-checkbox`}
                      type="checkbox"
                      checked={activeFilters[id]}
                      onChange={() => toggleAmenity(id)}
                      className="amenity-checkbox"
                    />
                    <span className="ml-2">{icon} {label}</span>
                  </label>
                </div>
                <div className={`slider-container ${!activeFilters[id] ? 'amenity-slider-disabled' : ''}`}>
                  <input
                    type="range"
                    id={id}
                    className="amenity-slider"
                    min="0"
                    max="25"
                    step="1"
                    value={amenityRadii[id] || 0}
                    onChange={(e) => handleRadiusChange(id, Number(e.target.value))}
                    disabled={!activeFilters[id]}
                  />
                  <span className="radius-display">{amenityRadii[id] || 0} mi</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 PlanIt - Built for the Hackathon.</p>
        </div>
      </footer>
    </div>
  );
}