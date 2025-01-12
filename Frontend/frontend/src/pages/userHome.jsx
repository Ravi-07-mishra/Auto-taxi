import React, { useState, useEffect } from "react";
import { useAuth } from "../Context/userContext";
import MapComponent from "../Component/map";
import { Button, Card, CardContent, Typography } from "@mui/material";
import RatingReview from "../Component/Ratingsystem"; // Import the RatingReview component
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import '../Css/UserHome.css';

const UserHome = () => {
  const auth = useAuth();
  const [bookings, setBookings] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(null); // Track the booking ID for which the review card should be shown
  const navigate = useNavigate(); // Initialize the navigate hook

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(`/api/user/${auth.user?._id}`);
        const json = await response.json();
        setBookings(json.bookings || []);
      } catch (error) {
        console.log("Error fetching bookings:", error);
      }
    };

    if (auth.user?._id) {
      fetchBookings();
    }
  }, [auth.user?._id]);

  const toggleDashboard = (e) => {
    e.preventDefault();
    setShowDashboard(!showDashboard);
  };

  const toggleReviewCard = (bookingId) => {
    // Toggle the visibility of the review card for a specific booking
    setReviewVisible(bookingId === reviewVisible ? null : bookingId);
  };

  const openInbox = (bookingId) => {
    // Navigate to the inbox page for the booking
    navigate(`/user/inbox/${bookingId}`);
  };

  return (
    <div className="bg-cover bg-center min-h-screen" style={{ backgroundImage: 'url("userbg.jpg")' }}>
      {/* Top Content (Heading and Welcome Message) */}
      <div className="flex items-center justify-center h-full pt-16">
        <div className="bg-white bg-opacity-70 p-8 rounded-lg shadow-xl w-full max-w-3xl">
          <h2 className="text-4xl font-bold text-gray-800 text-center mb-4">User Home</h2>
          <p className="text-xl text-gray-600 text-center">Welcome, {auth.user ? auth.user.name || "User" : "Please Login"}!</p>
        </div>
      </div>
      <section className="py-20 bg-transparent">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-5xl font-extrabold text-white drop-shadow-lg">User Home</h1>
          <p className="text-blue-100 mt-4 text-lg">Manage your bookings and explore the dashboard.</p>
        </div>
      </section>
      <div className="text-center mb-4">
        <Button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
          onClick={toggleDashboard}
        >
          {showDashboard ? "Hide Dashboard" : "Show Dashboard"}
        </Button>
      </div>
      {showDashboard && (
        <section className="mb-6">
          <div className="container mx-auto">
            <MapComponent />
          </div>
        </section>
      )}
      {/* Bookings Section */}
      <section className="py-12 bg-transparent">
  <div className="container mx-auto text-center px-4">
    <h2 className="text-3xl font-bold text-white mb-8">Bookings</h2>
    <div
      className="flex overflow-x-auto space-x-6 px-2 scrollbar-hidden"
      style={{
        scrollBehavior: "smooth", // Enables smooth scrolling
        maxWidth: "100%", // Ensures the container adapts to screen width
        scrollbarWidth: "none", // For Firefox (hides scrollbar)
        msOverflowStyle: "none", // For Internet Explorer and Edge (hides scrollbar)
      }}
  
    >
      {bookings.length > 0 ? (
        bookings.map((booking) => (
          <div
            key={booking._id}
            className="min-w-[33.33%] max-w-[33.33%] flex-shrink-0 transition-transform duration-300 hover:scale-105"
          >
            <Card
              className="bg-white/30 backdrop-blur-md p-6 rounded-lg shadow-xl border border-white/20"
              style={{
                backdropFilter: "blur(10px)", // Glass effect with blur
                background: "rgba(255, 255, 255, 0.1)", // Transparent white background for glass effect
              }}
            >
              <CardContent>
                <Typography variant="body1" className="text-gray-800">
                  Booking ID: {booking._id}
                </Typography>
                <div className="flex justify-center mt-4">
                  <Button
                    onClick={() => toggleReviewCard(booking._id)}
                    className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded"
                  >
                    {reviewVisible === booking._id ? "Cancel Review" : "Rate and Review"}
                  </Button>
                </div>
                <div className="flex justify-center mt-4">
                  <Button
                    onClick={() => openInbox(booking._id)}
                    className="bg-green-500 text-white hover:bg-green-600 px-4 py-2 rounded"
                  >
                    Open Inbox
                  </Button>
                </div>
              </CardContent>
            </Card>
            {reviewVisible === booking._id && (
              <div className="mt-4">
                <RatingReview bookingId={booking._id} />
              </div>
            )}
          </div>
        ))
      ) : (
        <Typography variant="body1" className="text-blue-100 mt-4">
          No bookings available.
        </Typography>
      )}
    </div>
  </div>
</section>






    </div>
  );
};

export default UserHome;
