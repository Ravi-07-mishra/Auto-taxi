import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setStatus] = useState('connecting');

  useEffect(() => {
    // Use VITE_API_URL2 from .env or fallback
    const socketUrl = import.meta.env.VITE_API_URL2 || 'https://auto-taxi-1.onrender.com';
    
    const socketInstance = io(socketUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 5000,
      secure: true,
      withCredentials: true,
      extraHeaders: {
        'X-Client-Type': 'web-app',
        'X-Request-ID': Date.now().toString()
      }
    });

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected:', socketInstance.id);
      setStatus('connected');
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Connection failed:', err.message);
      setStatus('error');
    });

    socketInstance.on('disconnect', () => {
      setStatus('disconnected');
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, status }}>
      {connectionStatus === 'connected' ? children : (
        <div className="connection-status">
          {connectionStatus === 'error' ? (
            <div className="text-red-500">Connection failed - retrying...</div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
              <span>Connecting to server...</span>
            </div>
          )}
        </div>
      )}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);