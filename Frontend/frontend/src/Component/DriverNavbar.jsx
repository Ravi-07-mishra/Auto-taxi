import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Avatar,
  Button,
  Dialog,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Typography,
  Badge,
  Tooltip,
  Divider,
  Chip,
  LinearProgress
} from "@mui/material";
import { 
  Close, 
  Logout, 
  Person, 
  Menu as MenuIcon, 
  Notifications,
  CheckCircle,
  Cancel,
  LocationOn,
  AccessTime,
  Person as PassengerIcon,
  AttachMoney
} from "@mui/icons-material";
import { useLocation, useNavigate, NavLink as RouterNavLink } from "react-router-dom";
import { useSocket } from "../Context/SocketContext";
import { useDriverAuth } from "../Context/driverContext";
import { useSubscription } from "../Context/SubscriptionContext";
import DriverLogin from "../pages/Driverlogin";
import DriverRegistrationForm from "../pages/Register";
import SubscriptionPage from "../pages/SubscriptionPage";
import { FlashOn, FlashOff } from "@mui/icons-material";
import io from "socket.io-client";

const DriverNavbar = () => {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const API_BASE2 = import.meta.env.VITE_API_URL2 || "http://localhost:3000";
  const {socket} = useSocket();
  const auth = useDriverAuth();
  const { subscription } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();

  // State management
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [navbarStyle, setNavbarStyle] = useState({ 
    background: "transparent",
    backdropFilter: "none"
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Booking request state
  const [bookingRequests, setBookingRequests] = useState([]);
  const [unreadRequests, setUnreadRequests] = useState(0);
  const timersRef = useRef({});
  // const socket = useRef(null);

  const driverName = auth.driver?.name || "Driver";
  const driverInitial = driverName.charAt(0).toUpperCase();
  const isSubscribed = subscription.isSubscribed && new Date(subscription.expiryDate) > new Date();
  const isAvailable = auth.driver?.isAvailable || false;

  // Initialize socket connection
    useEffect(() => {
    if (!auth.driver?._id || !isAvailable || !socket) return;

    // Handle booking requests
    socket.on("BookingRequest", (data) => {
      if (data.driverId === auth.driver._id) {
        const requestId = data.bookingId;
        const newRequest = {
          ...data,
          id: requestId,
          receivedAt: new Date(),
          timeLeft: 30,  // Set countdown time (30 seconds)
        };
        setBookingRequests((prev) => [newRequest, ...prev]);
        setUnreadRequests((prev) => prev + 1);
        startTimer(requestId); // Start the timer
      }
    });

    // Handle payment completion
    socket.on("paymentcompleted", (bookingId) => {
      console.log(`Payment completed for booking: ${bookingId}`);
    });
    // Emit driver location to server
    const emitLocation = () => {
      if (auth.driver?.location?.lat && auth.driver?.location?.lng) {
        socket.emit("driverLocation", {
          id: auth.driver._id,
          lat: auth.driver.location.lat,
          lng: auth.driver.location.lng,
        });
      }
    };
    emitLocation();

    // Cleanup listeners on component unmount or when socket changes
    return () => {
      socket.off("BookingRequest");
      socket.off("paymentcompleted");
    };
  }, [auth.driver, isAvailable, socket, navigate]);

  // Start countdown timer for a request
   const startTimer = useCallback((requestId) => {
    if (timersRef.current[requestId]) {
      clearInterval(timersRef.current[requestId]);
    }

    timersRef.current[requestId] = setInterval(() => {
      setBookingRequests((prevRequests) => {
        return prevRequests.map((req) => {
          if (req.id === requestId) {
            const timeLeft = req.timeLeft - 1;
            
            if (timeLeft <= 0) {
              clearInterval(timersRef.current[requestId]);
              delete timersRef.current[requestId];

              // Auto-reject if time expires
              socket.emit("declineBooking", { bookingId: requestId });
              return null;
            }

            return { ...req, timeLeft };
          }
          return req;
        }).filter(Boolean);
      });
    }, 1000);
  }, [socket]);

  // Handle booking actions (accept/decline)
  const handleBookingAction = useCallback((requestId, action, estimatedPrice) => {
    if (timersRef.current[requestId]) {
      clearInterval(timersRef.current[requestId]);
      delete timersRef.current[requestId];
    }

    if (socket && socket.connected) {
      if (action === "accept") {
        socket.emit("acceptBooking", { bookingId: requestId, price: estimatedPrice ?? 100 });
      } else {
        socket.emit("declineBooking", { bookingId: requestId });
      }
    }

    setBookingRequests((prev) => prev.filter((req) => req.id !== requestId));
    setUnreadRequests((prev) => prev - 1); // Decrease unread count
  }, [socket]);


  // Update availability
  const toggleAvailability = useCallback(async () => {
    if (!auth.driver?._id) return;
    
    try {
      const newAvailability = !isAvailable;
      
      // API call to update availability
      await fetch(`${API_BASE}/driver/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          driverId: auth.driver._id,
          isAvailable: newAvailability,
        }),
      });
      
      // Update context
      if (auth.dispatch) {
        auth.dispatch({ 
          type: "UPDATE_AVAILABILITY", 
          payload: { ...auth.driver, isAvailable: newAvailability } 
        });
      }

      // If going offline, clear pending requests
      if (!newAvailability) {
        // Clear all timers
        Object.values(timersRef.current).forEach(timerId => clearInterval(timerId));
        timersRef.current = {};
        setBookingRequests([]);
        setUnreadRequests(0);
        
        // Disconnect socket
        if (socket.current) {
          socket.current.disconnect();
          socket.current = null;
        }
      }
    } catch (err) {
      console.error("Error updating availability:", err);
    }
  }, [API_BASE, auth, isAvailable]);

  // Notification handlers
  const handleNotifClick = (event) => {
    setNotifAnchorEl(event.currentTarget);
    setUnreadRequests(0);
  };
  
  const handleNotifClose = useCallback(() => {
    setNotifAnchorEl(null);
  }, []);

  // Scroll listener for navbar effect
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 50) {
        setNavbarStyle({
          background: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          transition: "all 0.3s ease",
        });
      } else {
        setNavbarStyle({
          background: "transparent",
          backdropFilter: "none",
          transition: "all 0.3s ease",
        });
      }
    };
    
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [location]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timers
      Object.values(timersRef.current).forEach(timerId => clearInterval(timerId));
      
      // Disconnect socket
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  // Handlers
  const handleAvatarClick = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const toggleLogin = () => setIsLoginOpen((prev) => !prev);
  const toggleRegister = () => setIsRegisterOpen((prev) => !prev);
  const toggleSubscription = () => setIsSubscriptionOpen((prev) => !prev);
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  return (
    <>
      {/* Navbar Container */}
      <Box
        component="nav"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 2000,
          ...navbarStyle,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 2, sm: 4, md: 8 },
            py: 1.5,
          }}
        >
          {/* Logo & Desktop Links */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 2, md: 6 } }}>
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold lowercase tracking-wider shadow-md flex space-x-1 sm:space-x-2">
                {Array.from("auto-drive").map((letter, index) => (
                  <span
                    key={index}
                    style={{ color: index % 2 === 0 ? "#cbe557" : "white" }}
                  >
                    {letter}
                  </span>
                ))}
              </h1>
            </div>

            {/* Desktop Nav Links */}
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 4 }}>
              <RouterNavLink
                to="/driverDashboard"
                className={({ isActive }) =>
                  `text-lg font-medium transition-colors duration-300 hover:text-indigo-400 ${
                    isActive ? "text-indigo-400 border-b-2 border-indigo-400" : "text-gray-300"
                  }`
                }
              >
                Dashboard
              </RouterNavLink>
              <RouterNavLink
                to="/Aboutus"
                className={({ isActive }) =>
                  `text-lg font-medium transition-colors duration-300 hover:text-indigo-400 ${
                    isActive ? "text-indigo-400 border-b-2 border-indigo-400" : "text-gray-300"
                  }`
                }
              >
                About Us
              </RouterNavLink>
            </Box>
          </Box>

          {/* Auth Buttons / Avatar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 3 } }}>
            {/* Desktop Auth */}
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
              {auth.driver ? (
                <>
                  {!isSubscribed && (
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={toggleSubscription}
                      sx={{ 
                        px: 3, 
                        py: 1, 
                        textTransform: "none", 
                        borderRadius: 2,
                        fontWeight: 600,
                        background: "linear-gradient(45deg, #FFA000, #FF6D00)",
                        "&:hover": {
                          background: "linear-gradient(45deg, #FF8F00, #FF5722)",
                        }
                      }}
                    >
                      Subscribe
                    </Button>
                  )}
                  
                  {/* Booking Requests Notification */}
                  <Tooltip title="Booking requests">
                    <IconButton
                      onClick={handleNotifClick}
                      disabled={!isAvailable}
                      sx={{ 
                        color: "#E0E7FF",
                        position: "relative",
                        "&:hover": { 
                          background: "rgba(79, 70, 229, 0.2)",
                          transform: "scale(1.05)" 
                        }
                      }}
                    >
                      <Badge 
                        badgeContent={unreadRequests} 
                        color="error"
                        overlap="circular"
                        invisible={unreadRequests === 0 || !isAvailable}
                      >
                        <Notifications />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                  
                  {/* Online/Offline Toggle */}
                  <Tooltip title={isAvailable ? "Go Offline" : "Go Online"} arrow>
                    <IconButton
                      onClick={toggleAvailability}
                      sx={{
                        p: 1.5,
                        background: isAvailable 
                          ? "linear-gradient(45deg, #10B981, #059669)" 
                          : "linear-gradient(45deg, #EF4444, #B91C1C)",
                        color: "white",
                        "&:hover": {
                          transform: "scale(1.05)",
                          boxShadow: "0 0 15px rgba(59, 130, 246, 0.5)"
                        }
                      }}
                    >
                      {isAvailable ? <FlashOn /> : <FlashOff />}
                    </IconButton>
                  </Tooltip>
                  
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    variant="dot"
                    color={isAvailable ? "success" : "error"}
                  >
                    <Avatar
                      src={
                        auth.driver.profileImage
                          ? `${API_BASE}/${auth.driver.profileImage}`
                          : ""
                      }
                      alt={driverName}
                      onClick={handleAvatarClick}
                      sx={{
                        bgcolor: "#4F46E5",
                        cursor: "pointer",
                        border: `2px solid ${isAvailable ? "#10B981" : "#EF4444"}`,
                        width: 42,
                        height: 42,
                        "&:hover": { transform: "scale(1.1)" },
                      }}
                    >
                      {!auth.driver.profileImage && driverInitial}
                    </Avatar>
                  </Badge>
                  
                  {/* Profile Menu */}
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    sx={{ 
                      zIndex: 2500,
                      "& .MuiPaper-root": {
                        background: "rgba(15, 23, 42, 0.95)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                        color: "white",
                      }
                    }}
                  >
                    <MenuItem 
                      onClick={() => {
                        navigate("/driverprofile");
                        handleMenuClose();
                      }} 
                      sx={{ 
                        gap: 1.5,
                        "&:hover": {
                          background: "rgba(79, 70, 229, 0.2)",
                        }
                      }}
                    >
                      <Person fontSize="small" sx={{ color: "#818CF8" }} />
                      <Typography variant="body1">Profile</Typography>
                    </MenuItem>
                    <MenuItem 
                      onClick={() => {
                        auth.logout();
                        handleMenuClose();
                      }} 
                      sx={{ 
                        gap: 1.5,
                        "&:hover": {
                          background: "rgba(239, 68, 68, 0.2)",
                        }
                      }}
                    >
                      <Logout fontSize="small" sx={{ color: "#F87171" }} />
                      <Typography variant="body1">Logout</Typography>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    onClick={toggleLogin}
                    sx={{ 
                      px: 3, 
                      py: 1, 
                      textTransform: "none", 
                      borderRadius: 2,
                      fontWeight: 600,
                      color: "#E0E7FF",
                      borderColor: "#4F46E5",
                      "&:hover": {
                        background: "rgba(79, 70, 229, 0.1)",
                        borderColor: "#818CF8"
                      }
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="contained"
                    onClick={toggleRegister}
                    sx={{ 
                      px: 3, 
                      py: 1, 
                      textTransform: "none", 
                      borderRadius: 2,
                      fontWeight: 600,
                      background: "linear-gradient(45deg, #4F46E5, #7C3AED)",
                      "&:hover": {
                        background: "linear-gradient(45deg, #6366F1, #8B5CF6)",
                        boxShadow: "0 0 15px rgba(99, 102, 241, 0.5)"
                      }
                    }}
                  >
                    Register
                  </Button>
                </>
              )}
            </Box>

            {/* Mobile Menu Toggle */}
            <IconButton
              onClick={toggleMobileMenu}
              sx={{ 
                display: { xs: "flex", md: "none" }, 
                color: "#E0E7FF",
                "&:hover": {
                  background: "rgba(79, 70, 229, 0.2)",
                }
              }}
            >
              {isMobileMenuOpen ? <Close /> : <MenuIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <Box
            onClick={toggleMobileMenu}
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1999,
              display: { xs: 'block', md: 'none' },
            }}
          />
        )}

        {/* Mobile Sidebar */}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100%',
            width: { xs: '85%', sm: '320px' },
            zIndex: 2000,
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 25px rgba(0,0,0,0.3)',
            transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
            display: { xs: 'flex', md: 'none' },
            flexDirection: 'column',
            pt: 8,
            px: 3,
            overflowY: 'auto',
          }}
        >
          <IconButton
            onClick={toggleMobileMenu}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: 'white',
              background: 'rgba(255,255,255,0.1)',
              '&:hover': {
                background: 'rgba(255,255,255,0.2)',
              }
            }}
          >
            <Close />
          </IconButton>

          {/* Sidebar Logo */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 4,
            px: 2,
            py: 1,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.05)'
          }}>
            <h1 className="text-2xl font-extrabold lowercase tracking-wider shadow-md flex">
              {Array.from("auto-drive").map((letter, index) => (
                <span
                  key={index}
                  style={{ color: index % 2 === 0 ? "#cbe557" : "white" }}
                >
                  {letter}
                </span>
              ))}
            </h1>
          </Box>

          {/* Navigation Links */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
            <RouterNavLink
              to="/driverDashboard"
              className={({ isActive }) =>
                `py-3 px-4 rounded-lg transition-all duration-300 flex items-center ${
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg" 
                    : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              <Box component="span" sx={{ flexGrow: 1 }}>Dashboard</Box>
            </RouterNavLink>
            
            <RouterNavLink
              to="/Aboutus"
              className={({ isActive }) =>
                `py-3 px-4 rounded-lg transition-all duration-300 flex items-center ${
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg" 
                    : "text-gray-300 hover:bg-gray-800"
                }`
              }
            >
              <Box component="span" sx={{ flexGrow: 1 }}>About Us</Box>
            </RouterNavLink>
          </Box>

          {/* Booking Requests (Mobile) */}
          {auth.driver && isAvailable && (
            <Box sx={{ 
              p: 2, 
              mb: 3,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Notifications fontSize="small" />
                Booking Requests
              </Typography>
              
              {bookingRequests.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                  No active requests
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                  {bookingRequests.map(request => (
                    <Box 
                      key={request.id}
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        borderRadius: 2,
                        background: 'rgba(30, 41, 59, 0.7)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        position: 'relative'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip 
                          icon={<PassengerIcon fontSize="small" />}
                          label={request.userName || "Passenger"}
                          size="small"
                          sx={{ background: 'rgba(124, 58, 237, 0.2)' }}
                        />
                        <Chip 
                          label={`${request.timeLeft}s`} 
                          size="small"
                          color={request.timeLeft < 10 ? "error" : "primary"}
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      
                      <LinearProgress 
                        variant="determinate" 
                        value={(request.timeLeft / 30) * 100} 
                        sx={{ 
                          height: 4, 
                          borderRadius: 2,
                          mb: 1.5,
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: request.timeLeft < 10 ? '#EF4444' : '#3B82F6'
                          }
                        }} 
                      />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                        <LocationOn color="primary" fontSize="small" />
                        <Typography variant="body2">
                          {request.pickupLocation?.address || "Location not specified"}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                        <AttachMoney sx={{ color: '#FBBF24', fontSize: '1.25rem' }} />
                        <Typography variant="body2">
                          ${request.estimatedPrice ?? "100"}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          fullWidth
                          startIcon={<CheckCircle />}
                          onClick={() => handleBookingAction(request.id, "accept", request.estimatedPrice)}
                          sx={{ 
                            textTransform: "none",
                            background: "linear-gradient(45deg, #10B981, #059669)",
                          }}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          fullWidth
                          startIcon={<Cancel />}
                          onClick={() => handleBookingAction(request.id, "reject")}
                          sx={{ 
                            textTransform: "none",
                            borderColor: "#EF4444",
                            color: "#EF4444",
                            "&:hover": { borderColor: "#B91C1C" }
                          }}
                        >
                          Decline
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* User Section */}
          {auth.driver ? (
            <>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 3, 
                p: 2, 
                borderRadius: 2,
                background: 'rgba(255,255,255,0.05)'
              }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  variant="dot"
                  color={isAvailable ? "success" : "error"}
                >
                  <Avatar
                    src={
                      auth.driver.profileImage
                        ? `${API_BASE}/${auth.driver.profileImage}`
                        : ""
                    }
                    alt={driverName}
                    sx={{
                      bgcolor: "#4F46E5",
                      border: `2px solid ${isAvailable ? "#10B981" : "#EF4444"}`,
                      width: 56,
                      height: 56,
                    }}
                  >
                    {!auth.driver.profileImage && driverInitial}
                  </Avatar>
                </Badge>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {driverName}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      color: isAvailable ? '#10B981' : '#EF4444'
                    }}
                  >
                    {isAvailable ? 'Online' : 'Offline'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />

              {/* Online/Offline Toggle */}
              <Button
                fullWidth
                onClick={toggleAvailability}
                sx={{
                  py: 1.5,
                  mb: 2,
                  textAlign: "center",
                  borderRadius: 2,
                  fontWeight: 600,
                  background: isAvailable 
                    ? "linear-gradient(45deg, #10B981, #059669)" 
                    : "linear-gradient(45deg, #EF4444, #B91C1C)",
                  color: "white",
                  "&:hover": {
                    transform: "scale(1.02)",
                    boxShadow: "0 5px 15px rgba(0,0,0,0.2)"
                  }
                }}
                startIcon={isAvailable ? <FlashOn /> : <FlashOff />}
              >
                {isAvailable ? "Go Offline" : "Go Online"}
              </Button>

              {!isSubscribed && (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={toggleSubscription}
                  sx={{
                    py: 1.5,
                    mb: 2,
                    fontWeight: 600,
                    background: "linear-gradient(45deg, #FFA000, #FF6D00)",
                    "&:hover": {
                      background: "linear-gradient(45deg, #FF8F00, #FF5722)",
                      boxShadow: "0 5px 15px rgba(255,143,0,0.3)"
                    }
                  }}
                >
                  Subscribe Now
                </Button>
              )}
              
              <Button
                fullWidth
                onClick={() => navigate("/driverprofile")}
                sx={{
                  py: 1.5,
                  mb: 1,
                  textAlign: "center",
                  borderRadius: 2,
                  color: "#E0E7FF",
                  background: 'rgba(79, 70, 229, 0.2)',
                  "&:hover": {
                    background: "rgba(79, 70, 229, 0.3)",
                  }
                }}
                startIcon={<Person />}
              >
                My Profile
              </Button>
              
              <Button
                fullWidth
                onClick={() => {
                  auth.logout();
                  toggleMobileMenu();
                }}
                sx={{
                  py: 1.5,
                  mb: 2,
                  textAlign: "center",
                  borderRadius: 2,
                  color: "#E0E7FF",
                  background: 'rgba(239, 68, 68, 0.2)',
                  "&:hover": {
                    background: "rgba(239, 68, 68, 0.3)",
                  }
                }}
                startIcon={<Logout />}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={toggleLogin}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    color: "#E0E7FF",
                    borderColor: "#4F46E5",
                    "&:hover": {
                      background: "rgba(79, 70, 229, 0.1)",
                      borderColor: "#818CF8"
                    }
                  }}
                >
                  Login
                </Button>
                
                <Button
                  variant="contained"
                  fullWidth
                  onClick={toggleRegister}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    background: "linear-gradient(45deg, #4F46E5, #7C3AED)",
                    "&:hover": {
                      background: "linear-gradient(45deg, #6366F1, #8B5CF6)",
                      boxShadow: "0 5px 15px rgba(99, 102, 241, 0.4)"
                    }
                  }}
                >
                  Create Account
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* Booking Request Menu (Desktop) */}
      <Menu
        anchorEl={notifAnchorEl}
        open={Boolean(notifAnchorEl)}
        onClose={handleNotifClose}
        sx={{ 
          mt: 1.5,
          "& .MuiPaper-root": {
            width: 400,
            maxHeight: 500,
            background: "rgba(15, 23, 42, 0.98)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            overflow: 'visible',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 20,
              width: 10,
              height: 10,
              bgcolor: 'rgba(15, 23, 42, 0.98)',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
            }
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notifications fontSize="small" />
            Booking Requests
          </Typography>
        </Box>
        
        {bookingRequests.length === 0 ? (
          <MenuItem disabled sx={{ py: 3 }}>
            <Typography variant="body2" color="text.secondary" textAlign="center" width="100%">
              No active requests
            </Typography>
          </MenuItem>
        ) : (
          <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
               {bookingRequests.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
          No active requests
        </Typography>
      ) : (
        <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
          {bookingRequests.map((request) => (
            <Box key={request.id} sx={{
              p: 2, mb: 2, borderRadius: 2, background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255,255,255,0.05)', position: 'relative'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Chip
                  label={request.userName || "Passenger"}
                  size="small"
                  sx={{ background: 'rgba(124, 58, 237, 0.2)' }}
                />
                <Chip label={`${request.timeLeft}s`} size="small" color={request.timeLeft < 10 ? "error" : "primary"} />
              </Box>

              <LinearProgress
                variant="determinate"
                value={(request.timeLeft / 30) * 100}
                sx={{
                  height: 4, borderRadius: 2, mb: 1.5,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: request.timeLeft < 10 ? '#EF4444' : '#3B82F6',
                  }
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                <LocationOn color="primary" fontSize="small" />
                <Typography variant="body2">{request.pickupLocation?.address || "Location not specified"}</Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                <AttachMoney sx={{ color: '#FBBF24', fontSize: '1.25rem' }} />
                <Typography variant="body2">${request.estimatedPrice ?? "100"}</Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  fullWidth
                  startIcon={<CheckCircle />}
                  onClick={() => handleBookingAction(request.id, "accept", request.estimatedPrice)}
                  sx={{ background: "linear-gradient(45deg, #10B981, #059669)" }}
                >
                  Accept
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  fullWidth
                  startIcon={<Cancel />}
                  onClick={() => handleBookingAction(request.id, "reject")}
                  sx={{ borderColor: "#EF4444", color: "#EF4444", "&:hover": { borderColor: "#B91C1C" } }}
                >
                  Decline
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}
          </Box>
        )}
      </Menu>

      {/* Login Dialog */}
      <Dialog 
        open={isLoginOpen} 
        onClose={toggleLogin} 
        fullWidth 
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "linear-gradient(145deg, #1e293b, #0f172a)",
            overflow: "hidden",
          }
        }}
      >
        <Box sx={{ position: "relative", p: 3 }}>
          <IconButton
            onClick={toggleLogin}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              color: "#94a3b8",
              "&:hover": { color: "white" },
            }}
          >
            <Close />
          </IconButton>
          <DriverLogin onLoginSuccess={toggleLogin} />
        </Box>
      </Dialog>

      {/* Registration Dialog */}
      <Dialog 
        open={isRegisterOpen} 
        onClose={toggleRegister} 
        fullWidth 
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "linear-gradient(145deg, #1e293b, #0f172a)",
            overflow: "hidden",
          }
        }}
      >
        <Box sx={{ position: "relative", p: 3 }}>
          <IconButton
            onClick={toggleRegister}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              color: "#94a3b8",
              "&:hover": { color: "white" },
            }}
          >
            <Close />
          </IconButton>
          <DriverRegistrationForm onRegisterSuccess={toggleRegister} />
        </Box>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog 
        open={isSubscriptionOpen} 
        onClose={toggleSubscription} 
        fullWidth 
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: "linear-gradient(145deg, #1e293b, #0f172a)",
            overflow: "hidden",
            maxHeight: "90vh",
          }
        }}
      >
        <Box sx={{ position: "relative", p: 3 }}>
          <IconButton
            onClick={toggleSubscription}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              color: "#94a3b8",
              "&:hover": { color: "white" },
            }}
          >
            <Close />
          </IconButton>
          <SubscriptionPage />
        </Box>
      </Dialog>
    </>
  );
};

export default DriverNavbar;