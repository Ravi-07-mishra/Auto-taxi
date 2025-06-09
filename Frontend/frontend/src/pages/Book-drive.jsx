// src/pages/Bookdrive.jsx

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import MapSelector from "../Component/mapselector";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import {
  TextField,
  Button,
  CircularProgress,
  Typography,
  InputAdornment
} from "@mui/material";
import { useAuth } from "../Context/userContext";
import { MapPin, Navigation as NavIcon, ArrowRight } from "lucide-react";

// OpenCage Geocoder API Key
const OPEN_CAGE_API_KEY = import.meta.env.VITE_OPEN_CAGE_API_KEY;

// Backend API base URL from environment variables
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_BASE2 = import.meta.env.VITE_API_URL2 || "http://localhost:3000";

const Bookdrive = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [formData, setFormData] = useState({
    userId: user ? user._id : "",
    pickupLocation: { lat: "", lng: "" },
    destinationLocation: { lat: "", lng: "" },
  });
  const [loading, setLoading] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [pickupQuery, setPickupQuery] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({ ...prev, userId: user._id }));
    }
  }, [user]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          pickupLocation: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        }));
      },
      () => {
        alert("Unable to fetch your location. Please set it manually on the map.");
      }
    );
  }, []);

  useEffect(() => {
    socketRef.current = io(API_BASE2, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    const socket = socketRef.current;
    socket.on("connect", () => {
      if (formData.userId) socket.emit("setUserSocketId", formData.userId);
    });
    socket.on("bookingAccepted", (data) => {
      alert("Booking successful!");
      if (data?.paymentPageUrl) navigate(data.paymentPageUrl);
    });
    return () => {
      socket.disconnect();
    };
  }, [formData.userId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/user/booking`, formData);
      alert("Booking successful!");
    } catch (err) {
      alert(err.response?.data?.msg || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationSuggestions = async (query, type) => {
    try {
      const resp = await axios.get(`${API_BASE}/geocode`, { params: { query } });
      const results = resp.data.results || [];
      if (type === "pickup") setPickupSuggestions(results);
      else setDestinationSuggestions(results);
    } catch {}
  };

  const handleLocationChange = (e, type) => {
    const q = e.target.value;
    if (type === "pickup") {
      setPickupQuery(q);
      if (q.length > 2) fetchLocationSuggestions(q, "pickup");
      else setPickupSuggestions([]);
    } else {
      setDestinationQuery(q);
      if (q.length > 2) fetchLocationSuggestions(q, "destination");
      else setDestinationSuggestions([]);
    }
  };

  const handleLocationSelect = (loc, type) => {
    const coords = { lat: loc.geometry.lat, lng: loc.geometry.lng };
    if (type === "pickup") {
      setFormData((prev) => ({ ...prev, pickupLocation: coords }));
      setPickupQuery(loc.formatted);
      setPickupSuggestions([]);
    } else {
      setFormData((prev) => ({ ...prev, destinationLocation: coords }));
      setDestinationQuery(loc.formatted);
      setDestinationSuggestions([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white pt-16 px-2 sm:px-4">
      {user ? (
        <div className="container mx-auto py-8 space-y-8">
          <div className="text-center">
            <Typography variant="h2" sx={{ fontSize: { xs: "2.25rem", md: "3.75rem" }, fontWeight: "bold", mb: 2 }}>
              Book Your Ride
            </Typography>
            <Typography variant="body1" className="text-gray-400">
              Enter your journey details below
            </Typography>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-5xl mx-auto bg-[#1E1E1E]/80 p-6 rounded-2xl border border-[#2A2A2A] shadow-lg">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <TextField
                  placeholder="Pickup Location"
                  value={pickupQuery}
                  onChange={(e) => handleLocationChange(e, "pickup")}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MapPin className="text-[#C0FF3E]" />
                      </InputAdornment>
                    ),
                    className: "rounded-xl bg-[#2A2A2A] text-white",
                    sx: {
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#3A3A3A" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#C0FF3E" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#C0FF3E" },
                    },
                  }}
                />
                {pickupSuggestions.length > 0 && (
                  <div className="mt-2 bg-[#2A2A2A] rounded-xl border border-[#3A3A3A] max-h-60 overflow-auto z-10">
                    {pickupSuggestions.map((s) => (
                      <div
                        key={s.place_id}
                        onClick={() => handleLocationSelect(s, "pickup")}
                        className="p-3 cursor-pointer hover:bg-[#3A3A3A] flex items-center gap-2"
                      >
                        <MapPin size={16} className="text-[#C0FF3E]" />
                        {s.formatted}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <TextField
                  placeholder="Destination Location"
                  value={destinationQuery}
                  onChange={(e) => handleLocationChange(e, "destination")}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <NavIcon className="text-[#C0FF3E]" />
                      </InputAdornment>
                    ),
                    className: "rounded-xl bg-[#2A2A2A] text-white",
                    sx: {
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#3A3A3A" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#C0FF3E" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#C0FF3E" },
                    },
                  }}
                />
                {destinationSuggestions.length > 0 && (
                  <div className="mt-2 bg-[#2A2A2A] rounded-xl border border-[#3A3A3A] max-h-60 overflow-auto z-10">
                    {destinationSuggestions.map((s) => (
                      <div
                        key={s.place_id}
                        onClick={() => handleLocationSelect(s, "destination")}
                        className="p-3 cursor-pointer hover:bg-[#3A3A3A] flex items-center gap-2"
                      >
                        <NavIcon size={16} className="text-[#C0FF3E]" />
                        {s.formatted}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="min-w-[120px] h-[56px] bg-[#C0FF3E] hover:bg-[#B0EF2E] text-white rounded-xl flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <CircularProgress size={24} className="text-black" />
                ) : (
                  <>
                    <ArrowRight size={20} /><span>Book Drive</span>
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-2xl overflow-hidden border border-[#2A2A2A] shadow-lg">
            <MapSelector
              pickupLocation={formData.pickupLocation}
              destinationLocation={formData.destinationLocation}
              setDestinationLocation={(location) =>
                setFormData((prev) => ({ ...prev, destinationLocation: location }))
              }
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Typography variant="h5" className="text-white bg-[#1E1E1E]/80 p-8 rounded-xl border border-[#2A2A2A]">
            Please login to book a drive
          </Typography>
        </div>
      )}
    </div>
  );
};

export default Bookdrive;
