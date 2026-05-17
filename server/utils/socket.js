import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getCollections } from '../config/db.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

let io = null;

export const initSocket = async (httpServer) => {
  const { Server } = await import('socket.io');
  io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.CLIENT_ORIGIN || 'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5175',
        'http://127.0.0.1:5175',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: no token'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.user?.name || socket.id}`);
    const userId = socket.user?.id || socket.user?._id;

    if (userId) socket.join(`user-${userId}`);
    if (socket.user?.role) socket.join(`role-${socket.user.role}`);
    if (socket.user?.grnNumber) socket.join(`grn-${socket.user.grnNumber}`);

    socket.on('join-room', (complaintId) => {
      socket.join(`complaint-${complaintId}`);
    });

    socket.on('leave-room', (complaintId) => {
      socket.leave(`complaint-${complaintId}`);
    });

    socket.on('typing', ({ complaintId, isTyping }) => {
      socket.to(`complaint-${complaintId}`).emit('typing', {
        userId: socket.user?.id || socket.user?._id,
        name: socket.user?.name,
        isTyping,
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.user?.name || socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const emitNotification = (target, notification) => {
  const userId = target.userId || target.id;
  const isDirectTarget = Boolean(userId || target.grnNumber);
  if (!userId && !target.grnNumber && !target.role) return;
  const payload = {
    ...notification,
    userId: userId?.toString?.() || userId,
    role: isDirectTarget ? undefined : target.role,
    grnNumber: target.grnNumber,
    read: false,
    createdAt: notification.createdAt || new Date(),
  };

  try {
    const { notifications } = getCollections();
    notifications.insertOne(payload).catch((error) => {
      console.error('[Socket] Failed to save notification:', error);
    });
  } catch {
    // Database may not be initialized during early startup or tests.
  }

  if (!io) return;
  if (payload.userId) {
    io.to(`user-${payload.userId}`).emit('notification', payload);
  }
  if (target.grnNumber) {
    io.to(`grn-${target.grnNumber}`).emit('notification', payload);
  }
  if (!isDirectTarget && target.role) {
    io.to(`role-${target.role}`).emit('notification', payload);
  }
};

export const emitToComplaintRoom = (complaintId, event, data) => {
  if (!io) return;
  io.to(`complaint-${complaintId}`).emit(event, data);
};
