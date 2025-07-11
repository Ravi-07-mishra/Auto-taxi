// src/pages/DrivePage.jsx

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from "react-leaflet";
import { Button, TextField, LinearProgress, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
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

// Constants
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_BASE2 = import.meta.env.VITE_API_URL2 || "http://localhost:3000";
const NEAR_DESTINATION_THRESHOLD = 0.5; // km
const MAP_ZOOM_LEVEL = 14;
const EARTH_RADIUS_KM = 6371;

const DrivePage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { driver } = useDriverAuth();

  // State
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [driverToDestinationRoute, setDriverToDestinationRoute] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [rideStatus, setRideStatus] = useState("accepted");
  const [rideStartTime, setRideStartTime] = useState(null);
  const [rideEnded, setRideEnded] = useState(false);
  const [totalRideTime, setTotalRideTime] = useState(null);
  const [progress, setProgress] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNearDestination, setIsNearDestination] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);

  // Refs
  const socketRef = useRef(null);
  const mapRef = useRef(null);
  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const prevLocationRef = useRef(null);
  const prevTimeRef = useRef(null);

  // Window size
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Distance calculation
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, []);

  // Fetch booking details
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/driver/driver/${bookingId}`,
          { withCredentials: true }
        );
        setRideStatus(data.booking.status.toLowerCase());
        setPickupLocation(data.booking.pickupLocation);
        setDestinationLocation(data.booking.destinationLocation);
      } catch (err) {
        console.error("Error fetching booking details:", err);
        setError("Failed to load booking details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchBookingDetails();
  }, [bookingId]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const isMobile = windowSize.width < 768;

  // Calculate ETA and speed
  const calculateETAAndSpeed = useCallback(
    (prevLoc, currLoc, prevTime, currTime) => {
      const dist = calculateDistance(
        prevLoc.lat,
        prevLoc.lng,
        currLoc.lat,
        currLoc.lng
      );
      const hours = (currTime - prevTime) / 3600000;
      const currSpeed = dist / hours;
      setSpeed(currSpeed.toFixed(2));

      if (destinationLocation) {
        const remainingDistance = calculateDistance(
          currLoc.lat,
          currLoc.lng,
          destinationLocation.lat,
          destinationLocation.lng
        );
        setEta((remainingDistance / currSpeed).toFixed(2));
        setIsNearDestination(remainingDistance <= NEAR_DESTINATION_THRESHOLD);
      }
    },
    [destinationLocation, calculateDistance]
  );

  // Track ride progress percentage
  useEffect(() => {
    if (driverLocation && pickupLocation && destinationLocation) {
      const totalDistance = calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        destinationLocation.lat,
        destinationLocation.lng
      );
      const completedDistance = calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        driverLocation.lat,
        driverLocation.lng
      );
      setProgress(Math.min((completedDistance / totalDistance) * 100, 100));
    }
  }, [driverLocation, pickupLocation, destinationLocation, calculateDistance]);

  // Speech recognition setup (chat)
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (e) => {
        setNewMessage(e.results[0][0].transcript);
        setIsListening(false);
      };
      recognition.onerror = () => {
        setIsListening(false);
        setError("Speech recognition failed. Please try typing your message.");
      };

      recognitionRef.current = recognition;
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setError("Failed to start speech recognition.");
      }
    }
  }, [isListening]);

  // Emergency alert
  const handleEmergency = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("emergencyAlert", {
        bookingId,
        driverId: driver?._id,
      });
      setError("Emergency alert sent to passenger and support team!");
    }
  }, [bookingId, driver]);

  // Fetch route from point A → B
  const fetchRoute = useCallback(async (start, end, cb) => {
    setRouteLoading(true);
    try {
      const res = await axios.get(`${API_BASE2}/directions`, {
        params: {
          start: `${start.lng},${start.lat}`,
          end: `${end.lng},${end.lat}`,
        },
        timeout: 10000,
      });

      const feature = res.data.features?.[0];
      if (feature?.geometry?.coordinates) {
        cb(feature.geometry.coordinates);

        // Extract and store instructions on the main pickup→destination route
        if (cb === setRoute) {
          const steps = feature.properties.segments[0].steps || [];
          setInstructions(steps.map((s) => s.instruction));
          const duration = feature.properties.segments[0].duration;
          setEta((duration / 60).toFixed(2));
        }
      } else throw new Error("Invalid route data");
    } catch (err) {
      console.error("Route fetch error:", err);
      setError("Failed to fetch route. Please check your connection.");
    } finally {
      setRouteLoading(false);
    }
  }, []);

  // Fetch primary and live‐driver routes
  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      fetchRoute(
        { lat: pickupLocation.lat, lng: pickupLocation.lng },
        { lat: destinationLocation.lat, lng: destinationLocation.lng },
        setRoute
      );
    }
  }, [pickupLocation, destinationLocation, fetchRoute]);

  useEffect(() => {
    if (driverLocation && destinationLocation) {
      fetchRoute(driverLocation, destinationLocation, setDriverToDestinationRoute);
    }
  }, [driverLocation, destinationLocation, fetchRoute]);

  // Socket & geolocation streaming
  useEffect(() => {
    if (!driver) return;
    const socket = io(API_BASE2, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
    socketRef.current = socket;

    const handleSuccess = ({ coords }) => {
      const currentLocation = { lat: coords.latitude, lng: coords.longitude };
      setDriverLocation(currentLocation);

      if (prevLocationRef.current && prevTimeRef.current) {
        calculateETAAndSpeed(
          prevLocationRef.current,
          currentLocation,
          prevTimeRef.current,
          Date.now()
        );
      }
      prevLocationRef.current = currentLocation;
      prevTimeRef.current = Date.now();

      socket.emit("driverLocation", {
        id: driver._id,
        lat: coords.latitude,
        lng: coords.longitude,
      });
    };

    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      () => setError("Enable location services."),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    socket.on("connect", () => socket.emit("joinRoom", bookingId));
    socket.on("newMessage", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("connect_error", () => setError("Connection issues."));

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    };
  }, [driver, bookingId, calculateETAAndSpeed]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !socketRef.current || !driver?._id) return;
    const messageData = {
      bookingId,
      message: newMessage.trim(),
      senderId: driver._id,
      senderModel: "Driver",
      senderName: "Driver",
      timestamp: new Date().toISOString(),
    };
    socketRef.current.emit("sendMessage", messageData);
    setNewMessage("");
  }, [newMessage, bookingId, driver]);

  // Verify OTP
  const verifyOtp = useCallback(async () => {
    if (!otp.trim()) {
      setError("Please enter OTP");
      return;
    }
    
    setOtpVerifying(true);
    try {
      const { data } = await axios.post(
        `${API_BASE}/driver/${bookingId}/verify-otp`,
        { otp: otp.trim() },
        { withCredentials: true }
      );

      if (data.success) {
        setOtpDialogOpen(false);
        setOtp("");
        startRide();
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setOtpVerifying(false);
    }
  }, [otp, bookingId]);

  // Start ride after OTP verification
  const startRide = useCallback(() => {
    setRideStatus("started");
    setRideStartTime(Date.now());
    setSuccess("Ride started successfully!");

    // Speak out each instruction
    instructions.forEach((inst) => {
      const utter = new SpeechSynthesisUtterance(inst);
      utter.lang = "en-US";
      speechSynthesis.speak(utter);
    });
  }, [instructions]);

  // Ride controls
  const handleStartRide = useCallback(() => {
    setOtpDialogOpen(true);
  }, []);

  const handleCompleteRide = useCallback(async () => {
    try {
      const endTime = Date.now();
      const totalTime = endTime - rideStartTime;
      setTotalRideTime(totalTime);

      const res = await axios.patch(
        `${API_BASE}/driver/end/${bookingId}`,
        { totalRideTime: totalTime },
        { withCredentials: true, timeout: 10000 }
      );

      setRideStatus("completed");
      socketRef.current.emit("rideCompleted", {
        bookingId,
        paymentAmount: res.data.paymentAmount,
      });
      setSuccess("Ride completed successfully!");
    } catch (err) {
      console.error("Complete ride error:", err);
      setError("Failed to complete ride. Please try again.");
    }
  }, [bookingId, rideStartTime]);

  // Recenter map
  const handleRecenter = useCallback(() => {
    if (mapRef.current && driverLocation) {
      mapRef.current.flyTo([driverLocation.lat, driverLocation.lng], MAP_ZOOM_LEVEL);
    }
  }, [driverLocation]);

  // Chat keypress
  const handleMessageKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const handleCloseError = useCallback(() => setError(null), []);
  const handleCloseSuccess = useCallback(() => setSuccess(null), []);

  // Loading screens
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <LinearProgress className="w-64" />
        <p className="mt-4 text-gray-700">Loading booking details...</p>
      </div>
    );
  }
  if (routeLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <LinearProgress className="w-64" />
        <p className="mt-4 text-gray-700">Calculating optimal route...</p>
      </div>
    );
  }
  if (rideEnded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold text-green-600 mb-2">Ride Completed</h1>
        <p className="text-gray-700 mb-6">{success}</p>
        <Button variant="contained" onClick={() => navigate("/driver/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 p-2 sm:p-4 md:p-6 relative">
      {/* Error/Success Alerts */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseError} severity="error" className="w-full">
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" className="w-full">
          {success}
        </Alert>
      </Snackbar>

      {/* OTP Verification Dialog */}
      <Dialog open={otpDialogOpen} onClose={() => setOtpDialogOpen(false)}>
        <DialogTitle>Verify OTP to Start Ride</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Enter OTP"
            type="text"
            fullWidth
            variant="outlined"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            inputProps={{ maxLength: 6 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOtpDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={verifyOtp} 
            variant="contained" 
            color="primary"
            disabled={otpVerifying || !otp.trim()}
          >
            {otpVerifying ? "Verifying..." : "Verify"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full-screen map */}
      <div className="fixed inset-0 z-0">
        <MapContainer
          center={driverLocation || pickupLocation || [0, 0]}
          zoom={MAP_ZOOM_LEVEL}
          whenCreated={(map) => (mapRef.current = map)}
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© OpenStreetMap contributors'
          />
          {pickupLocation && (
            <Marker position={pickupLocation}>
              <Tooltip permanent>Pickup Location</Tooltip>
            </Marker>
          )}
          {destinationLocation && (
            <Marker position={destinationLocation}>
              <Tooltip permanent>Destination</Tooltip>
            </Marker>
          )}
          {driverLocation && (
            <Marker position={driverLocation}>
              <Tooltip permanent>Your Location</Tooltip>
            </Marker>
          )}
          {route.length > 0 && (
            <Polyline
              positions={route.map(([lng, lat]) => [lat, lng])}
              weight={5}
              opacity={0.7}
            />
          )}
          {driverToDestinationRoute.length > 0 && (
            <Polyline
              positions={driverToDestinationRoute.map(([lng, lat]) => [lat, lng])}
              weight={5}
              opacity={0.7}
              dashArray="10,10"
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
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div
          className={`mt-2 grid gap-1 ${
            isMobile ? "grid-cols-2" : "grid-cols-3"
          }`}
        >
          <div className="text-xs sm:text-sm text-gray-800 truncate">
            <span className="font-semibold">ETA:</span> {eta ? `${eta} hrs` : "--"}
          </div>
          <div className="text-xs sm:text-sm text-gray-800">
            <span className="font-semibold">Progress:</span> {progress.toFixed(1)}%
          </div>
          {!isMobile && (
            <div className="text-xs sm:text-sm text-gray-800">
              <span className="font-semibold">Speed:</span>{" "}
              {speed ? `${speed} km/h` : "--"}
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="fixed right-2 sm:right-4 bottom-20 sm:bottom-24 flex flex-col space-y-2 z-50">
        <button
          onClick={handleRecenter}
          className="bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-gray-100 transition-all p-3"
          aria-label="Recenter map"
        >
          <Navigation size={isMobile ? 20 : 24} className="text-gray-800" />
        </button>
        <button
          onClick={handleEmergency}
          className="bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all p-3"
          aria-label="Emergency alert"
        >
          <AlertTriangle size={isMobile ? 20 : 24} />
        </button>
        <button
          onClick={() => setIsChatOpen((o) => !o)}
          className={`rounded-full shadow-lg transition-all p-3 ${
            isChatOpen
              ? "bg-gray-500 text-white hover:bg-gray-600"
              : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
          }`}
          aria-label={isChatOpen ? "Close chat" : "Open chat"}
        >
          {isChatOpen ? <X size={isMobile ? 20 : 24} /> : <Send size={isMobile ? 20 : 24} />}
        </button>
      </div>

      {/* Chat window */}
      {isChatOpen && (
        <div
          className={`fixed bg-white rounded-lg shadow-xl flex flex-col z-50 ${
            isMobile ? "bottom-16 right-2 w-72 h-64" : "bottom-20 right-4 w-80 h-96"
          }`}
        >
          <div className="bg-blue-500 text-white p-2 flex justify-between items-center rounded-t-lg">
            <h2 className="font-semibold">Chat with Passenger</h2>
            <button onClick={() => setIsChatOpen(false)} aria-label="Close chat">
              <X size={18} />
            </button>
          </div>
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-2 space-y-2">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`max-w-[80%] ${
                    msg.senderModel === "Driver" ? "ml-auto" : "mr-auto"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg text-sm ${
                      msg.senderModel === "Driver"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="p-2 border-t">
            <div className="flex items-center space-x-1">
              <TextField
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                variant="outlined"
                size="small"
                className="flex-1"
                multiline
                maxRows={3}
                onKeyPress={handleMessageKeyPress}
                inputProps={{ "aria-label": "Message input" }}
              />
              <Button onClick={startListening} disabled={isListening} aria-label="Voice input">
                <Mic
                  size={20}
                  className={isListening ? "text-red-500 animate-pulse" : "text-gray-600"}
                />
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                aria-label="Send message"
              >
                <Send size={20} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ride action buttons */}
      <div
        className={`fixed left-0 right-0 flex justify-center z-50 ${
          isMobile ? "bottom-2 px-2" : "bottom-4 px-4"
        }`}
      >
        <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-1 flex space-x-2">
          {rideStatus === "accepted" && (
            <Button
              onClick={handleStartRide}
              variant="contained"
              color="success"
              startIcon={<Play size={18} />}
            >
              {isMobile ? "Start" : "Start Ride"}
            </Button>
          )}
          {rideStatus === "started" && (
            <Button
              onClick={handleCompleteRide}
              variant="contained"
              color="primary"
              startIcon={<CheckCircle size={18} />}
            >
              {isMobile ? "Complete" : "Complete Ride"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(DrivePage);