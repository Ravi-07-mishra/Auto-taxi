import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

// Nominatim API base
const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

const MapSelector = ({
  pickupLocation,
  setPickupLocation,
  destinationLocation,
  setDestinationLocation,
}) => {
  const [pickupName, setPickupName] = useState("Fetching pickup location...");
  const [destinationName, setDestinationName] = useState("Select destination location on the map");

  // Fetch location name from coordinates
  const fetchLocationName = async (lat, lng, setNameCallback) => {
    try {
      const response = await fetch(
        `${NOMINATIM_REVERSE_URL}?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();
      if (data?.display_name) {
        setNameCallback(data.display_name);
      } else {
        setNameCallback("Unknown Location");
      }
    } catch (error) {
      console.error("Error fetching location name:", error);
      setNameCallback("Error fetching location name");
    }
  };

  // Initial pickup location name fetch
  useEffect(() => {
    if (pickupLocation?.lat && pickupLocation?.lng) {
      fetchLocationName(pickupLocation.lat, pickupLocation.lng, setPickupName);
    }
  }, [pickupLocation]);

  // Map click handler to select destination
  const MapClickHandler = () => {
    useMapEvents({
      click: ({ latlng }) => {
        const { lat, lng } = latlng;
        setDestinationLocation({ lat, lng });
        fetchLocationName(lat, lng, setDestinationName);
      },
    });
    return null;
  };

  // Default center fallback to Indore, India
  const defaultCenter = [pickupLocation?.lat || 22.7196, pickupLocation?.lng || 75.8577];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg border-2 border-blue-600">
        <MapContainer center={defaultCenter} zoom={13} style={{ width: "100%", height: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler />
          {pickupLocation?.lat && pickupLocation?.lng && (
            <Marker position={[pickupLocation.lat, pickupLocation.lng]} />
          )}
          {destinationLocation?.lat && destinationLocation?.lng && (
            <Marker position={[destinationLocation.lat, destinationLocation.lng]} />
          )}
        </MapContainer>
      </div>

      <div className="w-full p-4 rounded-lg shadow mt-4 bg-black">
        <p className="text-sm font-medium text-white">
          <span className="font-semibold text-gray-300">Pickup Location:</span>{" "}
          <span className="font-light">{pickupName}</span>
        </p>
        <p className="text-sm font-medium text-white mt-2">
          <span className="font-semibold text-gray-300">Destination Location:</span>{" "}
          <span className="font-light">{destinationName}</span>
        </p>
      </div>
    </div>
  );
};

export default MapSelector;
