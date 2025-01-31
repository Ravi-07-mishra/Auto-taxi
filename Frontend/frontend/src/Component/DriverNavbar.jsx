import React, { useState, useEffect } from "react"
import { Avatar, Menu, MenuItem } from "@mui/material"
import { useLocation } from "react-router-dom"
import { useDriverAuth } from "../Context/driverContext"
import DriverLogin from "../pages/Driverlogin"
import DriverRegistrationForm from "../pages/Register"

const NavLink = ({ href, text, currentPath }) => {
  const isActive = currentPath === href
  return (
    <a href={href} className={`navbar-link ${isActive ? "active" : ""} py-2 px-4 rounded hover:text-white`}>
      {text}
    </a>
  )
}

const DriverNavbar = () => {
  const auth = useDriverAuth()
  const location = useLocation()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [navbarStyle, setNavbarStyle] = useState({
    background: "transparent",
  })

  const handleAvatarClick = (event) => setAnchorEl(event.currentTarget)
  const handleMenuClose = () => setAnchorEl(null)
  const toggleLogin = () => setIsLoginOpen((prev) => !prev)
  const toggleRegister = () => setIsRegisterOpen((prev) => !prev)

  const driverName = auth.driver?.name || "D"
  const driverInitial = driverName.charAt(0).toUpperCase()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setNavbarStyle({
          background: "linear-gradient(to bottom right, #262529, #363b3f, #383e42, #141920)",
          opacity: 0.95,
          transition: "background 0.5s ease",
        })
      } else {
        setNavbarStyle({
          background: "transparent",
          transition: "background 0.5s ease",
        })
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <nav className="fixed w-full z-20 top-0 left-0" style={{ ...navbarStyle, marginBottom: "20px" }}>
        <div className="flex items-center p-4">
          {/* Left Section: Title */}
          <h1
            className="text-2xl text-white"
            style={{
              fontFamily: "'Concert One', sans-serif",
              fontWeight: "400",
              marginLeft: "10px",
            }}
          >
            Auto Drive
          </h1>

          {/* Navigation Links */}
          <div style={{ display: "flex", marginLeft: "50px", gap: "30px" }}>
            <NavLink href="/driverDashboard" text="Driver Dashboard" currentPath={location.pathname} />
            <NavLink href="/driverpage" text="Home" currentPath={location.pathname} />
          
            <NavLink href="/Aboutus" text="About us" currentPath={location.pathname} />
          </div>

          {/* Right Section: Avatar/Buttons */}
          <div
            className="flex space-x-4"
            style={{
              position: "absolute",
              right: "10px",
            }}
          >
            {auth.driver ? (
              <>
                <Avatar 
  sx={{ bgcolor: "#2563EB", cursor: "pointer" }} 
  onClick={handleAvatarClick}
  src={`http://localhost:3000/${auth.driver.profileImage}` || ""}
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
                  <MenuItem onClick={handleMenuClose}>
                    <a href="/driverprofile">Profile</a>
                  </MenuItem>
                  <MenuItem onClick={auth.logout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <button onClick={toggleLogin} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Login
                </button>
                <button
                  onClick={toggleRegister}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-900 p-8 rounded-2xl relative">
            <button onClick={toggleLogin} className="absolute top-3 right-3 text-white hover:text-red-500">
              ✕
            </button>
            <DriverLogin />
          </div>
        </div>
      )}

      {/* Register Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-900 p-8 rounded-2xl relative">
            <button onClick={toggleRegister} className="absolute top-3 right-3 text-white hover:text-red-500">
              ✕
            </button>
            <DriverRegistrationForm />
          </div>
        </div>
      )}
    </>
  )
}

export default DriverNavbar

