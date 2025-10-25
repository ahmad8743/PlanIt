import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

// --- Amenity Configuration ---
// We use an array to easily map over and render them
const amenities = [
  { id: 'bus', label: 'Bus Stops', icon: '🚌' },
  { id: 'school', label: 'Schools', icon: '🏫' },
  { id: 'store', label: 'Grocery', icon: '🛒' },
  { id: 'restaurant', label: 'Restaurants', icon: '🍽️' },
  { id: 'park', label: 'Parks', icon: '🌳' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌃' },
];

// --- Icon Components ---
const AiIcon = () => <span>✨</span>;
const MapIcon = () => <span>🗺️</span>;
const DataIcon = () => <span>📊</span>;

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // New state to hold all radius values, keyed by amenity id
  const [amenityRadii, setAmenityRadii] = useState({
    bus: 5,
    school: 5,
    store: 5,
    restaurant: 5,
    park: 5,
    nightlife: 5,
  });

  const navigate = useNavigate();

  // Handler to update the radius for a specific amenity
  const handleRadiusChange = (id, value) => {
    setAmenityRadii(prevRadii => ({
      ...prevRadii,
      [id]: value,
    }));
  };

  const handleGenerateClick = () => {
    // Pass both the query and the radii object to the chat page
    navigate('/chat', {
      state: {
        query: searchQuery,
        radii: amenityRadii,
      },
    });
  };

  return (
    <div className="App">
      
      {/* --- Navigation Bar --- */}
      <nav className="navbar">
        <div className="container">
          <a href="#hero" className="nav-brand">PlanIt</a>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <header id="hero" className="hero-section">
        <div className="container hero-content">
          <h1>Find Your Perfect Location.</h1>
          <p className="hero-subtitle">
            PlanIt uses AI to create intelligent heatmaps based on what matters to you.
            Find the best places with the amenities you need.
          </p>
          
          {/* --- Main Search Bar --- */}
          <div className="search-container">
            <input 
              type="text" 
              className="search-bar" 
              placeholder="Enter a city or neighborhood..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-button" onClick={handleGenerateClick}>
              Generate Heatmap
            </button>
          </div>
          
          {/* --- New Amenities Section with Sliders --- */}
          <div className="amenities-container">
            {amenities.map(amenity => (
              <div key={amenity.id} className="amenity-item">
                <label htmlFor={amenity.id} className="amenity-label">
                  <span>{amenity.icon}</span> {amenity.label}
                </label>
                <div className="slider-container">
                  <input
                    type="range"
                    id={amenity.id}
                    className="amenity-slider"
                    min="0"
                    max="25"
                    step="1"
                    value={amenityRadii[amenity.id]}
                    onChange={(e) => handleRadiusChange(amenity.id, e.target.value)}
                  />
                  <span className="radius-display">
                    {amenityRadii[amenity.id]} mi
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* --- Features Section --- */}
      <section id="features" className="features-section">
        {/* ... (content is unchanged) ... */}
        <div className="container">
          <h2>Why Choose PlanIt?</h2>
          <div className="features-grid">
            
            <div className="feature-card">
              <div className="feature-icon"><MapIcon /></div>
              <h3>Custom Amenity Search</h3>
              <p>Filter locations by the amenities you care about, from bus stops and schools to restaurants and parks.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon"><AiIcon /></div>
              <h3>AI-Powered Heatmaps</h3>
              <p>Our AI analyzes your selected criteria to generate a simple, intuitive heatmap of the most suitable areas.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon"><DataIcon /></div>
              <h3>Real-World Data</h3>
              <p>We analyze real-world data, including street-level imagery, to score locations and provide accurate results.</p>
            </div>

          </div>
        </div>
      </section>

      {/* --- How It Works Section --- */}
      <section id="how-it-works" className="how-it-works-section">
        {/* ... (content is unchanged) ... */}
        <div className="container">
          <h2>How It Works in 3 Steps</h2>
          <div className="steps-container">
            
            <div className="step-card">
              <span>1</span>
              <h3>Enter a Location</h3>
              <p>Start by typing in the city, zip code, or neighborhood you're interested in.</p>
            </div>
            
            <div className="step-card">
              <span>2</span>
              <h3>Select Amenities</h3>
              <p>Check off your "must-haves," like nearby grocery stores, parks, or nightlife options.</p>
            </div>
            
            <div className="step-card">
              <span>3</span>
              <h3>View Your Heatmap</h3>
              <p>Get an instant, color-coded map showing the best and worst zones for your needs.</p>
            </div>

          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 PlanIt - Built for the Hackathon.</p>
        </div>
      </footer>
      
    </div>
  );
}