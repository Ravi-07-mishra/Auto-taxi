import React, { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Dialog,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Typography,
} from "@mui/material";
import { Close, Logout, Person } from "@mui/icons-material";
import { useLocation, useNavigate, NavLink as RouterNavLink } from "react-router-dom";
import { useDriverAuth } from "../Context/driverContext";
import { useSubscription } from "../Context/SubscriptionContext";
import DriverLogin from "../pages/Driverlogin";
import DriverRegistrationForm from "../pages/Register";
import SubscriptionPage from "../pages/SubscriptionPage";

// ─── Logging Helper ─────────────────────────────────────────────────
const logError = (message, error) => {
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

  // ─── Derived Data ─────────────────────────────────────────────────
  const driverName = auth.driver?.name || "Driver";
  const driverInitial = driverName.charAt(0).toUpperCase();
  const isSubscribed =
    subscription.isSubscribed && new Date(subscription.expiryDate) > new Date();

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleAvatarClick = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const toggleLogin = () => setIsLoginOpen((prev) => !prev);
  const toggleRegister = () => setIsRegisterOpen((prev) => !prev);
  const toggleSubscription = () => setIsSubscriptionOpen((prev) => !prev);
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  // ─── Scroll Listener ───────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 50) {
        setNavbarStyle({
          background:
            "linear-gradient(to bottom right, #262529, #363e3f, #383e42, #141920)",
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
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────
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
          {/* Logo & Desktop Links */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold lowercase tracking-wider shadow-md flex space-x-1 sm:space-x-2">
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

            {/* Desktop Nav Links (hidden on mobile) */}
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
                to="/Aboutus"
                className={({ isActive }) =>
                  `navbar-link ${isActive ? "text-blue-400 underline" : "text-white"}`
                }
              >
                About Us
              </RouterNavLink>
            </Box>
          </Box>

          {/* Auth Buttons / Avatar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
            {/* Desktop Auth (hidden on mobile) */}
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
              {auth.driver ? (
                <>
                  {!isSubscribed && (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={toggleSubscription}
                      sx={{ px: 4, py: 1, textTransform: "none", borderRadius: 4 }}
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
                    alt={driverName}
                    onClick={handleAvatarClick}
                    sx={{
                      bgcolor: "#2563EB",
                      cursor: "pointer",
                      border: "2px solid #fff",
                      width: 40,
                      height: 40,
                      "&:hover": { transform: "scale(1.1)" },
                    }}
                  >
                    {!auth.driver.profileImage && driverInitial}
                  </Avatar>
                  <Menu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={handleMenuClose}
  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
  transformOrigin={{ vertical: "top", horizontal: "right" }}
  sx={{ zIndex: 2000 }}
>
  {auth.driver
    ? [
        <MenuItem key="profile" onClick={handleMenuClose} sx={{ gap: 1 }}>
          <Person fontSize="small" />
          <RouterNavLink
            to="/driverprofile"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            Profile
          </RouterNavLink>
        </MenuItem>,
        <MenuItem
          key="logout"
          onClick={() => {
            auth.logout();
            handleMenuClose();
          }}
          sx={{ gap: 1 }}
        >
          <Logout fontSize="small" />
          Logout
        </MenuItem>,
      ]
    : []}
</Menu>

                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    onClick={toggleLogin}
                    sx={{ px: 4, py: 1, textTransform: "none", backgroundColor: "#2563EB", borderRadius: 4 }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={toggleRegister}
                    sx={{ px: 4, py: 1, textTransform: "none", borderRadius: 4, borderColor: "#9CA3AF" }}
                  >
                    Register
                  </Button>
                </>
              )}
            </Box>

            {/* Mobile Menu Toggle */}
            <IconButton
              onClick={toggleMobileMenu}
              sx={{ display: { xs: "flex", md: "none" }, color: "#fff" }}
            >
              {isMobileMenuOpen ? <Close /> : <Typography>☰</Typography>}
            </IconButton>
          </Box>
        </Box>

        {/* Mobile Links Panel */}
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
              className={({ isActive }) =>
                `navbar-link ${isActive ? "text-blue-400 underline" : "text-white"}`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Driver Dashboard
            </RouterNavLink>

            {auth.driver ? (
              <>
                {!isSubscribed && (
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => {
                      toggleSubscription();
                      setIsMobileMenuOpen(false);
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
                  sx={{ textAlign: "left", py: 1, borderRadius: 2 }}
                >
                  Profile
                </Button>
                <Button
                  fullWidth
                  onClick={() => {
                    auth.logout();
                    setIsMobileMenuOpen(false);
                  }}
                  sx={{ textAlign: "left", py: 1, borderRadius: 2 }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    toggleLogin();
                    setIsMobileMenuOpen(false);
                  }}
                  sx={{ py: 1, textTransform: "none", borderRadius: 4, backgroundColor: "#2563EB" }}
                >
                  Login
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    toggleRegister();
                    setIsMobileMenuOpen(false);
                  }}
                  sx={{ py: 1, borderRadius: 4 }}
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        )}
      </Box>

      {/* Login Dialog */}
      <Dialog open={isLoginOpen} onClose={toggleLogin} fullWidth maxWidth="xs">
        <Box sx={{ position: "relative", p: 2 }}>
          <IconButton
            onClick={toggleLogin}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "#fff",
              backgroundColor: "rgba(0,0,0,0.4)",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.6)" },
            }}
          >
            <Close />
          </IconButton>
          <DriverLogin />
        </Box>
      </Dialog>

      {/* Registration Dialog */}
      <Dialog open={isRegisterOpen} onClose={toggleRegister} fullWidth maxWidth="xs">
        <Box sx={{ position: "relative", p: 2 }}>
          <IconButton
            onClick={toggleRegister}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "#fff",
              backgroundColor: "rgba(0,0,0,0.4)",
              zIndex: 10,  // ensure it's on top of the form
              "&:hover": { backgroundColor: "rgba(0,0,0,0.6)" },
            }}
          >
            <Close />
          </IconButton>
          <DriverRegistrationForm />
        </Box>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={isSubscriptionOpen} onClose={toggleSubscription} fullWidth maxWidth="lg">
        <Box sx={{ position: "relative", p: 2 }}>
          <IconButton
            onClick={toggleSubscription}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "#fff",
              backgroundColor: "rgba(0,0,0,0.4)",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.6)" },
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
