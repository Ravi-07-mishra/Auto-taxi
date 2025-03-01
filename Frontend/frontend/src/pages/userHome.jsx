"use client";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../Context/userContext";
import { useNavigate } from "react-router-dom";
import { MapPin, DollarSign, Star, Eye, X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import BackgroundSlider from "../Component/BackgroundSlider";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const UserHome = () => {
  const auth = useAuth();
  const [bookings, setBookings] = useState([]);
  const [reviewVisible, setReviewVisible] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();
  const calendarRef = useRef(null);
  const sliderRef = useRef(null);

  const backgroundImages = ["/bg1.jpg", "/bg2.jpg", "/bg3.jpg"];

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(`/api/user/${auth.user?._id}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const json = await response.json();
        setBookings(json.bookings || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };

    if (auth.user?._id) fetchBookings();
  }, [auth.user?._id]);

  const handleCancelBooking = async (bookingId) => {
    try {
      const response = await fetch(`/api/booking/cancel/${bookingId}`, { method: "PUT" });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const result = await response.json();
      setBookings((prevBookings) =>
        prevBookings.map((booking) => (booking._id === bookingId ? { ...booking, status: "Cancelled" } : booking)),
      );
    } catch (error) {
      console.error("Error cancelling booking:", error);
    }
  };

  const handleSubmitReview = async (bookingId) => {
    try {
      const response = await fetch(`/api/booking/review/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const result = await response.json();
      setReviewVisible(null);
      setRating(0);
      setComment("");
      alert("Review submitted successfully!");
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const scrollToCalendar = () => {
    calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Custom Arrow Components
  const CustomPrevArrow = (props) => (
    <div
      className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/10 backdrop-blur-md rounded-full p-2 cursor-pointer hover:bg-white/20 transition-all z-30"
      onClick={() => sliderRef.current.slickPrev()}
    >
      <ChevronLeft className="w-6 h-6 text-white" />
    </div>
  );

  const CustomNextArrow = (props) => (
    <div
      className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/10 backdrop-blur-md rounded-full p-2 cursor-pointer hover:bg-white/20 transition-all z-30"
      onClick={() => sliderRef.current.slickNext()}
    >
      <ChevronRight className="w-6 h-6 text-white" />
    </div>
  );

  // Carousel settings
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false, // Disable default arrows
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
    appendDots: (dots) => (
      <div className="slick-dots-container">
        <ul className="slick-dots">{dots}</ul>
      </div>
    ),
    customPaging: (i) => (
      <div className="w-3 h-3 bg-white/50 rounded-full transition-all hover:bg-white/80"></div>
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 text-white relative font-sans">
      <BackgroundSlider images={backgroundImages} interval={7000} className="absolute inset-0 z-0" />

      {/* Welcome Section */}
      <section className="h-screen flex items-center justify-center relative z-10">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight animate-fade-in-down">
            Welcome, {auth.user ? auth.user.name || "User" : "Please Login"}!
          </h1>
          <p className="text-lg md:text-xl text-gray-300 animate-fade-in-up">
            Manage your bookings and explore the dashboard.
          </p>
          <div className="mt-8 animate-bounce">
            <p className="text-gray-400">Scroll to view bookings</p>
            <div className="mt-2">
              <ChevronDown className="w-6 h-6 mx-auto text-gray-400" />
            </div>
          </div>
        </div>
      </section>

      {/* Bookings Section */}
  {/* Bookings Section */}
<section className="py-20 bg-transparent z-10 relative" ref={calendarRef}>
  <div className="container mx-auto px-4">
    <h2 className="text-3xl font-bold mb-12 text-center text-white">Your Bookings</h2>
    <div className="relative">
      <Slider ref={sliderRef} {...carouselSettings}>
        {bookings.map((booking) => (
          <div key={booking._id} className="px-4">
            {/* Booking Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-300 hover:shadow-3xl hover:scale-105">
              <div className="p-6">
                {/* Driver Info */}
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-300/50">
                    <img
                      src={booking.driver?.profileImage || "/placeholder.svg?height=64&width=64"}
                      alt="Driver"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-xl text-white">{booking.driver?.name || "Driver"}</h3>
                    <span
                      className={`text-sm px-2 py-1 rounded-full ${
                        booking.status === "completed"
                          ? "bg-green-500/20 text-green-400"
                          : booking.status === "in-progress"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-indigo-500/20 text-indigo-400"
                      }`}
                    >
                      {booking.status || "Pending"}
                    </span>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-green-400 mt-1" />
                    <div>
                      <p className="text-indigo-200 text-sm">Pickup Location</p>
                      <p className="text-white font-medium">{booking.pickupLocation?.address || "Address not available"}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-red-400 mt-1" />
                    <div>
                      <p className="text-indigo-200 text-sm">Destination</p>
                      <p className="text-white font-medium">{booking.destinationLocation?.address || "Address not available"}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <DollarSign className="w-5 h-5 text-yellow-400 mt-1" />
                    <div>
                      <p className="text-indigo-200 text-sm">Price</p>
                      <p className="text-white font-medium">${booking.price || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {booking.status === "completed" ? (
                  <button
                    onClick={() => setReviewVisible(booking._id)}
                    className="w-full bg-indigo-600/70 text-white py-2 px-4 rounded-lg transition-all duration-300 hover:bg-indigo-700/70 flex items-center justify-center gap-2 transform hover:scale-105"
                  >
                    <Star className="w-5 h-5" />
                    Leave a Review
                  </button>
                ) : (
                  <div className="flex justify-between items-center gap-4">
                    <button
                      onClick={() => navigate(`/booking/${booking._id}`)}
                      className="bg-indigo-600/70 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:bg-indigo-700/70 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    {booking.status !== "Cancelled" && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="bg-red-600/70 text-white py-2 px-4 rounded-lg transition-all duration-300 hover:bg-red-700/70 flex items-center justify-center gap-2 transform hover:scale-105"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  </div>
</section>

      {/* Review Modal */}
      {reviewVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 w-11/12 max-w-md">
            <h3 className="font-semibold text-xl mb-4 text-white">Leave a Review</h3>
            <div className="space-y-4">
              {/* Star Rating */}
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 cursor-pointer ${
                      star <= rating ? "text-yellow-400" : "text-gray-400"
                    }`}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>

              {/* Comment Input */}
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your review..."
                className="w-full p-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
              />

              {/* Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setReviewVisible(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-300"
                >
                  Close
                </button>
                <button
                  onClick={() => handleSubmitReview(reviewVisible)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors duration-300"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scroll Button */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <button
          onClick={scrollToCalendar}
          className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center gap-2"
        >
          View Bookings
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default UserHome;