import React, { useEffect, useState ,useRef} from "react";
import axios from "axios";
import MapSelector from "../Component/mapselector";
import { useAuthContext } from "../hooks/UseAuthContext";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

import "../Css/BookDrive.css";

const Bookdrive = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [formData, setFormData] = useState({
    userId: user ? user.id : "",
    pickupLocation: { lat: "", lng: "" },
    destinationLocation: { lat: "", lng: "" },
  });
  const [loading, setLoading] = useState(false);

  // Update userId in formData when user changes
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        userId: user.id,
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
    const socket = io('http://localhost:3000'); // Initialize the socket connection
    socketRef.current = socket;

    socket.on('connect', () => {
        console.log('Socket connected with ID:', socket.id);
        if (formData.userId) {
            socket.emit('setUserSocketId', formData.userId);
        }
    });

    socket.on('bookingAccepted', (data) => {
        console.log('Booking accepted event received:', data);
        if (data && data.paymentPageUrl) {
            navigate(data.paymentPageUrl);
        } else {
            console.error('Payment page URL missing in bookingAccepted event data');
        }
    });

    return () => {
        socket.disconnect();
        console.log('Socket disconnected');
    };
}, [formData.userId, navigate]);

  
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:3000/api/user/booking", formData);
      console.log("Booking Response:", response); // Add this log
      alert("Booking successful!");
      // navigate("/bookings");
      setLoading(false);
    } catch (error) {
      console.error("Booking error:", error.response || error);
      alert(error.response?.data?.msg || "Booking failed. Please try again.");
    } 
  };

  return (
    <div className="container">
      {user ? (
        <form onSubmit={handleSubmit}>
          <label htmlFor="userId">UserId</label>
          <input
            type="text"
            name="userId"
            placeholder="User Id"
            value={formData.userId || ""} // Ensure a default value to avoid uncontrolled inputs
            disabled
          />

          <label htmlFor="pickupLocation">Pickup Location</label>
          <input
            type="text"
            id="pickupLocation"
            value={
              formData.pickupLocation.lat && formData.pickupLocation.lng
                ? `Lat: ${formData.pickupLocation.lat}, Lng: ${formData.pickupLocation.lng}`
                : "Fetching location..."
            }
            readOnly
          />

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

          <button type="submit" disabled={loading}>
            {loading ? "Booking..." : "Submit"}
          </button>
        </form>
      ) : (
        <h2>Please login to book a drive</h2>
      )}
    </div>
  );
};

export default Bookdrive;
