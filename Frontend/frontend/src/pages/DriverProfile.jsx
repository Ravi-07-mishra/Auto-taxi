// src/pages/DriverProfilePage.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useDriverAuth } from "../Context/driverContext";
import { motion } from "framer-motion";
import { FiStar, FiAward, FiTruck, FiClock, FiEdit2, FiCamera } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

// Base API URL from environment variables
const API_BASE = import.meta.env.VITE_API_URL2 ||
  (process.env.NODE_ENV === "production"
    ? "https://api.yourdomain.com"
    : "http://localhost:3000");

// Create an axios instance for reuse
const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

const ProfilePage = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [driverName, setDriverName] = useState("John Doe");
  const [driverId, setDriverId] = useState(null);
  const [email, setEmail] = useState("johndoe@gmail.com");
  const [avgRating, setAvgRating] = useState("4.8");
  const [isUploading, setIsUploading] = useState(false);
  const { driver } = useDriverAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!driver) {
      navigate("/driverlogin");
    } else {
      setDriverId(driver._id);
    }
  }, [driver, navigate]);

  // Fetch driver details
  const fetchDriverData = useCallback(async () => {
    if (!driverId) return;
    try {
      const {
        data: { data: { driver: updatedDriver } },
      } = await apiClient.get(`/api/driver/profile/${driverId}`);

      setDriverName(updatedDriver.name);
      setEmail(updatedDriver.email);
      setAvgRating(updatedDriver.avgRating);
      setProfileImage(
        updatedDriver.profileImage
          ? `${API_BASE}/${updatedDriver.profileImage}`
          : `${API_BASE}/uploads/drivers/profile/image-placeholder.png`
      );
    } catch (error) {
      console.error("Error fetching driver data:", error);
    }
  }, [driverId]);

  // Initialize local state from context on login
  useEffect(() => {
    if (driver) {
      setDriverName(driver.name);
      setEmail(driver.email);
      setAvgRating(driver.avgRating);
      setProfileImage(
        driver.profileImage
          ? `${API_BASE}/${driver.profileImage}`
          : `${API_BASE}/uploads/drivers/profile/image-placeholder.png`
      );
    }
  }, [driver]);

  // Fetch after setting ID
  useEffect(() => {
    fetchDriverData();
  }, [driverId, fetchDriverData]);

  // Handle profile image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("type", "profile");

    try {
      const { data: { profileImage: newImage } } = await apiClient.post(
        `/api/driver/uploadProfileImage/${driverId}`,
        formData
      );

      if (newImage) {
        await fetchDriverData();
      }
    } catch (error) {
      console.error("Error uploading profile image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const stats = [
    { icon: FiTruck, label: "Total Rides", value: "1,234" },
    { icon: FiClock, label: "Hours Driven", value: "2,500" },
    { icon: FiAward, label: "Driver Level", value: "Gold" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-900 shadow-2xl rounded-3xl overflow-hidden">
          <div className="relative h-56 bg-gradient-to-r from-gray-800 to-gray-900">
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent" />
          </div>

          <div className="relative px-8 pb-10">
            <div className="flex flex-col sm:flex-row items-center">
              <div className="relative">
                <img
                  src={profileImage}
                  alt={driverName}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-cyan-600 shadow-2xl -mt-20 z-10 object-cover"
                />
                <label
                  htmlFor="profile-image-upload"
                  className="absolute bottom-2 right-2 bg-cyan-600 rounded-full p-2 cursor-pointer hover:bg-cyan-700 transition duration-300"
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
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

              <div className="mt-6 sm:mt-0 sm:ml-8 text-center sm:text-left">
                <h1 className="text-2xl sm:text-4xl font-bold text-white">{driverName}</h1>
                <p className="text-sm sm:text-lg text-gray-400">{email}</p>
                <div className="mt-3 flex items-center justify-center sm:justify-start">
                  <FiStar className="text-yellow-500 mr-1" />
                  <span className="text-xl sm:text-2xl font-semibold text-white">{avgRating}</span>
                  <span className="ml-1 text-gray-400">/ 5.0</span>
                </div>
              </div>

              <Link
                to="/driveredit-profile"
                className="mt-6 sm:mt-0 sm:ml-auto px-6 py-3 bg-cyan-600 text-white rounded-full flex items-center hover:bg-cyan-700 transition duration-300"
              >
                <FiEdit2 className="mr-2" />
                Edit Profile
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {stats.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 flex flex-col items-center shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <item.icon className="h-10 w-10 text-cyan-600 mb-4" />
                  <h2 className="text-lg sm:text-xl font-semibold text-white">{item.label}</h2>
                  <p className="mt-2 text-3xl sm:text-4xl font-bold text-cyan-600">{item.value}</p>
                </div>
              ))}
            </div>

            {/* About */}
            <div className="mt-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">About Me</h2>
              <p className="text-gray-400 leading-relaxed text-base sm:text-lg">
                Passionate driver with over 5 years of experience in providing safe and efficient transportation
                services. Known for punctuality, professionalism, and excellent customer service. Always striving to
                ensure a comfortable and enjoyable ride for all passengers.
              </p>
            </div>

            {/* Achievements */}
            <div className="mt-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Achievements</h2>
              <ul className="space-y-4">
                {[
                  "Driver of the Month - March 2023",
                  "1000 Rides Milestone",
                  "Perfect 5-Star Rating Week",
                ].map((ach, i) => (
                  <li key={i} className="flex items-center text-gray-400 text-sm sm:text-lg">
                    <FiAward className="text-cyan-600 mr-3" /> {ach}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
