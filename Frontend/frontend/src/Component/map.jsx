import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { io } from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Importing Leaflet CSS for better styling
import '../Css/MapComponent.css'; // Import custom CSS for full screen

const MapComponent = () => {
  const [driverLocations, setDriverLocations] = useState({});

  useEffect(() => {
    const socket = io('http://localhost:3000'); // Use environment variable for flexibility

    // Listen for location updates
    socket.on('updateLocations', (locations) => {
      console.log('Received locations:', locations); // Debugging log
      setDriverLocations(locations);
    });

    // Cleanup on component unmount
    return () => {
      socket.off('updateLocations');
      socket.disconnect();
    };
  }, []);

  // Leaflet custom icon (ensure marker is displayed properly)
  const markerIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
  });

  return (
    <div className="map-container">
      <MapContainer
        center={[22.7195687, 75.8577258]} // Default coordinates (adjust as needed)
        zoom={13}
        style={{ height: '400px', width: '100%' }} // Fixed height for the card map
        className="leaflet-container"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {Object.keys(driverLocations).map(driverId => {
          const { lat, lng } = driverLocations[driverId];
          console.log(`Rendering marker for driver ${driverId} at [${lat}, ${lng}]`); // Debugging log
          return (
            <Marker key={driverId} position={[lat, lng]} icon={markerIcon}>
              <Popup>
                <strong>Driver ID:</strong> {driverId} <br />
                <strong>Latitude:</strong> {lat} <br />
                <strong>Longitude:</strong> {lng}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
