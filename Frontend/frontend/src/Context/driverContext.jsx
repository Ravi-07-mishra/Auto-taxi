import { createContext, useReducer, useEffect } from "react";
import React from "react";
// Create the context
export const DriverAuthContext = createContext();

// Define the reducer function
export const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            return { driver: action.payload };
        case 'LOGOUT':
            return { driver: null };
        default:
            return state;
    }
};

// Context provider component
export const DriverAuthContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, {
        driver: null,
    });

    // Load driver from localStorage on component mount
    useEffect(() => {
        const driver = JSON.parse(localStorage.getItem('driver'));
        if (driver) {
            dispatch({
                type: 'LOGIN',
                payload: driver,
            });
        }
    }, []);

    console.log('Driver context state:', state);

    return (
        <DriverAuthContext.Provider value={{ ...state, dispatch }}>
            {children}
        </DriverAuthContext.Provider>
    );
};
