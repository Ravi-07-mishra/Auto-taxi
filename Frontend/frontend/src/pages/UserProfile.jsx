import React, { useEffect, useState } from "react";
import { useAuth } from "../Context/userContext";
import { motion } from "framer-motion";
import { FiStar, FiAward, FiShoppingBag, FiClock, FiEdit2, FiCamera, FiSettings, FiBell } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { CircularProgress } from "@mui/material";

const UserProfilePage = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [userName, setUserName] = useState("Jane Doe");
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("janedoe@gmail.com");
  const [avgRating, setAvgRating] = useState("4.9");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      // Redirect to login if not authenticated
      if (!user) {
        navigate("/userlogin");
      } else {
        setUserId(user._id);
        console.log("User ID set to:", user._id);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [user, navigate]);

  const fetchUserData = async () => {
    if (!userId) return;
    try {
      const response = await axios.get(`http://localhost:3000/api/user/profile/${userId}`, { withCredentials: true });
      const updatedUser = response.data.data.user;
      setUserName(updatedUser.name);
      setUserId(updatedUser._id);
      setEmail(updatedUser.email);
      setAvgRating(updatedUser.avgRating);
      setProfileImage(updatedUser.profileImage ? `http://localhost:3000/${updatedUser.profileImage}` : 'http://localhost:3000/uploads/drivers/profile/image-1738174511665-171767109.png');
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  useEffect(() => {
    if (user) {
      setUserName(user.name);
      setUserId(user._id);
      setEmail(user.email);
      setAvgRating(user.avgRating);
      setProfileImage(user.profileImage ? `http://localhost:3000/${user.profileImage}` : 'http://localhost:3000/uploads/drivers/profile/image-1738174511665-171767109.png');
    }
  }, [user]);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'profile');

    try {
      const response = await axios.post(`http://localhost:3000/api/user/uploadProfileImage/${userId}`, formData, { withCredentials: true });
      if (response.data.profileImage) {
        await fetchUserData();
        toast.success("Profile image updated successfully!");
      }
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toast.error("Failed to upload profile image. Please try again.");
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
    { icon: FiShoppingBag, text: "Placed an order for a new laptop", time: "2 hours ago" },
    { icon: FiStar, text: "Rated a product 5 stars", time: "1 day ago" },
    { icon: FiAward, text: "Achieved Platinum User Level", time: "3 days ago" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 shadow-2xl rounded-3xl overflow-hidden">
          {/* Header Section */}
          <div className="relative h-56 bg-gradient-to-r from-gray-900 to-black">
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent"></div>
            <div className="absolute top-4 right-4 flex space-x-4">
              <button className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition duration-300">
                <FiBell className="text-white text-xl" />
              </button>
              <button className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition duration-300">
                <FiSettings className="text-white text-xl" />
              </button>
            </div>
          </div>

          {/* Profile Info Section */}
          <div className="relative px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-center">
              <div className="relative">
                <img
                  src={profileImage || "http://localhost:3000/uploads/drivers/profile/image-1738174511665-171767109.png"}
                  alt={userName}
                  className="w-40 h-40 rounded-full border-4 border-cyan-500 shadow-lg -mt-20 z-10 object-cover"
                />
                <label
                  htmlFor="profile-image-upload"
                  className="absolute bottom-2 right-2 bg-cyan-500 rounded-full p-2 cursor-pointer hover:bg-cyan-600 transition-all duration-300"
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
              <div className="mt-6 sm:mt-0 sm:ml-6 text-center sm:text-left">
                <h1 className="text-4xl font-bold text-white">{userName}</h1>
                <p className="text-lg text-gray-400">{email}</p>
                <div className="mt-2 flex items-center justify-center sm:justify-start">
                  <FiStar className="text-yellow-500 mr-1" />
                  <span className="text-xl font-semibold text-white">{avgRating}</span>
                  <span className="ml-1 text-gray-400">/ 5.0</span>
                </div>
              </div>
              <Link
                to="/useredit-profile"
                className="mt-6 sm:mt-0 sm:ml-auto px-6 py-3 bg-cyan-600 text-white rounded-full flex items-center hover:bg-cyan-700 transition duration-300"
              >
                <FiEdit2 className="mr-2" />
                Edit Profile
              </Link>
            </div>

            {/* Stats Section */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl p-6 flex flex-col items-center shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <item.icon className="h-10 w-10 text-cyan-500 mb-4" />
                  <h2 className="text-xl font-semibold text-white">{item.label}</h2>
                  <p className="mt-2 text-4xl font-bold text-cyan-500">{item.value}</p>
                </div>
              ))}
            </div>

            {/* About Section */}
            <div className="mt-10">
              <h2 className="text-3xl font-bold text-white mb-6">About Me</h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                A dedicated and satisfied customer who loves online shopping. Always looking for the best deals and products with a high standard of quality and customer service. Enjoys exploring new brands and creating memorable shopping experiences.
              </p>
            </div>

            {/* Recent Activities Section */}
            <div className="mt-10">
              <h2 className="text-3xl font-bold text-white mb-6">Recent Activities</h2>
              <ul className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <li key={index} className="flex items-center text-gray-400 text-lg">
                    <activity.icon className="text-cyan-500 mr-3" />
                    <div>
                      <p>{activity.text}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
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