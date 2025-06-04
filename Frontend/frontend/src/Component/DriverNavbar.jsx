// src/components/DriverNavbar.jsx

import React, { useEffect, useState, useCallback } from "react";
import {
  Avatar,
  Button,
  Dialog,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Alert as MuiAlert,
  Box,
  Typography,
} from "@mui/material";
import { AccountCircle, Logout, Person } from "@mui/icons-material";
import { useLocation, useNavigate, NavLink as RouterNavLink } from "react-router-dom";
import { useDriverAuth } from "../Context/driverContext";
import { useSubscription } from "../Context/SubscriptionContext";
import DriverLogin from "../pages/Driverlogin";
import DriverRegistrationForm from "../pages/Register";
import SubscriptionPage from "../pages/SubscriptionPage";

// ─── Logging Helper ─────────────────────────────────────────────────
const logError = (message, error) => {
  // Replace with Sentry/LogRocket/etc. in production
  console.error(message, error);
};

const DriverNavbar = () => {
  // ─── Backend Base URL ─────────────────────────────────────────────
  const API_BASE =
    import.meta.env.VITE_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://api.yourdomain.com"
      : "http://localhost:3000");

  const auth = useDriverAuth();
  const { subscription } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();

  // ─── State ─────────────────────────────────────────────────────────
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [navbarStyle, setNavbarStyle] = useState({ background: "transparent" });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ─── Derived Values ────────────────────────────────────────────────
  const driverName = auth.driver?.name || "Driver";
  const driverInitial = driverName.charAt(0).toUpperCase();

  const isSubscribed =
    subscription.isSubscribed &&
    new Date(subscription.expiryDate) > new Date();

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const toggleLogin = () => setIsLoginOpen((prev) => !prev);
  const toggleRegister = () => setIsRegisterOpen((prev) => !prev);
  const toggleSubscription = () => setIsSubscriptionOpen((prev) => !prev);
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

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
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          ...navbarStyle,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 2, md: 8 },
            py: 2,
          }}
        >
          {/* ─── Left: Logo & Desktop Links ────────────────────── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Logo */}
            <Typography
              component="h1"
              sx={{
                typography: { xs: "h6", md: "h5" },
                fontWeight: "bold",
                letterSpacing: 1.5,
                display: "flex",
                alignItems: "center",
                userSelect: "none",
              }}
            >
              {["a", "u", "t", "o", " ", "d", "r", "i", "v", "e"].map(
                (letter, idx) => (
                  <Box
                    key={idx}
                    component="span"
                    sx={{ color: idx % 2 === 0 ? "#cbe557" : "#fff" }}
                  >
                    {letter}
                  </Box>
                )
              )}
            </Typography>

            {/* Desktop Links (hidden on mobile) */}
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 6 }}>
              <RouterNavLink
                to="/driverDashboard"
                className={({ isActive }) =>
                  `navbar-link ${isActive ? "text-blue-400 underline" : "text-white"}`
                }
              >
                Driver Dashboard
              </RouterNavLink>
              <RouterNavLink
                to="/driverpage"
                className={({ isActive }) =>
                  `navbar-link ${isActive ? "text-blue-400 underline" : "text-white"}`
                }
              >
                Home
              </RouterNavLink>
              <RouterNavLink
                to="/Aboutus"
                className={({ isActive }) =>
                  `navbar-link ${isActive ? "text-blue-400 underline" : "text-white"}`
                }
              >
                About Us
              </RouterNavLink>
            </Box>
          </Box>

          {/* ─── Right: Auth Buttons / Avatar ────────────────────── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
            {/* Desktop: hidden on mobile */}
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
              {auth.driver ? (
                <>
                  {!isSubscribed && (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={toggleSubscription}
                      sx={{
                        px: 4,
                        py: 1,
                        borderRadius: 4,
                        textTransform: "none",
                        boxShadow: 2,
                        "&:hover": { backgroundColor: "success.dark" },
                      }}
                    >
                      Subscribe
                    </Button>
                  )}

                  <Avatar
                    src={
                      auth.driver.profileImage
                        ? `${API_BASE}/${auth.driver.profileImage}`
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
                    alt={driverName}
                    onClick={handleAvatarClick}
                  >
                    {!auth.driver.profileImage && driverInitial}
                  </Avatar>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                  >
                    <MenuItem onClick={handleMenuClose} sx={{ gap: 1 }}>
                      <Person fontSize="small" />
                      <RouterNavLink to="/driverprofile" style={{ textDecoration: "none", color: "inherit" }}>
                        Profile
                      </RouterNavLink>
                    </MenuItem>
                    <MenuItem onClick={() => { auth.logout(); handleMenuClose(); }} sx={{ gap: 1 }}>
                      <Logout fontSize="small" />
                      Logout
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={toggleLogin}
                    sx={{
                      px: 4,
                      py: 1,
                      borderRadius: 4,
                      textTransform: "none",
                      boxShadow: 2,
                      backgroundColor: "#2563EB",
                      "&:hover": { backgroundColor: "#1E40AF" },
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={toggleRegister}
                    sx={{
                      px: 4,
                      py: 1,
                      borderRadius: 4,
                      textTransform: "none",
                      borderColor: "#9CA3AF",
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
                    }}
                  >
                    Register
                  </Button>
                </>
              )}
            </Box>

            {/* Mobile Hamburger (visible only on xs/md) */}
            <IconButton
              edge="end"
              aria-label="toggle mobile menu"
              onClick={toggleMobileMenu}
              sx={{ display: { xs: "flex", md: "none" }, color: "#fff" }}
            >
              {isMobileMenuOpen ? <Typography>✕</Typography> : <Typography>☰</Typography>}
            </IconButton>
          </Box>
        </Box>

        {/* ─── Mobile Links (only when open) ────────────────────── */}
        {isMobileMenuOpen && (
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              flexDirection: "column",
              bgcolor: "#1f1f1f",
              px: 3,
              py: 2,
              gap: 2,
            }}
          >
            <RouterNavLink
              to="/driverDashboard"
              className={({ isActive }) => `navbar-link ${isActive ? "text-blue-400 underline" : "text-white"}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Driver Dashboard
            </RouterNavLink>
            <RouterNavLink
              to="/driverpage"
              className={({ isActive }) => `navbar-link ${isActive ? "text-blue-400 underline" : "text-white"}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </RouterNavLink>
            <RouterNavLink
              to="/Aboutus"
              className={({ isActive }) => `navbar-link ${isActive ? "text-blue-400 underline" : "text-white"}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About Us
            </RouterNavLink>

            {auth.driver ? (
              <>
                {!isSubscribed && (
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    onClick={() => {
                      toggleSubscription();
                      setIsMobileMenuOpen(false);
                    }}
                    sx={{
                      mt: 1,
                      px: 3,
                      py: 1,
                      borderRadius: 4,
                      textTransform: "none",
                    }}
                  >
                    Subscribe
                  </Button>
                )}
                <Button
                  fullWidth
                  onClick={() => {
                    navigate("/driverprofile");
                    setIsMobileMenuOpen(false);
                  }}
                  sx={{
                    color: "#fff",
                    textAlign: "left",
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
                    mt: 1,
                  }}
                >
                  Profile
                </Button>
                <Button
                  fullWidth
                  onClick={() => {
                    auth.logout();
                    setIsMobileMenuOpen(false);
                  }}
                  sx={{
                    color: "#fff",
                    textAlign: "left",
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
                    mt: 1,
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => {
                    toggleLogin();
                    setIsMobileMenuOpen(false);
                  }}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: 4,
                    textTransform: "none",
                    boxShadow: 2,
                    backgroundColor: "#2563EB",
                    "&:hover": { backgroundColor: "#1E40AF" },
                    mt: 1,
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  fullWidth
                  onClick={() => {
                    toggleRegister();
                    setIsMobileMenuOpen(false);
                  }}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: 4,
                    textTransform: "none",
                    borderColor: "#9CA3AF",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
                    mt: 1,
                  }}
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        )}
      </Box>

      {/* ─── Login Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={isLoginOpen}
        onClose={toggleLogin}
        aria-labelledby="driver-login-dialog"
        fullWidth
        maxWidth="xs"
      >
        <Box sx={{ position: "relative", p: 2 }}>
          <IconButton
            onClick={toggleLogin}
            aria-label="Close login modal"
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "#fff",
              backgroundColor: "rgba(0,0,0,0.4)",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.6)" },
            }}
          >
            <Typography>✕</Typography>
          </IconButton>
          <DriverLogin />
        </Box>
      </Dialog>

      {/* ─── Registration Dialog ────────────────────────────────── */}
      <Dialog
        open={isRegisterOpen}
        onClose={toggleRegister}
        aria-labelledby="driver-register-dialog"
        fullWidth
        maxWidth="xs"
      >
        <Box sx={{ position: "relative", p: 2 }}>
          <IconButton
            onClick={toggleRegister}
            aria-label="Close registration modal"
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "#fff",
              backgroundColor: "rgba(0,0,0,0.4)",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.6)" },
            }}
          >
            <Typography>✕</Typography>
          </IconButton>
          <DriverRegistrationForm />
        </Box>
      </Dialog>

      {/* ─── Subscription Dialog ───────────────────────────────── */}
      <Dialog
        open={isSubscriptionOpen}
        onClose={toggleSubscription}
        aria-labelledby="subscription-dialog"
        fullWidth
        maxWidth="lg"
      >
        <Box sx={{ position: "relative", p: 2 }}>
          <IconButton
            onClick={toggleSubscription}
            aria-label="Close subscription modal"
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "#fff",
              backgroundColor: "rgba(0,0,0,0.4)",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.6)" },
            }}
          >
            <Typography>✕</Typography>
          </IconButton>
          <SubscriptionPage />
        </Box>
      </Dialog>
    </>
  );
};

export default DriverNavbar;
