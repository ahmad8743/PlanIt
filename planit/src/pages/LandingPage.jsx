import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './Landing.css';

// ... (icon components are unchanged)
const BusIcon = () => <span>🚌</span>;
const SchoolIcon = () => <span>🏫</span>;
const StoreIcon = () => <span>🛒</span>;
const RestaurantIcon = () => <span>🍽️</span>;
const ParkIcon = () => <span>🌳</span>;
const NightlifeIcon = () => <span>🌃</span>;
const AiIcon = () => <span>✨</span>;
const MapIcon = () => <span>🗺️</span>;
const DataIcon = () => <span>📊</span>;

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate(); 

  const handleGenerateClick = () => {
    // UPDATED: Pass the searchQuery in the 'state' object
    navigate('/chat', { state: { query: searchQuery } });
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
          
          <div className="amenities-preview">
            <span><BusIcon /> Bus Stops</span>
            <span><SchoolIcon /> Schools</span>
            <span><StoreIcon /> Grocery</span>
            <span><RestaurantIcon /> Restaurants</span>
            <span><ParkIcon /> Parks</span>
            <span><NightlifeIcon /> Nightlife</span>
          </div>
        </div>
      </header>

      {/* ... (rest of the landing page sections are unchanged) ... */}
      
      {/* --- Features Section --- */}
      <section id="features" className="features-section">
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