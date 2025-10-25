import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/Landing.css'; // reuse styling

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
  const [loading, setLoading] = useState(false);


  // Send query to ChatGPT on load
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
              content: 'Extract the city and distances for these amenities if mentioned: bus stops, schools, grocery stores, restaurants, parks, nightlife. Return JSON like: { "city": "CityName", "filters": { "bus": 5, "school": 3, ... } }',
            },
            {
              role: 'user',
              content: userInput,
            },
          ],
        }),
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      setParsedCity(result.city || '');
      setAmenityRadii(result.filters || {});
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
  // Add this at the top (inside the component)
const [activeFilters, setActiveFilters] = useState(() => {
  const initial = {};
  amenities.forEach(({ id }) => (initial[id] = true)); // all on by default
  return initial;
});

// Checkbox toggle
const toggleAmenity = (id) => {
  setActiveFilters((prev) => ({
    ...prev,
    [id]: !prev[id],
  }));
};

// Radius change
const handleRadiusChange = (id, value) => {
  setAmenityRadii((prev) => ({
    ...prev,
    [id]: value,
  }));
};
// eslint-disable-next-line
const getActiveFilters = () => {
  const active = {};
  for (const key in amenityRadii) {
    if (activeFilters[key]) {
      active[key] = amenityRadii[key];
    }
  }
  return active;
};

  return (
    <div className="App chat-page">
      {/* --- Navbar --- */}
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
            {loading ? <span>Loading...</span> : <span>🗺️ Heatmap Preview Area</span>}
          </div>
        </div>
      </div>

      {/* --- Chatbox to resubmit new query --- */}
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
      {/* Checkbox section – always active */}
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
    
      {/* Slider section – visually dimmed and disabled if checkbox is off */}
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

      {/* --- Footer --- */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 PlanIt - Built for the Hackathon.</p>
        </div>
      </footer>
    </div>
  );
}