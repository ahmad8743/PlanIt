import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiEndpoint } from '../config/apiConfig';
import GoogleMapsHeatmapV2 from '../components/GoogleMapsHeatmapV2';
import '../styles/Landing.css';
import { searchConfig } from '../config/searchConfig';

const extractCityAndFilters = async (text) => {
  const res = await fetch('http://localhost:8000/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: text })
  });
  const data = await res.json();
  console.log("🧠 Extracted filters:", data);
  return data;
};

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
  const [amenityRadii, setAmenityRadii] = useState({});
  const [activeFilters, setActiveFilters] = useState(() => {
    const initial = {};
    amenities.forEach(({ id }) => (initial[id] = true));
    return initial;
  });
  const [searchResults, setSearchResults] = useState([]);
  const [allAmenityScores, setAllAmenityScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [updateTimeout, setUpdateTimeout] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!hasInitialized && location.state?.query) {
      setHasInitialized(true);
      setQuery(location.state.query);

      const incomingFilters = location.state.filters || {};
      const incomingCity = location.state.city || '';
      const incomingActiveFilters = location.state.activeFilters || {};

      setAmenityRadii(incomingFilters);
      setActiveFilters((prev) => ({ ...prev, ...incomingActiveFilters }));

      callBackendWithCurrentFilters(incomingFilters, incomingActiveFilters, incomingCity);
    }
  }, [hasInitialized, location.state]);

  const simulateChatGPT = (input) => extractCityAndFilters(input);

  const simulateChatGPTAndSend = async (inputText) => {
    if (!inputText || inputText.trim() === '') return;

    const simulatedParsed = await simulateChatGPT(inputText);

    setAmenityRadii(simulatedParsed.filters);

    const initialActive = {};
    Object.keys(simulatedParsed.filters).forEach((key) => {
      initialActive[key] = true;
    });
    setActiveFilters((prev) => ({ ...prev, ...initialActive }));

    callBackendWithCurrentFilters(simulatedParsed.filters, initialActive, simulatedParsed.city);
  };

  const handleNewQuerySubmit = () => {
    if (query.trim()) simulateChatGPTAndSend(query);
  };

  const toggleAmenity = (id) => {
    setActiveFilters((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      setTimeout(() => callBackendWithCurrentFilters(amenityRadii, updated), 0);
      return updated;
    });
  };

  const handleRadiusChange = (id, value) => {
    const updatedRadii = { ...amenityRadii, [id]: value };
    setAmenityRadii(updatedRadii);

    if (updateTimeout) clearTimeout(updateTimeout);
    const timeout = setTimeout(() => callBackendWithCurrentFilters(updatedRadii, activeFilters), 1000);
    setUpdateTimeout(timeout);
  };

  const callBackendWithCurrentFilters = async (filtersObj, filtersState, cityOverride = null) => {

    const active = {};
    for (const key in filtersObj) {
      if (filtersState[key]) {
        active[key] = filtersObj[key];
      }
    }
    try {
      const res = await fetch(getApiEndpoint('/search'), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: query,
    top_k: searchConfig.topK,
    softmax_temperature: searchConfig.softmaxTemperature,
    filters: filtersObj // 🧠 important
  }),
});
      const data = await res.json();
      setSearchResults(data.results);
      setAllAmenityScores(data.heatmap_scores || {});
    } catch (err) {
      console.error('Backend update failed:', err);
    }
  };

const getCombinedHeatmapScores = () => {
  if (!searchResults || !allAmenityScores) return [];

  const length = searchResults.length;
  const combined = new Array(length).fill(0);
  let activeCount = 0;

  for (const key in allAmenityScores) {
    if (activeFilters[key]) {
      const scores = allAmenityScores[key] || [];
      for (let i = 0; i < length; i++) {
        combined[i] += scores[i] || 0;
      }
      activeCount++;
    }
  }

  if (activeCount === 0) return new Array(length).fill(0);
  return combined.map(val => val / activeCount); // 🎯 average
};

  return (
    <div className="App chat-page">
      <nav className="navbar">
        <div className="container">
          <a href="/" className="nav-brand">PlanIt</a>
        </div>
      </nav>

      <div className="chat-heatmap-container">
        <div className="container">
          <h1 className="heatmap-title">AI-Generated Heatmap</h1>

          <div className="heatmap-box">
            <GoogleMapsHeatmapV2
              searchResults={searchResults}
              heatmapScores={getCombinedHeatmapScores()}
              loading={loading}
            />
          </div>
        </div>
      </div>

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