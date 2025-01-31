import React, { useEffect, useState } from "react"
import { useDriverAuth } from "../Context/driverContext"
import { motion } from "framer-motion"
import { FiStar, FiAward, FiTruck, FiClock, FiEdit2, FiCamera } from "react-icons/fi"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"

const ProfilePage = () => {
  const [profileImage, setProfileImage] = useState(null)
  const [driverName, setDriverName] = useState("John Doe")
  const [driverId, setDriverId] = useState(null);
  const [email, setEmail] = useState("johndoe@gmail.com")
  const [avgRating, setAvgRating] = useState("4.8")
  const { driver } = useDriverAuth()
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false)


  useEffect(() => {
      const timeout = setTimeout(() => {
        // Redirect to login if not authenticated
        if (!driver) {
          navigate("/driverlogin")
        } else {
          setDriverId(driver._id)
          console.log("Driver ID set to:", driver._id)
        }
      }, 1000) // Wait for 5 seconds (5000 milliseconds)
  
      return () => clearTimeout(timeout) // Cleanup the timeout on component unmount
    }, [driver, navigate])
  const fetchDriverData = async () => {
    if (!driverId) return;
    try {
      const response = await axios.get(`http://localhost:3000/api/driver/profile/${driverId}`, { withCredentials: true });
      const updatedDriver = response.data.data.driver;
      setDriverName(updatedDriver.name);
      setDriverId(updatedDriver._id);
      setEmail(updatedDriver.email);
      setAvgRating(updatedDriver.avgRating);
      // Assuming the image path is stored as a relative path
      setProfileImage(updatedDriver.profileImage ? `http://localhost:3000/${driver.profileImage}` : 'null');
    } catch (error) {
      console.error("Error fetching driver data:", error);
    }
  };

  // Fetch data on initial load
  useEffect(() => {
    if (driverId) {
      fetchDriverData();
    }
  }, [driverId]);

  // Set the initial data from the `driver` prop if available
  useEffect(() => {
    if (driver) {
      setDriverName(driver.name);
      setDriverId(driver._id);
      setEmail(driver.email);
      setAvgRating(driver.avgRating);
      setProfileImage(driver.profileImage ? `http://localhost:3000/${driver.profileImage}` : 'http://localhost:3000/uploads/drivers/profile/image-1738174511665-171767109.png');
    }
  }, [driver]);

  // Handle image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);  // Show loading state
    const formData = new FormData();
    formData.append('image', event.target.files[0]); // Make sure the field is 'image'
    formData.append('type', 'profile'); // or 'cover'

    try {
      const response = await axios.post(`http://localhost:3000/api/driver/uploadProfileImage/${driverId}`, formData, { withCredentials: true });

      if (response.data.profileImage) {
        // Refresh driver data after successful upload
        await fetchDriverData();
      }
    } catch (error) {
      console.error("Error uploading profile image:", error);
    } finally {
      setIsUploading(false);  // Hide loading state after upload
    }
  };

  const stats = [
    { icon: FiTruck, label: "Total Rides", value: "1,234" },
    { icon: FiClock, label: "Hours Driven", value: "2,500" },
    { icon: FiAward, label: "Driver Level", value: "Gold" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-teal-400 via-blue-500 to-indigo-600 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden">
          {/* Header Section */}
          <div className="relative h-48 bg-gradient-to-r from-cyan-500 to-blue-600">
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white to-transparent"></div>
          </div>

          {/* Profile Info Section */}
          <div className="relative px-6 pb-8">
            <div className="flex flex-col sm:flex-row items-center">
              <div className="relative">
                <img
                  src={profileImage || "/placeholder-avatar.jpg"}
                  alt={driverName}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg -mt-16 z-10 object-cover"
                />
                <label
                  htmlFor="profile-image-upload"
                  className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 cursor-pointer"
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                  ) : (
                    <FiCamera className="text-white" />
                  )}
                  <input
                    id="profile-image-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-gray-900">{driverName}</h1>
                <p className="text-lg text-gray-600">{driverId}</p>
                <div className="mt-2 flex items-center justify-center sm:justify-start">
                  <FiStar className="text-yellow-500 mr-1" />
                  <span className="text-xl font-semibold text-gray-800">{avgRating}</span>
                  <span className="ml-1 text-gray-600">/ 5.0</span>
                </div>
              </div>
              <Link
                to="/driveredit-profile"
                className="mt-4 sm:mt-0 sm:ml-auto px-4 py-2 bg-cyan-600 text-white rounded-full flex items-center hover:bg-cyan-700 transition duration-300"
              >
                <FiEdit2 className="mr-2" />
                Edit Profile
              </Link>
            </div>

            {/* Stats Section */}
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {stats.map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 flex flex-col items-center shadow-md"
                >
                  <item.icon className="h-8 w-8 text-cyan-600 mb-3" />
                  <h2 className="text-lg font-semibold text-gray-700">{item.label}</h2>
                  <p className="mt-2 text-3xl font-bold text-cyan-700">{item.value}</p>
                </div>
              ))}
            </div>

            {/* About Section */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Me</h2>
              <p className="text-gray-700 leading-relaxed">
                Passionate driver with over 5 years of experience in providing safe and efficient transportation
                services. Known for punctuality, professionalism, and excellent customer service. Always striving to
                ensure a comfortable and enjoyable ride for all passengers.
              </p>
            </div>

            {/* Achievements Section */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Achievements</h2>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <FiAward className="text-cyan-600 mr-2" /> Driver of the Month - March 2023
                </li>
                <li className="flex items-center text-gray-700">
                  <FiAward className="text-cyan-600 mr-2" /> 1000 Rides Milestone
                </li>
                <li className="flex items-center text-gray-700">
                  <FiAward className="text-cyan-600 mr-2" /> Perfect 5-Star Rating Week
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ProfilePage

