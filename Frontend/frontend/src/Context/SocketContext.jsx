import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';

// Create the context
const SocketContext = createContext();

// Custom hook for consuming the context
export const useSocket = () => {
  return useContext(SocketContext);
};

// Provider for the context
export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [isSocketInitialized, setIsSocketInitialized] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:3000', {
      transports: ['websocket', 'polling'], // Include polling as a fallback
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    console.log('Socket initialized:', socketRef.current);

    // Handle connection and error events
    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      setIsSocketInitialized(true);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected. Reason:', reason);
    });

    // Clean up on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log('Socket disconnected on cleanup.');
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {isSocketInitialized ? children : <div>Loading socket...</div>}
    </SocketContext.Provider>
  );
};
