/* global google */
import React, { useState, useEffect, useRef } from 'react';
import { searchConfig } from '../config/searchConfig';
import { GOOGLE_MAPS_API_KEY } from '../../../creds/creds.js';


const mapContainerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '8px',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
};

const defaultCenter = searchConfig.map.defaultCenter;

export default function GoogleMapsHeatmapV2({ searchResults, heatmapScores, loading }) {
  const googleMapsApiKey = GOOGLE_MAPS_API_KEY;

  const [heatmapRadius, setHeatmapRadius] = useState(searchConfig.heatmap.defaultRadius);
  const [heatmapOpacity, setHeatmapOpacity] = useState(searchConfig.heatmap.defaultOpacity);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatmapLayerRef = useRef(null);

  // Load Google Maps API using the modern importLibrary approach
  useEffect(() => {
    if (!googleMapsApiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    const loadGoogleMaps = async () => {
      try {
        // Check if already loaded
        if (window.google && window.google.maps && window.google.maps.importLibrary) {
          setMapLoaded(true);
          return;
        }

        // Load the Google Maps API using the bootstrap loader
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&v=weekly&loading=async`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          setMapLoaded(true);
        };
        
        script.onerror = () => {
          setError('Failed to load Google Maps API');
        };

        // Check if script already exists
        const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
        if (!existingScript) {
          document.head.appendChild(script);
        } else {
          if (window.google && window.google.maps) {
            setMapLoaded(true);
          } else {
            existingScript.onload = () => setMapLoaded(true);
          }
        }
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError(`Error loading Google Maps: ${err.message}`);
      }
    };

    loadGoogleMaps();
  }, [googleMapsApiKey]);

  // Initialize map using importLibrary
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      try {
        // Import required libraries
        const [{ Map }] = await Promise.all([
          google.maps.importLibrary("maps"),
          google.maps.importLibrary("visualization"),
        ]);

        // Create map instance
        const map = new Map(mapRef.current, {
          center: defaultCenter,
          zoom: searchConfig.map.defaultZoom,
          streetViewControl: false,
          mapTypeControl: true,
          clickableIcons: false,
          fullscreenControl: true,
          zoomControl: true,
        });

        mapInstanceRef.current = map;
      } catch (err) {
        setError(`Error initializing map: ${err.message}`);
      }
    };

    // Add a small delay to ensure DOM is ready
    setTimeout(initMap, 100);
  }, [mapLoaded]);

  // Create/update heatmap
  useEffect(() => {
    if (!mapInstanceRef.current || !searchResults || searchResults.length === 0 || !heatmapScores || heatmapScores.length === 0) {
      if (heatmapLayerRef.current) {
        heatmapLayerRef.current.setMap(null);
        heatmapLayerRef.current = null;
      }
      return;
    }

    const createHeatmap = () => {
      try {
        // Clean and validate data
        const clean = searchResults.map((result, index) => {
          let lat, lng;
          
          // Use structured coordinates if available
          if (result.coordinates && result.coordinates.lat && result.coordinates.lng) {
            lat = Number(result.coordinates.lat);
            lng = Number(result.coordinates.lng);
          } else {
            // Fallback: parse from ID (format: "lat_lng")
            const coords = result.id.split('_');
            if (coords.length >= 2) {
              lat = Number(coords[0]);
              lng = Number(coords[1]);
            }
          }
          
          const weight = Number(heatmapScores[index] ?? 1) * searchConfig.heatmapIntensityMultiplier;
          
          return { lat, lng, weight };
        }).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));

        if (clean.length === 0) {
          return;
        }

        // Convert to Google Maps format
        const data = clean.map(p => ({
          location: new google.maps.LatLng(p.lat, p.lng),
          weight: p.weight
        }));

        // Fit map to data
        const bounds = new google.maps.LatLngBounds();
        data.forEach(({ location }) => bounds.extend(location));
        if (!bounds.isEmpty() && typeof bounds.getCenter === 'function') {
          mapInstanceRef.current.fitBounds(bounds);
        }

        // Clear existing heatmap
        if (heatmapLayerRef.current) {
          heatmapLayerRef.current.setMap(null);
        }

        // Create new heatmap
        const heatmap = new google.maps.visualization.HeatmapLayer({
          data,
          map: showHeatmap ? mapInstanceRef.current : null,
          radius: heatmapRadius,
          opacity: heatmapOpacity,
          maxIntensity: Math.max(...clean.map(p => p.weight)),
          gradient: [
            'rgba(0, 255, 0, 0)',      // Transparent green
            'rgba(0, 255, 0, 0.3)',    // Light green
            'rgba(255, 255, 0, 0.5)',  // Yellow
            'rgba(255, 165, 0, 0.7)',  // Orange
            'rgba(255, 0, 0, 0.9)',    // Red
            'rgba(255, 0, 0, 1)'       // Solid red
          ]
        });

        heatmapLayerRef.current = heatmap;
      } catch (err) {
        // Silently handle heatmap creation errors
      }
    };

    createHeatmap();
  }, [searchResults, heatmapScores, heatmapRadius, heatmapOpacity, showHeatmap]);

  // Update heatmap visibility
  useEffect(() => {
    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.setMap(showHeatmap ? mapInstanceRef.current : null);
    }
  }, [showHeatmap]);

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#ffe6e6', 
        border: '1px solid #ffcccc',
        borderRadius: '8px',
        margin: '20px 0',
        textAlign: 'center'
      }}>
        <h3>❌ Google Maps Error</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  if (!mapLoaded) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        <div>🗺️ Loading Google Maps...</div>
        <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
          Using modern importLibrary API
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '1200px', margin: '20px auto' }}>
      <div 
        ref={mapRef} 
        style={mapContainerStyle}
      />
      
      {/* Heatmap Controls */}
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '10px', 
        backgroundColor: 'white', 
        padding: '15px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        zIndex: 1000,
        minWidth: '200px'
      }}>
        <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '14px' }}>
          🔥 Heatmap Controls
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
            Radius: {heatmapRadius}px
          </label>
          <input
            type="range"
            min={searchConfig.heatmap.minRadius}
            max={searchConfig.heatmap.maxRadius}
            value={heatmapRadius}
            onChange={(e) => setHeatmapRadius(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
            Opacity: {heatmapOpacity.toFixed(1)}
          </label>
          <input
            type="range"
            min={searchConfig.heatmap.minOpacity}
            max={searchConfig.heatmap.maxOpacity}
            step="0.1"
            value={heatmapOpacity}
            onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={(e) => setShowHeatmap(e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Show Heatmap
          </label>
        </div>
      </div>
    </div>
  );
}