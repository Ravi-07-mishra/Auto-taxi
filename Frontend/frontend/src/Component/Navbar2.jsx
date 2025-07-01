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
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Logout, Person, Home, DirectionsCar, Info } from "@mui/icons-material";

const logError = (message, error) => {
  console.error(message, error);
};

const Navbar2 = () => {
  const API_BASE =
    import.meta.env.VITE_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://api.yourdomain.com"
      : "http://localhost:3000");

  const auth = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [navbarStyle, setNavbarStyle] = useState({ 
    background: "transparent",
    backdropFilter: "blur(0px)",
    borderBottom: "1px solid transparent"
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const toggleCalendar = () => setIsCalendarOpen((prev) => !prev);
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsCalendarOpen(false);
  };
  const handleCloseSnackbar = () => setSnackbarOpen(false);

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

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setNavbarStyle({
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(99, 102, 241, 0.15)",
          transition: "all 0.3s ease",
        });
      } else {
        setNavbarStyle({
          background: "transparent",
          backdropFilter: "blur(0px)",
          borderBottom: "1px solid transparent",
          transition: "all 0.3s ease",
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { path: "/userhome", label: "Home", icon: <Home /> },
    { path: "/userbookdrive", label: "Book Drive", icon: <DirectionsCar /> },
    { path: "/Aboutus", label: "About Us", icon: <Info /> },
  ];

  return (
    <>
      {/* Navbar */}
      <Box
        component="nav"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 1100,
          ...navbarStyle,
          boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 2, sm: 3, md: 4 },
            py: 1.5,
            maxWidth: 1600,
            mx: "auto",
          }}
        >
          {/* Left: Logo & Desktop Links */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 6 } }}>
            {/* Mobile Menu Button */}
            <IconButton
              onClick={toggleMobileMenu}
              sx={{ 
                display: { xs: "flex", md: "none" }, 
                color: "#fff",
                mr: 1
              }}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </IconButton>

            {/* Logo */}
            <Box 
              component={RouterNavLink} 
              to="/userhome"
              sx={{ 
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 1,
                "&:hover": { 
                  transform: "scale(1.02)",
                  transition: "transform 0.2s"
                }
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  letterSpacing: "-0.5px",
                  background: "linear-gradient(to right, #cbe557, #93c5fd)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                AUTO DRIVE
              </Typography>
            </Box>

            {/* Desktop Links */}
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 4 }}>
              {navLinks.map((link) => (
                <RouterNavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) => 
                    `navbar-link ${isActive ? "active" : ""}`
                  }
                  onClick={closeAllMenus}
                  style={{ textDecoration: "none" }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color: location.pathname === link.path 
                        ? "#cbe557" 
                        : "rgba(255,255,255,0.8)",
                      transition: "color 0.2s",
                      "&:hover": {
                        color: "#cbe557",
                      },
                      position: "relative",
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        bottom: -4,
                        left: 0,
                        width: location.pathname === link.path ? "100%" : "0",
                        height: "2px",
                        background: "#cbe557",
                        transition: "width 0.3s",
                      },
                      "&:hover::after": {
                        width: "100%",
                      }
                    }}
                  >
                    {link.label}
                  </Typography>
                </RouterNavLink>
              ))}
              
              {location.pathname === "/userhome" && (
                <Button
                  onClick={toggleCalendar}
                  variant="text"
                  sx={{
                    color: "rgba(255,255,255,0.8)",
                    py: 0,
                    textTransform: "none",
                    fontWeight: 600,
                    "&:hover": { 
                      color: "#cbe557",
                      backgroundColor: "transparent",
                    },
                    position: "relative",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      bottom: -4,
                      left: 0,
                      width: isCalendarOpen ? "100%" : "0",
                      height: "2px",
                      background: "#cbe557",
                      transition: "width 0.3s",
                    },
                    "&:hover::after": {
                      width: "100%",
                    }
                  }}
                >
                  Previous Bookings
                </Button>
              )}
            </Box>
          </Box>

          {/* Right: Avatar / Auth Menu */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Desktop Avatar */}
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center" }}>
              <Avatar
                src={
                  auth.user?.profileImage
                    ? `${API_BASE}/${auth.user.profileImage}`
                    : ""
                }
                sx={{
                  bgcolor: "#6366f1",
                  cursor: "pointer",
                  border: "2px solid rgba(255,255,255,0.3)",
                  transition: "all 0.2s",
                  "&:hover": { 
                    transform: "scale(1.1)",
                    borderColor: "#cbe557",
                    boxShadow: "0 0 10px rgba(203, 229, 87, 0.5)"
                  },
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
                sx={{
                  "& .MuiPaper-root": {
                    background: "rgba(15, 23, 42, 0.95)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    borderRadius: "12px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                    minWidth: 200,
                    mt: 1,
                  },
                  "& .MuiList-root": {
                    p: 0.5,
                  }
                }}
              >
                {auth.user
                  ? [
                      <MenuItem 
                        key="profile" 
                        onClick={handleMenuClose} 
                        sx={{ 
                          gap: 1.5,
                          borderRadius: "8px",
                          "&:hover": { bgcolor: "rgba(99, 102, 241, 0.2)" }
                        }}
                      >
                        <Person fontSize="small" sx={{ color: "#93c5fd" }} />
                        <RouterNavLink
                          to="/userprofile"
                          style={{ 
                            textDecoration: "none", 
                            color: "#e2e8f0",
                            fontWeight: 500,
                            flex: 1
                          }}
                        >
                          Profile
                        </RouterNavLink>
                      </MenuItem>,
                      <Divider key="divider" sx={{ my: 0.5, bgcolor: "rgba(255,255,255,0.08)" }} />,
                      <MenuItem
                        key="logout"
                        onClick={() => {
                          auth.logout();
                          handleMenuClose();
                        }}
                        sx={{ 
                          gap: 1.5,
                          borderRadius: "8px",
                          "&:hover": { bgcolor: "rgba(239, 68, 68, 0.2)" }
                        }}
                      >
                        <Logout fontSize="small" sx={{ color: "#f87171" }} />
                        <Typography sx={{ color: "#f87171", fontWeight: 500 }}>
                          Logout
                        </Typography>
                      </MenuItem>,
                    ]
                  : [
                      <MenuItem 
                        key="login" 
                        onClick={handleMenuClose} 
                        sx={{ 
                          gap: 1.5,
                          borderRadius: "8px",
                          "&:hover": { bgcolor: "rgba(99, 102, 241, 0.2)" }
                        }}
                      >
                        <Person fontSize="small" sx={{ color: "#93c5fd" }} />
                        <RouterNavLink
                          to="/userlogin"
                          style={{ 
                            textDecoration: "none", 
                            color: "#e2e8f0",
                            fontWeight: 500,
                            flex: 1
                          }}
                        >
                          Login
                        </RouterNavLink>
                      </MenuItem>,
                      <Divider key="divider" sx={{ my: 0.5, bgcolor: "rgba(255,255,255,0.08)" }} />,
                      <MenuItem 
                        key="signup" 
                        onClick={handleMenuClose} 
                        sx={{ 
                          gap: 1.5,
                          borderRadius: "8px",
                          "&:hover": { bgcolor: "rgba(16, 185, 129, 0.2)" }
                        }}
                      >
                        <Logout fontSize="small" sx={{ color: "#34d399" }} />
                        <RouterNavLink
                          to="/send-otp"
                          style={{ 
                            textDecoration: "none", 
                            color: "#34d399",
                            fontWeight: 500,
                            flex: 1
                          }}
                        >
                          Signup
                        </RouterNavLink>
                      </MenuItem>,
                    ]}
              </Menu>
            </Box>

            {/* Mobile Auth Button */}
            {isMobile && (
              <IconButton
                onClick={toggleMobileMenu}
                sx={{ color: "#fff" }}
              >
                <Avatar
                  src={
                    auth.user?.profileImage
                      ? `${API_BASE}/${auth.user.profileImage}`
                      : ""
                  }
                  sx={{
                    bgcolor: "#6366f1",
                    width: 36,
                    height: 36,
                    border: "2px solid rgba(255,255,255,0.3)",
                  }}
                >
                  {!auth.user?.profileImage &&
                    (auth.user?.name?.[0]?.toUpperCase() || "U")}
                </Avatar>
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Mobile Drawer */}
        <Drawer
          anchor="left"
          open={isMobileMenuOpen}
          onClose={toggleMobileMenu}
          sx={{
            "& .MuiDrawer-paper": {
              width: 280,
              bgcolor: "rgba(15, 23, 42, 0.95)",
              backdropFilter: "blur(12px)",
              borderRight: "1px solid rgba(99, 102, 241, 0.2)",
              boxShadow: "0 0 30px rgba(0,0,0,0.4)",
            },
          }}
        >
          <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Avatar
              src={
                auth.user?.profileImage
                  ? `${API_BASE}/${auth.user.profileImage}`
                  : ""
              }
              sx={{
                bgcolor: "#6366f1",
                width: 48,
                height: 48,
                border: "2px solid rgba(203, 229, 87, 0.5)",
              }}
            >
              {!auth.user?.profileImage &&
                (auth.user?.name?.[0]?.toUpperCase() || "U")}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#fff" }}>
                {auth.user?.name || "Guest"}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                {auth.user?.email || "Welcome!"}
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)", my: 1 }} />
          
          <List>
            {navLinks.map((link) => (
              <ListItem 
                key={link.path} 
                disablePadding
                onClick={toggleMobileMenu}
              >
                <ListItemButton
                  component={RouterNavLink}
                  to={link.path}
                  selected={location.pathname === link.path}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    "&.Mui-selected": {
                      bgcolor: "rgba(99, 102, 241, 0.2)",
                      "& .MuiListItemIcon-root, & .MuiListItemText-primary": {
                        color: "#cbe557",
                      },
                    },
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.05)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: "rgba(255,255,255,0.7)", minWidth: 36 }}>
                    {link.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={link.label} 
                    primaryTypographyProps={{ 
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.85)",
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            ))}
            
            {location.pathname === "/userhome" && (
              <ListItem disablePadding onClick={() => {
                toggleCalendar();
                toggleMobileMenu();
              }}>
                <ListItemButton
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.05)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: "rgba(255,255,255,0.7)", minWidth: 36 }}>
                    <DirectionsCar />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Previous Bookings" 
                    primaryTypographyProps={{ 
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.85)",
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            )}
          </List>
          
          <Divider sx={{ bgcolor: "rgba(255,255,255,0.1)", my: 1 }} />
          
          <List>
            {auth.user ? (
              <>
                <ListItem disablePadding onClick={toggleMobileMenu}>
                  <ListItemButton
                    component={RouterNavLink}
                    to="/userprofile"
                    sx={{
                      borderRadius: 1,
                      mx: 1,
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.05)",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: "rgba(255,255,255,0.7)", minWidth: 36 }}>
                      <Person />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Profile" 
                      primaryTypographyProps={{ 
                        fontWeight: 500,
                        color: "rgba(255,255,255,0.85)",
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      auth.logout();
                      toggleMobileMenu();
                    }}
                    sx={{
                      borderRadius: 1,
                      mx: 1,
                      "&:hover": {
                        bgcolor: "rgba(239, 68, 68, 0.1)",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: "#f87171", minWidth: 36 }}>
                      <Logout />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Logout" 
                      primaryTypographyProps={{ 
                        fontWeight: 500,
                        color: "#f87171",
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
              </>
            ) : (
              <>
                <ListItem disablePadding onClick={toggleMobileMenu}>
                  <ListItemButton
                    component={RouterNavLink}
                    to="/userlogin"
                    sx={{
                      borderRadius: 1,
                      mx: 1,
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.05)",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: "rgba(255,255,255,0.7)", minWidth: 36 }}>
                      <Person />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Login" 
                      primaryTypographyProps={{ 
                        fontWeight: 500,
                        color: "rgba(255,255,255,0.85)",
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding onClick={toggleMobileMenu}>
                  <ListItemButton
                    component={RouterNavLink}
                    to="/send-otp"
                    sx={{
                      borderRadius: 1,
                      mx: 1,
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.05)",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: "#34d399", minWidth: 36 }}>
                      <Logout />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Signup" 
                      primaryTypographyProps={{ 
                        fontWeight: 500,
                        color: "#34d399",
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
              </>
            )}
          </List>
        </Drawer>
      </Box>

      {/* Calendar Dialog */}
      <Dialog
        open={isCalendarOpen}
        onClose={toggleCalendar}
        aria-labelledby="previous-bookings-calendar"
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            background: "linear-gradient(to bottom, #1e293b, #0f172a)",
            color: "#fff",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          }
        }}
      >
        <Box sx={{ p: 3, position: "relative" }}>
          <IconButton
            onClick={toggleCalendar}
            aria-label="Close calendar"
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              color: "#94a3b8",
              "&:hover": { 
                color: "#cbe557",
                bgcolor: "rgba(255,255,255,0.05)",
              },
            }}
          >
            <FaTimes size={18} />
          </IconButton>

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, textAlign: "center" }}>
            Your Previous Bookings
          </Typography>

          {loadingBookings ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 6 }}>
              <CircularProgress size={40} sx={{ color: "#6366f1" }} />
            </Box>
          ) : (
            <Box>
              <Calendar
                onClickDay={(date) => {
                  const booking = completedBookings.find(
                    (b) =>
                      new Date(b.createdAt).toDateString() ===
                      date.toDateString()
                  );
                  if (booking) {
                    alert(
                      `Date: ${date.toLocaleDateString()}\nPrice: $${booking.price.toFixed(2)}\nStatus: ${booking.status}`
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
              {completedBookings.length === 0 && !loadingBookings && (
                <Typography variant="body1" sx={{ 
                  textAlign: "center", 
                  mt: 3,
                  color: "rgba(255,255,255,0.6)",
                  fontStyle: "italic"
                }}>
                  No completed bookings found
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Dialog>

      {/* Snackbar for Errors */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ zIndex: 1400 }}
      >
        <MuiAlert
          onClose={handleCloseSnackbar}
          severity="error"
          sx={{ 
            width: "100%",
            bgcolor: "#1e293b",
            color: "#fff",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            "& .MuiAlert-icon": {
              color: "#f87171"
            }
          }}
        >
          {errorMsg}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default Navbar2;