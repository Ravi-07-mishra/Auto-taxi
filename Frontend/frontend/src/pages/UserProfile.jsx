// src/pages/UserProfilePage.jsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../Context/userContext";
import { motion } from "framer-motion";
import {
  FiStar,
  FiAward,
  FiShoppingBag,
  FiClock,
  FiEdit2,
  FiCamera,
  FiSettings,
  FiBell,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert as MuiAlert,
} from "@mui/material";

// ----------------------------------------
// Logging Helper
// ----------------------------------------
const logError = (message, error) => {
  // In production, replace with Sentry, LogRocket, etc.
  console.error(message, error);
};

const UserProfilePage = () => {
  // ─── Backend Base URL ───────────────────────────────────────────
  const API_BASE =
    import.meta.env.VITE_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://api.yourdomain.com"
      : "http://localhost:3000");

  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState("Jane Doe");
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("janedoe@gmail.com");
  const [avgRating, setAvgRating] = useState("4.9");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  // For error/success feedback
  const [errorMsg, setErrorMsg] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // ─── Redirect if not authenticated & set userId ─────────────────
  useEffect(() => {
    // Keep the 1-second delay exactly as before
    const timeout = setTimeout(() => {
      if (!user) {
        navigate("/userlogin");
      } else {
        setUserId(user._id);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [user, navigate]);

  // ─── Fetch user data from API ───────────────────────────────────
  const fetchUserData = async () => {
    if (!userId) return;
    try {
      const response = await axios.get(
        `${API_BASE}/api/user/profile/${userId}`,
        { withCredentials: true }
      );
      const updatedUser = response.data.data.user;

      setUserName(updatedUser.name);
      setEmail(updatedUser.email);
      setAvgRating(updatedUser.avgRating);

      setProfileImage(
        updatedUser.profileImage
          ? `${API_BASE}/${updatedUser.profileImage}`
          : null
      );
    } catch (error) {
      logError("Error fetching user data:", error);
      setErrorMsg("Failed to load profile data.");
      setSnackbarOpen(true);
    }
  };

  // ─── Fetch data when userId is set ───────────────────────────────
  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ─── Update local state when user context changes ────────────────
  useEffect(() => {
    if (user) {
      setUserName(user.name);
      setUserId(user._id);
      setEmail(user.email);
      setAvgRating(user.avgRating);

      setProfileImage(
        user.profileImage
          ? `${API_BASE}/${user.profileImage}`
          : `${API_BASE}/uploads/users/profile/default.png`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ─── Handle profile image upload ─────────────────────────────────
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("type", "profile");

    try {
      const response = await axios.post(
        `${API_BASE}/api/user/uploadProfileImage/${userId}`,
        formData,
        { withCredentials: true }
      );
      if (response.data.profileImage) {
        await fetchUserData();
      }
    } catch (error) {
      logError("Error uploading profile image:", error);
      setErrorMsg("Failed to upload image.");
      setSnackbarOpen(true);
    } finally {
      setIsUploading(false);
    }
  };

  const stats = [
    { icon: FiShoppingBag, label: "Total Orders", value: "150" },
    { icon: FiClock, label: "Hours Spent Shopping", value: "800" },
    { icon: FiAward, label: "User Level", value: "Platinum" },
  ];

  const recentActivities = [
    {
      icon: FiShoppingBag,
      text: "Placed an order for a new laptop",
      time: "2 hours ago",
    },
    { icon: FiStar, text: "Rated a product 5 stars", time: "1 day ago" },
    {
      icon: FiAward,
      text: "Achieved Platinum User Level",
      time: "3 days ago",
    },
  ];

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8"
    >
      {/* Snackbar for errors/success messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <MuiAlert
          onClose={handleCloseSnackbar}
          severity={errorMsg.startsWith("Failed") ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {errorMsg}
        </MuiAlert>
      </Snackbar>

      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 shadow-2xl rounded-3xl overflow-hidden">
          {/* Header Section */}
          <div className="relative h-56 bg-gradient-to-r from-gray-900 to-black">
            {/* Gradient overlay at bottom */}
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent"></div>

            {/* Bell & Settings icons */}
            <div className="absolute top-4 right-4 flex space-x-4">
              <IconButton
                aria-label="Notifications"
                sx={{
                  bgcolor: "rgba(55,65,81,0.8)",
                  "&:hover": { bgcolor: "rgba(75,85,99,0.8)" },
                }}
              >
                <FiBell className="text-white text-xl" />
              </IconButton>
              <IconButton
                aria-label="Settings"
                sx={{
                  bgcolor: "rgba(55,65,81,0.8)",
                  "&:hover": { bgcolor: "rgba(75,85,99,0.8)" },
                }}
              >
                <FiSettings className="text-white text-xl" />
              </IconButton>
            </div>
          </div>

          {/* Profile Info Section */}
          <div className="relative px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start">
              {/* Profile Image */}
              <div className="relative">
                <img
                  src={
                    profileImage ||
                    `${API_BASE}/uploads/users/profile/default.png`
                  }
                  alt={userName}
                  className="w-40 h-40 rounded-full border-4 border-cyan-500 shadow-lg -mt-20 z-10 object-cover"
                />
                <label
                  htmlFor="profile-image-upload"
                  className="absolute bottom-2 right-2 bg-cyan-500 rounded-full p-2 cursor-pointer hover:bg-cyan-600 transition-all duration-300"
                >
                  {isUploading ? (
                    <CircularProgress
                      size={20}
                      sx={{ color: "#fff" }}
                      aria-label="Uploading"
                    />
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

              {/* Name, Email, Rating */}
              <div className="mt-6 sm:mt-0 sm:ml-6 text-center sm:text-left">
                <Typography
                  component="h1"
                  className="text-4xl font-bold text-white"
                >
                  {userName}
                </Typography>
                <Typography className="text-lg text-gray-400">
                  {email}
                </Typography>
                <div className="mt-2 flex items-center justify-center sm:justify-start">
                  <FiStar className="text-yellow-500 mr-1" />
                  <Typography className="text-xl font-semibold text-white">
                    {avgRating}
                  </Typography>
                  <Typography className="ml-1 text-gray-400">
                    / 5.0
                  </Typography>
                </div>
              </div>

              {/* Edit Profile Button */}
              <Link
                to="/useredit-profile"
                className="mt-6 sm:mt-0 sm:ml-auto px-6 py-3 bg-cyan-600 text-white rounded-full flex items-center hover:bg-cyan-700 transition duration-300"
              >
                <FiEdit2 className="mr-2" />
                Edit Profile
              </Link>
            </div>

            {/* Stats Section */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.map((item, index) => (
                <Box
                  key={index}
                  className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl p-6 flex flex-col items-center shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <item.icon className="h-10 w-10 text-cyan-500 mb-4" />
                  <Typography className="text-xl font-semibold text-white">
                    {item.label}
                  </Typography>
                  <Typography className="mt-2 text-4xl font-bold text-cyan-500">
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </div>

            {/* About Section */}
            <div className="mt-10">
              <Typography className="text-3xl font-bold text-white mb-6">
                About Me
              </Typography>
              <Typography className="text-gray-400 leading-relaxed text-lg">
                A dedicated and satisfied customer who loves online shopping.
                Always looking for the best deals and products with a high
                standard of quality and customer service. Enjoys exploring new
                brands and creating memorable shopping experiences.
              </Typography>
            </div>

            {/* Recent Activities Section */}
            <div className="mt-10">
              <Typography className="text-3xl font-bold text-white mb-6">
                Recent Activities
              </Typography>
              <ul className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <li
                    key={index}
                    className="flex items-center text-gray-400 text-lg"
                  >
                    <activity.icon className="text-cyan-500 mr-3" />
                    <div>
                      <Typography>{activity.text}</Typography>
                      <Typography className="text-sm text-gray-500">
                        {activity.time}
                      </Typography>
                    </div>
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

export default UserProfilePage;
