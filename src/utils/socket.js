import { io } from 'socket.io-client';
import { API_BASE } from './api';
import { getToken } from './auth';

let socket = null;

export const connectSocket = () => {
  if (socket) return socket;
  
  const token = getToken();
  if (!token) return null;

  socket = io(API_BASE || window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected');
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Disconnected');
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinComplaintRoom = (complaintId) => {
  if (socket) socket.emit('join-room', complaintId);
};

export const leaveComplaintRoom = (complaintId) => {
  if (socket) socket.emit('leave-room', complaintId);
};

export const sendTyping = (complaintId, isTyping) => {
  if (socket) socket.emit('typing', { complaintId, isTyping });
};
