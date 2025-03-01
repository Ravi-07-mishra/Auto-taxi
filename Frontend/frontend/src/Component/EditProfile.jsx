import React, { useState, useEffect } from "react";
import { useDriverAuth } from "../Context/driverContext";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiLock, FiCamera } from "react-icons/fi";
import axios from "axios";
import { toast } from "react-hot-toast";
import { CircularProgress } from "@mui/material";

const EditProfilePage = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [driverName, setDriverName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { driver } = useDriverAuth();

  useEffect(() => {
    if (driver) {
      setDriverName(driver.name);
      setEmail(driver.email);
      setProfileImage(driver.profileImage ? `http://localhost:3000/${driver.profileImage}` : null);
    }
  }, [driver]);

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("profileImage", file);
      formData.append("driverId", driver._id);

      try {
        const response = await axios.post("http://localhost:3000/api/driver/uploadProfileImage", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        });
        setProfileImage(`http://localhost:3000/${response.data.profileImage}`);
        toast.success("Profile image updated successfully!");
      } catch (error) {
        console.error("Error uploading profile image:", error);
        toast.error("Failed to upload profile image. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.put(
        "http://localhost:3000/api/driver/updateProfile",
        { name: driverName, email, password },
        { withCredentials: true },
      );
      console.log("Profile updated:", response.data);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-md mx-auto bg-gray-800 shadow-2xl rounded-3xl overflow-hidden">
        <div className="px-6 py-8">
          <h2 className="text-3xl font-bold text-center text-white mb-8">Edit Profile</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Upload */}
            <div className="flex justify-center">
              <div className="relative group">
                <img
                  src={profileImage || "/placeholder-avatar.jpg"}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-cyan-500 group-hover:border-cyan-400 transition-all duration-300"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <label htmlFor="profileImageInput" className="cursor-pointer">
                    <FiCamera className="text-white text-3xl bg-cyan-500 rounded-full p-2 hover:bg-cyan-600 transition-all duration-300" />
                  </label>
                </div>
                <input
                  type="file"
                  id="profileImageInput"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="pl-10 block w-full bg-gray-700 border-gray-600 rounded-md text-white focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-400"
                  placeholder="Enter your name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full bg-gray-700 border-gray-600 rounded-md text-white focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-400"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                New Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full bg-gray-700 border-gray-600 rounded-md text-white focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-400"
                  placeholder="Enter new password (optional)"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : "Save Changes"}
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default EditProfilePage;