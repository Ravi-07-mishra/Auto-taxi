import React, { createContext, useContext, useRef, useEffect } from 'react';
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

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:3000'); // Replace with your socket URL
    console.log('Socket initialized:', socketRef.current);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log('Socket disconnected');
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};
