// src/pages/UserRidePage.jsx
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
import L from "leaflet";
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

// ----------------------------------------
// Helper Functions (no logic changes)
// ----------------------------------------
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

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
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
  const hours = (currTime - prevTime) / 3600; // timestamp diff is in ms, so /3600 converts to hours
  const currSpeed = dist / hours; // km/h
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
  const API_BASE2 = import.meta.env.VITE_API_URL2 || "http://localhost:3000";

// ----------------------------------------
// Logging Wrapper (swap out in prod)
// ----------------------------------------
const logError = (message, error) => {
  // In production, you might send this to a remote logging service instead.
  // Here we just print to console.
  console.error(message, error);
};

// ----------------------------------------
// MapUpdater Component
// ----------------------------------------
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    // Only update view if center changes meaningfully
    if (Array.isArray(center) && center.length === 2) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

// ----------------------------------------
// Main Page Component
// ----------------------------------------

const UserRidePage = () => {
  // ─── Backend Base URL ───────────────────────────────────────────
  // In production, set REACT_APP_API_URL in your .env file.
  const API_BASE =
    import.meta.env.VITE_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://api.yourdomain.com"
      : "http://localhost:3000");

  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ─── State Variables ─────────────────────────────────────────────
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
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Map view
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [mapZoom, setMapZoom] = useState(14);

  // Refs
  const socketRef = useRef(null);
  const mapRef = useRef(null);
  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const geolocationWatchId = useRef(null);

  // ─── Fetch Booking Details ───────────────────────────────────────
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/driver/driver/${bookingId}`
        );
        const booking = data.booking;
        if (booking?.pickupLocation && booking?.destinationLocation) {
          setPickupLocation(booking.pickupLocation);
          setDestinationLocation(booking.destinationLocation);
          setMapCenter([
            booking.pickupLocation.lat,
            booking.pickupLocation.lng,
          ]);
        } else {
          throw new Error("Invalid booking data");
        }
      } catch (err) {
        logError("Error fetching booking details:", err);
        setError("Failed to load booking details.");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [API_BASE, bookingId]);

  // ─── Fetch Route Utility ─────────────────────────────────────────
  const fetchRoute = useCallback(
    async (start, end, setter) => {
      try {
        const response = await axios.get(`${API_BASE}/directions`, {
          params: {
            start: `${start.lng},${start.lat}`,
            end: `${end.lng},${end.lat}`,
          },
        });
        const feat = response.data.features?.[0];
        if (feat?.geometry?.coordinates) {
          const coords = feat.geometry.coordinates.map(([lng, lat]) => [
            lat,
            lng,
          ]);
          setter(coords);

          // If setting the main route, also extract ETA from OpenRouteService / whatever API you’re using.
          if (setter === setRoute) {
            const durationInSeconds = feat.properties.segments[0].duration;
            setEta((durationInSeconds / 60).toFixed(2)); // in minutes
          }
        } else {
          throw new Error("Invalid route data");
        }
      } catch (err) {
        logError("Route fetch error:", err);
        setError("Failed to fetch route. Please try again.");
        setSnackbarOpen(true);
      }
    },
    [API_BASE]
  );

  // ─── Fetch route from pickup → destination on initial load ───────
  useEffect(() => {
    if (pickupLocation && destinationLocation) {
      fetchRoute(pickupLocation, destinationLocation, setRoute);
    }
  }, [pickupLocation, destinationLocation, fetchRoute]);

  // ─── Recalculate route from driver → destination whenever driver moves ─
  useEffect(() => {
    if (driverLocation && destinationLocation) {
      fetchRoute(driverLocation, destinationLocation, setRoute);
    }
  }, [driverLocation, destinationLocation, fetchRoute]);

  // ─── Update Progress (%) ──────────────────────────────────────────
  useEffect(() => {
    if (driverLocation && pickupLocation && destinationLocation) {
      const totalDistance = calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        destinationLocation.lat,
        destinationLocation.lng
      );
      const distanceCovered = calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        driverLocation.lat,
        driverLocation.lng
      );
      setProgress(Math.min((distanceCovered / totalDistance) * 100, 100));
    }
  }, [driverLocation, pickupLocation, destinationLocation]);

  // ─── Initialize Socket.IO, Geolocation & Speech Recognition ───────
  useEffect(() => {
    if (!user) return;

    // ─── 1. Initialize Socket.IO ───────────────────────────────────
    const socket = io(API_BASE2, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    let prevLoc = null;
    let prevTime = null;

    socket.on("connect", () => {
      socket.emit("joinRoom", bookingId);
    });

    socket.on("updateLocations", (data) => {
      const [driverIdKey] = Object.keys(data);
      const loc = data[driverIdKey];

      if (loc?.lat && loc?.lng) {
        setDriverLocation(loc);
        setMapCenter([loc.lat, loc.lng]);

        const now = Date.now();
        if (prevLoc && prevTime) {
          calculateETAAndSpeed(
            prevLoc,
            loc,
            prevTime,
            now,
            destinationLocation,
            setSpeed,
            setEta
          );
        }
        prevLoc = loc;
        prevTime = now;
      }
    });

    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
      // Auto‐scroll chat container
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      }, 50);
    });

    socket.on("RideCompletednowpay", (d) => {
      if (d.paymentPageUrl) {
        navigate(d.paymentPageUrl);
      }
    });

    // ─── 2. Initialize Geolocation Watch ────────────────────────────
    if (navigator.geolocation) {
      geolocationWatchId.current = navigator.geolocation.watchPosition(
        ({ coords }) =>
          setUserLocation({
            lat: coords.latitude,
            lng: coords.longitude,
            timestamp: Date.now(),
          }),
        (geoErr) => {
          logError("Geolocation watch error:", geoErr);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    }

    // ─── 3. Initialize Speech Recognition ───────────────────────────
    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      const recog = new SpeechRec();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = "en-US";
      recog.onresult = (e) => {
        setNewMessage(e.results[0][0].transcript);
        setIsListening(false);
      };
      recog.onerror = () => {
        setIsListening(false);
      };
      recognitionRef.current = recog;
    }

    // ─── Cleanup on Unmount ────────────────────────────────────────
    return () => {
      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      // Clear geolocation watch
      if (geolocationWatchId.current !== null) {
        navigator.geolocation.clearWatch(geolocationWatchId.current);
      }
    };
  }, [API_BASE2, bookingId, user, navigate, destinationLocation]);

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleRecenter = () => {
    if (driverLocation) {
      setMapCenter([driverLocation.lat, driverLocation.lng]);
      setMapZoom(14);
    }
  };

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

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const toggleNightMode = () => {
    setIsNightMode((prev) => !prev);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // ─── Loading State ───────────────────────────────────────────────
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
        <MuiAlert severity="info" variant="outlined">
          Loading ride details…
        </MuiAlert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        bgcolor: isNightMode ? "grey.900" : "grey.50",
        p: 0,
        m: 0,
      }}
    >
      {/* Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={8000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <MuiAlert
          onClose={handleCloseSnackbar}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </MuiAlert>
      </Snackbar>

      {/* Map Fullscreen */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
        }}
      >
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
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
            <Marker
              position={[pickupLocation.lat, pickupLocation.lng]}
              icon={userIcon}
            >
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
              <Tooltip>Driver’s Location</Tooltip>
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
              pathOptions={{
                color: isNightMode ? "#FFA500" : "blue",
                weight: 6,
              }}
            />
          )}
        </MapContainer>
      </Box>

      {/* Top Bar (Progress, ETA, Speed) */}
      <Box
        sx={{
          position: "fixed",
          top: 16,
          left: 16,
          right: 16,
          bgcolor: "rgba(255,255,255,0.95)",
          borderRadius: 2,
          boxShadow: 3,
          p: 1,
          zIndex: 50,
        }}
      >
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 8, borderRadius: 4 }}
        />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 1,
            typography: "body2",
            color: "text.secondary",
          }}
        >
          <span>ETA: {eta} hrs</span>
          <span>Speed: {speed} km/h</span>
        </Box>
      </Box>

      {/* Recenter Button */}
      <IconButton
        onClick={handleRecenter}
        aria-label="Recenter map"
        sx={{
          position: "fixed",
          bottom: 140,
          right: 16,
          bgcolor: "rgba(255,255,255,0.9)",
          boxShadow: 3,
          "&:hover": { bgcolor: "grey.100" },
          zIndex: 50,
        }}
      >
        <Navigation size={24} />
      </IconButton>

      {/* Emergency Button */}
      <IconButton
        onClick={() => setSnackbarOpen(true) /* show error banner as “emergency alert” */}
        aria-label="Emergency alert"
        sx={{
          position: "fixed",
          bottom: 88,
          right: 16,
          bgcolor: "error.main",
          color: "#fff",
          boxShadow: 3,
          "&:hover": { bgcolor: "error.dark" },
          zIndex: 50,
        }}
      >
        <AlertTriangle size={24} />
      </IconButton>

      {/* Chat Window */}
      {isChatOpen && (
        <Box
          sx={{
            position: "fixed",
            bottom: 88,
            right: 16,
            width: { xs: "90%", sm: 320, md: 400 },
            height: { xs: 240, sm: 400 },
            maxHeight: "80vh",
            bgcolor: "#fff",
            borderRadius: 2,
            boxShadow: 4,
            display: "flex",
            flexDirection: "column",
            zIndex: 50,
          }}
        >
          <Box
            sx={{
              bgcolor: "primary.main",
              color: "#fff",
              p: 1.5,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
          >
            <Box component="h2" sx={{ m: 0, typography: "h6" }}>
              Chat with Driver
            </Box>
          </Box>
          <Box
            ref={chatContainerRef}
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              p: 1,
              "&::-webkit-scrollbar": { width: 8 },
              "&::-webkit-scrollbar-thumb": { bgcolor: "grey.400", borderRadius: 1 },
            }}
          >
            {messages.map((msg, i) => (
              <Box
                key={i}
                sx={{
                  maxWidth: "70%",
                  alignSelf: msg.senderModel === "User" ? "flex-end" : "flex-start",
                  mb: 1.5,
                }}
              >
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor:
                      msg.senderModel === "User" ? "primary.main" : "grey.200",
                    color:
                      msg.senderModel === "User" ? "#fff" : "text.primary",
                  }}
                >
                  {msg.text}
                </Box>
                <Box
                  component="p"
                  sx={{ typography: "caption", color: "text.secondary", mt: 0.5 }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Box>
              </Box>
            ))}
          </Box>
          <Box
            sx={{
              borderTop: "1px solid",
              borderColor: "grey.300",
              display: "flex",
              alignItems: "center",
              p: 1,
            }}
          >
            <TextField
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message…"
              variant="outlined"
              size="small"
              fullWidth
              onKeyPress={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <IconButton
              onClick={startListening}
              disabled={isListening}
              aria-label="Start voice input"
              sx={{ ml: 1 }}
            >
              <Mic size={20} />
            </IconButton>
            <IconButton
              onClick={sendMessage}
              aria-label="Send message"
              color="primary"
              sx={{ ml: 1 }}
            >
              <Send size={20} />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Chat Toggle Button */}
      <IconButton
        onClick={() => setIsChatOpen((prev) => !prev)}
        aria-label={isChatOpen ? "Close chat" : "Open chat"}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          bgcolor: "primary.main",
          color: "#fff",
          boxShadow: 4,
          "&:hover": { bgcolor: "primary.dark" },
          zIndex: 50,
        }}
      >
        {isChatOpen ? <X size={24} /> : <Send size={24} />}
      </IconButton>

      {/* Night Mode Toggle Button */}
      <Button
        onClick={toggleNightMode}
        aria-label="Toggle night mode"
        variant="contained"
        sx={{
          position: "fixed",
          bottom: 16,
          left: 16,
          bgcolor: isNightMode ? "grey.700" : "grey.800",
          color: "#fff",
          boxShadow: 4,
          "&:hover": { bgcolor: isNightMode ? "grey.600" : "grey.700" },
          zIndex: 50,
        }}
      >
        {isNightMode ? "🌙" : "☀️"}
      </Button>
    </Box>
  );
};

export default UserRidePage;
