import React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { loginUser, signupUser, checkAuthStatus, logoutUser } from "../helpers/help-tools";
import axios from "axios";
const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
  
    useEffect(() => {
      async function checkStatus() {
        const data = await checkAuthStatus();
        if (data) {
          setUser(data.user); 
          setIsLoggedIn(true);
        }
      }
      checkStatus();
    }, []);
  // here login 
    const login = async (email, password) => {
      try {
        const data = await loginUser(email, password);
        if (data) {
          localStorage.setItem("auth_token", data.token); 
          setUser(data.user);  
          setIsLoggedIn(true);
        }
        return data;
      } catch (error) {
        console.error("Login failed:", error.message);
      }
    };
  
    const signup = async (name, email, password, otp) => {
      try {
        const data = await signupUser(name, email, password, otp);
        if (data) {
          localStorage.setItem("auth_token", data.token);  
          setUser(data.user);  
          setIsLoggedIn(true);
        }
        return data;
      } catch (error) {
        console.error("Signup failed:", error.message);
      }
    };
  
    const logout = async () => {
      try {
        await axios.post('http://localhost:3000/api/user/logout', {}, { withCredentials: true });// Your helper function that calls the API
        // Remove token from localStorage
        localStorage.removeItem("auth_token");
      
        // Clear authentication state
        setIsLoggedIn(false);
        setUser(null);
    
        // Ensure cookie is removed (fallback, optional)
        document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/userlogin"; // Redirect to login page
      } catch (err) {
        console.log("Logout Error:", err);
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