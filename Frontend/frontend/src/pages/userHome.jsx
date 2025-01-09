import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/userContext";
import MapComponent from "../Component/map";
import { Card, CardContent, Typography, Button, Grid } from '@mui/material';

const UserHome = () => {
  const auth = useAuth();
  const [bookings, setBookings] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(`/api/user/${auth.user?.id}`);
        const json = await response.json();
        setBookings(json.bookings || []);
      } catch (error) {
        console.log("Error fetching bookings:", error);
      }
    };

    if (auth.user?.id) {
      fetchBookings();
    }
  }, [auth.user?.id]);

  const openInbox = (bookingId) => {
    navigate(`/user/inbox/${bookingId}`);
  };

  const toggleDashboard = (e) => {
    e.preventDefault();
    setShowDashboard(!showDashboard);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="user-home-container">
        <div className="welcome-message">
          {auth.user ? <h2>Welcome, {auth.user.name || "User"}!</h2> : <h2>Please Login</h2>}
        </div>
        <div className="bookings-section">
          <h3>Bookings</h3>
          <button className="btn btn-primary" onClick={toggleDashboard}>
            {showDashboard ? "Hide Dashboard" : "Show Dashboard"}
          </button>
          {showDashboard && (
            <div className="map-card">
              <MapComponent />
            </div>
          )}
          {bookings.length > 0 ? (
            <Grid container spacing={2}>
              {bookings.map((booking) => (
                <Grid item xs={12} sm={6} md={4} key={booking._id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h5" component="div">
                        Booking ID: {booking._id}
                      </Typography>
                      <Button variant="contained" color="primary" onClick={() => openInbox(booking._id)}>
                        Open Inbox
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <p>No bookings available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserHome;
