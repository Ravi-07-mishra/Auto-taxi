"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from "react-leaflet";
import { Button, TextField } from "@mui/material";
import L from "leaflet";
import io from "socket.io-client";
import axios from "axios";
import { useDriverAuth } from "../Context/driverContext";
import {
  Send,
  X,
  Play,
  CheckCircle,
  AlertTriangle,
  Mic,
  Navigation
} from "lucide-react";

const DrivePage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { driver } = useDriverAuth();

  // ↓ Use VITE_API_URL from .env, or default to localhost
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [driverToDestinationRoute, setDriverToDestinationRoute] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [rideStatus, setRideStatus] = useState("accepted");
  const [rideStartTime, setRideStartTime] = useState(null);
  const [showRideInfo, setShowRideInfo] = useState(false);
  const [rideEnded, setRideEnded] = useState(false);
  const [totalRideTime, setTotalRideTime] = useState(null);
  const [progress, setProgress] = useState(0);
  const [nextLandmark, setNextLandmark] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNearDestination, setIsNearDestination] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const socketRef = useRef(null);
  const mapRef = useRef(null);
  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Window size for responsiveness
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const handleResize = () =>
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;

  // Fetch booking details
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/api/driver/driver/${bookingId}`,
          { withCredentials: true } // if you need cookies/session
        );
        setRideStatus(data.booking.status.toLowerCase());
        setPickupLocation(data.booking.pickupLocation);
        setDestinationLocation(data.booking.destinationLocation);
      } catch (err) {
        console.error("Error fetching booking details:", err);
        alert("Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  // Haversine formula for distance
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Calculate ETA & speed
  const calculateETAAndSpeed = (prevLoc, currLoc, prevTime, currTime) => {
    const dist = calculateDistance(
      prevLoc.lat,
      prevLoc.lng,
      currLoc.lat,
      currLoc.lng
    );
    const hours = (currTime - prevTime) / 3600000; // ms → hours
    const currSpeed = dist / hours; // km/h
    setSpeed(currSpeed.toFixed(2));

    if (destinationLocation) {
      const rem = calculateDistance(
        currLoc.lat,
        currLoc.lng,
        destinationLocation.lat,
        destinationLocation.lng
      );
      setEta((rem / currSpeed).toFixed(2)); // hours
      setIsNearDestination(rem <= 0.5); // if < 0.5 km, near destination
    }
  };

  // Track ride progress percentage
  useEffect(() => {
    if (driverLocation && pickupLocation && destinationLocation) {
      const total = calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        destinationLocation.lat,
        destinationLocation.lng
      );
      const done = calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        driverLocation.lat,
        driverLocation.lng
      );
      setProgress(Math.min((done / total) * 100, 100));
    }
  }, [driverLocation, pickupLocation, destinationLocation]);

  // Speech recognition setup
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      recognitionRef.current = new SpeechRec();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.onresult = (e) => {
        setNewMessage(e.results[0][0].transcript);
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, []);
  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Emergency alert
  const handleEmergency = () => {
    alert("Emergency alert sent to passenger and support team!");
    socketRef.current.emit("emergencyAlert", {
      bookingId,
      driverId: driver._id,
    });
  };

  // Fetch route from point A → B
  const fetchRoute = async (start, end, cb) => {
    setRouteLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/directions`, {
        params: {
          start: `${start.lng},${start.lat}`,
          end: `${end.lng},${end.lat}`,
        },
      });
      const feat = res.data.features?.[0];
      if (feat?.geometry?.coordinates) {
        cb(feat.geometry.coordinates);
        if (cb === setRoute) {
          const dur = feat.properties.segments[0].duration; // seconds
          setEta((dur / 60).toFixed(2)); // convert to minutes
        }
      } else {
        throw new Error("Invalid route data");
      }
    } catch (err) {
      console.error("Route fetch error:", err);
      alert("Failed to fetch route.");
    } finally {
      setRouteLoading(false);
    }
  };

  // Fetch ride route once pickup & destination are known
  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      fetchRoute(
        { lat: pickupLocation.lat, lng: pickupLocation.lng },
        { lat: destinationLocation.lat, lng: destinationLocation.lng },
        setRoute
      );
    }
  }, [pickupLocation, destinationLocation]);

  // Fetch route from driver → destination as driverLocation updates
  useEffect(() => {
    if (driverLocation && destinationLocation) {
      fetchRoute(driverLocation, destinationLocation, setDriverToDestinationRoute);
    }
  }, [driverLocation, destinationLocation]);

  // Socket + geolocation streaming
  useEffect(() => {
    if (!driver) return;

    const socket = io(API_BASE, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    let prevLoc = null,
      prevTime = null;

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const curr = { lat: coords.latitude, lng: coords.longitude };
        setDriverLocation(curr);

        if (prevLoc && prevTime) {
          calculateETAAndSpeed(prevLoc, curr, prevTime, Date.now());
        }
        prevLoc = curr;
        prevTime = Date.now();

        socket.emit("driverLocation", {
          id: driver._id,
          lat: coords.latitude,
          lng: coords.longitude,
        });
      },
      console.error,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    socket.on("connect", () => socket.emit("joinRoom", bookingId));
    socket.on("newMessage", (msg) => setMessages((m) => [...m, msg]));

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    };
  }, [driver, bookingId]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Send chat message
  const sendMessage = () => {
    if (!newMessage.trim()) return;
    socketRef.current.emit("sendMessage", {
      bookingId,
      message: newMessage,
      senderId: driver._id,
      senderModel: "Driver",
      senderName: "Driver",
    });
    setNewMessage("");
  };

  // Ride controls
  const handleStartRide = () => {
    setRideStatus("started");
    setRideStartTime(Date.now());
  };

  const handleCompleteRide = async () => {
    try {
      const end = Date.now();
      const total = end - rideStartTime;
      setTotalRideTime(total);
      const res = await axios.patch(
        `${API_BASE}/api/driver/end/${bookingId}`,
        { totalRideTime: total },
        { withCredentials: true }
      );
      setRideStatus("completed");
      setShowRideInfo(true);
      socketRef.current.emit("rideCompleted", {
        bookingId,
        paymentAmount: res.data.paymentAmount,
      });
      alert("Ride completed successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to complete ride.");
    }
  };

  const handleEndRide = async () => {
    try {
      const res = await axios.patch(
        `${API_BASE}/api/driver/end/${bookingId}`,
        {},
        { withCredentials: true }
      );
      alert(res.data.message);
      setRideEnded(true);
    } catch (err) {
      console.error(err);
      alert("Failed to end ride.");
    }
  };

  if (loading)
    return (
      <div className="text-center py-5 text-xl text-gray-700">
        Loading booking details...
      </div>
    );
  if (routeLoading)
    return (
      <div className="text-center py-5 text-xl text-gray-700">
        Loading route...
      </div>
    );
  if (rideEnded)
    return (
      <div className="text-center py-5 text-xl font-semibold text-green-600">
        Ride has ended successfully!
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 p-2 sm:p-4 md:p-6">
      {/* Full-screen map */}
      <div className="fixed inset-0 z-0">
        <MapContainer
          center={
            driverLocation ||
            (pickupLocation && {
              lat: pickupLocation.lat,
              lng: pickupLocation.lng,
            })
          }
          zoom={14}
          whenCreated={(map) => (mapRef.current = map)}
          className="w-screen h-screen"
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
            <Marker
              position={driverLocation}
              icon={L.icon({
                iconUrl: "/driver-icon.png",
                iconSize: [30, 30],
              })}
            >
              <Tooltip>Driver's Location</Tooltip>
            </Marker>
          )}
          {route.length > 0 && (
            <Polyline
              positions={route.map(([lng, lat]) => [lat, lng])}
              color="blue"
              weight={4}
            />
          )}
          {driverToDestinationRoute.length > 0 && (
            <Polyline
              positions={driverToDestinationRoute.map(([lng, lat]) => [lat, lng])}
              color="green"
              weight={4}
            />
          )}
        </MapContainer>
      </div>

      {/* Progress bar + stats */}
      <div
        className={`fixed bg-white bg-opacity-90 rounded-lg shadow-lg z-50 ${
          isMobile ? "top-2 left-2 right-2 p-2" : "top-4 left-4 right-4 p-3"
        }`}
      >
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div
          className={`mt-2 grid gap-1 ${
            isMobile ? "grid-cols-2" : "grid-cols-3"
          }`}
        >
          <span className="text-xs sm:text-sm text-black">
            Next: {nextLandmark || "Main Street"}
          </span>
          <span className="text-xs sm:text-sm text-black">
            ETA: {eta ? `${eta} hrs` : "Calculating..."}
          </span>
          {!isMobile && (
            <span className="text-xs sm:text-sm text-black">
              Speed: {speed ? `${speed} km/h` : "Calculating..."}
            </span>
          )}
        </div>
      </div>

      {/* Recenter button */}
      <button
        onClick={() => {
          if (mapRef.current && driverLocation) {
            mapRef.current.setView([driverLocation.lat, driverLocation.lng], 14);
          }
        }}
        className={`fixed bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-gray-100 transition-all z-50 ${
          isMobile ? "bottom-24 right-2 p-2" : "bottom-32 right-4 p-3"
        }`}
      >
        <Navigation size={isMobile ? 20 : 24} className="text-gray-800" />
      </button>

      {/* Emergency button */}
      <button
        onClick={handleEmergency}
        className={`fixed bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all z-50 ${
          isMobile ? "bottom-16 right-2 p-3" : "bottom-20 right-4 p-4"
        }`}
      >
        <AlertTriangle size={isMobile ? 20 : 24} />
      </button>

      {/* Chat window */}
      {isChatOpen && (
        <div
          className={`fixed bg-white rounded-lg shadow-xl flex flex-col z-50 ${
            isMobile ? "bottom-16 right-2 w-72 h-64" : "bottom-20 right-4 w-80 h-96"
          }`}
        >
          <div className="bg-blue-500 text-white p-2 sm:p-3 rounded-t-lg">
            <h2 className="text-sm sm:text-lg font-semibold">Chat with Passenger</h2>
          </div>
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[70%] ${
                  msg.senderModel === "Driver" ? "ml-auto" : "mr-auto"
                }`}
              >
                <div
                  className={`p-2 sm:p-3 rounded-lg text-xs sm:text-base ${
                    msg.senderModel === "Driver"
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
          <div className="p-2 sm:p-3 border-t">
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
              <Button onClick={startListening} disabled={isListening} className="ml-1 sm:ml-2 min-w-0">
                <Mic size={isMobile ? 16 : 20} />
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={sendMessage}
                className="ml-1 sm:ml-2 min-w-0"
              >
                <Send size={isMobile ? 16 : 20} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Chat toggle button */}
      <button
        onClick={() => setIsChatOpen((o) => !o)}
        className={`fixed bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all z-50 ${
          isMobile ? "bottom-4 right-2 p-3" : "bottom-4 right-4 p-4"
        }`}
      >
        {isChatOpen ? <X size={isMobile ? 20 : 24} /> : <Send size={isMobile ? 20 : 24} />}
      </button>

      {/* Ride action buttons */}
      <div
        className={`fixed flex justify-center z-50 ${
          isMobile ? "bottom-2 left-2 right-2 space-x-2" : "bottom-4 left-4 right-4 space-x-4"
        }`}
      >
        {rideStatus === "accepted" && (
          <button
            onClick={handleStartRide}
            className={`flex items-center rounded-lg shadow-lg transition-all ${
              isMobile ? "px-3 py-2 text-sm" : "px-4 py-3 text-base"
            } bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white`}
          >
            <Play size={isMobile ? 16 : 20} className="mr-1 sm:mr-2" />
            {isMobile ? "Start" : "Start Ride"}
          </button>
        )}
        {rideStatus === "started" && (
          <button
            onClick={handleCompleteRide}
            disabled={!isNearDestination}
            className={`flex items-center rounded-lg shadow-lg transition-all ${
              isNearDestination
                ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                : "bg-gray-400 cursor-not-allowed text-white"
            } ${isMobile ? "px-3 py-2 text-sm" : "px-4 py-3 text-base"}`}
          >
            <CheckCircle size={isMobile ? 16 : 20} className="mr-1 sm:mr-2" />
            {isMobile ? "Complete" : "Complete Ride"}
          </button>
        )}
        {rideStatus === "completed" && (
          <button
            onClick={handleEndRide}
            className={`rounded-lg shadow-lg transition-all ${
              isMobile ? "px-3 py-2 text-sm" : "px-4 py-3 text-base"
            } bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white`}
          >
            {isMobile ? "End" : "End Ride"}
          </button>
        )}
      </div>
    </div>
  );
};

export default DrivePage;
