import React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

const MapSelector = ({ pickupLocation, destinationLocation, setDestinationLocation }) => {
  const MapClickHandler = () => {
    useMapEvents({
      click: (event) => {
        const { lat, lng } = event.latlng;
        setDestinationLocation({ lat, lng });
      },
    });
    return null;
  };

  return (
    <MapContainer
      center={[
        pickupLocation.lat || 22.7195687, // Default to Indore if location not yet available
        pickupLocation.lng || 75.8577258,
      ]}
      zoom={13}
      style={{ width: "100%", height: "400px" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler />
      {pickupLocation.lat && pickupLocation.lng && (
        <Marker position={[pickupLocation.lat, pickupLocation.lng]} />
      )}
      {destinationLocation.lat && destinationLocation.lng && (
        <Marker position={[destinationLocation.lat, destinationLocation.lng]} />
      )}
    </MapContainer>
  );
};

export default MapSelector;
