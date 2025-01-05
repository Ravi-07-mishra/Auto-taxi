import React, { useState, useEffect } from "react";
import Navbars from "../Component/Navbar";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../hooks/UseAuthContext";
import "../Css/UserHome.css"; // Importing the CSS file
import MapComponent from "../Component/map";

const UserHome = () => {
  const { user } = useAuthContext();
  const [bookings, setBookings] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(`/api/user/${user.id}`);
        const json = await response.json();
        setBookings(json.bookings || []); // Ensure we are setting bookings correctly
      } catch (error) {
        console.log("Error fetching bookings:", error);
      }
    };

    if (user?.id) {
      fetchBookings();
    }
  }, [user?.id]);

  const openInbox = (bookingId) => {
    navigate(`/user/inbox/${bookingId}`);
  };

  const toggleDashboard = (e) => {
    e.preventDefault(); // Prevent default button behavior
    setShowDashboard(!showDashboard);
  };

  return (
    <div>
      <Navbars />
      <div className="user-home-container">
        <div className="welcome-message">
          {user ? <h2>Welcome, {user.name || "User"}!</h2> : <h2>Please Login</h2>}
        </div>
        <div className="bookings-section">
          <h3>Bookings</h3>
          <button onClick={toggleDashboard}>
            {showDashboard ? "Hide Dashboard" : "Show Dashboard"}
          </button>
          {showDashboard && (
            <div className="map-card">
              <MapComponent />
            </div>
          )}
          {bookings.length > 0 ? (
            <div className="bookings-list">
              {bookings.map((booking) => (
                <div key={booking._id} className="booking-card">
                  <p>
                    <strong>Booking ID:</strong> {booking._id}
                  </p>
                  <button onClick={() => openInbox(booking._id)}>Open Inbox</button>
                </div>
              ))}
            </div>
          ) : (
            <p>No bookings available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserHome;
