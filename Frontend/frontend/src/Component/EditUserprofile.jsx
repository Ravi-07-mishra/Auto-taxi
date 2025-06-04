import React, { useEffect, useState } from "react";
import { useAuth } from "../Context/userContext";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiLock } from "react-icons/fi";
import axios from "axios";
import { toast } from "react-hot-toast";
import { CircularProgress } from "@mui/material";

const EditUserProfilePage = () => {
  // ─── Backend Base URL ───────────────────────────────────────────
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, setUser } = useAuth();

  // Initialize form fields with current user details
  useEffect(() => {
    if (user) {
      setUserName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Prepare payload; include password fields only if newPassword is provided
      const payload = { name: userName, email };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      const response = await axios.put(
        `${API_BASE}/user/updateProfile`,
        payload,
        { withCredentials: true }
      );
      // Update user context with new details
      setUser(response.data.user);
      toast.success("Profile updated successfully!");
      // Clear password fields on success
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update profile. Please try again."
      );
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6"
    >
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl p-8">
        <h2 className="text-3xl font-bold text-center text-white mb-6">
          Edit Profile
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field */}
          <div className="relative">
            <label htmlFor="name" className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiUser className="text-gray-400" />
            </label>
            <input
              type="text"
              id="name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition duration-300"
              placeholder="Name"
              required
            />
          </div>
          {/* Email Field */}
          <div className="relative">
            <label htmlFor="email" className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiMail className="text-gray-400" />
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition duration-300"
              placeholder="Email"
              required
            />
          </div>
          {/* Current Password Field */}
          <div className="relative">
            <label htmlFor="currentPassword" className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiLock className="text-gray-400" />
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition duration-300"
              placeholder="Current Password"
              required={newPassword ? true : false}
            />
          </div>
          {/* New Password Field (Optional) */}
          <div className="relative">
            <label htmlFor="newPassword" className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiLock className="text-gray-400" />
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-10 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition duration-300"
              placeholder="New Password (leave blank to keep current)"
            />
          </div>
          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-lg transition-colors duration-300"
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default EditUserProfilePage;
