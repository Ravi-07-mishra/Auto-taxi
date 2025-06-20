import React, { useEffect, useState, useRef ,useCallback} from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import io from "socket.io-client";
import axios from "axios";
import { Send, X, Navigation, AlertTriangle, Mic, Clipboard } from "lucide-react";
import {
  Button,
  TextField,
  Snackbar,
  Alert as MuiAlert,
  LinearProgress,
  Box,
  IconButton,
  Typography,
  Paper,
} from "@mui/material";
import { useAuth } from "../Context/userContext";
import "leaflet/dist/leaflet.css";

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (Array.isArray(center) && center.length === 2) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calculateETAAndSpeed = (
  prevLoc,
  currLoc,
  prevTime,
  currTime,
  destinationLocation,
  setSpeed,
  setEta
) => {
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
    const remDist = calculateDistance(
      currLoc.lat,
      currLoc.lng,
      destinationLocation.lat,
      destinationLocation.lng
    );
    setEta((remDist / currSpeed).toFixed(2));
  }
};

const UserRidePage = () => {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const API_BASE2 = import.meta.env.VITE_API_URL2 || "http://localhost:3000";

  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State (original + new OTP state)
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [progress, setProgress] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpCopied, setOtpCopied] = useState(false);

  // Refs
  const socketRef = useRef(null);
  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const geoWatchId = useRef(null);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [mapZoom, setMapZoom] = useState(14);

  // Generate OTP on load
  useEffect(() => {
    const fetchBookingAndOtp = async () => {
      try {
        // Original booking fetch
        const { data } = await axios.get(`${API_BASE}/driver/driver/${bookingId}`);
        setPickupLocation(data.booking.pickupLocation);
        setDestinationLocation(data.booking.destinationLocation);
        setMapCenter([data.booking.pickupLocation.lat, data.booking.pickupLocation.lng]);

        // NEW: Generate OTP
        const otpRes = await axios.post(`${API_BASE}/user/${bookingId}/generate-otp`);
        setOtp(otpRes.data.otp);
      } catch (err) {
        setError("Failed to load booking");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };
    fetchBookingAndOtp();
  }, [API_BASE, bookingId]);

  // Copy OTP helper
  const copyOtp = () => {
    navigator.clipboard.writeText(otp);
    setOtpCopied(true);
    setTimeout(() => setOtpCopied(false), 2000);
  };

  
  useEffect(() => {
    if (!user) return;
    const socket = io(API_BASE2);
    socketRef.current = socket;

    let prevLoc = null;
    let prevTime = null;

    socket.on("connect", () => {
      socket.emit("joinRoom", bookingId);
      socket.emit("setUserSocketId", user._id);
    });

    socket.on("updateLocations", (locations) => {
      const loc = Object.values(locations)[0];
      setDriverLocation(loc);
      setMapCenter([loc.lat, loc.lng]);
      const now = Date.now();
      if (prevLoc && prevTime) {
        calculateETAAndSpeed(prevLoc, loc, prevTime, now, destinationLocation, setSpeed, setEta);
      }
      prevLoc = loc;
      prevTime = now;
    });

    socket.on("newMessage", (msg) => {
      setMessages((m) => [...m, msg]);
      setTimeout(() => {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }, 50);
    });

    socket.on("bookingAccepted", ({ paymentPageUrl }) => {
      if (paymentPageUrl && !isNavigating) {
        setIsNavigating(true);
        navigate(paymentPageUrl);
      }
    });

    socket.on("RideCompletednowpay", (d) => {
      if (d.paymentPageUrl && !isNavigating) {
        setIsNavigating(true);
        navigate(d.paymentPageUrl);
      }
    });

    if (navigator.geolocation) {
      geoWatchId.current = navigator.geolocation.watchPosition(
        ({ coords }) => setUserLocation({ lat: coords.latitude, lng: coords.longitude }),
        console.error,
        { enableHighAccuracy: true }
      );
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.onresult = (e) => {
        setNewMessage(e.results[0][0].transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }

    return () => {
      socket.disconnect();
      if (geoWatchId.current != null) navigator.geolocation.clearWatch(geoWatchId.current);
    };
  }, [API_BASE2, bookingId, user, destinationLocation, navigate, isNavigating]);

  // Route fetching (original)
  const fetchRoute = useCallback(
    async (start, end, setter) => {
      try {
        const res = await axios.get(`${API_BASE2}/directions`, {
          params: {
            start: `${start.lng},${start.lat}`,
            end: `${end.lng},${end.lat}`,
          },
        });
        const coords = res.data.features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        setter(coords);
        if (setter === setRoute) {
          const durationSec = res.data.features[0].properties.segments[0].duration;
          setEta((durationSec / 60).toFixed(2));
        }
      } catch (err) {
        setError("Route fetch failed");
        setSnackbarOpen(true);
      }
    },
    [API_BASE2]
  );

  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      fetchRoute(pickupLocation, destinationLocation, setRoute);
    }
  }, [pickupLocation, destinationLocation, fetchRoute]);

  // Progress calculation (original)
  useEffect(() => {
    if (driverLocation && pickupLocation && destinationLocation) {
      const totalDist = calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        destinationLocation.lat,
        destinationLocation.lng
      );
      const doneDist = calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        driverLocation.lat,
        driverLocation.lng
      );
      setProgress(Math.min((doneDist / totalDist) * 100, 100));
    }
  }, [driverLocation, pickupLocation, destinationLocation]);

  // Handlers (original)
  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;
    socketRef.current.emit("sendMessage", {
      bookingId,
      message: newMessage,
      senderId: user._id,
      senderModel: "User",
      senderName: "User",
    });
    setNewMessage("");
  };

  const startListen = () => {
    recognitionRef.current?.start();
    setIsListening(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <MuiAlert severity="info">Loading ride details...</MuiAlert>
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", minHeight: "100vh" }}>
      {/* NEW: OTP Display (only addition) */}
      {otp && (
        <Paper sx={{
          position: "fixed",
          top: 80,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          p: 2,
          textAlign: "center"
        }}>
          <Typography variant="h6">Show driver this OTP:</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>{otp}</Typography>
            <IconButton onClick={copyOtp} color="primary">
              <Clipboard size={20} />
            </IconButton>
          </Box>
          {otpCopied && (
            <Typography variant="caption" color="green">Copied!</Typography>
          )}
        </Paper>
      )}

      {/* Original components below (unchanged) */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <MuiAlert severity="error">{error}</MuiAlert>
      </Snackbar>

      <Box sx={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            url={isNightMode 
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" 
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
          />
          <MapUpdater center={mapCenter} zoom={mapZoom} />
          {pickupLocation && (
            <Marker position={[pickupLocation.lat, pickupLocation.lng]}>
              <Tooltip>Pickup</Tooltip>
            </Marker>
          )}
          {destinationLocation && (
            <Marker position={[destinationLocation.lat, destinationLocation.lng]}>
              <Tooltip>Destination</Tooltip>
            </Marker>
          )}
          {driverLocation && (
            <Marker position={[driverLocation.lat, driverLocation.lng]}>
              <Tooltip>Driver</Tooltip>
            </Marker>
          )}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Tooltip>You</Tooltip>
            </Marker>
          )}
          {route.length > 0 && (
            <Polyline
              positions={route}
              pathOptions={{ color: isNightMode ? "#FFA500" : "blue", weight: 6 }}
            />
          )}
        </MapContainer>
      </Box>

      <Box sx={{
        position: "fixed",
        top: 16,
        left: 16,
        right: 16,
        bgcolor: "background.paper",
        borderRadius: 1,
        p: 1,
        zIndex: 50
      }}>
        <LinearProgress variant="determinate" value={progress} />
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <span>ETA: {eta} hrs</span>
          <span>Speed: {speed} km/h</span>
        </Box>
      </Box>

      <IconButton
        onClick={() => setMapCenter(driverLocation ? [driverLocation.lat, driverLocation.lng] : mapCenter)}
        sx={{ position: "fixed", bottom: 140, right: 16, zIndex: 50 }}
      >
        <Navigation />
      </IconButton>

      <IconButton
        onClick={() => setSnackbarOpen(true)}
        sx={{ position: "fixed", bottom: 88, right: 16, zIndex: 50 }}
      >
        <AlertTriangle />
      </IconButton>

      <IconButton
        onClick={() => setIsChatOpen(!isChatOpen)}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          bgcolor: "primary.main",
          color: "white",
          zIndex: 50
        }}
      >
        {isChatOpen ? <X /> : <Send />}
      </IconButton>

      {isChatOpen && (
        <Box sx={{
          position: "fixed",
          bottom: 88,
          right: 16,
          width: 300,
          height: 300,
          bgcolor: "background.paper",
          borderRadius: 1,
          zIndex: 50,
          display: "flex",
          flexDirection: "column"
        }}>
          <Box sx={{ bgcolor: "primary.main", color: "white", p: 1 }}>Chat</Box>
          <Box ref={chatContainerRef} sx={{ flex: 1, overflowY: "auto", p: 1 }}>
            {messages.map((msg, i) => (
              <Box key={i} sx={{ mb: 1, alignSelf: msg.senderModel === "User" ? "flex-end" : "flex-start" }}>
                <Box sx={{
                  p: 1,
                  borderRadius: 1,
                  bgcolor: msg.senderModel === "User" ? "primary.main" : "grey.200",
                  color: msg.senderModel === "User" ? "white" : "text.primary"
                }}>
                  {msg.text}
                </Box>
                <Typography variant="caption">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: "flex", p: 1, borderTop: "1px solid grey" }}>
            <TextField
              fullWidth
              size="small"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <IconButton onClick={startListen} disabled={isListening}>
              <Mic />
            </IconButton>
            <IconButton onClick={sendMessage}>
              <Send />
            </IconButton>
          </Box>
        </Box>
      )}

      <Button
        onClick={() => setIsNightMode(!isNightMode)}
        sx={{ position: "fixed", bottom: 16, left: 16, zIndex: 50 }}
      >
        {isNightMode ? "☀️" : "🌙"}
      </Button>
    </Box>
  );
};

export default UserRidePage;