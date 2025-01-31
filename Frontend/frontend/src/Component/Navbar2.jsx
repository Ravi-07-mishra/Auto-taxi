import React, { useEffect, useState } from "react";
import { useAuth } from "../Context/userContext";
import { useLocation } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../Css/CalendarStyles.css";

const NavLink = ({ href, text, currentPath }) => {
  const isActive = currentPath === href;
  return (
    <a href={href} className={`navbar-link ${isActive ? "active" : ""}`}>
      {text}
    </a>
  );
};

const Navbar2 = () => {
  const auth = useAuth();
  const location = useLocation();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [navbarStyle, setNavbarStyle] = useState({ background: "transparent" });

  const toggleCalendar = () => setIsCalendarOpen((prev) => !prev);

  useEffect(() => {
    const fetchCompletedBookings = async () => {
      try {
        const response = await fetch(`/api/user/completedBookings/${auth.user._id}`);
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
    };

    if (auth.user) {
      fetchCompletedBookings();
    }
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
        <div className="flex items-center p-4">
          <h1 className="text-2xl" style={{ fontFamily: "'Concert One', sans-serif", fontWeight: "400", marginLeft: "10px" }}>
            Auto Drive
          </h1>

          <div style={{ display: "flex", marginLeft: "50px", gap: "30px" }}>
            <NavLink href="/userhome" text="Home" currentPath={location.pathname} />
            <NavLink href="/userbookdrive" text="Book Drive" currentPath={location.pathname} />
            <NavLink href="/Aboutus" text="About us" currentPath={location.pathname} />
            {location.pathname === "/userhome" && (
              <button
                onClick={toggleCalendar}
                className="navbar-link py-2 px-4 rounded hover:text-white"
                style={{ marginLeft: "10px" }}
              >
                Previous Bookings
              </button>
            )}
          </div>

          <div className="flex space-x-4" style={{ position: "absolute", right: "10px" }}>
            {auth.user ? (
              <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700" onClick={auth.logout}>
                Logout
              </button>
            ) : (
              <>
                <a href="/userlogin" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Login
                </a>
                <a href="/usersignup" className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                  Signup
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {isCalendarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-gray-900 p-8 rounded-2xl relative">
            <button onClick={toggleCalendar} className="calendar-close-button" aria-label="Close calendar">
              ×
            </button>
            <Calendar
              onClickDay={(date) => {
                const booking = completedBookings.find(
                  (b) => new Date(b.createdAt).toDateString() === date.toDateString()
                );
                if (booking) {
                  alert(
                    `Price: ${booking.price}\nPickup: ${booking.pickupLocation.lat}, ${booking.pickupLocation.lng}\nDestination: ${booking.destinationLocation.lat}, ${booking.destinationLocation.lng}`
                  );
                }
              }}
              tileClassName={({ date }) =>
                completedBookings.some((b) => new Date(b.createdAt).toDateString() === date.toDateString())
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