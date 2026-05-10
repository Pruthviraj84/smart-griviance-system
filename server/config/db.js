import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { hashPassword } from '../utils/authUtils.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'smart-hostel';

const client = new MongoClient(MONGODB_URI);

let db;
let collections = {};

export const connectDB = async () => {
  try {
    await client.connect();
    db = client.db(DB_NAME);
    
    collections.students = db.collection('students');
    collections.complaints = db.collection('complaints');
    collections.complaintArchive = db.collection('complaint_archive');
    collections.auditLogs = db.collection('audit_logs');
    collections.workers = db.collection('workers');
    collections.messages = db.collection('messages');
    collections.notifications = db.collection('notifications');

    // Clean up old index if it exists and remove documents without GRN to avoid duplicate nulls
    try {
      await collections.students.dropIndex("email_1");
    } catch (e) {
      // Index might not exist, ignore
    }
    
    // Remove legacy students without a grnNumber to allow unique index creation
    await collections.students.deleteMany({ grnNumber: { $exists: false } });
    await collections.students.deleteMany({ grnNumber: null });

    // Create indexes
    await collections.students.createIndex({ grnNumber: 1 }, { unique: true });
    await collections.complaints.createIndex({ grnNumber: 1 }); // Updated from email to grnNumber
    await collections.complaints.createIndex({ status: 1 });
    await collections.complaints.createIndex({ createdAt: -1 });
    await collections.complaints.createIndex({ assigned_worker_id: 1 });
    await collections.complaints.createIndex({ grnNumber: 1, category: 1, createdAt: -1 });
    await collections.complaints.createIndex({ urgentMisuse: 1, createdAt: -1 });
    await collections.complaintArchive.createIndex({ removedAt: -1 });
    await collections.auditLogs.createIndex({ actionAt: -1 });
    await collections.workers.createIndex({ email: 1 }, { unique: true });
    await collections.messages.createIndex({ complaintId: 1, createdAt: 1 });
    await collections.notifications.createIndex({ userId: 1, read: 1 });
    await collections.notifications.createIndex({ role: 1, createdAt: -1 });

    const defaultWorkers = [
      { name: 'Vikram', email: 'vikram@hostel.com', phone: '9876543201', role: 'Worker', password: await hashPassword('Worker@123'), specializations: ['Electric', 'Internet'], maxWorkload: 5, isActive: true, rating: 4.5, totalCompleted: 12, createdAt: new Date() },
      { name: 'Rajesh', email: 'rajesh@hostel.com', phone: '9876543202', role: 'Worker', password: await hashPassword('Worker@123'), specializations: ['Plumbing', 'Cleaning'], maxWorkload: 5, isActive: true, rating: 4.2, totalCompleted: 8, createdAt: new Date() },
    ];

    for (const worker of defaultWorkers) {
      const normalizedWorker = { ...worker, email: worker.email.toLowerCase() };
      const existingWorker = await collections.workers.findOne({ email: normalizedWorker.email });
      if (!existingWorker) {
        await collections.workers.insertOne(normalizedWorker);
      }
    }

    // FIX: Set role to 'Worker' for all existing workers missing or with incorrect role
    await collections.workers.updateMany(
      { $or: [{ role: { $exists: false } }, { role: { $ne: 'Worker' } }] },
      { $set: { role: 'Worker' } }
    );

    // Ensure new worker fields exist for legacy records
    await collections.workers.updateMany(
      { specializations: { $exists: false } },
      { $set: { specializations: [], specialization: 'General', maxWorkload: 5, isActive: true, rating: 0, totalCompleted: 0, activeComplaintsCount: 0, availabilityStatus: 'Available' } }
    );

    await collections.workers.updateMany(
      { specialization: { $exists: false } },
      [{ $set: { specialization: { $ifNull: [{ $arrayElemAt: ['$specializations', 0] }, 'General'] } } }]
    );

    await collections.workers.updateMany(
      { activeComplaintsCount: { $exists: false } },
      { $set: { activeComplaintsCount: 0, availabilityStatus: 'Available' } }
    );

    console.log('MongoDB connected successfully');
    return collections;
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1);
  }
};

export const getCollections = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return collections;
};
