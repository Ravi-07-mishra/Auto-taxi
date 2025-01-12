import React, { createContext, useContext, useEffect, useState } from "react";
import { checkDriverAuthStatus, loginDriver, registerDriver } from "../helpers/help-tools";
import axios from "axios";
const AuthContext = createContext(null);

export const DriverAuthProvider = ({ children }) => {
    const [driver, setDriver] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        async function checkStatus() {
            try {
                const data = await checkDriverAuthStatus();
                if (data && data.driver) {
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
            if (data && data.driver) {
                localStorage.setItem("token", data.token); 
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
            if (data && data.driver) {
                localStorage.setItem("token", data.token); 
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
          // Send logout request to the server with POST method
          await axios.post('http://localhost:3000/api/driver/logout', {}, { withCredentials: true });
      
          // Remove token from localStorage
          localStorage.removeItem("token");
      
          // Clear authentication state
          setIsLoggedIn(false);
          setDriver(null);
      
          // Ensure cookie is removed (fallback, optional)
          document.cookie = "driver_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
          // Redirect to the login page
          navigate('/login');
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
