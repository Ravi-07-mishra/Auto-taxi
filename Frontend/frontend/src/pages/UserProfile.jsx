// src/pages/UserProfilePage.jsx
import React, { useEffect, useState, useRef } from "react";
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
  FiUser,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Typography,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert as MuiAlert,
  Skeleton,
} from "@mui/material";

const logError = (message, error) => {
  console.error(message, error);
};

const UserProfilePage = () => {
  const API_BASE = import.meta.env.VITE_API_URL || "https://auto-taxi-1.onrender.com/api";
  const STATIC_BASE = API_BASE.replace('/api', '');
  const fileInputRef = useRef(null);
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("");
  const [avgRating, setAvgRating] = useState("0.0");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/userlogin");
    } else {
      setUserId(user._id);
      setIsLoading(false);
    }
  }, [user, navigate]);

  // Fetch user data
  const fetchUserData = async () => {
    if (!userId) return;
    
    try {
      const response = await axios.get(
        `${API_BASE}/user/profile/${userId}`,
        { withCredentials: true }
      );
      
      if (!response.data || !response.data.data || !response.data.data.user) {
        throw new Error("Invalid response structure");
      }
      
      const updatedUser = response.data.data.user;

      setUserName(updatedUser.name);
      setEmail(updatedUser.email);
      setAvgRating(updatedUser.avgRating || "0.0");

      // Handle profile image URL
      if (updatedUser.profileImage) {
        // Remove leading slash if present
        const cleanPath = updatedUser.profileImage.replace(/^\/+/, '');
        setProfileImage(`${STATIC_BASE}/${cleanPath}`);
      } else {
        setProfileImage(null);
      }
    } catch (error) {
      logError("Error fetching user data:", error);
      setErrorMsg("Failed to load profile data. Please try again later.");
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  // Handle profile image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.match('image.*')) {
      setErrorMsg("Please select a valid image file (JPEG, PNG)");
      setSnackbarOpen(true);
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size should be less than 5MB");
      setSnackbarOpen(true);
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("type", "profile");

    try {
      const response = await axios.post(
        `${API_BASE}/user/uploadProfileImage/${userId}`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data && response.data.imageUrl) {
        // Update profile image with new URL
        setProfileImage(`${STATIC_BASE}${response.data.imageUrl}`);
        setErrorMsg("Profile image updated successfully!");
      } else if (response.data && response.data.profileImage) {
        const cleanPath = response.data.profileImage.replace(/^\/+/, '');
        setProfileImage(`${STATIC_BASE}/${cleanPath}`);
        setErrorMsg("Profile image updated successfully!");
      } else {
        setErrorMsg("Image upload successful but URL not returned");
      }
      
      setSnackbarOpen(true);
    } catch (error) {
      logError("Error uploading profile image:", error);
      setErrorMsg("Failed to upload image. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <CircularProgress size={60} color="primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8"
    >
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <MuiAlert
          onClose={handleCloseSnackbar}
          severity={errorMsg.includes("Failed") ? "error" : "success"}
          sx={{ width: "100%", fontSize: "1rem" }}
        >
          {errorMsg}
        </MuiAlert>
      </Snackbar>

      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800/70 backdrop-blur-lg shadow-2xl rounded-3xl overflow-hidden border border-gray-700">
          {/* Header Section */}
          <div className="relative h-56 bg-gradient-to-r from-indigo-900/70 to-purple-900/70">
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>

            {/* Settings Icons */}
            <div className="absolute top-4 right-4 flex space-x-4">
              <IconButton
                aria-label="Notifications"
                className="bg-gray-800/50 hover:bg-gray-700/70 backdrop-blur-sm"
              >
                <FiBell className="text-white text-xl" />
              </IconButton>
              <IconButton
                aria-label="Settings"
                className="bg-gray-800/50 hover:bg-gray-700/70 backdrop-blur-sm"
              >
                <FiSettings className="text-white text-xl" />
              </IconButton>
            </div>
          </div>

          {/* Profile Info Section */}
          <div className="relative px-4 sm:px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start">
              {/* Profile Image */}
              <div className="relative -mt-20 z-10">
                <div className="relative rounded-full border-4 border-cyan-500 shadow-xl">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={userName}
                      className="w-40 h-40 rounded-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        setProfileImage(null);
                      }}
                    />
                  ) : (
                    <div className="bg-gray-700 border-2 border-dashed rounded-full w-40 h-40 flex items-center justify-center">
                      <FiUser className="text-gray-400 text-6xl" />
                    </div>
                  )}
                  
                  <button
                    onClick={handleCameraClick}
                    disabled={isUploading}
                    className="absolute bottom-2 right-2 bg-cyan-600 hover:bg-cyan-700 rounded-full p-2 transition-all duration-300 shadow-lg"
                  >
                    {isUploading ? (
                      <CircularProgress
                        size={20}
                        className="text-white"
                        aria-label="Uploading"
                      />
                    ) : (
                      <FiCamera className="text-white text-xl" />
                    )}
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    id="profile-image-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </div>
              </div>

              {/* User Info */}
              <div className="mt-6 sm:mt-0 sm:ml-6 text-center sm:text-left">
                <Typography
                  component="h1"
                  className="text-3xl md:text-4xl font-bold text-white"
                >
                  {userName || <Skeleton variant="text" width={200} />}
                </Typography>
                <Typography className="text-gray-300 mt-1">
                  {email || <Skeleton variant="text" width={180} />}
                </Typography>
                <div className="mt-3 flex items-center justify-center sm:justify-start">
                  <FiStar className="text-yellow-500 mr-1 text-xl" />
                  <Typography className="text-xl font-semibold text-white">
                    {avgRating}
                  </Typography>
                  <Typography className="ml-1 text-gray-400">
                    / 5.0
                  </Typography>
                </div>
              </div>

              {/* Edit Profile Button */}
              <Link
                to="/useredit-profile"
                className="mt-6 sm:mt-0 sm:ml-auto px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-full flex items-center hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 shadow-lg"
              >
                <FiEdit2 className="mr-2" />
                Edit Profile
              </Link>
            </div>

            {/* Stats Section */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
              {stats.map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5 }}
                  className="bg-gray-700/50 backdrop-blur-sm rounded-2xl p-5 border border-gray-600 shadow-lg"
                >
                  <div className="flex items-center">
                    <div className="p-3 bg-cyan-900/30 rounded-lg mr-4">
                      <item.icon className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <Typography className="text-gray-400 text-sm">
                        {item.label}
                      </Typography>
                      <Typography className="text-2xl font-bold text-white mt-1">
                        {item.value}
                      </Typography>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* About Section */}
            <div className="mt-10 p-6 bg-gray-700/30 backdrop-blur-sm rounded-2xl border border-gray-600">
              <Typography className="text-2xl font-bold text-white mb-4">
                About Me
              </Typography>
              <Typography className="text-gray-300 leading-relaxed">
                A dedicated and satisfied customer who loves online shopping.
                Always looking for the best deals and products with a high
                standard of quality and customer service. Enjoys exploring new
                brands and creating memorable shopping experiences.
              </Typography>
            </div>

            {/* Recent Activities Section */}
            <div className="mt-10">
              <Typography className="text-2xl font-bold text-white mb-4">
                Recent Activities
              </Typography>
              <ul className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start p-4 bg-gray-700/40 rounded-xl hover:bg-gray-700/60 transition-colors"
                  >
                    <div className="p-2 bg-cyan-900/20 rounded-lg mt-1 mr-4">
                      <activity.icon className="text-cyan-400" />
                    </div>
                    <div>
                      <Typography className="text-gray-100">
                        {activity.text}
                      </Typography>
                      <Typography className="text-sm text-cyan-400 mt-1">
                        {activity.time}
                      </Typography>
                    </div>
                  </motion.li>
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