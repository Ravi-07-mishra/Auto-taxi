import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useDriverAuth } from "../Context/driverContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import "../Css/DriverDashboard.css";
import { useSubscription } from "../Context/SubscriptionContext";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  MapPin,
  DollarSign,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const DriverDashboard = () => {
  const [driverId, setDriverId] = useState("");
  const [bookingRequests, setBookingRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [addresses, setAddresses] = useState({}); // Reverse geocoded addresses keyed by booking ID

  const { subscription } = useSubscription();
  const sliderRef = useRef(null);
  const { driver, dispatch } = useDriverAuth();
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const isSubscriptionValid =
    subscription.isSubscribed && new Date(subscription.expiryDate) > new Date();

  // Redirect to login if not authenticated and set driver ID
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!driver) {
        navigate("/driverlogin");
      } else {
        setDriverId(driver._id);
        console.log("Driver ID set to:", driver._id);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [driver, navigate]);

  // Fetch bookings for the driver
  useEffect(() => {
    if (!driverId || !isSubscriptionValid) return;
    const fetchBookings = async () => {
      try {
        const response = await fetch(`/api/driver/${driverId}`);
        const json = await response.json();
        setBookings(json.bookings || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };
    fetchBookings();
  }, [driverId, isSubscriptionValid]);

  // Reverse geocode function: call backend endpoint and return address string
  const fetchAddressFromCoordinates = async (lat, lon) => {
    try {
      const url = `http://localhost:3000/api/reverse-geocode?lat=${lat}&lon=${lon}`;
      console.log("Fetching reverse geocode from:", url);
      const response = await fetch(url);
      if (!response.ok) {
        console.error("Reverse geocode response not ok:", response.status);
        return "Address not available";
      }
      const data = await response.json();
      console.log("Full API response:", data);
      if (data.formatted) return data.formatted;
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

  // Fetch reverse geocoded addresses for each booking
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
                  ? await fetchAddressFromCoordinates(
                      pickupLocation.lat,
                      pickupLocation.lng
                    )
                  : "Address not available";
              const destinationAddress =
                destLocation && destLocation.lat && destLocation.lng
                  ? await fetchAddressFromCoordinates(
                      destLocation.lat,
                      destLocation.lng
                    )
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

  // Socket setup and location updates
  useEffect(() => {
    if (!driverId) return;

    socketRef.current = io("http://localhost:3000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    const socket = socketRef.current;
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });
    socket.on("BookingRequest", (data) => {
      console.log("Received booking request:", data);
      if (data.driverId === driverId) {
        setBookingRequests((prev) => [...prev, data]);
      }
    });
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });
    socket.on("paymentcompleted", (bookingId) => {
      console.log("Payment completed for bookingId:", bookingId);
      navigate(`/driver/drive/${bookingId}`);
    });
    socket.on("reconnect_attempt", () => {
      console.log("Reconnecting to socket...");
    });
    const updateDriverLocation = () => {
      if (driver && driver.location && driver.location.lat && driver.location.lng) {
        socket.emit("driverLocation", {
          id: driverId,
          lat: driver.location.lat,
          lng: driver.location.lng,
        });
      } else {
        // Fallback location
        socket.emit("driverLocation", {
          id: driverId,
          lat: 20.2960587,
          lng: 85.8245398,
        });
      }
    };

    updateDriverLocation();
    return () => {
      socket.off("BookingRequest");
      socket.disconnect();
      console.log("Socket disconnected on cleanup.");
    };
  }, [driverId, driver, navigate]);

  const handleAccept = (bookingId) => {
    const socket = socketRef.current;
    socket.emit("acceptBooking", { bookingId, price: 100 });
    setBookingRequests((prev) =>
      prev.filter((b) => b.bookingId !== bookingId)
    );
  };

  const handleDecline = (bookingId) => {
    const socket = socketRef.current;
    socket.emit("declineBooking", { bookingId });
    setBookingRequests((prev) =>
      prev.filter((b) => b.bookingId !== bookingId)
    );
  };

  // Custom carousel arrows for active bookings slider
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

  // Carousel settings for active bookings
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

  // Additional handlers for toggling availability, inbox, logout, etc.
  const toggleAvailability = async () => {
    if (!driver || !driver.user) return;
    try {
      const response = await fetch("/api/driver/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: driver.user.id,
          isAvailable: !driver.isAvailable,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        dispatch({ type: "UPDATE_AVAILABILITY", payload: data.driver });
      } else {
        console.error(data.msg);
      }
    } catch (error) {
      console.error("Error updating availability:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("driver");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: 'url("driverbg3.jpg")' }}>
      {/* Hero Section */}
      <section className="h-screen flex items-center justify-center relative">
        <div className="text-center z-10">
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight mt-14">Driver Dashboard</h1>
          <p className="text-xl text-gray-300">Welcome back, {driver?.name}</p>
          <div className="mt-8 animate-bounce">
            <p className="text-gray-400">Scroll to view bookings</p>
            <div className="mt-2">
              <svg className="w-6 h-6 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-70" />
      </section>

      {/* Booking Requests Section */}
      <section className="py-20 bg-black bg-opacity-80">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">New Booking Requests</h2>
          <div className="overflow-x-auto pb-6">
            <div className="flex space-x-6 snap-x snap-mandatory">
              {bookingRequests.map((req) => (
                <div key={req.bookingId} className="w-[calc(33.33%-1rem)] flex-shrink-0 snap-start">
                  <div className="bg-gradient-to-r from-black via-gray-800 to-black rounded-xl overflow-hidden shadow-xl border border-gray-700 transition-all duration-300 hover:shadow-indigo-500/50 hover:scale-105">
                    <div className="p-6">
                      {/* User Info */}
                      <div className="flex items-center mb-6">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500">
                          <img
                            src={req.userImage || "/placeholder.svg?height=64&width=64"}
                            alt="User"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-white font-semibold text-lg">{req.userName || "New Request"}</h3>
                          <span className="text-indigo-300 text-sm">Pending Confirmation</span>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="space-y-4 mb-6">
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 text-green-400 mt-1" />
                          <div>
                            <p className="text-indigo-200 text-sm">Pickup Location</p>
                            <p className="text-white font-medium text-sm">
                              {addresses[req.bookingId]?.pickupAddress || "Loading address..."}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 text-red-400 mt-1" />
                          <div>
                            <p className="text-indigo-200 text-sm">Destination</p>
                            <p className="text-white font-medium text-sm">
                              {addresses[req.bookingId]?.destinationAddress || "Loading address..."}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <DollarSign className="w-5 h-5 text-yellow-400 mt-1" />
                          <div>
                            <p className="text-indigo-200 text-sm">Estimated Price</p>
                            <p className="text-white font-medium text-sm">${req.estimatedPrice || "100"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleAccept(req.bookingId)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors duration-300"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDecline(req.bookingId)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors duration-300"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Active Bookings Section */}
      <section className="py-20 bg-transparent relative z-10">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Your Active Bookings</h2>
          <div className="relative">
            <Slider ref={sliderRef} {...carouselSettings}>
              {bookings.map((booking) => (
                <div key={booking._id} className="px-4">
                  {/* Booking Card */}
                  <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-300 hover:shadow-3xl hover:scale-105">
                    <div className="p-6">
                      {/* User Info */}
                      <div className="flex items-center mb-6">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-300/50">
                          <img
                            src={booking.userImage || "/placeholder.svg?height=64&width=64"}
                            alt="User"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-semibold text-xl text-white">{booking.userName || "User"}</h3>
                          <span
                            className={`text-sm px-2 py-1 rounded-full ${
                              booking.status === "completed"
                                ? "bg-green-500/20 text-green-400"
                                : booking.status === "in-progress"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-indigo-500/20 text-indigo-400"
                            }`}
                          >
                            {booking.status || "Active"}
                          </span>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-5 h-5 text-green-400 mt-1" />
                          <div>
                            <p className="text-indigo-200 text-xs">Pickup Location</p>
                            <p className="text-white font-medium text-sm">
                              {addresses[booking._id]?.pickupAddress || "Loading address..."}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-2">
                          <MapPin className="w-5 h-5 text-red-400 mt-1" />
                          <div>
                            <p className="text-indigo-200 text-xs">Destination</p>
                            <p className="text-white font-medium text-sm">
                              {addresses[booking._id]?.destinationAddress || "Loading address..."}
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
                      <div className="flex justify-between items-center gap-4">
                        <button
                          onClick={() => handleMarkAsCompleted(booking._id)}
                          className="bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-4 rounded-lg transition-all duration-300 hover:from-green-700 hover:to-green-800 flex items-center justify-center gap-2 transform hover:scale-105"
                        >
                          <Check className="w-4 h-4" />
                          Mark as Completed
                        </button>
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          className="bg-gradient-to-r from-red-600 to-red-700 text-white py-2 px-4 rounded-lg transition-all duration-300 hover:from-red-700 hover:to-red-800 flex items-center justify-center gap-2 transform hover:scale-105"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-indigo-900 bg-opacity-80 py-6">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Button
            onClick={toggleAvailability}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors duration-300"
          >
            Toggle Availability
          </Button>
          <Button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-300"
          >
            Logout
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default DriverDashboard;
