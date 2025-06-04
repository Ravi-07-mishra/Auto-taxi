import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Users,
  Car,
  Clock,
  Mail,
  Phone,
  MapPin,
  Menu,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

const NavLink = ({ href, text, currentPath, onClick }) => {
  const isActive = currentPath === href;
  return (
    <Link
      to={href}
      className={`navbar-link ${isActive ? "active" : ""} text-white hover:text-[#cbe557] transition-colors`}
      onClick={onClick}
    >
      {text}
    </Link>
  );
};

/**
 * Home
 *
 * - Plays background video.
 * - Fetches top-rated drivers and displays in carousel.
 * - Includes navbar with responsive menu.
 * - Provides role selection card (User vs Driver).
 */
const Home = () => {
  // Backend Base URL from environment
  const API_BASE = import.meta.env.VITE_API_URL;
  if (!API_BASE) {
    console.error("VITE_API_URL is not defined.");
  }

  const [isCardVisible, setIsCardVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [topDrivers, setTopDrivers] = useState([]);
  const [error, setError] = useState(null);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const contactRef = useRef(null);
  const topDriversRef = useRef(null);
  const navigate = useNavigate();

  const handleGetStartedClick = () => setIsCardVisible(true);
  const handleCloseCard = () => setIsCardVisible(false);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchTopDrivers = async () => {
      try {
        setLoadingDrivers(true);
        setError(null);
        const response = await axios.get(`${API_BASE}/driver/top-rated`);
        const result = response.data;
        const normalizedDrivers = (result.data || []).map((driver) => ({
          ...driver,
          name: driver.name || "Unknown Driver",
          avgRating: typeof driver.avgRating === "number" ? driver.avgRating : 0,
          numRatings: typeof driver.numRatings === "number" ? driver.numRatings : 0,
          profileImage: driver.profileImage || "/default-driver.jpg",
        }));
        if (isMounted) {
          setTopDrivers(normalizedDrivers);
        }
      } catch (err) {
        console.error("Fetch top drivers error:", err);
        if (isMounted) {
          setError("Failed to load top drivers.");
          setTopDrivers([]);
        }
      } finally {
        if (isMounted) setLoadingDrivers(false);
      }
    };
    fetchTopDrivers();
    return () => {
      isMounted = false;
    };
  }, [API_BASE]);

  return (
    <div className="relative min-h-screen">
      <video autoPlay loop muted className="fixed top-0 left-0 w-full h-full object-cover z-0">
        <source src="/HomePage.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-10"></div>

      <div className="relative z-20">
        {/* Navbar */}
        <nav className="fixed w-full z-30 top-0 left-0 p-4 bg-black bg-opacity-50">
          <div className="max-w-screen-xl mx-auto flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold lowercase tracking-wider shadow-md flex space-x-1 sm:space-x-2">
                {Array.from("auto-drive").map((letter, index) => (
                  <span key={index} style={{ color: index % 2 === 0 ? "#cbe557" : "white" }}>
                    {letter}
                  </span>
                ))}
              </h1>
            </div>

            <div className="hidden md:flex gap-8">
              <NavLink href="/Home" text="Home" currentPath="/Home" />
              <button
                onClick={() => {
                  topDriversRef.current?.scrollIntoView({ behavior: "smooth" });
                  setIsMenuOpen(false);
                }}
                className="text-white hover:text-[#cbe557] transition-colors"
              >
                Trusted Drivers
              </button>
              <NavLink href="/OurServices" text="Our Services" currentPath="/Home" />
              <button
                onClick={scrollToContact}
                className="bg-[#cbe557] text-black px-4 py-2 rounded-lg hover:bg-opacity-80 transition-all"
              >
                Contact Us
              </button>
            </div>

            <button className="md:hidden text-white" onClick={toggleMenu}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {isMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-40 flex flex-col items-center justify-center space-y-6">
            <button className="absolute top-4 right-4 text-white" onClick={toggleMenu}>
              <X size={24} />
            </button>
            <NavLink href="/Home" text="Home" currentPath="/Home" onClick={toggleMenu} />
            <button
              onClick={() => {
                topDriversRef.current?.scrollIntoView({ behavior: "smooth" });
                toggleMenu();
              }}
              className="text-white hover:text-[#cbe557] transition-colors"
            >
              Trusted Drivers
            </button>
            <NavLink href="/OurServices" text="Our Services" currentPath="/Home" onClick={toggleMenu} />
            <button
              onClick={() => {
                scrollToContact();
                toggleMenu();
              }}
              className="bg-[#cbe557] text-black px-4 py-2 rounded-lg hover:bg-opacity-80 transition-all"
            >
              Contact Us
            </button>
          </div>
        )}

        {/* Hero */}
        <section className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center text-white">
            <h2
              className="text-3xl sm:text-4xl md:text-6xl font-bold mb-8"
              style={{ fontFamily: "Merriweather" }}
            >
              Book Drives or Start Driving
            </h2>
            <button
              onClick={handleGetStartedClick}
              className="bg-[#cbe557] text-gray-800 font-bold py-3 px-6 sm:px-8 rounded-lg shadow-lg hover:bg-[#b8d93e] hover:shadow-xl transition-all"
            >
              Get Started
            </button>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 bg-black bg-opacity-70">
          <div className="max-w-screen-xl mx-auto px-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white text-center">
              {[
                { icon: Users, value: "20k+", label: "Users" },
                { icon: Car, value: "100+", label: "Drivers" },
                { icon: Clock, value: "50k+", label: "Hours Driven" },
              ].map((stat, i) => (
                <div key={i}>
                  <stat.icon size={48} className="mx-auto mb-4 text-[#cbe557]" />
                  <h2 className="text-4xl md:text-5xl font-bold">{stat.value}</h2>
                  <p className="text-xl">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Top Drivers */}
        <section className="py-16 bg-black bg-opacity-80" ref={topDriversRef}>
          <div className="max-w-screen-xl mx-auto px-4 w-full">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-white">
              Our Top-Rated Drivers
            </h2>
            {loadingDrivers ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#cbe557]"></div>
              </div>
            ) : topDrivers.length > 0 ? (
              <div className="relative max-w-4xl mx-auto">
                <Carousel
                  showArrows
                  showStatus={false}
                  showThumbs={false}
                  infiniteLoop
                  autoPlay
                  interval={5000}
                  renderArrowPrev={(onClickHandler, hasPrev, label) => (
                    <button
                      onClick={onClickHandler}
                      disabled={!hasPrev}
                      aria-label={label}
                      className="absolute left-0 top-1/2 z-10 -translate-y-1/2 bg-[#cbe557] bg-opacity-80 p-2 rounded-full hover:bg-opacity-100"
                    >
                      <ChevronLeft className="h-6 w-6 text-black" />
                    </button>
                  )}
                  renderArrowNext={(onClickHandler, hasNext, label) => (
                    <button
                      onClick={onClickHandler}
                      disabled={!hasNext}
                      aria-label={label}
                      className="absolute right-0 top-1/2 z-10 -translate-y-1/2 bg-[#cbe557] bg-opacity-80 p-2 rounded-full hover:bg-opacity-100"
                    >
                      <ChevronRight className="h-6 w-6 text-black" />
                    </button>
                  )}
                >
                  {topDrivers.map((driver) => (
                    <div key={driver._id} className="px-2 sm:px-4 py-4">
                      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 shadow-lg border border-[#cbe557]	border-opacity-30">
                        <div className="flex flex-col items-center">
                          <div className="relative mb-6">
                            <img
                              src={`${API_BASE}/${driver.profileImage}`}
                              alt={driver.name}
                              className="w-32 h-32 rounded-full object-cover border-4 border-[#cbe557]"
                              onError={(e) => { e.target.src = "/default-driver.jpg"; }}
                            />
                            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-[#cbe557] text-black px-3 py-1 rounded-full flex items-center">
                              <Star className="h-4 w-4 fill-current mr-1" />
                              <span className="font-bold">{driver.avgRating.toFixed(1)}</span>
                            </div>
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">{driver.name}</h3>
                          <div className="flex justify-center mt-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${i < Math.round(driver.avgRating) ? "fill-[#cbe557] text-[#cbe557]" : "text-gray-400"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </Carousel>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">No top-rated drivers available yet</div>
            )}
          </div>
        </section>

        {/* Contact */}
        <section ref={contactRef} className="py-20 bg-black bg-opacity-70 text-white">
          <div className="max-w-screen-xl mx-auto px-4 w-full">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Contact Us</h2>
            <p className="text-center max-w-2xl mx-auto mb-8">
              Reach out to us for assistance or to address any concerns. We're here to help with your issues,
              complaints, or questions. Your satisfaction matters to us, so don't hesitate to contact us anytime.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
              <div className="flex items-center">
                <Mail className="mr-2 text-[#cbe557]" />
                <span>info@auto-drive.com</span>
              </div>
              <div className="flex items-center">
                <Phone className="mr-2 text-[#cbe557]" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center">
                <MapPin className="mr-2 text-[#cbe557]" />
                <span>123 Drive St, City, State 12345</span>
              </div>
            </div>
          </div>
        </section>

        {/* Role Selection Card */}
        {isCardVisible && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-lg overflow-hidden shadow-lg w-full max-w-4xl h-auto md:h-3/4 flex flex-col md:flex-row">
              <Link to="/userhome" className="w-full md:w-1/2 h-1/2 md:h-full relative group">
                <div className="h-full w-full">
                  <img src="/user.jpg" alt="User" className="h-full w-full object-cover object-center" />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition">
                    <h3 className="text-white text-3xl font-bold">User</h3>
                  </div>
                </div>
              </Link>
              <Link to="/driverdashboard" className="w-full md:w-1/2 h-1/2 md:h-full relative group">
                <div className="h-full w-full">
                  <img src="/driver.jpg" alt="Driver" className="h-full w-full object-cover object-center" />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition">
                    <h3 className="text-white text-3xl font-bold">Driver</h3>
                  </div>
                </div>
              </Link>
            </div>
            <button onClick={handleCloseCard} className="absolute top-4 right-4 bg-red-500 text-white font-bold py-2 px-4 rounded-full hover:bg-red-600 transition-all">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;