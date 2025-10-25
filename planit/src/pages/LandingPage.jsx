import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

// Icon Components (unchanged)
const AiIcon = () => <span>✨</span>;
const MapIcon = () => <span>🗺️</span>;
const DataIcon = () => <span>📊</span>;

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleGenerateClick = () => {
    if (!searchQuery.trim()) return;
    navigate('/chat', {
      state: {
        query: searchQuery,
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
            Just tell us what you're looking for — and we’ll handle the rest.
          </p>

          {/* --- Natural Language Search Input --- */}
          <div className="search-container">
            <input
              type="text"
              className="search-bar"
              placeholder='e.g. I want to live in Seattle near a park and schools within 3 miles'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-button" onClick={handleGenerateClick}>
              Generate Heatmap
            </button>
          </div>
        </div>
      </header>

      {/* --- Features Section (unchanged) --- */}
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

      {/* --- How It Works Section (unchanged) --- */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="container">
          <h2>How It Works in 3 Steps</h2>
          <div className="steps-container">
            <div className="step-card">
              <span>1</span>
              <h3>Enter a Location + Preferences</h3>
              <p>Just describe what kind of neighborhood or environment you’re looking for.</p>
            </div>

            <div className="step-card">
              <span>2</span>
              <h3>Let AI Parse Your Needs</h3>
              <p>We extract your location, preferences, and amenity filters automatically with AI.</p>
            </div>

            <div className="step-card">
              <span>3</span>
              <h3>View Your Heatmap</h3>
              <p>Get an instant, color-coded map showing the best and worst zones for your needs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer (unchanged) --- */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 PlanIt - Built for the Hackathon.</p>
        </div>
      </footer>
    </div>
  );
}