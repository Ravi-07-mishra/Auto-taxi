import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid'; // Add this import

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Create connection with unique ID
    const socketInstance = io('wss://auto-taxi-1.onrender.com', {
      transports: ['websocket'],
      reconnectionAttempts: 3,
      withCredentials: true,
      extraHeaders: {
        'X-Connection-ID': uuidv4() // Now properly defined
      }
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {socket ? children : <div>Connecting...</div>}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);