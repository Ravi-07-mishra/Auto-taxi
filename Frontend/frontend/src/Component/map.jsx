import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { io } from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; 
import '../Css/MapComponent.css'; 

const MapComponent = () => {
  // ─── Backend Base URL ───────────────────────────────────────────
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const [driverLocations, setDriverLocations] = useState({});

  useEffect(() => {
    // Connect to socket using environment variable if provided
    const socket = io(API_BASE);

    socket.on('updateLocations', (locations) => {
      console.log('Received locations:', locations);
      setDriverLocations(locations);
    });

    return () => {
      socket.off('updateLocations');
      socket.disconnect();
    };
  }, [API_BASE]);

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
        center={[22.7195687, 75.8577258]}
        zoom={13}
        style={{ height: '400px', width: '100%' }}
        className="leaflet-container"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {Object.keys(driverLocations).map((driverId) => {
          const { lat, lng } = driverLocations[driverId];
          console.log(`Rendering marker for driver ${driverId} at [${lat}, ${lng}]`);
          return (
            <Marker
              key={driverId}
              position={[lat, lng]}
              icon={markerIcon}
            >
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
