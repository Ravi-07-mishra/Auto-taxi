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
  // addresses: { [bookingId: string]: { pickupAddress: string, destinationAddress: string } }
  const [addresses, setAddresses] = useState({});
  const [reviewVisible, setReviewVisible] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const backgroundImages = ["/bg1.jpg", "/bg2.jpg", "/bg3.jpg"];

  // Fetch bookings from the backend
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(`/api/user/${auth.user?._id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const json = await response.json();
        console.log("Fetched bookings:", json.bookings);
        setBookings(json.bookings || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };
    if (auth.user?._id) fetchBookings();
  }, [auth.user?._id]);

  // Reverse geocoding using our backend endpoint with OpenCage
  const fetchAddressFromCoordinates = async (lat, lon) => {
    try {
      const url = `http://localhost:3000/api/reverse-geocode?lat=${lat}&lon=${lon}`;
      console.log("Fetching reverse geocode from:", url);
      const response = await fetch(url);
      if (!response.ok) {
        console.error("Response not ok:", response.status);
        return "Address not available";
      }
      const data = await response.json();
      console.log("Full API response:", data);
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
  
  

  // Fetch addresses for each booking and store them in state
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
          console.log("Fetched addresses:", newAddresses);
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

  // Custom carousel arrows
  const CustomPrevArrow = () => (
    <div
      className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/30 backdrop-blur-md rounded-full p-2 cursor-pointer hover:bg-black/50 transition-all z-30"
      onClick={() => sliderRef.current.slickPrev()}
    >
      <ChevronLeft className="w-6 h-6 text-white" />
    </div>
  );
  const CustomNextArrow = () => (
    <div
      className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/30 backdrop-blur-md rounded-full p-2 cursor-pointer hover:bg-black/50 transition-all z-30"
      onClick={() => sliderRef.current.slickNext()}
    >
      <ChevronRight className="w-6 h-6 text-white" />
    </div>
  );

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
    appendDots: (dots) => (
      <div className="slick-dots-container mt-4">
        <ul className="slick-dots flex justify-center gap-2">{dots}</ul>
      </div>
    ),
    customPaging: () => (
      <div className="w-3 h-3 bg-white/50 rounded-full transition-all hover:bg-white/80"></div>
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 text-white relative font-sans">
      <BackgroundSlider images={backgroundImages} interval={7000} className="absolute inset-0 z-0" />
      {/* Welcome Section */}
      <section className="pt-20 pb-10 flex items-center justify-center relative z-10">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight drop-shadow-lg">
            Welcome, {auth.user ? auth.user.name || "User" : "Please Login"}!
          </h1>
          <p className="text-lg md:text-xl text-gray-300 drop-shadow-sm">
            Manage your bookings and explore your dashboard.
          </p>
        </div>
      </section>
      {/* Bookings Section */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Your Bookings</h2>
          <div className="relative">
            <Slider ref={sliderRef} {...carouselSettings}>
              {bookings.map((booking) => {
                const id = booking._id.toString();
                return (
                  <div key={id} className="px-4">
                    {/* Booking Card */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/20 transition-transform duration-300 hover:shadow-2xl hover:scale-105">
                      <div className="p-6">
                        {/* Driver Info */}
                        <div className="flex items-center mb-4">
                          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-indigo-300/50">
                            <img
                              src={booking.driver?.profileImage || "/placeholder.svg?height=64&width=64"}
                              alt="Driver"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="ml-4">
                            <h3 className="font-semibold text-xl">{booking.driver?.name || "Driver"}</h3>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
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
                        <div className="space-y-3 mb-4">
                          <div className="flex items-start space-x-2">
                            <MapPin className="w-5 h-5 text-green-400 mt-1" />
                            <div>
                              <p className="text-indigo-200 text-xs">Pickup Location</p>
                              <p className="text-white font-medium text-sm">
                                {addresses[id]?.pickupAddress || "Address not available"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <MapPin className="w-5 h-5 text-red-400 mt-1" />
                            <div>
                              <p className="text-indigo-200 text-xs">Destination</p>
                              <p className="text-white font-medium text-sm">
                                {addresses[id]?.destinationAddress || "Address not available"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <DollarSign className="w-5 h-5 text-yellow-400 mt-1" />
                            <div>
                              <p className="text-indigo-200 text-xs">Price</p>
                              <p className="text-white font-medium text-sm">${booking.price || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                        {/* Actions */}
                        {booking.status === "completed" ? (
                          <button
                            onClick={() => setReviewVisible(id)}
                            className="w-full bg-indigo-600/80 text-white py-2 rounded-md flex items-center justify-center gap-2 transition-transform duration-300 hover:bg-indigo-700 hover:scale-105 text-sm"
                          >
                            <Star className="w-5 h-5" />
                            Leave a Review
                          </button>
                        ) : (
                          <div className="flex justify-between items-center gap-3">
                            <button
                              onClick={() => navigate(`/booking/${id}`)}
                              className="bg-indigo-600/80 text-white font-semibold py-2 px-4 rounded-md shadow hover:bg-indigo-700 transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-2 text-sm"
                            >
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                            {booking.status !== "Cancelled" && (
                              <button
                                onClick={() => handleCancelBooking(id)}
                                className="bg-red-600/80 text-white py-2 px-4 rounded-md transition-transform duration-300 hover:bg-red-700 hover:scale-105 flex items-center gap-2 text-sm"
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
          </div>
        </div>
      </section>
      {/* Review Modal */}
      {reviewVisible && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 w-11/12 max-w-md shadow-2xl">
            <h3 className="font-semibold text-2xl mb-6 text-white">Leave a Review</h3>
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-7 h-7 cursor-pointer ${star <= rating ? "text-yellow-400" : "text-gray-500"}`}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your review..."
                className="w-full p-3 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setReviewVisible(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md transition-colors duration-300"
                >
                  Close
                </button>
                <button
                  onClick={() => handleSubmitReview(reviewVisible)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors duration-300"
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
