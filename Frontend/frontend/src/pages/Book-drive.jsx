import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import MapSelector from "../Component/mapselector";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { TextField, Button, CircularProgress } from "@mui/material";
import { useAuth } from "../Context/userContext";

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

  // Update userId in formData when user changes
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        userId: user._id,
      }));
    }
  }, [user]);

  // Fetch current location for pickup
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
          alert(
            "Unable to fetch your location. Please set it manually on the map."
          );
        }
      );
    };

    if ("geolocation" in navigator) {
      fetchLocation();
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  }, []);

  // Handle socket events
  useEffect(() => {
    socketRef.current = io("http://localhost:3000", {
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
        console.error(
          "Payment page URL missing in bookingAccepted event data"
        );
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
      const response = await axios.post(
        "http://localhost:3000/api/user/booking",
        formData
      );
      console.log("Booking Response:", response);
      alert("Booking successful!");
      setLoading(false);
    } catch (error) {
      console.error("Booking error:", error.response || error);
      alert(error.response?.data?.msg || "Booking failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-blue-50 via-gray-100 to-blue-50">
      {user ? (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg border border-gray-200"
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Book a Drive
          </h2>
          <TextField
            label="User ID"
            value={formData.userId || ""}
            fullWidth
            disabled
            margin="normal"
            variant="outlined"
            InputLabelProps={{ className: "text-gray-700" }}
            className="mb-4"
          />

          <TextField
            label="Pickup Location"
            value={
              formData.pickupLocation.lat && formData.pickupLocation.lng
                ? `Lat: ${formData.pickupLocation.lat}, Lng: ${formData.pickupLocation.lng}`
                : "Fetching location..."
            }
            fullWidth
            disabled
            margin="normal"
            variant="outlined"
            InputLabelProps={{ className: "text-gray-700" }}
            className="mb-6"
          />

          <div className="my-6">
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

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      ) : (
        <h2 className="text-xl font-semibold text-gray-700">
          Please login to book a drive
        </h2>
      )}
    </div>
  );
};

export default Bookdrive;
