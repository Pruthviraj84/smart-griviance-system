import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

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

    // Create indexes
    await collections.students.createIndex({ email: 1 }, { unique: true });
    await collections.complaints.createIndex({ email: 1 });
    await collections.complaints.createIndex({ status: 1 });
    await collections.complaints.createIndex({ createdAt: -1 });
    await collections.complaints.createIndex({ assigned_worker_id: 1 });
    await collections.complaintArchive.createIndex({ removedAt: -1 });
    await collections.auditLogs.createIndex({ actionAt: -1 });
    await collections.workers.createIndex({ email: 1 }, { unique: true });

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
