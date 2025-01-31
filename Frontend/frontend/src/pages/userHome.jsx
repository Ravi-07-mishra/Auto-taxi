import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../Context/userContext";
import { Button, Card, CardContent, Typography } from "@mui/material";
import RatingReview from "../Component/Ratingsystem"; // Import the RatingReview component
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import '../Css/UserHome.css';

const UserHome = () => {
  const auth = useAuth();
  const [bookings, setBookings] = useState([]);
  const [reviewVisible, setReviewVisible] = useState(null); // Track the booking ID for which the review card should be shown
  const navigate = useNavigate(); // Initialize the navigate hook
  const calendarRef = useRef(null); // Reference to CalendarPage for smooth scrolling

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

  const scrollToCalendar = () => {
    calendarRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="bg-cover bg-center min-h-screen" style={{ backgroundImage: 'url("userbg.jpg")' }}>
      <div className="flex items-center justify-center h-full pt-16">
        <div className="bg-gray bg-opacity-70 p-8 rounded-lg shadow-xl w-full max-w-3xl">
         
          <h2 className="text-4xl text-gray-700 text-center">Welcome, {auth.user ? auth.user.name || "User" : "Please Login"}!</h2>
        </div>
      </div>
      <section className="py-20 bg-transparent">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-6xl font-extrabold text-white drop-shadow-lg">User Home</h1>
          <p className="text-black mt-4 text-lg" style={{ fontSize: '20px' }}>Manage your bookings and explore the dashboard.</p>
        </div>
      </section>

      {/* Get Started Button with Styling */}
      <div className="text-center mb-6">
        <Button
          onClick={scrollToCalendar}
          className="bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-3 text-lg font-semibold rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
        >
          Get Started
        </Button>
      </div>

    </div>
  );
};

export default UserHome;
