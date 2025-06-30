// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL2 || 'https://auto-taxi-1.onrender.com';

    // Use only websocket, short timeouts
    const socketInstance = io(socketUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 2,
      reconnectionDelay: 800,
      timeout: 2000,
      secure: true,
      withCredentials: true,
      extraHeaders: {
        'X-Client-Type': 'web-app',
        'X-Request-ID': Date.now().toString()
      }
    });

    socketInstance.on('connect', () => {
      setStatus('connected');
      console.log('✅ WebSocket connected:', socketInstance.id);
    });

    socketInstance.on('connect_error', (err) => {
      setStatus('error');
      console.error('Connection failed:', err.message);
    });

    socketInstance.on('disconnect', () => {
      setStatus('disconnected');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, status }}>
      {status === 'connected' ? children : (
        <div className="connection-status">
          {status === 'error' ? (
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
