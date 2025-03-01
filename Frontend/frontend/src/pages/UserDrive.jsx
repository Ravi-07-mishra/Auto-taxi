"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import io from "socket.io-client";
import axios from "axios";
import { Send, X, Clock, Navigation, AlertTriangle, Mic } from "lucide-react";
import { Button, TextField, Snackbar } from "@mui/material";
import { useAuth } from "../Context/userContext";
import "leaflet/dist/leaflet.css";

const createIcon = (iconUrl) =>
  L.icon({
    iconUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const userIcon = createIcon("/user-icon.png");
const driverIcon = createIcon("/driver-icon.png");

// Component to update map center and zoom
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const UserRidePage = () => {
  const { bookingId } = useParams();
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [speed, setSpeed] = useState(null); // Speed in km/h
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const socketRef = useRef(null);
  const mapRef = useRef(null); // Ref to hold the Leaflet map instance
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatContainerRef = useRef(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [isNightMode, setIsNightMode] = useState(false); // Night mode state
  const [mapCenter, setMapCenter] = useState([0, 0]); // Map center state
  const [mapZoom, setMapZoom] = useState(14); // Map zoom state

  // Fetch booking details
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const { data } = await axios.get(`http://localhost:3000/api/driver/driver/${bookingId}`);
        setPickupLocation(data.booking.pickupLocation);
        setDestinationLocation(data.booking.destinationLocation);
        setMapCenter([data.booking.pickupLocation.lat, data.booking.pickupLocation.lng]); // Set initial map center
        setLoading(false);
      } catch (err) {
        console.error("Error fetching booking details:", err);
        setLoading(false);
        setError("Failed to load booking details.");
      }
    };
    fetchBookingDetails();
  }, [bookingId]);

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Calculate ETA and speed
  const calculateETAAndSpeed = (prevLocation, currentLocation, prevTime, currentTime) => {
    const distance = calculateDistance(prevLocation.lat, prevLocation.lng, currentLocation.lat, currentLocation.lng);
    const timeDifference = (currentTime - prevTime) / 3600; // Time difference in hours
    const currentSpeed = distance / timeDifference; // Speed in km/h
    setSpeed(currentSpeed.toFixed(2));

    if (destinationLocation) {
      const remainingDistance = calculateDistance(currentLocation.lat, currentLocation.lng, destinationLocation.lat, destinationLocation.lng);
      const etaHours = remainingDistance / currentSpeed;
      setEta(etaHours.toFixed(2));
    }
  };

  // Fetch route between two points
  const fetchRoute = async (start, end, setRouteCallback) => {
    try {
      const response = await axios.get(`http://localhost:3000/directions`, {
        params: {
          start: `${start.lng},${start.lat}`,
          end: `${end.lng},${end.lat}`,
        },
      });

      if (response.data.features && response.data.features.length > 0) {
        const routeData = response.data.features[0];
        if (routeData?.geometry?.coordinates) {
          setRouteCallback(routeData.geometry.coordinates.map(([lng, lat]) => [lat, lng]));
          if (setRouteCallback === setRoute) {
            const duration = routeData.properties.segments[0].duration;
            setEta((duration / 60).toFixed(2));
          }
        } else {
          console.error("Route data does not contain valid coordinates:", routeData);
          setError("Failed to fetch route data. Coordinates not found.");
        }
      } else {
        console.error("No valid route data found in response:", response.data);
        setError("Failed to fetch route data. No route found.");
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      setError("Failed to fetch the route. Please try again.");
    }
  };

  // Fetch route between pickup and destination
  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      fetchRoute(pickupLocation, destinationLocation, setRoute);
    }
  }, [pickupLocation, destinationLocation]);

  // Fetch route between driver's location and destination
  useEffect(() => {
    if (driverLocation && destinationLocation) {
      fetchRoute(driverLocation, destinationLocation, setRoute);
    }
  }, [driverLocation, destinationLocation]);

  // Calculate ride progress
  useEffect(() => {
    if (driverLocation && pickupLocation && destinationLocation) {
      const totalDistance = calculateDistance(pickupLocation.lat, pickupLocation.lng, destinationLocation.lat, destinationLocation.lng);
      const distanceCovered = calculateDistance(pickupLocation.lat, pickupLocation.lng, driverLocation.lat, driverLocation.lng);
      const progressPercentage = (distanceCovered / totalDistance) * 100;
      setProgress(Math.min(progressPercentage, 100));
    }
  }, [driverLocation, pickupLocation, destinationLocation]);

  // Socket connection and real-time updates
  useEffect(() => {
    if (!user) return;

    socketRef.current = io("http://localhost:3000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    let prevLocation = null;
    let prevTime = null;

    socket.on("connect", () => {
      console.log("Connected to socket");
      socket.emit("joinRoom", bookingId);
    });

    socket.on("updateLocations", (data) => {
      console.log("Driver location received:", data); // Debugging

      // Extract the first key (driver ID) and its value (location)
      const driverId = Object.keys(data)[0];
      const location = data[driverId];
      if (location && location.lat && location.lng) {
        setDriverLocation(location);
        setMapCenter([location.lat, location.lng]); // Update map center to driver's location
      } else {
        console.error("Invalid driver location:", location);
      }
    
      if (prevLocation && prevTime) {
        const currentTime = Date.now();
        calculateETAAndSpeed(prevLocation, location, prevTime, currentTime);
      }

      prevLocation = location;
      prevTime = Date.now();
    });

    socket.on("newMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
    socket.on("RideCompletednowpay", (data) => {
      console.log("Ride completed event received:", data);
      toast.success("Ride completed! Redirecting to payment page...");
  
      if (data && data.paymentPageUrl) {
        navigate(data.paymentPageUrl);
      } else {
        console.error("Payment page URL missing in RideCompletednowpay event data");
      }
    });
  
    socket.on("chatError", (errorMessage) => {
      setError(errorMessage);
    });

    // Watch user's location
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("User location updated:", { lat: latitude, lng: longitude }); 
        setUserLocation({ lat: latitude, lng: longitude, timestamp: Date.now() });
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      },
    );

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    };
  }, [bookingId, user]);

  // Recenter the map on the driver's location
  const handleRecenter = () => {
    if (driverLocation) {
      setMapCenter([driverLocation.lat, driverLocation.lng]);
      setMapZoom(14);
    }
  };

  // Send message to driver
  const sendMessage = () => {
    if (newMessage.trim() === "") return;

    const messageData = {
      bookingId,
      message: newMessage,
      senderId: user?._id,
      senderModel: "User",
      senderName: "User",
    };

    socketRef.current.emit("sendMessage", messageData);
    setNewMessage("");
  };

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setNewMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Toggle night mode
  const toggleNightMode = () => {
    setIsNightMode(!isNightMode);
  };

  if (loading) return <div className="text-center py-5 text-xl font-semibold text-gray-700">Loading ride details...</div>;

  return (
    <div className={`min-h-screen ${isNightMode ? "bg-gray-900" : "bg-gradient-to-br from-black to-gray-900"} p-6`}>
      {/* Map Section */}
      <div className="fixed top-0 left-0 w-full h-full z-0">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          whenCreated={(map) => (mapRef.current = map)}
          className="w-full h-full"
        >
          <TileLayer
            url={isNightMode ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
          />
          <MapUpdater center={mapCenter} zoom={mapZoom} />
          {pickupLocation && (
            <Marker position={[pickupLocation.lat, pickupLocation.lng]}>
              <Tooltip>Pickup Location</Tooltip>
            </Marker>
          )}
          {destinationLocation && (
            <Marker position={[destinationLocation.lat, destinationLocation.lng]}>
              <Tooltip>Destination</Tooltip>
            </Marker>
          )}
          {driverLocation && (
            <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
              <Tooltip>Driver's Location</Tooltip>
            </Marker>
          )}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Tooltip>Your Location</Tooltip>
            </Marker>
          )}
          {route.length > 0 && (
            <Polyline
              positions={route}
              color={isNightMode ? "#FFA500" : "blue"} // Orange for night mode, blue for day
              weight={6} // Thicker line
            />
          )}
        </MapContainer>
      </div>

      {/* Top Bar - Progress and ETA */}
      <div className="fixed top-4 left-4 right-4 bg-white bg-opacity-95 p-3 rounded-lg shadow-lg z-50">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-800">ETA: {eta} hours</p>
          <p className="text-sm text-gray-800">Speed: {speed} km/h</p>
        </div>
      </div>

      {/* Recenter Button */}
      <button
        onClick={handleRecenter}
        className="fixed bottom-32 right-4 bg-white bg-opacity-90 p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all z-50"
      >
        <Navigation size={24} className="text-gray-800" />
      </button>

      {/* Emergency Button */}
      <button
        onClick={() => alert("Emergency alert sent to driver and support team!")}
        className="fixed bottom-20 right-4 bg-red-500 text-white p-4 rounded-full shadow-lg hover:bg-red-600 transition-all z-50"
      >
        <AlertTriangle size={24} />
      </button>

      {/* Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-4 w-96 h-[28rem] bg-white rounded-lg shadow-xl flex flex-col z-50">
          <div className="bg-blue-500 text-white p-4 rounded-t-lg">
            <h2 className="text-lg font-semibold">Chat with Driver</h2>
          </div>
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`max-w-[70%] ${msg.senderModel === "User" ? "ml-auto" : "mr-auto"}`}>
                <div
                  className={`p-3 rounded-lg ${
                    msg.senderModel === "User" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {msg.text}
                </div>
                <p className="text-xs text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
          <div className="p-4 border-t">
            <div className="flex items-center">
              <TextField
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                variant="outlined"
                size="small"
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button onClick={startListening} disabled={isListening} className="ml-2">
                <Mic size={20} />
              </Button>
              <Button variant="contained" color="primary" onClick={sendMessage} className="ml-2">
                <Send size={20} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all z-50"
      >
        {isChatOpen ? <X size={24} /> : <Send size={24} />}
      </button>

      {/* Night Mode Toggle */}
      <button
        onClick={toggleNightMode}
        className="fixed bottom-4 left-4 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all z-50"
      >
        {isNightMode ? "🌙" : "☀️"}
      </button>
    </div>
  );
};

export default UserRidePage;