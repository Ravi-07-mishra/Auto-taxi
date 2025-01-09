import React, { createContext, useContext, useEffect, useState } from "react";
import { checkDriverAuthStatus, loginDriver, logoutDriver, registerDriver } from "../helpers/help-tools";

const AuthContext = createContext(null);

export const DriverAuthProvider = ({ children }) => {
    const [driver, setDriver] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        async function checkStatus() {
            try {
                const data = await checkDriverAuthStatus();
                if (data && data.driver) {
                    setDriver(data.driver); // Assuming the backend sends a `driver` object
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
            const data = await loginDriver(email, password); // Ensure loginDriver returns the expected response
            if (data && data.driver) {
                localStorage.setItem("token", data.token); // Store the token
                setDriver(data.driver); // Store driver info
                setIsLoggedIn(true);
            }
            return data; // Return the response data for further use
        } catch (error) {
            console.error("Login failed:", error.message);
            throw error; // Ensure error is thrown for proper handling
        }
    };
    

    const signup = async (formData) => {
        try {
            const data = await registerDriver(formData);
            if (data && data.driver) {
                localStorage.setItem("token", data.token); // Store the token in localStorage
                setDriver(data.driver); // Store the entire driver object from the response
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
            await logoutDriver();
            setIsLoggedIn(false);
            setDriver(null);
            localStorage.removeItem("token"); // Remove the token from localStorage
            window.location.reload();
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
