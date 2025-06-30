import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setStatus] = useState('disconnected');

  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_APP_WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 5000,
      withCredentials: true,
      forceNew: true
    });

    // Connection events
    socketInstance.on('connect', () => {
      setStatus('connected');
      console.log('WebSocket connected:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      setStatus('disconnected');
    });

    socketInstance.on('connect_error', (err) => {
      setStatus('error');
      console.error('Connection error:', err.message);
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connectionStatus }}>
      {connectionStatus === 'connected' ? children : (
        <div className="connection-status">
          {connectionStatus === 'error' ? (
            <p>Connection failed. Retrying...</p>
          ) : (
            <p>Establishing secure connection...</p>
          )}
        </div>
      )}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);