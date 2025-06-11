import React, { useEffect, useState, useRef, useCallback } from "react";
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
import { Send, X, Navigation, AlertTriangle, Mic } from "lucide-react";
import {
  Button,
  TextField,
  Snackbar,
  Alert as MuiAlert,
  LinearProgress,
  Box,
  IconButton,
} from "@mui/material";
import { useAuth } from "../Context/userContext";
import "leaflet/dist/leaflet.css";

// Helper: re-center map when props change
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (Array.isArray(center) && center.length === 2) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

// Distance & ETA/Speed calculations
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
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
  const hours = (currTime - prevTime) / 3600000; // ms to hours
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
  const API_BASE =
    import.meta.env.VITE_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://api.yourdomain.com"
      : "http://localhost:3000");
  const API_BASE2 = import.meta.env.VITE_API_URL2 || "http://localhost:3000";

  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
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

  // Map view
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [mapZoom, setMapZoom] = useState(14);

  // Refs
  const socketRef = useRef(null);
  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const geoWatchId = useRef(null);

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/driver/driver/${bookingId}`
        );
        const { pickupLocation, destinationLocation } = data.booking;
        setPickupLocation(pickupLocation);
        setDestinationLocation(destinationLocation);
        setMapCenter([pickupLocation.lat, pickupLocation.lng]);
      } catch (e) {
        console.error(e);
        setError("Failed to load booking.");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [API_BASE, bookingId]);

  // Fetch route polyline
  const fetchRoute = useCallback(
    async (start, end, setter) => {
      try {
        const res = await axios.get(`${API_BASE2}/directions`, {
          params: {
            start: `${start.lng},${start.lat}`,
            end: `${end.lng},${end.lat}`,
          },
        });
        const feat = res.data.features?.[0];
        const coords = feat.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        setter(coords);
        if (setter === setRoute) {
          const durationSec = feat.properties.segments[0].duration;
          setEta((durationSec / 60).toFixed(2));
        }
      } catch (e) {
        console.error(e);
        setError("Route fetch failed.");
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

  useEffect(() => {
    if (driverLocation && destinationLocation) {
      fetchRoute(driverLocation, destinationLocation, setRoute);
    }
  }, [driverLocation, destinationLocation, fetchRoute]);

  // Update progress bar
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

  // Socket, geolocation, speech setup
  useEffect(() => {
    if (!user) return;
    const socket = io(API_BASE2);
    socketRef.current = socket;

    let prevLoc = null;
    let prevTime = null;

    socket.on("connect", () => {
      socket.emit("joinRoom", bookingId);
      console.log("[client] connected as", socket.id);
      socket.emit("setUserSocketId", user._id);
      console.log("[client] sent setUserSocketId:", user._id);
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
      console.log("Received bookingAccepted event:", paymentPageUrl);
      if (paymentPageUrl && !isNavigating) {
        setIsNavigating(true);
        navigate(paymentPageUrl);
      }
    });

    socket.on("RideCompletednowpay", (d) => {
      console.log("Received RideCompletednowpay event:", d);
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

  // Handlers
  const recenter = () =>
    driverLocation && setMapCenter([driverLocation.lat, driverLocation.lng]);
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
  const toggleNight = () => setIsNightMode((v) => !v);
  const closeSnack = () => setSnackbarOpen(false);

  // Loading
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: isNightMode ? "grey.900" : "grey.100",
        }}
      >
        <MuiAlert severity="info">Loading ride details…</MuiAlert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        bgcolor: isNightMode ? "grey.900" : "grey.50",
      }}
    >
      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={8000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <MuiAlert onClose={closeSnack} severity="error">
          {error}
        </MuiAlert>
      </Snackbar>

      {/* Map */}
      <Box sx={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          whenCreated={(m) => (mapRef.current = m)}
          style={{ width: "100vw", height: "100vh" }}
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
            <Marker position={[driverLocation.lat, driverLocation.lng]}>
              <Tooltip>Driver’s Location</Tooltip>
            </Marker>
          )}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Tooltip>Your Location</Tooltip>
            </Marker>
          )}
          {route.length > 0 && (
            <Polyline
              positions={route}
              pathOptions={{
                color: isNightMode ? "#FFA500" : "blue",
                weight: 6,
              }}
            />
          )}
        </MapContainer>
      </Box>

      {/* Top Bar */}
      <Box
        sx={{
          position: "fixed",
          top: 16,
          left: 16,
          right: 16,
          bgcolor: "rgba(255,255,255,0.95)",
          borderRadius: 2,
          p: 1,
          zIndex: 50,
        }}
      >
        <LinearProgress variant="determinate" value={progress} />
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <span>ETA: {eta} hrs</span>
          <span>Speed: {speed} km/h</span>
        </Box>
      </Box>

      {/* Controls */}
      <IconButton
        onClick={recenter}
        sx={{ position: "fixed", bottom: 140, right: 16, zIndex: 50 }}
      >
        <Navigation />
      </IconButton>
      <IconButton
        onClick={() => setSnackbarOpen(true)}
        sx={{
          position: "fixed",
          bottom: 88,
          right: 16,
          color: "error.main",
          zIndex: 50,
        }}
      >
        <AlertTriangle />
      </IconButton>

      {/* Chat */}
      <IconButton
        onClick={() => setIsChatOpen((v) => !v)}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          bgcolor: "primary.main",
          color: "#fff",
          zIndex: 50,
        }}
      >
        {isChatOpen ? <X /> : <Send />}
      </IconButton>

      {isChatOpen && (
        <Box
          sx={{
            position: "fixed",
            bottom: 88,
            right: 16,
            width: 320,
            height: 400,
            bgcolor: "#fff",
            borderRadius: 2,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ bgcolor: "primary.main", color: "#fff", p: 1 }}>
            Chat with Driver
          </Box>
          <Box
            ref={chatContainerRef}
            sx={{ flexGrow: 1, overflowY: "auto", p: 1 }}
          >
            {messages.map((msg, i) => (
              <Box
                key={i}
                sx={{
                  mb: 1,
                  alignSelf: msg.senderModel === "User" ? "flex-end" : "flex-start",
                }}
              >
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: msg.senderModel === "User" ? "primary.main" : "grey.200",
                    color: msg.senderModel === "User" ? "#fff" : "text.primary",
                  }}
                >
                  {msg.text}
                </Box>
                <Box sx={{ typography: "caption", color: "text.secondary" }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Box>
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
            <IconButton color="primary" onClick={sendMessage}>
              <Send />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Night Mode Toggle */}
      <Button
        onClick={toggleNight}
        variant="contained"
        sx={{ position: "fixed", bottom: 16, left: 16, zIndex: 50 }}
      >
        {isNightMode ? "🌙" : "☀️"}
      </Button>
    </Box>
  );
};

export default UserRidePage;
