import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const CLOUDINARY_FOLDER = 'hostel-grievance-system/complaints';

const uploadSingleToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
          if (error) {
            console.error('[Cloudinary] upload_stream error for file:', file.originalname || file.filename || '<unknown>', error?.message || error);
            return reject(error);
          }
        resolve(result);
      }
    );

    try {
      streamifier.createReadStream(file.buffer).pipe(stream);
    } catch (e) {
      reject(e);
    }
  });
};

async function run() {
  const dummyBuffer = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
  const file = {
    originalname: 'test.gif',
    buffer: dummyBuffer
  };
  try {
    const result = await uploadSingleToCloudinary(file);
    console.log("Success:", result);
  } catch (err) {
    console.error("Failed:", err);
  }
}

run();
