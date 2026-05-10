import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import { createServer } from 'http';

import { connectDB, getCollections } from './server/config/db.js';
import { escalatePriority } from './server/utils/complaintUtils.js';
import { initSocket } from './server/utils/socket.js';

import authRoutes from './server/routes/authRoutes.js';
import complaintRoutes from './server/routes/complaintRoutes.js';
import workerRoutes from './server/routes/workerRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';
import superAdminRoutes from './server/routes/superAdminRoutes.js';
import chatRoutes from './server/routes/chatRoutes.js';
import notificationRoutes from './server/routes/notificationRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const app = express();
const httpServer = createServer(app);
const DEFAULT_PORT = parseInt(process.env.PORT) || 4001;
let PORT = DEFAULT_PORT;

const startServer = async () => {
  try {
    await connectDB();
    await initSocket(httpServer);
    const listen = async () => {
      const server = httpServer.listen(PORT);
      server.on('listening', () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📁 Image uploads served at http://localhost:${PORT}/uploads`);
        console.log(`⏰ Auto-escalation cron job scheduled (daily at midnight)`);
      });
      server.on('error', async (err) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`Port ${PORT} in use, trying ${PORT + 1}`);
          PORT += 1;
          server.close();
          await listen();
        } else {
          console.error('Server error:', err);
          process.exit(1);
        }
      });
    };
    await listen();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

app.use('/uploads', express.static(UPLOAD_DIR));

app.use(express.static(path.join(__dirname, 'dist')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.use(cors({
  origin: [
    process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
  ],
}));
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin/workers', workerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// CRON JOB: Auto Priority Escalation
cron.schedule('0 0 * * *', async () => {
  console.log('[CRON] Running priority escalation job...');
  try {
    const { complaints } = getCollections();
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const staleComplaints = await complaints.find({
      status: { $in: ['Pending', 'Assigned'] },
      $or: [{ started_at: { $exists: false } }, { started_at: null }],
      createdAt: { $lte: fourDaysAgo },
    }).toArray();

    let escalatedCount = 0;

    for (const complaint of staleComplaints) {
      const newPriority = escalatePriority(complaint.priority);
      const shouldEscalate = newPriority !== complaint.priority || !complaint.delayed;

      if (shouldEscalate) {
        await complaints.updateOne(
          { _id: complaint._id },
          { 
            $set: { 
              priority: newPriority,
              delayed: true,
              escalated: true,
              escalatedAt: new Date(),
              lastUpdatedAt: new Date(),
              superAdminNotification: `Complaint ID #${complaint._id} has not been processed for 4 days`,
            }
          }
        );
        escalatedCount++;
      }
    }
    console.log(`[CRON] Completed. Escalated ${escalatedCount} complaints.`);
  } catch (error) {
    console.error('[CRON] Error during priority escalation:', error);
  }
});



startServer();
