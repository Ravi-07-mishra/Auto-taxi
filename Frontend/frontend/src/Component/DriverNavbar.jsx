import React, { useState, useEffect } from "react";
import { Avatar, Menu, MenuItem } from "@mui/material";
import { AccountCircle, Logout, Person } from "@mui/icons-material";
import { useLocation } from "react-router-dom";
import { useDriverAuth } from "../Context/driverContext";
import { useSubscription } from "../Context/SubscriptionContext";
import DriverLogin from "../pages/Driverlogin";
import DriverRegistrationForm from "../pages/Register";
import SubscriptionPage from "../pages/SubscriptionPage";

const NavLink = ({ href, text, currentPath }) => {
  const isActive = currentPath === href;
  return (
    <a
      href={href}
      className={`navbar-link ${
        isActive ? "text-blue-400 underline" : "text-white"
      } py-2 px-4 rounded hover:text-blue-400 transition`}
    >
      {text}
    </a>
  );
};

const DriverNavbar = () => {
  // ─── Backend Base URL ───────────────────────────────────────────
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const auth = useDriverAuth();
  const { subscription } = useSubscription();
  const location = useLocation();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [navbarStyle, setNavbarStyle] = useState({
    background: "transparent",
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const toggleLogin = () => setIsLoginOpen((prev) => !prev);
  const toggleRegister = () => setIsRegisterOpen((prev) => !prev);
  const toggleSubscription = () => setIsSubscriptionOpen((prev) => !prev);
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  const driverName = auth.driver?.name || "D";
  const driverInitial = driverName.charAt(0).toUpperCase();

  useEffect(() => {
    const handleScroll = () => {
      setNavbarStyle({
        background:
          window.scrollY > 50
            ? "linear-gradient(to bottom right, #262529, #363b3f, #383e42, #141920)"
            : "transparent",
        opacity: 0.95,
        transition: "background 0.5s ease",
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isSubscribed =
    subscription.isSubscribed &&
    new Date(subscription.expiryDate) > new Date();

  return (
    <>
      <nav
        className="fixed w-full z-20 top-0 left-0 shadow-sm"
        style={{ ...navbarStyle }}
      >
        <div className="flex items-center justify-between px-4 py-3 md:px-8">
          {/* Left: Logo & Links */}
          <div className="flex items-center gap-6">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-wider shadow-md flex space-x-1">
              {["a", "u", "t", "o", " ", "d", "r", "i", "v", "e"].map(
                (letter, index) => (
                  <span
                    key={index}
                    style={{ color: index % 2 === 0 ? "#cbe557" : "white" }}
                  >
                    {letter}
                  </span>
                )
              )}
            </h1>

            {/* Desktop Links */}
            <div className="hidden md:flex gap-6">
              <NavLink
                href="/driverDashboard"
                text="Driver Dashboard"
                currentPath={location.pathname}
              />
              <NavLink
                href="/driverpage"
                text="Home"
                currentPath={location.pathname}
              />
              <NavLink
                href="/Aboutus"
                text="About us"
                currentPath={location.pathname}
              />
            </div>
          </div>

          {/* Right: Buttons or Avatar */}
          <div className="hidden md:flex gap-4 items-center">
            {auth.driver ? (
              <>
                {!isSubscribed && (
                  <button
                    onClick={toggleSubscription}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2 rounded-full shadow-md transition duration-300"
                  >
                    Subscribe
                  </button>
                )}
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
                    auth.driver.profileImage
                      ? `${API_BASE}/${auth.driver.profileImage}`
                      : ""
                  }
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
                  <MenuItem onClick={handleMenuClose} className="gap-2">
                    <Person fontSize="small" />
                    <a href="/driverprofile">Profile</a>
                  </MenuItem>
                  <MenuItem onClick={auth.logout} className="gap-2">
                    <Logout fontSize="small" />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <button
                  onClick={toggleLogin}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-5 py-2 rounded-full shadow-md transition duration-300"
                >
                  Login
                </button>
                <button
                  onClick={toggleRegister}
                  className="bg-gray-700 hover:bg-gray-800 text-white font-semibold px-5 py-2 rounded-full shadow-md transition duration-300"
                >
                  Register
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-white text-2xl focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#1f1f1f] px-6 pb-4 pt-2 z-50">
            <div className="flex flex-col space-y-3">
              <NavLink
                href="/driverDashboard"
                text="Driver Dashboard"
                currentPath={location.pathname}
              />
              <NavLink
                href="/driverpage"
                text="Home"
                currentPath={location.pathname}
              />
              <NavLink
                href="/Aboutus"
                text="About us"
                currentPath={location.pathname}
              />

              {auth.driver ? (
                <>
                  {!isSubscribed && (
                    <button
                      onClick={() => {
                        toggleSubscription();
                        toggleMobileMenu();
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-full shadow-md transition duration-300"
                    >
                      Subscribe
                    </button>
                  )}
                  <button
                    onClick={() => {
                      window.location.href = "/driverprofile";
                      toggleMobileMenu();
                    }}
                    className="text-white hover:text-blue-400 transition text-left px-4 py-2 rounded hover:bg-gray-800"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      auth.logout();
                      toggleMobileMenu();
                    }}
                    className="text-white hover:text-blue-400 transition text-left px-4 py-2 rounded hover:bg-gray-800"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      toggleLogin();
                      toggleMobileMenu();
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-full shadow-md transition duration-300"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      toggleRegister();
                      toggleMobileMenu();
                    }}
                    className="bg-gray-700 hover:bg-gray-800 text-white font-semibold px-4 py-2 rounded-full shadow-md transition duration-300"
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Modals */}
      {isLoginOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-900 p-8 rounded-2xl relative w-11/12 max-w-md">
            <button
              onClick={toggleLogin}
              className="absolute top-3 right-3 text-white hover:text-red-500"
              aria-label="Close login modal"
            >
              ✕
            </button>
            <DriverLogin />
          </div>
        </div>
      )}

      {isRegisterOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-900 p-8 rounded-2xl relative w-11/12 max-w-md">
            <button
              onClick={toggleRegister}
              className="absolute top-3 right-3 text-white hover:text-red-500"
              aria-label="Close registration modal"
            >
              ✕
            </button>
            <DriverRegistrationForm />
          </div>
        </div>
      )}

      {isSubscriptionOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-900 p-8 rounded-2xl relative w-11/12 max-w-4xl">
            <button
              onClick={toggleSubscription}
              className="absolute top-3 right-3 text-white hover:text-red-500"
              aria-label="Close subscription modal"
            >
              ✕
            </button>
            <SubscriptionPage />
          </div>
        </div>
      )}
    </>
  );
};

export default DriverNavbar;
