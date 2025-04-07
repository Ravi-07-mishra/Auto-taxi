"use client";
import React, { useState, useEffect, useRef } from "react";

import { useAuth } from "../Context/userContext";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  DollarSign,
  Star,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import BackgroundSlider from "../Component/BackgroundSlider";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const UserHome = () => {
  const auth = useAuth();
  const [bookings, setBookings] = useState([]);
  const [addresses, setAddresses] = useState({});
  const [reviewVisible, setReviewVisible] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const backgroundImages = ["/bg1.jpg", "/bg2.jpg", "/bg3.jpg"];

  // Custom Prev Arrow Component
  const CustomPrevArrow = () => (
    <div
      className="absolute top-1/2 left-6 -translate-y-1/2 bg-black/50 backdrop-blur-md rounded-full p-3 cursor-pointer hover:bg-indigo-600/80 transition-all z-30 shadow-lg hover:scale-110"
      onClick={() => sliderRef.current.slickPrev()}
    >
      <ChevronLeft className="w-6 h-6 text-white" />
    </div>
  );

  // Custom Next Arrow Component
  const CustomNextArrow = () => (
    <div
      className="absolute top-1/2 right-6 -translate-y-1/2 bg-black/50 backdrop-blur-md rounded-full p-3 cursor-pointer hover:bg-indigo-600/80 transition-all z-30 shadow-lg hover:scale-110"
      onClick={() => sliderRef.current.slickNext()}
    >
      <ChevronRight className="w-6 h-6 text-white" />
    </div>
  );

  // Slider Settings
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
    appendDots: (dots) => (
      <div className="slick-dots-container">
        <ul className="flex justify-center gap-2">{dots}</ul>
      </div>
    ),
    customPaging: () => (
      <div className="w-3 h-3 bg-white/30 rounded-full transition-all hover:bg-white/80 dot-indicator"></div>
    ),
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(`/api/user/${auth.user?._id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const json = await response.json();
        setBookings(json.bookings || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };
    if (auth.user?._id) fetchBookings();
  }, [auth.user?._id]);

  const fetchAddressFromCoordinates = async (lat, lon) => {
    try {
      const url = `http://localhost:3000/api/reverse-geocode?lat=${lat}&lon=${lon}`;
      const response = await fetch(url);
      if (!response.ok) {
        return "Address not available";
      }
      const data = await response.json();
      if (data.formatted) {
        return data.formatted;
      }
      if (data.results && data.results.length > 0) {
        return (
          data.results[0].formatted ||
          data.results[0].display_name ||
          "Address not available"
        );
      }
      return "Address not available";
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
      return "Address not available";
    }
  };

  useEffect(() => {
    if (bookings.length > 0) {
      const fetchAllAddresses = async () => {
        try {
          const addressPairs = await Promise.all(
            bookings.map(async (booking) => {
              const id = booking._id.toString();
              const pickupLocation = booking.pickupLocation;
              const destLocation = booking.destinationLocation;
              const pickupAddress =
                pickupLocation && pickupLocation.lat && pickupLocation.lng
                  ? await fetchAddressFromCoordinates(pickupLocation.lat, pickupLocation.lng)
                  : "Address not available";
              const destinationAddress =
                destLocation && destLocation.lat && destLocation.lng
                  ? await fetchAddressFromCoordinates(destLocation.lat, destLocation.lng)
                  : "Address not available";
              return { id, pickupAddress, destinationAddress };
            })
          );
          const newAddresses = {};
          addressPairs.forEach(({ id, pickupAddress, destinationAddress }) => {
            newAddresses[id] = { pickupAddress, destinationAddress };
          });
          setAddresses(newAddresses);
        } catch (error) {
          console.error("Error fetching all addresses:", error);
        }
      };
      fetchAllAddresses();
    }
  }, [bookings]);

  const handleCancelBooking = async (bookingId) => {
    try {
      const response = await fetch(`/api/booking/cancel/${bookingId}`, {
        method: "PUT",
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      await response.json();
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking._id.toString() === bookingId.toString()
            ? { ...booking, status: "Cancelled" }
            : booking
        )
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
      await response.json();
      setReviewVisible(null);
      setRating(0);
      setComment("");
      alert("Review submitted successfully!");
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 text-white relative font-sans">
      <BackgroundSlider images={backgroundImages} interval={7000} className="absolute inset-0 z-0" />
      
      {/* Welcome Section */}
      <section className="pt-24 pb-12 flex items-center justify-center relative z-10">
        <div className="text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight drop-shadow-lg">
            Welcome, {auth.user ? auth.user.name || "User" : "Please Login"}!
          </h1>
          <p className="text-lg md:text-xl text-gray-300 drop-shadow-sm max-w-2xl mx-auto">
            Manage your bookings and explore your dashboard.
          </p>
        </div>
      </section>

      {/* Bookings Section */}
      <section className="py-12 relative z-10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-10 text-center">Your Bookings</h2>
          <div className="relative max-w-3xl mx-auto">
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">You don't have any bookings yet</p>
              </div>
            ) : (
              <Slider ref={sliderRef} {...carouselSettings}>
                {bookings.map((booking) => {
                  const id = booking._id.toString();
                  return (
                    <div key={id} className="px-2 sm:px-4">
                      {/* Booking Card */}
                      <div className="bg-gradient-to-br from-gray-800/80 to-indigo-900/80 backdrop-blur-lg rounded-2xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-300 hover:shadow-indigo-500/20 hover:border-indigo-400/30">
                        {/* Card Header */}
                        <div className="p-6 pb-4 border-b border-white/10">
                          <div className="flex items-center">
                            <div className="relative">
                              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-400/50 shadow-md">
                                <img
                                  src={`http://localhost:3000/${booking.profileImage}` || "/placeholder.svg"}
                                  alt="Driver"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = "/placeholder.svg";
                                  }}
                                />
                              </div>
                              {booking.driver?.avgRating && (
                                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-2 py-1 rounded-full flex items-center text-xs font-bold shadow-md">
                                  <Star className="w-3 h-3 fill-current mr-1" />
                                  {booking.driver.avgRating.toFixed(1)}
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <h3 className="font-bold text-xl text-white">{booking.driver?.name || "Driver"}</h3>
                              <div className="flex items-center mt-1">
                                <span
                                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    booking.status === "completed"
                                      ? "bg-green-500/20 text-green-300"
                                      : booking.status === "in-progress"
                                      ? "bg-yellow-500/20 text-yellow-300"
                                      : booking.status === "Cancelled"
                                      ? "bg-red-500/20 text-red-300"
                                      : "bg-indigo-500/20 text-indigo-300"
                                  }`}
                                >
                                  {booking.status || "Pending"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 pt-4">
                          <div className="space-y-4 mb-6">
                            {/* Pickup Location */}
                            <div className="flex items-start">
                              <div className="bg-indigo-500/20 p-2 rounded-lg mr-3">
                                <MapPin className="w-5 h-5 text-indigo-300" />
                              </div>
                              <div>
                                <p className="text-indigo-300/80 text-xs font-medium uppercase tracking-wider mb-1">
                                  Pickup Location
                                </p>
                                <p className="text-white font-medium">
                                  {addresses[id]?.pickupAddress || "Loading address..."}
                                </p>
                              </div>
                            </div>

                            {/* Destination */}
                            <div className="flex items-start">
                              <div className="bg-pink-500/20 p-2 rounded-lg mr-3">
                                <MapPin className="w-5 h-5 text-pink-300" />
                              </div>
                              <div>
                                <p className="text-pink-300/80 text-xs font-medium uppercase tracking-wider mb-1">
                                  Destination
                                </p>
                                <p className="text-white font-medium">
                                  {addresses[id]?.destinationAddress || "Loading address..."}
                                </p>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-start">
                              <div className="bg-amber-500/20 p-2 rounded-lg mr-3">
                                <DollarSign className="w-5 h-5 text-amber-300" />
                              </div>
                              <div>
                                <p className="text-amber-300/80 text-xs font-medium uppercase tracking-wider mb-1">
                                  Price
                                </p>
                                <p className="text-white font-medium">
                                  ${booking.price?.toFixed(2) || "0.00"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer - Actions */}
                          {booking.status === "completed" ? (
                            <button
                              onClick={() => setReviewVisible(id)}
                              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                            >
                              <Star className="w-5 h-5" />
                              Leave a Review
                            </button>
                          ) : (
                            <div className="flex justify-between gap-3">
                              <button
                                onClick={() => navigate(`/booking/${id}`)}
                                className="flex-1 bg-indigo-600/90 text-white font-medium py-3 px-4 rounded-lg shadow hover:bg-indigo-700 transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                Details
                              </button>
                              {booking.status !== "Cancelled" && (
                                <button
                                  onClick={() => handleCancelBooking(id)}
                                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-lg transition-all duration-300 hover:from-red-700 hover:to-red-800 hover:scale-[1.02] flex items-center justify-center gap-2"
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
                  );
                })}
              </Slider>
            )}
          </div>
        </div>
      </section>

      {/* Review Modal */}
      {reviewVisible && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 w-11/12 max-w-md shadow-2xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-2xl text-white">Leave a Review</h3>
              <button
                onClick={() => setReviewVisible(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-2 rounded-full transition-all ${
                      star <= rating
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-gray-700/50 text-gray-400"
                    } hover:scale-110`}
                  >
                    <Star className="w-7 h-7" fill={star <= rating ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                className="w-full p-4 rounded-lg bg-gray-700/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-white/10 resize-none"
                rows={4}
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setReviewVisible(null)}
                  className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded-lg transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmitReview(reviewVisible)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
                  disabled={rating === 0}
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserHome;