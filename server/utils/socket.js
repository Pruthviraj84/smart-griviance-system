import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

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
  if (!io) return;
  if (target.userId) {
    io.to(`user-${target.userId}`).emit('notification', notification);
  }
  if (target.role) {
    io.to(`role-${target.role}`).emit('notification', notification);
  }
};

export const emitToComplaintRoom = (complaintId, event, data) => {
  if (!io) return;
  io.to(`complaint-${complaintId}`).emit(event, data);
};
