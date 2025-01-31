import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";

const Home = () => {
  const [isCardVisible, setIsCardVisible] = useState(false);

  const handleGetStartedClick = () => {
    setIsCardVisible(true); // Show the card prompt when clicked
  };

  const handleCloseCard = () => {
    setIsCardVisible(false); // Hide the card when the close button is clicked
  };

  return (
    <div className="relative flex flex-col lg:flex-row min-h-screen">

      {/* Section 1: Statistics */}
      <div className="w-full lg:w-1/3 min-h-screen bg-gradient-to-br from-[#121212] via-[#1b1b1b] via-[#262626] to-[#0d0d0d] text-white flex flex-col items-center justify-center p-6 relative z-10">
        <h1 className="text-4xl font-extrabold lowercase tracking-wider shadow-md absolute top-[-40px] flex space-x-2 mt-20">
          {["a", "u", "t", "o", "-", "d", "r", "i", "v", "e"].map((letter, index) => (
            <span
              key={index}
              style={{ color: index % 2 === 0 ? "#cbe557" : "white" }}
            >
              {letter}
            </span>
          ))}
        </h1>
        <div className="flex flex-col items-center justify-center flex-grow pt-10">
          <div className="text-center mb-10">
            <h2 className="text-5xl font-bold text-gray-200">100+</h2>
            <p className="text-gray-400 text-lg">Drivers</p>
          </div>
          <div className="text-center">
            <h2 className="text-5xl font-bold text-gray-200">20k+</h2>
            <p className="text-gray-400 text-lg">Users</p>
          </div>
        </div>
      </div>

      {/* Section 2: Navigation */}
      <div className="w-full lg:w-1/3 min-h-screen bg-gradient-to-br from-[#232323] via-[#4b4b4b] via-[#5f605d] via-[#494949] to-[#363636] text-white flex flex-col p-6 relative z-10">
        <ul className="flex justify-center space-x-12 text-lg pt-6">
          <li>
            <NavLink to="/Home" className="hover:text-gray-400 transition">
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/TrustedDrivers" className="hover:text-gray-400 transition">
              Trusted Drivers
            </NavLink>
          </li>
          <li>
            <NavLink to="/OurServices" className="hover:text-gray-400 transition">
              Our Services
            </NavLink>
          </li>
        </ul>
        <div className="flex flex-col items-center justify-center flex-grow">
          <h2 className="text-5xl font-bold text-center mt-12">
            Book Drives or Start Driving
          </h2>
          <button
            onClick={handleGetStartedClick}
            className="bg-[#cae944] text-gray-800 font-bold py-2 px-6 rounded-lg shadow-lg hover:bg-[#b8d93e] hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#a8c834] focus:ring-offset-2"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Section 3: Contact Us */}
      <div className="w-full lg:w-1/3 min-h-screen bg-gradient-to-br from-[#0f0f0f] via-[#1b1b1b] via-[#262626] to-[#121212] text-white flex flex-col items-center justify-center p-6 relative z-10">
        <button
          className="bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg shadow-md hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 absolute top-[-40px] mt-20"
        >
          Contact Us
        </button>
        <p className="text-gray-400 text-center mt-8 max-w-md">
          Reach out to us for assistance or to address any concerns. We're here to help with your issues, complaints, or questions. Your satisfaction matters to us, so don’t hesitate to contact us anytime.
        </p>
      </div>

      {/* Card Prompt */}
      {isCardVisible && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg overflow-hidden shadow-lg w-3/4 h-3/4 flex">
            {/* User Section */}
            <Link to="/userhome" className="w-1/2 relative group">
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

            {/* Driver Section */}
            <Link to="/driverdashboard" className="w-1/2 relative group">
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

          {/* Close Button */}
          <div className="flex justify-center mt-4">
            <button
              onClick={handleCloseCard}
              className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
