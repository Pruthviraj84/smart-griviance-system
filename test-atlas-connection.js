import fs from 'fs';
import { MongoClient } from 'mongodb';

// Read .env file directly
const envContent = fs.readFileSync('.env', 'utf-8');
const mongoUriLine = envContent.split('\n')
  .find(line => line.trim().startsWith('MONGODB_URI='));
const mongoUri = mongoUriLine ? mongoUriLine.trim().split('=').slice(1).join('=') : null;

if (!mongoUri) {
  console.error('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

console.log('Testing MongoDB Atlas connection...');
console.log('URI:', mongoUri.replace(/:[^:]*@/, ':****@')); // Hide password
console.log('');

const client = new MongoClient(mongoUri, {
  serverSelectionTimeoutMS: 10000,
});

try {
  await client.connect();
  const admin = client.db().admin();
  const status = await admin.ping();
  
  if (status.ok === 1) {
    console.log('✅ MongoDB Atlas connection SUCCESSFUL!');
    console.log('✅ Credentials are valid and database is accessible');
  }
  
  process.exit(0);
} catch (err) {
  console.error('❌ MongoDB connection failed!');
  console.error('Error:', err.message);
  process.exit(1);
} finally {
  await client.close();
}
