import React, { useState } from 'react';
import { Typography } from '@mui/material';
import { useAuth } from '../Context/userContext';
import { useLocation } from 'react-router-dom';

// A reusable component for navigation links
const NavLink = ({ href, text, currentPath }) => {
  const baseStyle =
    "block py-2 px-3 rounded md:p-0 text-gray-900 dark:text-white hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-600 dark:hover:bg-gray-700";
  const activeStyle = "text-white bg-blue-600 md:bg-transparent md:text-blue-600";

  return (
    <a href={href} className={`${baseStyle} ${currentPath === href ? activeStyle : ""}`}>
      {text}
    </a>
  );
};

const Navbar2 = () => {
  const auth = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <nav className="bg-white dark:bg-gray-900 fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-600 shadow-lg">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        {/* Logo Section */}
        <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
          <img src="logo.png" className="h-10" alt="Auto Taxi Logo" />
          <Typography
            sx={{
              display: { md: "block", sm: "none", xs: "none" },
              fontWeight: 800,
              textShadow: "2px 2px 20px rgba(0, 0, 0, 0.3)",
            }}
          >
            <span style={{ fontSize: "20px" }}>Auto </span>TAXI
          </Typography>
        </a>

        {/* Right Section */}
        <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          {/* Conditional rendering for Login/Logout */}
          {auth.user ? (
            <button
              type="button"
              className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800"
              onClick={auth.logout}
            >
              Logout
            </button>
          ) : (
            <>
              <a
                href="/login"
                className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800"
                rel="noopener noreferrer"
              >
                Login
              </a>
              <a
                href="/signup"
                className="text-white bg-gray-600 hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-gray-500 dark:hover:bg-gray-600 dark:focus:ring-gray-800"
                rel="noopener noreferrer"
              >
                Signup
              </a>
            </>
          )}

          {/* Hamburger Menu (Responsive) */}
          <button
            onClick={toggleMenu}
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-controls="navbar-sticky"
            aria-expanded={isMenuOpen}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 17 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <div
          className={`items-center justify-between ${
            isMenuOpen ? "block" : "hidden"
          } w-full md:flex md:w-auto md:order-1`}
          id="navbar-sticky"
        >
          <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
            <li>
              <NavLink href="/home" text="Home" currentPath={location.pathname} />
            </li>
            <li>
              <NavLink href="/userHome" text="User Dashboard" currentPath={location.pathname} />
            </li>
            <li>
              <NavLink href="/bookdrive" text="Book Drive" currentPath={location.pathname} />
            </li>
          
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar2;
