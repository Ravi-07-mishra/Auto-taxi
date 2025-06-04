"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import io from "socket.io-client";
import axios from "axios";
import { Send, X, Navigation, AlertTriangle, Mic } from "lucide-react";
import { Button, TextField } from "@mui/material";
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

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const UserRidePage = () => {
  // ─── Backend Base URL ───────────────────────────────────────────
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [mapZoom, setMapZoom] = useState(14);

  const socketRef = useRef(null);
  const mapRef = useRef(null);
  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Fetch booking details
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/api/driver/driver/${bookingId}`
        );
        setPickupLocation(data.booking.pickupLocation);
        setDestinationLocation(data.booking.destinationLocation);
        setMapCenter([
          data.booking.pickupLocation.lat,
          data.booking.pickupLocation.lng,
        ]);
      } catch (err) {
        console.error("Error fetching booking details:", err);
        setError("Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    };
    fetchBookingDetails();
  }, [bookingId]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateETAAndSpeed = (prevLoc, currLoc, prevTime, currTime) => {
    const dist = calculateDistance(
      prevLoc.lat,
      prevLoc.lng,
      currLoc.lat,
      currLoc.lng
    );
    const hours = (currTime - prevTime) / 3600;
    const currSpeed = dist / hours;
    setSpeed(currSpeed.toFixed(2));
    if (destinationLocation) {
      const remDist = calculateDistance(
        currLoc.lat,
        currLoc.lng,
        destinationLocation.lat,
        destinationLocation.lng
      );
      setEta((remDist / currSpeed).toFixed(2));
    }
  };

  const fetchRoute = async (start, end, setter) => {
    try {
      const res = await axios.get(`${API_BASE}/directions`, {
        params: {
          start: `${start.lng},${start.lat}`,
          end: `${end.lng},${end.lat}`,
        },
      });
      const feat = res.data.features?.[0];
      if (feat?.geometry?.coordinates) {
        const coords = feat.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        setter(coords);
        if (setter === setRoute) {
          const duration = feat.properties.segments[0].duration;
          setEta((duration / 60).toFixed(2));
        }
      } else throw new Error("Invalid route data");
    } catch (err) {
      console.error("Route fetch error:", err);
      setError("Failed to fetch route. Please try again.");
    }
  };

  // Fetch route from pickup to destination
  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      fetchRoute(pickupLocation, destinationLocation, setRoute);
    }
  }, [pickupLocation, destinationLocation]);

  // Update route from driver to destination
  useEffect(() => {
    if (driverLocation && destinationLocation) {
      fetchRoute(driverLocation, destinationLocation, setRoute);
    }
  }, [driverLocation, destinationLocation]);

  // Update progress percentage
  useEffect(() => {
    if (driverLocation && pickupLocation && destinationLocation) {
      const total = calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        destinationLocation.lat,
        destinationLocation.lng
      );
      const covered = calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        driverLocation.lat,
        driverLocation.lng
      );
      setProgress(Math.min((covered / total) * 100, 100));
    }
  }, [driverLocation, pickupLocation, destinationLocation]);

  // Setup socket and geolocation watching
  useEffect(() => {
    if (!user) return;

    const socket = io(API_BASE, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    let prevLoc = null;
    let prevTime = null;

    socket.on("connect", () => socket.emit("joinRoom", bookingId));

    socket.on("updateLocations", (data) => {
      const [driverIdKey] = Object.keys(data);
      const loc = data[driverIdKey];
      if (loc?.lat && loc?.lng) {
        setDriverLocation(loc);
        setMapCenter([loc.lat, loc.lng]);
        const now = Date.now();
        if (prevLoc && prevTime) calculateETAAndSpeed(prevLoc, loc, prevTime, now);
        prevLoc = loc;
        prevTime = now;
      }
    });

    socket.on("newMessage", (msg) => setMessages((prev) => [...prev, msg]));

    socket.on("RideCompletednowpay", (d) => {
      if (d.paymentPageUrl) navigate(d.paymentPageUrl);
    });

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) =>
        setUserLocation({
          lat: coords.latitude,
          lng: coords.longitude,
          timestamp: Date.now(),
        }),
      console.error,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    };
  }, [bookingId, user, navigate]);

  const handleRecenter = () => {
    if (driverLocation) {
      setMapCenter([driverLocation.lat, driverLocation.lng]);
      setMapZoom(14);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    socketRef.current.emit("sendMessage", {
      bookingId,
      message: newMessage,
      senderId: user._id,
      senderModel: "User",
      senderName: "User",
    });
    setNewMessage("");
  };

  // Speech recognition setup
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      const recog = new SpeechRec();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = "en-US";
      recog.onresult = (e) => {
        setNewMessage(e.results[0][0].transcript);
        setIsListening(false);
      };
      recog.onerror = () => setIsListening(false);
      recognitionRef.current = recog;
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const toggleNightMode = () => setIsNightMode((prev) => !prev);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl text-gray-700">
        Loading ride details...
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        isNightMode ? "bg-gray-900" : "bg-gradient-to-br from-black to-gray-900"
      } p-2 sm:p-4 md:p-6`}
    >
      {/* Map */}
      <div className="fixed inset-0 z-0">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          whenCreated={(map) => (mapRef.current = map)}
          className="w-screen h-screen"
        >
          <TileLayer
            url={
              isNightMode
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
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
              color={isNightMode ? "#FFA500" : "blue"}
              weight={6}
            />
          )}
        </MapContainer>
      </div>

      {/* Top Bar */}
      <div className="fixed top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 bg-white bg-opacity-95 p-2 sm:p-3 rounded-lg shadow-lg z-50">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2 text-sm text-gray-800">
          <span>ETA: {eta} hrs</span>
          <span>Speed: {speed} km/h</span>
        </div>
      </div>

      {/* Recenter */}
      <button
        onClick={handleRecenter}
        className="fixed bottom-32 right-4 bg-white bg-opacity-90 p-3 sm:p-4 rounded-full shadow-lg hover:bg-gray-100 transition z-50"
      >
        <Navigation size={24} />
      </button>

      {/* Emergency */}
      <button
        onClick={() => alert("Emergency alert sent to driver and support team!")}
        className="fixed bottom-20 right-4 bg-red-500 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-red-600 transition z-50"
      >
        <AlertTriangle size={24} />
      </button>

      {/* Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-4 w-[90%] sm:w-80 md:w-96 max-w-md h-64 sm:h-[28rem] max-h-[80vh] bg-white rounded-lg shadow-xl flex flex-col z-50">
          <div className="bg-blue-500 text-white p-4 rounded-t-lg">
            <h2 className="text-lg font-semibold">Chat with Driver</h2>
          </div>
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4 max-h-[60vh]"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[70%] ${
                  msg.senderModel === "User" ? "ml-auto" : "mr-auto"
                }`}
              >
                <div
                  className={`p-3 rounded-lg ${
                    msg.senderModel === "User"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {msg.text}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
          <div className="p-4 border-t flex items-center">
            <TextField
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              variant="outlined"
              size="small"
              className="flex-1"
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <Button onClick={startListening} disabled={isListening} className="ml-2 p-1 sm:p-2">
              <Mic size={20} />
            </Button>
            <Button variant="contained" color="primary" onClick={sendMessage} className="ml-2 p-1 sm:p-2">
              <Send size={20} />
            </Button>
          </div>
        </div>
      )}

      {/* Chat Toggle */}
      <button
        onClick={() => setIsChatOpen((open) => !open)}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:from-blue-700 hover:to-purple-700 transition z-50"
      >
        {isChatOpen ? <X size={24} /> : <Send size={24} />}
      </button>

      {/* Night Mode Toggle */}
      <button
        onClick={toggleNightMode}
        className="fixed bottom-4 left-4 bg-gray-800 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-gray-700 transition z-50"
      >
        {isNightMode ? "🌙" : "☀️"}
      </button>
    </div>
  );
};

export default UserRidePage;
