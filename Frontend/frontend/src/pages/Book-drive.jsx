import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import MapSelector from "../Component/mapselector";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { TextField, Button, CircularProgress, Typography } from "@mui/material";
import { useAuth } from "../Context/userContext";
import { MapPin, Navigation, ArrowRight } from "lucide-react";

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
      setFormData((prev) => ({
        ...prev,
        userId: user._id,
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchLocation = () => {
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
        (error) => {
          console.error("Error fetching location:", error);
          alert("Unable to fetch your location. Please set it manually on the map.");
        }
      );
    };

    if ("geolocation" in navigator) {
      fetchLocation();
    } else {
      alert("Geolocation is not supported by your browser.");
    }
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
      console.log("Socket connected with ID:", socket.id);
      if (formData.userId) {
        socket.emit("setUserSocketId", formData.userId);
      }
    });

    socket.on("bookingAccepted", (data) => {
      console.log("Booking accepted event received:", data);
      alert("Booking successful!");
      if (data && data.paymentPageUrl) {
        navigate(data.paymentPageUrl);
      } else {
        console.error("Payment page URL missing in bookingAccepted event data");
      }
    });

    return () => {
      socket.disconnect();
      console.log("Socket disconnected");
    };
  }, [formData.userId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/user/booking`, formData);
      console.log("Booking Response:", response);
      alert("Booking successful!");
      setLoading(false);
    } catch (error) {
      console.error("Booking error:", error.response || error);
      alert(error.response?.data?.msg || "Booking failed. Please try again.");
      setLoading(false);
    }
  };

  const fetchLocationSuggestions = async (query, type) => {
    try {
      const response = await axios.get(`${API_BASE}/geocode`, {
        params: { query },
      });

      const results = response.data.results;

      if (type === "pickup") {
        setPickupSuggestions(results);
      } else {
        setDestinationSuggestions(results);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const handleLocationChange = (e, type) => {
    const query = e.target.value;
    if (type === "pickup") {
      setPickupQuery(query);
    } else {
      setDestinationQuery(query);
    }

    if (query.length > 2) {
      fetchLocationSuggestions(query, type);
    } else {
      if (type === "pickup") {
        setPickupSuggestions([]);
      } else {
        setDestinationSuggestions([]);
      }
    }
  };

  const handleLocationSelect = (selectedLocation, type) => {
    const location = {
      lat: selectedLocation.geometry.lat,
      lng: selectedLocation.geometry.lng,
    };
    if (type === "pickup") {
      setFormData((prev) => ({ ...prev, pickupLocation: location }));
      setPickupQuery(selectedLocation.formatted);
      setPickupSuggestions([]);
    } else {
      setFormData((prev) => ({ ...prev, destinationLocation: location }));
      setDestinationQuery(selectedLocation.formatted);
      setDestinationSuggestions([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white pt-16 px-2 sm:px-4">
      {user ? (
        <div className="container mx-auto px-2 sm:px-4 py-8 space-y-8">
          {/* Heading */}
          <div className="text-center px-2">
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: "2.25rem", md: "3.75rem" },
                fontWeight: "bold",
                marginBottom: "2rem",
              }}
            >
              Book Your Ride
            </Typography>
            <Typography variant="body1" className="text-gray-400">
              Enter your journey details below
            </Typography>
          </div>

          {/* Form */}
          <div className="w-full max-w-5xl mx-auto px-2 sm:px-4">
            <form
              onSubmit={handleSubmit}
              className="bg-[#1E1E1E]/80 backdrop-blur-md p-4 sm:p-6 rounded-2xl shadow-[0_0_15px_rgba(192,255,62,0.1)] border border-[#2A2A2A] space-y-4"
            >
              <div className="flex flex-col md:flex-row gap-4 w-full">
                {/* Pickup */}
                <div className="flex-1 relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#C0FF3E]">
                    <MapPin size={20} />
                  </div>
                  <TextField
                    placeholder="Pickup Location"
                    onChange={(e) => handleLocationChange(e, "pickup")}
                    value={pickupQuery || ""}
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{
                      className: "text-white pl-10",
                      shrink: true,
                    }}
                    InputProps={{
                      className: "rounded-xl bg-[#2A2A2A] text-white pl-12",
                      sx: {
                        color: "white",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3A3A3A",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#C0FF3E",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#C0FF3E",
                        },
                      },
                    }}
                  />
                  {pickupSuggestions.length > 0 && (
                    <div className="relative w-full mt-2 bg-[#2A2A2A] rounded-xl shadow-lg z-[99999] border border-[#3A3A3A] max-h-60 overflow-auto">
                      {pickupSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.place_id}
                          className="p-3 cursor-pointer hover:bg-[#3A3A3A] transition-colors duration-200 flex items-center gap-2"
                          onClick={() => handleLocationSelect(suggestion, "pickup")}
                        >
                          <MapPin size={16} className="text-[#C0FF3E]" />
                          {suggestion.formatted}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Destination */}
                <div className="flex-1 relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#C0FF3E]">
                    <Navigation size={20} />
                  </div>
                  <TextField
                    placeholder="Destination Location"
                    onChange={(e) => handleLocationChange(e, "destination")}
                    value={destinationQuery || ""}
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{
                      className: "text-gray-400 pl-10",
                      shrink: true,
                    }}
                    InputProps={{
                      className: "rounded-xl bg-[#2A2A2A] text-white pl-12",
                      sx: {
                        color: "white",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#3A3A3A",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#C0FF3E",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#C0FF3E",
                        },
                      },
                    }}
                  />
                  {destinationSuggestions.length > 0 && (
                    <div className="relative w-full mt-2 bg-[#2A2A2A] rounded-xl shadow-lg z-[100] border border-[#3A3A3A]">
                      {destinationSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.place_id}
                          className="p-3 cursor-pointer hover:bg-[#3A3A3A] transition-colors duration-200 flex items-center gap-2"
                          onClick={() => handleLocationSelect(suggestion, "destination")}
                        >
                          <Navigation size={16} className="text-[#C0FF3E]" />
                          {suggestion.formatted}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-w-[120px] h-[56px] bg-[#C0FF3E] hover:bg-[#B0EF2E] text-white font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(192,255,62,0.3)]"
                >
                  {loading ? (
                    <CircularProgress size={24} className="text-black" />
                  ) : (
                    <>
                      <ArrowRight size={20} />
                      <span style={{ color: "white" }}>Book Drive</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Map */}
          <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-lg border border-[#2A2A2A]">
            <MapSelector
              pickupLocation={formData.pickupLocation}
              destinationLocation={formData.destinationLocation}
              setDestinationLocation={(location) =>
                setFormData((prev) => ({
                  ...prev,
                  destinationLocation: location,
                }))
              }
            />
          </div>
        </div>
      ) : (
        <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center">
          <Typography
            variant="h5"
            className="text-white text-center font-semibold bg-[#1E1E1E]/80 p-8 rounded-xl backdrop-blur-md border border-[#2A2A2A]"
          >
            Please login to book a drive
          </Typography>
        </div>
      )}
    </div>
  );
};

export default Bookdrive;
