import { connectDB } from './server/config/db.js';

async function run() {
  const collections = await connectDB();
  const latestComplaint = await collections.complaints.findOne({}, { sort: { createdAt: -1 } });
  console.log("Latest Complaint Document from MongoDB:");
  console.log(JSON.stringify(latestComplaint, null, 2));
  process.exit(0);
}

run();
