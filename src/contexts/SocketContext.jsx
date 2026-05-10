import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '../utils/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const socket = connectSocket();
      if (socket) {
        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        if (socket.connected) setIsConnected(true);

        return () => {
          socket.off('connect', onConnect);
          socket.off('disconnect', onDisconnect);
        };
      }
    } else {
      disconnectSocket();
      setIsConnected(false);
    }
  }, [isAuthenticated]);

  const on = useCallback((event, handler) => {
    const socket = getSocket();
    if (socket) socket.on(event, handler);
    return () => {
      if (socket) socket.off(event, handler);
    };
  }, []);

  const off = useCallback((event, handler) => {
    const socket = getSocket();
    if (socket) socket.off(event, handler);
  }, []);

  const emit = useCallback((event, data) => {
    const socket = getSocket();
    if (socket) socket.emit(event, data);
  }, []);

  const value = { isConnected, on, off, emit };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
