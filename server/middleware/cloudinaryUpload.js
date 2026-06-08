import multer from 'multer';

const storage = multer.memoryStorage();

const allowedTypes = /jpeg|jpg|png|webp/;

const fileFilter = (req, file, cb) => {
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, and WEBP images are allowed.'), false);
  }
};

export const complaintImageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter,
});
