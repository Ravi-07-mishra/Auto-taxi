// SocketContext.jsx
import React, { createContext, useContext, useRef, useEffect, useState } from "react";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  // ─── Backend Base URL ───────────────────────────────────────────
  const API_BASE =  "http://localhost:3000";
  // const API_BASE = import.meta.env.VITE_API_URL2 || "http://localhost:3000";

  const socketRef = useRef(null);
  const [isSocketInitialized, setIsSocketInitialized] = useState(false);

  useEffect(() => {
    // Initialize socket connection using the base URL
    socketRef.current = io(API_BASE, {
      transports: ["websocket", "polling"], // Include polling as a fallback
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    console.log("Socket initialized:", socketRef.current);

    // Handle connection events
    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
      setIsSocketInitialized(true);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Connection error:", error.message);
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("Socket disconnected. Reason:", reason);
    });

    // Clean up on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log("Socket disconnected on cleanup.");
      }
    };
  }, [API_BASE]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {isSocketInitialized ? children : <div>Loading socket...</div>}
    </SocketContext.Provider>
  );
};
