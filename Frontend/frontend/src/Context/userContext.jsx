import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  checkAuthStatus,
  loginUser,
  signupUser,
} from "../helpers/help-tools";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ─── Backend Base URL ───────────────────────────────────────────
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkStatus() {
      try {
        const data = await checkAuthStatus();
        if (data?.user) {
          setUser(data.user);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error("Error checking auth status:", error.message);
      }
    }
    checkStatus();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await loginUser(email, password);
      if (data?.user) {
        localStorage.setItem("auth_token", data.token);
        setUser(data.user);
        setIsLoggedIn(true);
      }
      return data;
    } catch (error) {
      console.error("Login failed:", error.message);
      throw error;
    }
  };

  const signup = async (name, email, password, otp) => {
    try {
      const data = await signupUser(name, email, password, otp);
      if (data?.user) {
        localStorage.setItem("auth_token", data.token);
        setUser(data.user);
        setIsLoggedIn(true);
      }
      return data;
    } catch (error) {
      console.error("Signup failed:", error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        `${API_BASE}/user/logout`,
        {},
        { withCredentials: true }
      );
      localStorage.removeItem("auth_token");
      setIsLoggedIn(false);
      setUser(null);
      document.cookie =
        "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      navigate("/userlogin");
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  const value = {
    user,
    isLoggedIn,
    login,
    logout,
    signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};