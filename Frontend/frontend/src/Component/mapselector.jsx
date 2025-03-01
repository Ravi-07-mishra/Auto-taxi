import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

const MapSelector = ({
  pickupLocation,
  setPickupLocation,
  destinationLocation,
  setDestinationLocation,
}) => {
  const [pickupName, setPickupName] = useState("Fetching pickup location...");
  const [destinationName, setDestinationName] = useState("Select destination location on the map");

  const fetchLocationName = async (lat, lng, setNameCallback) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();
      if (data && data.display_name) {
        setNameCallback(data.display_name);
      } else {
        setNameCallback("Unknown Location");
      }
    } catch (error) {
      console.error("Error fetching location name:", error);
      setNameCallback("Error fetching location name");
    }
  };

  useEffect(() => {
    if (pickupLocation.lat && pickupLocation.lng) {
      fetchLocationName(pickupLocation.lat, pickupLocation.lng, setPickupName);
    }
  }, [pickupLocation]);

  const MapClickHandler = () => {
    useMapEvents({
      click: (event) => {
        const { lat, lng } = event.latlng;
        setDestinationLocation({ lat, lng });
        fetchLocationName(lat, lng, setDestinationName);
      },
    });
    return null;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg border-2 border-blue-600">
        <MapContainer
          center={[pickupLocation.lat || 22.7195687, pickupLocation.lng || 75.8577258]}
          zoom={13}
          style={{ width: "100%", height: "100%" }}
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
      </div>

      <div className="w-full p-4 rounded-lg shadow mt-4 bg-black">
  <p className="text-sm font-medium text-white">
    <span className="font-semibold text-gray-300">Pickup Location:</span>{' '}
    <span className="font-light">{pickupName}</span>
  </p>
  <p className="text-sm font-medium text-white mt-2">
    <span className="font-semibold text-gray-300">Destination Location:</span>{' '}
    <span className="font-light">{destinationName}</span>
  </p>
</div>
    </div>
  );
};

export default MapSelector;
