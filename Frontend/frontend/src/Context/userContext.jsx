import React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { loginUser, signupUser, checkAuthStatus, logoutUser } from "../helpers/help-tools";
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
  
    const login = async (email, password) => {
      try {
        const data = await loginUser(email, password);
        if (data) {
          localStorage.setItem("token", data.token); 
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
          localStorage.setItem("token", data.token);  
          setUser(data.user);  
          setIsLoggedIn(true);
        }
        return data;
      } catch (error) {
        console.error("Signup failed:", error.message);
      }
    };
  
    const logout = async () => {
      await logoutUser();
      setIsLoggedIn(false);
      setUser(null);
      window.location.reload();
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