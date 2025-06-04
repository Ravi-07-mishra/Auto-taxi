// src/components/Navbar2.jsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../Context/userContext";
import { useLocation, NavLink as RouterNavLink } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../Css/CalendarStyles.css";
import { FaBars, FaTimes } from "react-icons/fa";
import {
  Avatar,
  Dialog,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Snackbar,
  Alert as MuiAlert,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";

import { Logout, Person } from "@mui/icons-material";

// ─── Logging Helper ─────────────────────────────────────────────────
const logError = (message, error) => {
  // Swap with Sentry/LogRocket etc. in production
  console.error(message, error);
};

const Navbar2 = () => {
  // ─── Backend Base URL ─────────────────────────────────────────────
  const API_BASE =
    import.meta.env.VITE_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://api.yourdomain.com"
      : "http://localhost:3000");

  const auth = useAuth();
  const location = useLocation();

  // ─── State ─────────────────────────────────────────────────────────
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [navbarStyle, setNavbarStyle] = useState({ background: "transparent" });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // ─── Handlers ──────────────────────────────────────────────────────
  const toggleCalendar = () => setIsCalendarOpen((prev) => !prev);
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsCalendarOpen(false);
  };
  const handleCloseSnackbar = () => setSnackbarOpen(false);

  // ─── Fetch Completed Bookings ──────────────────────────────────────
  useEffect(() => {
    if (!auth.user?._id) return;
    setLoadingBookings(true);

    (async () => {
      try {
        const response = await fetch(
          `${API_BASE}/user/completedBookings/${auth.user._id}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error(response.statusText);

        const data = await response.json();
        if (Array.isArray(data.bookings)) {
          setCompletedBookings(data.bookings);
        } else {
          setCompletedBookings([]);
        }
      } catch (error) {
        logError("Error fetching completed bookings:", error);
        setErrorMsg("Failed to load previous bookings.");
        setSnackbarOpen(true);
      } finally {
        setLoadingBookings(false);
      }
    })();
  }, [auth.user, API_BASE]);

  // ─── Scroll Listener ───────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setNavbarStyle({
          background:
            "linear-gradient(to bottom right, #262529, #363b3f, #383e42, #141920)",
          opacity: 0.95,
          transition: "background 0.5s ease",
        });
      } else {
        setNavbarStyle({
          background: "transparent",
          transition: "background 0.5s ease",
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ─── JSX ────────────────────────────────────────────────────────────
  return (
    <>
      {/* ─── Navbar ──────────────────────────────────────────────── */}
      <Box
        component="nav"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 20,
          ...navbarStyle,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 3, md: 6 },
            py: 2,
          }}
        >
          {/* ─── Left: Logo & Desktop Links ────────────────────── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Mobile Menu Button (only on xs) */}
            <IconButton
              onClick={toggleMobileMenu}
              sx={{ display: { xs: "flex", md: "none" }, color: "#fff" }}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </IconButton>

            {/* Logo */}
            <Typography
              component="h1"
              sx={{
                typography: { xs: "h6", sm: "h5" },
                fontFamily: "'Concert One', sans-serif",
                fontWeight: 400,
                color: "#fff",
                userSelect: "none",
              }}
            >
              Auto Drive
            </Typography>

            {/* Desktop Links (hidden on xs) */}
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 6 }}>
              <RouterNavLink
                to="/userhome"
                className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                onClick={closeAllMenus}
              >
                Home
              </RouterNavLink>
              <RouterNavLink
                to="/userbookdrive"
                className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                onClick={closeAllMenus}
              >
                Book Drive
              </RouterNavLink>
              <RouterNavLink
                to="/Aboutus"
                className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                onClick={closeAllMenus}
              >
                About Us
              </RouterNavLink>
              {location.pathname === "/userhome" && (
                <Button
                  onClick={toggleCalendar}
                  variant="text"
                  sx={{
                    color: "#fff",
                    py: 0,
                    textTransform: "none",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
                  }}
                >
                  Previous Bookings
                </Button>
              )}
            </Box>
          </Box>

          {/* ─── Right: Avatar / Auth Menu ────────────────────── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Desktop (hidden on xs) */}
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
              <Avatar
                src={
                  auth.user?.profileImage
                    ? `${API_BASE}/${auth.user.profileImage}`
                    : ""
                }
                sx={{
                  bgcolor: "#2563EB",
                  cursor: "pointer",
                  border: "2px solid #fff",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "scale(1.1)" },
                  width: 40,
                  height: 40,
                }}
                alt={auth.user?.name || "User"}
                onClick={handleAvatarClick}
              >
                {!auth.user?.profileImage &&
                  (auth.user?.name?.[0]?.toUpperCase() || "U")}
              </Avatar>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                {auth.user ? (
                  <>
                    <MenuItem onClick={handleMenuClose} sx={{ gap: 1 }}>
                      <Person fontSize="small" />
                      <RouterNavLink
                        to="/userprofile"
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        Profile
                      </RouterNavLink>
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        auth.logout();
                        handleMenuClose();
                      }}
                      sx={{ gap: 1 }}
                    >
                      <Logout fontSize="small" />
                      Logout
                    </MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem onClick={handleMenuClose}>
                      <RouterNavLink to="/userlogin" style={{ textDecoration: "none", color: "inherit" }}>
                        Login
                      </RouterNavLink>
                    </MenuItem>
                    <MenuItem onClick={handleMenuClose}>
                      <RouterNavLink to="/usersignup" style={{ textDecoration: "none", color: "inherit" }}>
                        Signup
                      </RouterNavLink>
                    </MenuItem>
                  </>
                )}
              </Menu>
            </Box>

            {/* Mobile Auth Button (only on xs) */}
            {auth.user ? (
              <Button
                variant="contained"
                color="primary"
                onClick={auth.logout}
                sx={{
                  display: { xs: "flex", md: "none" },
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  backgroundColor: "#2563EB",
                  "&:hover": { backgroundColor: "#1E40AF" },
                }}
              >
                Logout
              </Button>
            ) : (
              <Button
                component="a"
                href="/userlogin"
                variant="contained"
                color="primary"
                sx={{
                  display: { xs: "flex", md: "none" },
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  backgroundColor: "#2563EB",
                  "&:hover": { backgroundColor: "#1E40AF" },
                }}
              >
                Login
              </Button>
            )}
          </Box>
        </Box>

        {/* ─── Mobile Links Panel ────────────────────────────── */}
        {isMobileMenuOpen && (
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              flexDirection: "column",
              bgcolor: "rgba(31,41,55,0.95)",
              px: 3,
              py: 2,
              gap: 2,
            }}
          >
            <RouterNavLink
              to="/userhome"
              className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
              onClick={closeAllMenus}
            >
              Home
            </RouterNavLink>
            <RouterNavLink
              to="/userbookdrive"
              className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
              onClick={closeAllMenus}
            >
              Book Drive
            </RouterNavLink>
            <RouterNavLink
              to="/Aboutus"
              className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
              onClick={closeAllMenus}
            >
              About Us
            </RouterNavLink>

            {location.pathname === "/userhome" && (
              <Button
                onClick={() => {
                  toggleCalendar();
                  setIsMobileMenuOpen(false);
                }}
                variant="text"
                sx={{
                  color: "#fff",
                  textAlign: "left",
                  py: 0,
                  textTransform: "none",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
                }}
              >
                Previous Bookings
              </Button>
            )}

            {!auth.user && (
              <Button
                component="a"
                href="/usersignup"
                variant="contained"
                color="inherit"
                fullWidth
                sx={{
                  backgroundColor: "#374151",
                  "&:hover": { backgroundColor: "#4B5563" },
                  color: "#fff",
                  py: 1,
                  borderRadius: 2,
                }}
                onClick={closeAllMenus}
              >
                Signup
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* ─── Calendar Dialog ───────────────────────────────────────── */}
      <Dialog
        open={isCalendarOpen}
        onClose={toggleCalendar}
        aria-labelledby="previous-bookings-calendar"
        fullWidth
        maxWidth="sm"
      >
        <Box sx={{ position: "relative", p: 2, bgcolor: "#1f2937", color: "#fff" }}>
          <IconButton
            onClick={toggleCalendar}
            aria-label="Close calendar"
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "#fff",
              backgroundColor: "rgba(0,0,0,0.4)",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.6)" },
            }}
          >
            <Typography>×</Typography>
          </IconButton>

          {loadingBookings ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress color="inherit" />
            </Box>
          ) : (
            <Calendar
              onClickDay={(date) => {
                const booking = completedBookings.find(
                  (b) =>
                    new Date(b.createdAt).toDateString() ===
                    date.toDateString()
                );
                if (booking) {
                  alert(
                    `Price: ${booking.price}\nPickup: ${booking.pickupLocation.lat}, ${booking.pickupLocation.lng}\nDestination: ${booking.destinationLocation.lat}, ${booking.destinationLocation.lng}`
                  );
                }
              }}
              tileClassName={({ date }) =>
                completedBookings.some(
                  (b) =>
                    new Date(b.createdAt).toDateString() ===
                    date.toDateString()
                )
                  ? "react-calendar__tile--has-booking"
                  : ""
              }
            />
          )}
        </Box>
      </Dialog>

      {/* ─── Snackbar for Errors ────────────────────────────────────── */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <MuiAlert
          onClose={handleCloseSnackbar}
          severity="error"
          sx={{ width: "100%" }}
        >
          {errorMsg}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default Navbar2;
