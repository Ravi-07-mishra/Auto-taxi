import React, { useEffect, useState } from "react";
import { useAuth } from "../Context/userContext";
import { useLocation } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../Css/CalendarStyles.css";
import { FaBars, FaTimes } from "react-icons/fa";
import { Avatar, Menu, MenuItem } from "@mui/material";
import { Logout, Person } from "@mui/icons-material";

const NavLink = ({ href, text, currentPath, onClick }) => {
  const isActive = currentPath === href;
  return (
    <a
      href={href}
      className={`navbar-link ${isActive ? "active" : ""}`}
      onClick={onClick}
    >
      {text}
    </a>
  );
};

const Navbar2 = () => {
  // ─── Backend Base URL ───────────────────────────────────────────
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const auth = useAuth();
  const location = useLocation();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [navbarStyle, setNavbarStyle] = useState({ background: "transparent" });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const toggleCalendar = () => setIsCalendarOpen((prev) => !prev);
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsCalendarOpen(false);
  };

  useEffect(() => {
    if (!auth.user?._id) return;
    (async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/user/completedBookings/${auth.user._id}`
        );
        const data = await response.json();
        if (Array.isArray(data.bookings)) {
          setCompletedBookings(data.bookings);
        } else {
          setCompletedBookings([]);
        }
      } catch (error) {
        console.error("Error fetching completed bookings:", error);
        setCompletedBookings([]);
      }
    })();
  }, [auth.user]);

  useEffect(() => {
    const handleScroll = () => {
      setNavbarStyle(
        window.scrollY > 50
          ? {
              background:
                "linear-gradient(to bottom right, #262529, #363b3f, #383e42, #141920)",
              opacity: 0.95,
              transition: "background 0.5s ease",
            }
          : { background: "transparent", transition: "background 0.5s ease" }
      );
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav className="fixed w-full z-20 top-0 left-0" style={navbarStyle}>
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left side: Logo and navigation buttons */}
          <div className="flex items-center gap-10">
            {/* Mobile Menu Button */}
            <button className="md:hidden text-white" onClick={toggleMobileMenu}>
              {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>

            {/* Logo */}
            <h1
              className="text-2xl sm:text-3xl text-white"
              style={{ fontFamily: "'Concert One', sans-serif", fontWeight: 400 }}
            >
              Auto Drive
            </h1>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <NavLink
                href="/userhome"
                text="Home"
                currentPath={location.pathname}
                onClick={closeAllMenus}
              />
              <NavLink
                href="/userbookdrive"
                text="Book Drive"
                currentPath={location.pathname}
                onClick={closeAllMenus}
              />
              <NavLink
                href="/Aboutus"
                text="About us"
                currentPath={location.pathname}
                onClick={closeAllMenus}
              />
              {location.pathname === "/userhome" && (
                <button
                  onClick={toggleCalendar}
                  className="navbar-link py-2 px-4 rounded-lg hover:text-white"
                >
                  Previous Bookings
                </button>
              )}
            </div>
          </div>

          {/* Right side: Avatar Auth Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Avatar
              sx={{
                bgcolor: "#2563EB",
                cursor: "pointer",
                border: "2px solid white",
                transition: "transform 0.2s",
                "&:hover": { transform: "scale(1.1)" },
              }}
              onClick={handleAvatarClick}
              src={
                auth.user?.profileImage
                  ? `${API_BASE}/${auth.user.profileImage}`
                  : ""
              }
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
                  <MenuItem onClick={handleMenuClose} className="gap-2">
                    <Person fontSize="small" />
                    <a href="/userprofile">Profile</a>
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      auth.logout();
                      handleMenuClose();
                    }}
                    className="gap-2"
                  >
                    <Logout fontSize="small" />
                    Logout
                  </MenuItem>
                </>
              ) : (
                <>
                  <MenuItem onClick={handleMenuClose}>
                    <a href="/userlogin">Login</a>
                  </MenuItem>
                  <MenuItem onClick={handleMenuClose}>
                    <a href="/usersignup">Signup</a>
                  </MenuItem>
                </>
              )}
            </Menu>
          </div>

          {/* Mobile Auth Button */}
          <div className="md:hidden">
            {auth.user ? (
              <button
                type="button"
                className="bg-blue-600 text-white px-3 py-1 text-sm rounded-lg hover:bg-blue-700"
                onClick={auth.logout}
              >
                Logout
              </button>
            ) : (
              <a
                href="/userlogin"
                className="bg-blue-600 text-white px-3 py-1 text-sm rounded-lg hover:bg-blue-700"
              >
                Login
              </a>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gray-900 bg-opacity-95 w-full pb-4">
            <div className="flex flex-col space-y-4 px-4">
              <NavLink
                href="/userhome"
                text="Home"
                currentPath={location.pathname}
                onClick={closeAllMenus}
              />
              <NavLink
                href="/userbookdrive"
                text="Book Drive"
                currentPath={location.pathname}
                onClick={closeAllMenus}
              />
              <NavLink
                href="/Aboutus"
                text="About us"
                currentPath={location.pathname}
                onClick={closeAllMenus}
              />
              {location.pathname === "/userhome" && (
                <button
                  onClick={() => {
                    toggleCalendar();
                    setIsMobileMenuOpen(false);
                  }}
                  className="navbar-link py-2 px-4 rounded hover:text-white text-left"
                >
                  Previous Bookings
                </button>
              )}
              {!auth.user && (
                <a
                  href="/usersignup"
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-center"
                  onClick={closeAllMenus}
                >
                  Signup
                </a>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Calendar Modal */}
      {isCalendarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-30">
          <div className="bg-gray-900 p-8 rounded-2xl relative max-w-md w-full mx-4">
            <button
              onClick={toggleCalendar}
              className="calendar-close-button absolute top-2 right-2 text-white text-2xl"
              aria-label="Close calendar"
            >
              ×
            </button>
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
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar2;
