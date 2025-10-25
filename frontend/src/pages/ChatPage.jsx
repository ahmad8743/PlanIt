import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/Landing.css';

const amenities = [
  { id: 'bus', label: 'Bus Stops', icon: '🚌' },
  { id: 'school', label: 'Schools', icon: '🏫' },
  { id: 'store', label: 'Grocery', icon: '🛒' },
  { id: 'restaurant', label: 'Restaurants', icon: '🍽️' },
  { id: 'park', label: 'Parks', icon: '🌳' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌃' },
];

export default function ChatPage() {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [parsedCity, setParsedCity] = useState('');
  const [amenityRadii, setAmenityRadii] = useState({});
  const [activeFilters, setActiveFilters] = useState(() => {
    const initial = {};
    amenities.forEach(({ id }) => (initial[id] = true));
    return initial;
  });
  const [heatmapArray, setHeatmapArray] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updateTimeout, setUpdateTimeout] = useState(null);

  useEffect(() => {
    const incomingQuery = location.state?.query || '';
    setQuery(incomingQuery);
    if (incomingQuery) {
      processQuery(incomingQuery);
    }
  }, [location.state]);

  const processQuery = async (userInput) => {
    setLoading(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Extract the city and distances for these amenities if mentioned: bus stops, schools, grocery stores, restaurants, parks, nightlife. Return JSON like: { "city": "CityName", "filters": { "bus": 5, "school": 3, ... } }'
            },
            {
              role: 'user',
              content: userInput
            }
          ]
        })
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      setParsedCity(result.city || '');
      setAmenityRadii(result.filters || {});

      const initialActive = {};
      Object.keys(result.filters || {}).forEach((key) => {
        initialActive[key] = true;
      });
      setActiveFilters((prev) => ({ ...prev, ...initialActive }));

      callBackendWithCurrentFilters(result.filters || {}, initialActive, result.city);
    } catch (err) {
      console.error('Error processing query:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewQuerySubmit = () => {
    if (query.trim()) {
      processQuery(query);
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
      const res = await fetch('http://localhost:8000/api/update-from-sliders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, filters: active })
      });
      const data = await res.json();
      setHeatmapArray(data.heatmap);
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

      <div className="chat-heatmap-container">
        <div className="container">
          <h1 className="heatmap-title">AI-Generated Heatmap</h1>
          <p className="heatmap-subtitle">
            Based on: <strong>{parsedCity || '...'}</strong>
          </p>

          <div className="heatmap-box">
            {loading ? <span>Loading...</span> : <span>🗺️ Heatmap Preview Area</span>}
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