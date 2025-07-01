// src/components/DriverDashboard.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../Context/SocketContext";
import { CircularProgress, Typography } from "@mui/material";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import { MapPin, DollarSign, Check, X, ChevronLeft, ChevronRight } from "lucide-react";

import { useDriverAuth } from "../Context/driverContext";
import { useSubscription } from "../Context/SubscriptionContext";

import "../Css/DriverDashboard.css";

const DriverDashboard = () => {
  const { driver, dispatch } = useDriverAuth();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
const {socket} = useSocket();
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

  // Check if subscription is valid
  const isSubscriptionValid =
    subscription.isSubscribed &&
    subscription.expiryDate &&
    new Date(subscription.expiryDate) > new Date();

  // ─── Backend Base URL ───────────────────────────────────────────
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

    // // Initialize socket.io
    // const socket = io(API_BASE2, {
    //   transports: ["websocket", "polling"],
    //   reconnection: true,
    //   reconnectionAttempts: 5,
    //   reconnectionDelay: 1000,
    // });
    socketRef.current = socket;

    socket.on("connect", () => {
      // Optionally: set some "connected" state if needed
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
      // Optionally: set some "disconnected" state
    });

    socket.on("paymentcompleted", (bookingId) => {
      navigate(`/driver/drive/${bookingId}`);
    });

    socket.on("reconnect_attempt", () => {
      // Optionally: show a "reconnecting…" indicator
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
  const CustomPrevArrow = (props) => (
    <div
      {...props}
      className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/50 backdrop-blur-md rounded-full p-2 cursor-pointer hover:bg-black/70 transition-all z-30"
    >
      <ChevronLeft className="w-6 h-6 text-white" />
    </div>
  );

  const CustomNextArrow = (props) => (
    <div
      {...props}
      className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/50 backdrop-blur-md rounded-full p-2 cursor-pointer hover:bg-black/70 transition-all z-30"
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
    autoplaySpeed: 5000,
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
    if (!driver?._id) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/driver/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          driverId: driver._id,
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
    <div className="min-h-screen bg-cover bg-center bg-fixed bg-gray-900">
      {/* Hero Section */}
      <section className="h-screen flex items-center justify-center relative pt-20">
        <div className="text-center z-10 px-4">
          <Typography variant="h1" className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Driver Dashboard
          </Typography>
          <Typography variant="h6" className="text-xl text-gray-300 mb-10">
            Welcome back, {driver?.name || "Driver"}
          </Typography>
          
          <div className="max-w-2xl mx-auto bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="text-indigo-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-white font-medium mb-1">Active Bookings</h3>
                <p className="text-2xl font-bold text-white">{bookings.length}</p>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="text-green-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-white font-medium mb-1">Status</h3>
                <p className={`text-lg font-bold ${driver?.isAvailable ? 'text-green-500' : 'text-red-500'}`}>
                  {driver?.isAvailable ? 'Online' : 'Offline'}
                </p>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="text-yellow-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-white font-medium mb-1">Subscription</h3>
                <p className="text-lg font-bold text-white">
                  {isSubscriptionValid ? 'Active' : 'Expired'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-16 animate-bounce">
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
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-80" />
      </section>

      {/* Booking Requests Section */}
      <section className="py-20 bg-black bg-opacity-80">
        <div className="container mx-auto px-4">
          <Typography variant="h2" className="text-3xl font-bold text-white mb-12 text-center">
            New Booking Requests
          </Typography>

          {bookingRequests.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <Typography className="text-gray-400 text-lg">
                No new booking requests at the moment
              </Typography>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookingRequests.map((req) => {
                const { bookingId, userImage, userName, estimatedPrice } = req;
                const pickupAddr = addresses[bookingId]?.pickupAddress || "Loading address...";
                const destAddr = addresses[bookingId]?.destinationAddress || "Loading address...";

                return (
                  <div
                    key={bookingId}
                    className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-700 transition-all duration-300 hover:shadow-indigo-500/30 hover:border-indigo-500/50"
                  >
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
                          <MapPin className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                          <div>
                            <Typography variant="caption" className="text-gray-400 block">
                              Pickup Location
                            </Typography>
                            <Typography variant="body2" className="text-white font-medium">
                              {pickupAddr}
                            </Typography>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                          <div>
                            <Typography variant="caption" className="text-gray-400 block">
                              Destination
                            </Typography>
                            <Typography variant="body2" className="text-white font-medium">
                              {destAddr}
                            </Typography>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <DollarSign className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                          <div>
                            <Typography variant="caption" className="text-gray-400 block">
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
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleDecline(bookingId)}
                          className="flex-1 bg-gray-700 hover:bg-gray-800 text-white py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
            <div className="flex justify-center items-center py-20">
              <CircularProgress color="inherit" className="text-indigo-500" />
            </div>
          ) : bookingError ? (
            <div className="text-center py-12 bg-red-900/20 rounded-xl border border-red-800/50">
              <Typography className="text-red-400 text-lg">{bookingError}</Typography>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <Typography className="text-gray-400 text-lg">
                You have no active bookings right now
              </Typography>
            </div>
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
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl border border-gray-700 transition-all duration-300">
                        {/* Card Header */}
                        <div className="p-6 pb-4 border-b border-gray-700 flex items-center">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500/50 shadow-md">
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
                              className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
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
                        <div className="p-6 space-y-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                              <Typography
                                variant="caption"
                                className="text-gray-400 uppercase tracking-wider mb-1 block"
                              >
                                Pickup Location
                              </Typography>
                              <Typography variant="body2" className="text-white font-medium">
                                {pickupAddr}
                              </Typography>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                              <Typography
                                variant="caption"
                                className="text-gray-400 uppercase tracking-wider mb-1 block"
                              >
                                Destination
                              </Typography>
                              <Typography variant="body2" className="text-white font-medium">
                                {destAddr}
                              </Typography>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                              <DollarSign className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                              <Typography
                                variant="caption"
                                className="text-gray-400 uppercase tracking-wider mb-1 block"
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
                              className="bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg shadow hover:bg-indigo-700 transition-all duration-300 flex-1 flex items-center justify-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Start Ride
                            </button>
                          )}
                          <button
                            onClick={() => handleCancelBooking(id)}
                            className="bg-gradient-to-r from-gray-700 to-gray-800 text-white py-3 rounded-lg transition-all duration-300 hover:from-gray-800 hover:to-gray-900 flex-1 flex items-center justify-center gap-2"
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
      
      {/* Footer */}
      <footer className="py-8 bg-black/80 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>© {new Date().getFullYear()} DriveEase. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default DriverDashboard;