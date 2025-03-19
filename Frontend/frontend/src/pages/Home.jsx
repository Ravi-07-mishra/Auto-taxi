import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Users, Car, Clock, Mail, Phone, MapPin, Menu, X } from "lucide-react";
import React from "react";

const NavLink = ({ href, text, currentPath, onClick }) => {
  const isActive = currentPath === href;
  return (
    <Link
      to={href}
      className={`navbar-link ${
        isActive ? "active" : ""
      } text-white hover:text-[#cbe557] transition-colors`}
      onClick={onClick}
    >
      {text}
    </Link>
  );
};

const Home = () => {
  const [isCardVisible, setIsCardVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const contactRef = useRef(null);

  const handleGetStartedClick = () => {
    setIsCardVisible(true);
  };

  const handleCloseCard = () => {
    setIsCardVisible(false);
  };

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        className="fixed top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/HomePage.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay */}
      <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-10"></div>

      {/* Content */}
      <div className="relative z-20">
        {/* Navigation */}
        <nav className="fixed w-full z-30 top-0 left-0 p-4 bg-black bg-opacity-50">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Logo Image */}
              <img
                src="/carlogo.png" // Path to your logo image
                alt="Auto-Drive Logo"
                className="h-10 w-15" // Adjust the size as needed
              />
              <h1 className="text-2xl md:text-4xl font-extrabold  tracking-wider shadow-md flex space-x-2">
                {["Q", "U", "I", "C", "K", "-", "G", "O"].map(
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
            </div>

            <div className="hidden md:flex gap-8">
              <NavLink href="/Home" text="Home" currentPath="/Home" />
              <NavLink
                href="/TrustedDrivers"
                text="Trusted Drivers"
                currentPath="/Home"
              />
              <NavLink
                href="/OurServices"
                text="Our Services"
                currentPath="/Home"
              />
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-40 flex flex-col items-center justify-center">
            <NavLink
              href="/Home"
              text="Home"
              currentPath="/Home"
              onClick={toggleMenu}
            />
            <NavLink
              href="/TrustedDrivers"
              text="Trusted Drivers"
              currentPath="/Home"
              onClick={toggleMenu}
            />
            <NavLink
              href="/OurServices"
              text="Our Services"
              currentPath="/Home"
              onClick={toggleMenu}
            />
            <button
              onClick={() => {
                scrollToContact();
                toggleMenu();
              }}
              className="bg-[#cbe557] text-black px-4 py-2 rounded-lg hover:bg-opacity-80 transition-all mt-4"
            >
              Contact Us
            </button>
          </div>
        )}

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center text-white">
            <h2 className="text-4xl md:text-6xl font-bold mb-8" style={{fontFamily:"Merriweather"}}>
              Book Drives or Start Driving
            </h2>
            <button
              onClick={handleGetStartedClick}
              className="bg-[#cbe557] text-gray-800 font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-[#b8d93e] hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#a8c834] focus:ring-offset-2"
              style={{ borderRadius: "10px" }}
            >
              Get Started
            </button>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-black bg-opacity-70">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-around text-white gap-8 md:gap-0">
              <div className="text-center">
                <Users size={48} className="mx-auto mb-4 text-[#cbe557]" />
                <h2 className="text-4xl md:text-5xl font-bold">20k+</h2>
                <p className="text-xl">Users</p>
              </div>
              <div className="text-center">
                <Car size={48} className="mx-auto mb-4 text-[#cbe557]" />
                <h2 className="text-4xl md:text-5xl font-bold">100+</h2>
                <p className="text-xl">Drivers</p>
              </div>
              <div className="text-center">
                <Clock size={48} className="mx-auto mb-4 text-[#cbe557]" />
                <h2 className="text-4xl md:text-5xl font-bold">50k+</h2>
                <p className="text-xl">Hours Driven</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section
          ref={contactRef}
          className="py-20 bg-black bg-opacity-70 text-white"
        >
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              Contact Us
            </h2>
            <p className="text-center max-w-2xl mx-auto mb-8">
              Reach out to us for assistance or to address any concerns. We're
              here to help with your issues, complaints, or questions. Your
              satisfaction matters to us, so don't hesitate to contact us
              anytime.
            </p>
            <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8">
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

        {/* Card Prompt */}
        {isCardVisible && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-lg overflow-hidden shadow-lg w-full max-w-4xl h-3/4 flex flex-col md:flex-row">
              <Link
                to="/userhome"
                className="w-full md:w-1/2 h-1/2 md:h-full relative group"
              >
                <div className="h-full w-full">
                  <img
                    src="/user.jpg"
                    alt="User"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition">
                    <h3 className="text-white text-3xl font-bold">User</h3>
                  </div>
                </div>
              </Link>

              <Link
                to="/driverdashboard"
                className="w-full md:w-1/2 h-1/2 md:h-full relative group"
              >
                <div className="h-full w-full">
                  <img
                    src="/driver.jpg"
                    alt="Driver"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition">
                    <h3 className="text-white text-3xl font-bold">Driver</h3>
                  </div>
                </div>
              </Link>
            </div>

            <button
              onClick={handleCloseCard}
              className="absolute top-4 right-4 bg-red-500 text-white font-bold py-2 px-4 rounded-full hover:bg-red-600 transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;