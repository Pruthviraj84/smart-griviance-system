import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

console.log('Testing MongoDB connection...');
console.log('URI:', mongoUri.replace(/:[^:]*@/, ':****@')); // Hide password

const client = new MongoClient(mongoUri, {
  serverSelectionTimeoutMS: 5000,
});

try {
  await client.connect();
  const admin = client.db().admin();
  const status = await admin.ping();
  
  if (status.ok === 1) {
    console.log('✅ MongoDB connection successful!');
    console.log('Connected to:', client.topology.seedlist);
  }
  
  process.exit(0);
} catch (err) {
  console.error('❌ MongoDB connection failed!');
  console.error('Error:', err.message);
  process.exit(1);
} finally {
  await client.close();
}
