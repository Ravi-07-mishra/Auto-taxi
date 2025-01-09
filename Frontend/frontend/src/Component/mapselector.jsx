import React, { useState,useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents,Polyline } from "react-leaflet";

const MapSelector = ({
  pickupLocation,
  destinationLocation,
  setDestinationLocation,
}) => {
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
        pickupLocation.lat || 22.7195687,
        pickupLocation.lng || 75.8577258,
      ]}
      zoom={13}
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "8px",
        border: "2px solid #3f51b5",
      }}
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
