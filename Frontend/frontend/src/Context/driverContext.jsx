import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  checkDriverAuthStatus,
  loginDriver,
  registerDriver,
} from "../helpers/help-tools";

const AuthContext = createContext(null);

export const DriverAuthProvider = ({ children }) => {
  // ─── Backend Base URL ───────────────────────────────────────────
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const [driver, setDriver] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkStatus() {
      try {
        const data = await checkDriverAuthStatus();
        if (data?.driver) {
          setDriver(data.driver);
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
      const data = await loginDriver(email, password);
      if (data?.driver) {
        localStorage.setItem("driver_token", data.token);
        setDriver(data.driver);
        setIsLoggedIn(true);
      }
      return data;
    } catch (error) {
      console.error("Login failed:", error.message);
      throw error;
    }
  };

  const signup = async (formData) => {
    try {
      const data = await registerDriver(formData);
      if (data?.driver) {
        localStorage.setItem("driver_token", data.token);
        setDriver(data.driver);
        setIsLoggedIn(true);
      }
      return data;
    } catch (error) {
      console.error("Signup failed:", error.message);
      throw new Error("Signup failed");
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        `${API_BASE}/api/driver/logout`,
        {},
        { withCredentials: true }
      );

      localStorage.removeItem("driver_token");
      setIsLoggedIn(false);
      setDriver(null);

      document.cookie =
        "driver_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      navigate("/driverlogin");
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  const value = {
    driver,
    isLoggedIn,
    login,
    logout,
    signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useDriverAuth = () => {
  return useContext(AuthContext);
};