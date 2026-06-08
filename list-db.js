import { connectDB } from './server/config/db.js';

async function run() {
  const collections = await connectDB();
  const students = await collections.students.find({}).toArray();
  console.log("Students:");
  students.forEach(s => {
    console.log(`GRN: ${s.grnNumber}, Name: ${s.name}, PasswordHash: ${s.password}`);
  });

  const complaints = await collections.complaints.find({}).toArray();
  console.log("\nComplaints count:", complaints.length);
  process.exit(0);
}

run();
