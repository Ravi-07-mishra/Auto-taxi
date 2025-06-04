// src/components/DriverDashboard.jsx

import React, { useEffect, useState, useRef, useCallback } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { Button, CircularProgress, Typography } from "@mui/material";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import { MapPin, DollarSign, Check, X, ChevronLeft, ChevronRight } from "lucide-react";

import { useDriverAuth } from "../Context/driverContext";
import { useSubscription } from "../Context/SubscriptionContext";

import "../Css/DriverDashboard.css";

/**
 * DriverDashboard
 *
 * - Displays new booking requests via WebSocket (socket.io) and allows Accept/Decline.
 * - Fetches all active bookings once, then reverse‐geocodes each pickup/destination.
 * - Shows active bookings in an auto‐playing carousel.
 * - Allows toggling “Go Online / Go Offline” and logging out.
 */
const DriverDashboard = () => {
  const { driver, dispatch } = useDriverAuth();
  const { subscription } = useSubscription();
  const navigate = useNavigate();

  // Local state
  const [driverId, setDriverId] = useState("");
  const [bookingRequests, setBookingRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [addresses, setAddresses] = useState({});
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingError, setBookingError] = useState(null);
  const [addressLoadingState, setAddressLoadingState] = useState(false);
  const [addressErrorState, setAddressErrorState] = useState(null);

  // Refs
  const sliderRef = useRef(null);
  const socketRef = useRef(null);

  // Check if subscription is valid (expiryDate should be an ISO string).
  const isSubscriptionValid =
    subscription.isSubscribed &&
    subscription.expiryDate &&
    new Date(subscription.expiryDate) > new Date();

  // ─── Backend Base URL ───────────────────────────────────────────
  // Must be defined in .env as VITE_API_URL (e.g. “https://api.yourdomain.com”).
  const API_BASE = import.meta.env.VITE_API_URL;
  if (!API_BASE) {
    console.error("VITE_API_URL is not defined in environment variables.");
  }
  const API_BASE2 = import.meta.env.VITE_API_URL2 || "http://localhost:3000";


  // ─── Redirect to login if not authenticated, set driver ID ─────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!driver) {
        navigate("/driverlogin");
      } else {
        setDriverId(driver._id);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [driver, navigate]);

  // ─── Fetch bookings for the driver once driverId and subscription are ready ───
  useEffect(() => {
    let isMounted = true;
    if (!driverId || !isSubscriptionValid) {
      setLoadingBookings(false);
      return;
    }

    const fetchBookings = async () => {
      setLoadingBookings(true);
      setBookingError(null);

      try {
        const res = await fetch(`${API_BASE}/driver/${driverId}`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (isMounted) {
          setBookings(json.bookings || []);
        }
      } catch (err) {
        if (isMounted) {
          setBookingError("Failed to load bookings. Please try again later.");
          console.error("Error fetching bookings:", err);
        }
      } finally {
        if (isMounted) {
          setLoadingBookings(false);
        }
      }
    };

    fetchBookings();

    return () => {
      isMounted = false;
    };
  }, [driverId, isSubscriptionValid, API_BASE]);

  // ─── Reverse geocode helper ───────────────────────────────────────────
  const fetchAddressFromCoordinates = useCallback(
    async (lat, lng, signal) => {
      if (!lat || !lng) {
        return "Address not available";
      }

      try {
        const url = new URL(`${API_BASE}/reverse-geocode`);
        url.searchParams.append("lat", lat);
        url.searchParams.append("lon", lng);

        const res = await fetch(url.toString(), { signal });
        if (!res.ok) {
          console.error("Reverse geocode returned status:", res.status);
          return "Address not available";
        }

        const data = await res.json();
        if (data.formatted) {
          return data.formatted;
        }
        if (Array.isArray(data.results) && data.results.length > 0) {
          return (
            data.results[0].formatted ||
            data.results[0].display_name ||
            "Address not available"
          );
        }
        return "Address not available";
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error in reverse geocoding:", err);
        }
        return "Address not available";
      }
    },
    [API_BASE]
  );

  // ─── Fetch reverse‐geocoded addresses for each booking ────────────────
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    if (bookings.length === 0) {
      setAddressLoadingState(false);
      return;
    }

    const fetchAllAddresses = async () => {
      setAddressLoadingState(true);
      setAddressErrorState(null);

      try {
        const addressPromises = bookings.map(async (booking) => {
          const id = booking._id.toString();
          const { pickupLocation, destinationLocation } = booking;

          const pickupAddress = await fetchAddressFromCoordinates(
            pickupLocation?.lat,
            pickupLocation?.lng,
            controller.signal
          );
          const destinationAddress = await fetchAddressFromCoordinates(
            destinationLocation?.lat,
            destinationLocation?.lng,
            controller.signal
          );

          return { id, pickupAddress, destinationAddress };
        });

        const results = await Promise.all(addressPromises);

        if (isMounted) {
          const newAddresses = results.reduce((acc, { id, pickupAddress, destinationAddress }) => {
            acc[id] = { pickupAddress, destinationAddress };
            return acc;
          }, {});
          setAddresses(newAddresses);
        }
      } catch (err) {
        if (isMounted && err.name !== "AbortError") {
          setAddressErrorState("Failed to load addresses.");
          console.error("Error fetching addresses:", err);
        }
      } finally {
        if (isMounted) {
          setAddressLoadingState(false);
        }
      }
    };

    fetchAllAddresses();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [bookings, fetchAddressFromCoordinates]);

  // ─── Socket setup and location updates ─────────────────────────────────
  useEffect(() => {
    if (!driverId) {
      return;
    }

    // Initialize socket.io
    const socket = io(API_BASE2, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      // Optionally: set some “connected” state if needed
    });

    socket.on("BookingRequest", (data) => {
      if (data.driverId === driverId) {
        setBookingRequests((prev) => [...prev, data]);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("disconnect", (reason) => {
      // Optionally: set some “disconnected” state
    });

    socket.on("paymentcompleted", (bookingId) => {
      navigate(`/driver/drive/${bookingId}`);
    });

    socket.on("reconnect_attempt", () => {
      // Optionally: show a “reconnecting…” indicator
    });

    // Emit initial driverLocation
    const emitLocation = () => {
      if (driver?.location?.lat && driver?.location?.lng) {
        socket.emit("driverLocation", {
          id: driverId,
          lat: driver.location.lat,
          lng: driver.location.lng,
        });
      } else {
        // fallback coordinates (OSM default: Bhubaneswar)
        socket.emit("driverLocation", {
          id: driverId,
          lat: 20.2960587,
          lng: 85.8245398,
        });
      }
    };
    emitLocation();

    // Optional: you could set up an interval here to send location updates repeatedly

    return () => {
      socket.off("BookingRequest");
      socket.disconnect();
    };
  }, [driverId, driver, navigate, API_BASE2]);

  // ─── Accept / Decline booking handlers ───────────────────────────────
  const handleAccept = useCallback(
    (bookingId) => {
      const socket = socketRef.current;
      if (socket && socket.connected) {
        socket.emit("acceptBooking", { bookingId, price: 100 });
      }
      setBookingRequests((prev) => prev.filter((b) => b.bookingId !== bookingId));
    },
    []
  );

  const handleDecline = useCallback(
    (bookingId) => {
      const socket = socketRef.current;
      if (socket && socket.connected) {
        socket.emit("declineBooking", { bookingId });
      }
      setBookingRequests((prev) => prev.filter((b) => b.bookingId !== bookingId));
    },
    []
  );

  // ─── Carousel Arrow Components ───────────────────────────────────────
  const CustomPrevArrow = () => (
    <div
      className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/30 backdrop-blur-md rounded-full p-2 cursor-pointer hover:bg-black/50 transition-all z-30"
      onClick={() => sliderRef.current?.slickPrev()}
    >
      <ChevronLeft className="w-6 h-6 text-white" />
    </div>
  );

  const CustomNextArrow = () => (
    <div
      className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/30 backdrop-blur-md rounded-full p-2 cursor-pointer hover:bg-black/50 transition-all z-30"
      onClick={() => sliderRef.current?.slickNext()}
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

  // ─── Toggle availability handler ─────────────────────────────────────
  const toggleAvailability = async () => {
    if (!driver?.user?.id) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/driver/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          driverId: driver.user.id,
          isAvailable: !driver.isAvailable,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        dispatch({ type: "UPDATE_AVAILABILITY", payload: data.driver });
      } else {
        console.error("Availability toggle error:", data.msg || data);
      }
    } catch (err) {
      console.error("Error updating availability:", err);
    }
  };

  // ─── Logout handler ─────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("driver");
    navigate("/driverlogin");
  };

  // ─── Cancel booking handler (backend must support this) ───────────────
  const handleCancelBooking = async (bookingId) => {
    try {
      const res = await fetch(`${API_BASE}/driver/cancel/${bookingId}`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b._id.toString() !== bookingId));
      } else {
        console.error("Cancel booking error:", data.msg || data);
      }
    } catch (err) {
      console.error("Error canceling booking:", err);
    }
  };

  // ─── JSX Rendering ───────────────────────────────────────────────────
  // If subscription is invalid, redirect or show a message
  if (!subscription.isSubscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <Typography variant="h5">
          Your subscription has expired. Please renew to access the dashboard.
        </Typography>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: 'url("driverbg3.jpg")' }}
    >
      {/* Toggle Availability Button */}
      <button
        onClick={toggleAvailability}
        className={`fixed top-20 right-6 z-50 px-6 py-3 rounded-full font-semibold shadow-lg transition-all duration-300 flex items-center gap-2 ${
          driver?.isAvailable
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-green-600 hover:bg-green-700 text-white"
        }`}
      >
        {driver?.isAvailable ? (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
            </svg>
            Go Offline
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
            </svg>
            Go Online
          </>
        )}
      </button>

      {/* Hero Section */}
      <section className="h-screen flex items-center justify-center relative">
        <div className="text-center z-10">
          <Typography variant="h1" className="text-6xl font-bold text-white mb-4 tracking-tight mt-14">
            Driver Dashboard
          </Typography>
          <Typography variant="h6" className="text-xl text-gray-300">
            Welcome back, {driver?.name || "Driver"}
          </Typography>
          <div className="mt-8 animate-bounce">
            <Typography className="text-gray-400">Scroll to view bookings</Typography>
            <div className="mt-2">
              <svg
                className="w-6 h-6 mx-auto text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-70" />
      </section>

      {/* Booking Requests Section */}
      <section className="py-20 bg-black bg-opacity-80">
        <div className="container mx-auto px-4">
          <Typography variant="h2" className="text-3xl font-bold text-white mb-12 text-center">
            New Booking Requests
          </Typography>

          {bookingRequests.length === 0 ? (
            <Typography className="text-center text-gray-400">
              No new booking requests at the moment.
            </Typography>
          ) : (
            <div className="overflow-x-auto pb-6">
              <div className="flex space-x-6 snap-x snap-mandatory">
                {bookingRequests.map((req) => {
                  const { bookingId, userImage, userName, estimatedPrice } = req;
                  const pickupAddr = addresses[bookingId]?.pickupAddress || "Loading address...";
                  const destAddr = addresses[bookingId]?.destinationAddress || "Loading address...";

                  return (
                    <div
                      key={bookingId}
                      className="w-[calc(33.33%-1rem)] flex-shrink-0 snap-start"
                    >
                      <div className="bg-gradient-to-r from-black via-gray-800 to-black rounded-xl overflow-hidden shadow-xl border border-gray-700 transition-all duration-300 hover:shadow-indigo-500/50 hover:scale-105">
                        <div className="p-6">
                          {/* User Info */}
                          <div className="flex items-center mb-6">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500">
                              <img
                                src={userImage || "/placeholder.svg?height=64&width=64"}
                                alt="User"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="ml-4">
                              <Typography
                                variant="subtitle1"
                                className="text-white font-semibold text-lg"
                              >
                                {userName || "New Request"}
                              </Typography>
                              <Typography variant="caption" className="text-indigo-300">
                                Pending Confirmation
                              </Typography>
                            </div>
                          </div>

                          {/* Booking Details */}
                          <div className="space-y-4 mb-6">
                            <div className="flex items-start space-x-3">
                              <MapPin className="w-5 h-5 text-green-400 mt-1" />
                              <div>
                                <Typography variant="caption" className="text-indigo-200">
                                  Pickup Location
                                </Typography>
                                <Typography variant="body2" className="text-white font-medium">
                                  {pickupAddr}
                                </Typography>
                              </div>
                            </div>

                            <div className="flex items-start space-x-3">
                              <MapPin className="w-5 h-5 text-red-400 mt-1" />
                              <div>
                                <Typography variant="caption" className="text-indigo-200">
                                  Destination
                                </Typography>
                                <Typography variant="body2" className="text-white font-medium">
                                  {destAddr}
                                </Typography>
                              </div>
                            </div>

                            <div className="flex items-start space-x-3">
                              <DollarSign className="w-5 h-5 text-yellow-400 mt-1" />
                              <div>
                                <Typography variant="caption" className="text-indigo-200">
                                  Estimated Price
                                </Typography>
                                <Typography variant="body2" className="text-white font-medium">
                                  ${estimatedPrice ?? "100"}
                                </Typography>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-4">
                            <button
                              onClick={() => handleAccept(bookingId)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors duration-300"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleDecline(bookingId)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors duration-300"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Active Bookings Section */}
      <section className="py-20 bg-transparent relative z-10">
        <div className="container mx-auto px-4">
          <Typography variant="h2" className="text-3xl font-bold text-white mb-12 text-center">
            Your Active Bookings
          </Typography>

          {loadingBookings ? (
            <div className="flex justify-center items-center">
              <CircularProgress color="inherit" />
            </div>
          ) : bookingError ? (
            <Typography className="text-center text-red-400">{bookingError}</Typography>
          ) : bookings.length === 0 ? (
            <Typography className="text-center text-gray-400">
              You have no active bookings right now.
            </Typography>
          ) : (
            <div className="relative max-w-3xl mx-auto">
              <Slider ref={sliderRef} {...carouselSettings}>
                {bookings.map((booking) => {
                  const id = booking._id.toString();
                  const status = booking.status || "Active";
                  const pickupAddr = addresses[id]?.pickupAddress || "Loading address...";
                  const destAddr = addresses[id]?.destinationAddress || "Loading address...";
                  const price = booking.price ?? "N/A";

                  return (
                    <div key={id} className="px-2 sm:px-4">
                      {/* Booking Card */}
                      <div className="bg-gradient-to-br from-gray-800/80 to-indigo-900/80 backdrop-blur-lg rounded-2xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-300 hover:shadow-indigo-500/20 hover:scale-105">
                        {/* Card Header */}
                        <div className="p-6 pb-4 border-b border-white/10 flex items-center">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-400/50 shadow-md">
                            <img
                              src={booking.userImage || "/placeholder.svg?height=64&width=64"}
                              alt="User"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="ml-4">
                            <Typography variant="h6" className="font-semibold text-white">
                              {booking.userName || "User"}
                            </Typography>
                            <span
                              className={`text-sm px-2 py-1 rounded-full ${
                                status === "completed"
                                  ? "bg-green-500/20 text-green-400"
                                  : status === "in-progress"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-indigo-500/20 text-indigo-400"
                              }`}
                            >
                              {status}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 space-y-3">
                          <div className="flex items-start space-x-2">
                            <MapPin className="w-5 h-5 text-indigo-300 mt-1" />
                            <div>
                              <Typography
                                variant="caption"
                                className="text-indigo-300/80 uppercase tracking-wider mb-1"
                              >
                                Pickup Location
                              </Typography>
                              <Typography variant="body2" className="text-white font-medium">
                                {pickupAddr}
                              </Typography>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <MapPin className="w-5 h-5 text-indigo-300 mt-1" />
                            <div>
                              <Typography
                                variant="caption"
                                className="text-indigo-300/80 uppercase tracking-wider mb-1"
                              >
                                Destination
                              </Typography>
                              <Typography variant="body2" className="text-white font-medium">
                                {destAddr}
                              </Typography>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <DollarSign className="w-5 h-5 text-indigo-300 mt-1" />
                            <div>
                              <Typography
                                variant="caption"
                                className="text-indigo-300/80 uppercase tracking-wider mb-1"
                              >
                                Price
                              </Typography>
                              <Typography variant="body2" className="text-white font-medium">
                                ${price}
                              </Typography>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 pt-0 flex justify-between gap-3">
                          {status === "Accepted" && (
                            <button
                              onClick={() => navigate(`/driver/drive/${id}`)}
                              className="bg-indigo-600/90 text-white font-medium py-3 px-4 rounded-lg shadow hover:bg-indigo-700 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Start Ride
                            </button>
                          )}
                          <button
                            onClick={() => handleCancelBooking(id)}
                            className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg transition-all duration-300 hover:from-red-700 hover:to-red-800 hover:scale-[1.02] flex items-center justify-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Slider>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DriverDashboard;
