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
  const navigate = useNavigate();
  const sliderRef = useRef(null);

  const [bookings, setBookings] = useState([]);
  const [addresses, setAddresses] = useState({});        // { [bookingId]: { pickup, destination } }
  const [currentIndex, setCurrentIndex] = useState(0);   // which slide is active
  const [reviewVisible, setReviewVisible] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [rideDetails, setRideDetails] = useState(null);

  // In-memory cache so we don't repeat lookups for same coords
  const addressCache = useRef({});

  // Fetch bookings when user loads
  useEffect(() => {
    if (!auth.user?._id) return;
    (async () => {
      try {
        const res = await fetch(`/api/user/${auth.user._id}`);
        if (!res.ok) throw new Error(res.statusText);
        const json = await res.json();
        setBookings(json.bookings || []);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      }
    })();
  }, [auth.user?._id]);

  // Reverse-geocode helper with caching
  const fetchAddressFromCoordinates = async (lat, lon) => {
    const key = `${lat},${lon}`;
    if (addressCache.current[key]) {
      return addressCache.current[key];
    }
    try {
      const res = await fetch(
        `http://localhost:3000/api/reverse-geocode?lat=${lat}&lon=${lon}`
      );
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      const addr =
        data.formatted ||
        data.results?.[0]?.formatted ||
        data.results?.[0]?.display_name ||
        "Address not available";
      addressCache.current[key] = addr;
      return addr;
    } catch (err) {
      console.error("Reverse geocode error:", err);
      return "Address not available";
    }
  };

  // Whenever the active slide changes, fetch that booking’s addresses if not already
  useEffect(() => {
    const b = bookings[currentIndex];
    if (!b) return;

    const id = b._id.toString();
    if (addresses[id]) return; // already fetched

    (async () => {
      const { pickupLocation, destinationLocation } = b;
      const pickupAddress =
        pickupLocation?.lat && pickupLocation?.lng
          ? await fetchAddressFromCoordinates(
              pickupLocation.lat,
              pickupLocation.lng
            )
          : "Address not available";
      const destinationAddress =
        destinationLocation?.lat && destinationLocation?.lng
          ? await fetchAddressFromCoordinates(
              destinationLocation.lat,
              destinationLocation.lng
            )
          : "Address not available";

      setAddresses((prev) => ({
        ...prev,
        [id]: { pickupAddress, destinationAddress },
      }));
    })();
  }, [currentIndex, bookings, addresses]);

  // Carousel arrows
  const CustomPrevArrow = () => (
    <div
      className="absolute top-1/2 left-6 -translate-y-1/2 bg-black/50 backdrop-blur-md rounded-full p-3 cursor-pointer hover:bg-indigo-600/80 transition-all z-30 shadow-lg hover:scale-110"
      onClick={() => sliderRef.current.slickPrev()}
    >
      <ChevronLeft className="w-6 h-6 text-white" />
    </div>
  );
  const CustomNextArrow = () => (
    <div
      className="absolute top-1/2 right-6 -translate-y-1/2 bg-black/50 backdrop-blur-md rounded-full p-3 cursor-pointer hover:bg-indigo-600/80 transition-all z-30 shadow-lg hover:scale-110"
      onClick={() => sliderRef.current.slickNext()}
    >
      <ChevronRight className="w-6 h-6 text-white" />
    </div>
  );

  // Slider settings with afterChange
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
    afterChange: (idx) => setCurrentIndex(idx),
    appendDots: (dots) => (
      <div className="slick-dots-container">
        <ul className="flex justify-center gap-2">{dots}</ul>
      </div>
    ),
    customPaging: () => (
      <div className="w-3 h-3 bg-white/30 rounded-full transition-all hover:bg-white/80 dot-indicator"></div>
    ),
  };

  // Cancel & review handlers (unchanged)
  const handleCancelBooking = async (bookingId) => {
    try {
      const res = await fetch(`/api/booking/cancel/${bookingId}`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error(res.statusText);
      await res.json();
      setBookings((bks) =>
        bks.map((bk) =>
          bk._id.toString() === bookingId
            ? { ...bk, status: "Cancelled" }
            : bk
        )
      );
    } catch (err) {
      console.error("Cancel booking error:", err);
    }
  };
  const handleSubmitReview = async (bookingId) => {
    try {
      const res = await fetch(`/api/booking/review/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) throw new Error(res.statusText);
      await res.json();
      setReviewVisible(null);
      setRating(0);
      setComment("");
      alert("Review submitted!");
    } catch (err) {
      console.error("Submit review error:", err);
    }
  };
  const handleShowRideDetails = (booking) => setRideDetails(booking);

  const backgroundImages = ["/bg1.jpg", "/bg2.jpg", "/bg3.jpg"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 text-white relative font-sans">
      <BackgroundSlider
        images={backgroundImages}
        interval={7000}
        className="absolute inset-0 z-0"
      />

      {/* Welcome */}
      <section className="pt-24 pb-12 flex items-center justify-center relative z-10 px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
            Welcome,{" "}
            {auth.user ? auth.user.name || "User" : "Please Login"}!
          </h1>
          <p className="text-lg md:text-xl text-gray-300 drop-shadow-sm">
            Manage your bookings and explore your dashboard.
          </p>
        </div>
      </section>

      {/* Bookings */}
      <section className="py-12 relative z-10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-10 text-center">
            Your Bookings
          </h2>
          <div className="relative max-w-3xl mx-auto">
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  You don't have any bookings yet
                </p>
              </div>
            ) : (
              <Slider ref={sliderRef} {...carouselSettings}>
                {bookings.map((bk, idx) => {
                  const id = bk._id.toString();
                  return (
                    <div key={id} className="px-2 sm:px-4">
                      <div className="bg-gradient-to-br from-gray-800/80 to-indigo-900/80 backdrop-blur-lg rounded-2xl overflow-hidden shadow-2xl border border-white/10 transition-all hover:shadow-indigo-500/20 hover:border-indigo-400/30">
                        {/* Header */}
                        <div className="p-6 pb-4 border-b border-white/10">
                          <div className="flex items-center">
                            <div className="relative">
                              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-400/50 shadow-md">
                                <img
                                  src={
                                    `http://localhost:3000/${bk.profileImage}` ||
                                    "/placeholder.svg"
                                  }
                                  alt="Driver"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = "/placeholder.svg";
                                  }}
                                />
                              </div>
                              {bk.driver?.avgRating && (
                                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-2 py-1 rounded-full flex items-center text-xs font-bold shadow-md">
                                  <Star className="w-3 h-3 fill-current mr-1" />
                                  {bk.driver.avgRating.toFixed(1)}
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <h3 className="font-bold text-xl text-white">
                                {bk.driver?.name || "Driver"}
                              </h3>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  bk.status === "completed"
                                    ? "bg-green-500/20 text-green-300"
                                    : bk.status === "in-progress"
                                    ? "bg-yellow-500/20 text-yellow-300"
                                    : bk.status === "Cancelled"
                                    ? "bg-red-500/20 text-red-300"
                                    : "bg-indigo-500/20 text-indigo-300"
                                }`}
                              >
                                {bk.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 pt-4">
                          <div className="space-y-4 mb-6">
                            <div className="flex items-start">
                              <div className="bg-indigo-500/20 p-2 rounded-lg mr-3">
                                <MapPin className="w-5 h-5 text-indigo-300" />
                              </div>
                              <div>
                                <p className="text-indigo-300/80 text-xs font-medium uppercase tracking-wider mb-1">
                                  Pickup Location
                                </p>
                                <p className="text-white font-medium">
                                  {
                                    addresses[id]?.pickupAddress ||
                                    (idx === currentIndex
                                      ? "Loading address..."
                                      : "–")
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start">
                              <div className="bg-indigo-500/20 p-2 rounded-lg mr-3">
                                <MapPin className="w-5 h-5 text-indigo-300" />
                              </div>
                              <div>
                                <p className="text-indigo-300/80 text-xs font-medium uppercase tracking-wider mb-1">
                                  Destination
                                </p>
                                <p className="text-white font-medium">
                                  {
                                    addresses[id]?.destinationAddress ||
                                    (idx === currentIndex
                                      ? "Loading address..."
                                      : "–")
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer Actions */}
                        {bk.status === "completed" ? (
                          <button
                            onClick={() => setReviewVisible(id)}
                            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 rounded-lg flex items-center justify-center gap-2"
                          >
                            <Star className="w-5 h-5" />
                            Leave a Review
                          </button>
                        ) : (
                          <div className="flex justify-between gap-3">
                            <button
                              onClick={() => handleShowRideDetails(bk)}
                              className="flex-1 bg-indigo-600/90 text-white font-medium py-3 px-4 rounded-lg shadow flex items-center justify-center gap-2"
                            >
                              <Eye className="w-4 h-4" /> Details
                            </button>
                            {bk.status !== "Cancelled" && (
                              <button
                                onClick={() => handleCancelBooking(id)}
                                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                              >
                                <X className="w-4 h-4" /> Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </Slider>
            )}
          </div>
        </div>
      </section>

      {/* Ride Details Modal */}
      {rideDetails && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 w-11/12 max-w-lg shadow-2xl border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold text-white">
                Ride Details
              </h3>
              <button onClick={() => setRideDetails(null)}>
                <X className="w-6 h-6 text-gray-400 hover:text-white" />
              </button>
            </div>
            <div className="space-y-3 text-white text-sm">
              <p>
                <strong>Driver:</strong> {rideDetails.driver?.name || "N/A"}
              </p>
              <p>
                <strong>Status:</strong> {rideDetails.status}
              </p>
              <p>
                <strong>Price:</strong> ${rideDetails.price?.toFixed(2) || "0.00"}
              </p>
              <p>
                <strong>Pickup:</strong>{" "}
                {addresses[rideDetails._id]?.pickupAddress || "Loading..."}
              </p>
              <p>
                <strong>Destination:</strong>{" "}
                {addresses[rideDetails._id]?.destinationAddress || "Loading..."}
              </p>
              <p>
                <strong>Booked At:</strong>{" "}
                {new Date(rideDetails.createdAt).toLocaleString()}
              </p>
              {rideDetails.rating && (
                <p>
                  <strong>Your Rating:</strong> {rideDetails.rating} / 5
                </p>
              )}
              {rideDetails.review && (
                <p>
                  <strong>Your Review:</strong> “{rideDetails.review}”
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewVisible && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 w-11/12 max-w-lg shadow-2xl border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold text-white">
                Leave a Review
              </h3>
              <button onClick={() => setReviewVisible(null)}>
                <X className="w-6 h-6 text-gray-400 hover:text-white" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white mb-2">
                  Rating (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-white mb-2">
                  Review
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white"
                  rows="4"
                />
              </div>
              <button
                onClick={() => handleSubmitReview(reviewVisible)}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 rounded-lg font-medium"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserHome;
