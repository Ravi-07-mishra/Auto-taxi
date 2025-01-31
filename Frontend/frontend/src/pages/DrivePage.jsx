import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from "react-leaflet";
import L from "leaflet";
import io from 'socket.io-client';
import axios from "axios";
import { useDriverAuth } from "../Context/driverContext";

const DrivePage = () => {
  const { bookingId } = useParams();
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const [driverToDestinationRoute, setDriverToDestinationRoute] = useState([]);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);
  const { driver } = useDriverAuth();
  const socketRef = useRef(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [rideEnded, setRideEnded] = useState(false);
  const mapRef = useRef(null);

  // Fetch booking details
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:3000/api/driver/driver/${bookingId}`
        );
        setPickupLocation(data.booking.pickupLocation);
        setDestinationLocation(data.booking.destinationLocation);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching booking details:", err.message);
        setLoading(false);
        alert("Failed to load booking details.");
      }
    };
    fetchBookingDetails();
  }, [bookingId]);

  // Fetch route between two points
  const fetchRoute = async (start, end, setRouteCallback) => {
    try {
      const response = await axios.get("http://localhost:3000/directions", {
        params: {
          start: `${start.lng},${start.lat}`,
          end: `${end.lng},${end.lat}`,
        },
      });
      console.log("API Response:", response.data);

      // Check if 'features' exists in the response and if it's not empty
      if (response.data.features && response.data.features.length > 0) {
        const routeData = response.data.features[0];
  
        // Check if the necessary geometry and coordinates are available
        if (routeData?.geometry?.coordinates) {
          setRouteCallback(routeData.geometry.coordinates);
          if (setRouteCallback === setRoute) {
            const duration = routeData.properties.segments[0].duration;
            setEta((duration / 60).toFixed(2)); // Set ETA in minutes
          }
        } else {
          console.error("Route data does not contain valid coordinates:", routeData);
          alert("Failed to fetch route data. Coordinates not found.");
        }
      } else {
        console.error("No valid route data found in response:", response.data);
        alert("Failed to fetch route data. No route found.");
      }
    } catch (error) {
      console.error("Error fetching route:", error.message);
      alert("Failed to fetch the route. Please try again.");
    } finally {
      setRouteLoading(false); // Make sure loading state is handled
    }
  };
  

  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      fetchRoute(
        { lat: pickupLocation.lat, lng: pickupLocation.lng },
        { lat: destinationLocation.lat, lng: destinationLocation.lng },
        setRoute
      );
    }
  }, [pickupLocation, destinationLocation]);

  useEffect(() => {
    if (driverLocation && destinationLocation) {
      fetchRoute(driverLocation, destinationLocation, setDriverToDestinationRoute);
    }
  }, [driverLocation, destinationLocation]);

  // Handle End Ride
  const handleEndRide = async () => {
    try {
      const response = await axios.patch(
        `http://localhost:3000/api/driver/end/${bookingId}`
      );
      alert(response.data.message);
      setRideEnded(true);
    } catch (error) {
      console.error("Error ending the ride:", error.message);
      alert("Failed to end the ride. Please try again.");
    }
  };

  // Handle real-time driver location
  useEffect(() => {
    if (!driver) return;

    socketRef.current = io("http://localhost:3000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setDriverLocation({ lat: latitude, lng: longitude });

        socket.emit("driverLocation", {
          id: driver._id,
          lat: latitude,
          lng: longitude,
        });
      },
      (error) => {
        console.error("Geolocation error:", error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    };
  }, [driver]);

  if (rideEnded) {
    return <div className="text-center py-5">Ride has ended successfully!</div>;
  }

  if (loading)
    return <div className="text-center py-5">Loading booking details...</div>;

  if (routeLoading)
    return <div className="text-center py-5">Loading route...</div>;

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-6">
      <h1 className="text-3xl font-bold text-center text-gray-800">
        Drive Details
      </h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">
            Route Overview
          </h2>
        </div>
        <div className="flex justify-between mb-4">
          {eta && <span className="text-sm text-black">ETA: {eta} minutes</span>}
        </div>
        <div className="h-[500px] bg-gray-100 rounded-lg shadow overflow-hidden">
          <MapContainer
            center={
              driverLocation || {
                lat: pickupLocation?.lat,
                lng: pickupLocation?.lng,
              }
            }
            zoom={14}
            whenCreated={(map) => {
              mapRef.current = map;
            }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {pickupLocation && (
              <Marker position={pickupLocation}>
                <Tooltip>Pickup Location</Tooltip>
              </Marker>
            )}
            {destinationLocation && (
              <Marker position={destinationLocation}>
                <Tooltip>Destination</Tooltip>
              </Marker>
            )}
            {driverLocation && (
              <Marker position={driverLocation} icon={L.icon({ iconUrl: "path-to-driver-icon.png", iconSize: [30, 30] })}>
                <Tooltip>Driver's Location</Tooltip>
              </Marker>
            )}
            <Polyline
              positions={route.map(([lng, lat]) => ({ lat, lng }))}
              color="blue"
              weight={4}
            />
            <Polyline
              positions={driverToDestinationRoute.map(([lng, lat]) => ({ lat, lng }))}
              color="green"
              weight={4}
            />
          </MapContainer>
        </div>
      </div>
      <div className="text-center mt-4">
        <button
          onClick={handleEndRide}
          className="px-6 py-3 rounded-lg bg-red-600 text-white"
        >
          End Ride
        </button>
      </div>
    </div>
  );
};

export default DrivePage;
