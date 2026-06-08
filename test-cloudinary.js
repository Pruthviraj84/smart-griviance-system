import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

console.log("Environment check:");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);
console.log("CLOUDINARY_API_SECRET exists:", !!process.env.CLOUDINARY_API_SECRET);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

async function runTest() {
  try {
    console.log("Pinging Cloudinary API...");
    // Try pinging or uploading a dummy 1x1 image
    const result = await cloudinary.uploader.upload("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", {
      folder: 'test-folder'
    });
    console.log("Ping/Upload Success!");
    console.log("Result:", result);
  } catch (error) {
    console.error("Cloudinary upload failed:");
    console.error(error);
  }
}

runTest();
