import multer from 'multer';

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof multer.MulterError) {
    console.error('[Multer Error]', err);
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Each image must be 5MB or smaller.'
      : err.code === 'LIMIT_UNEXPECTED_FILE'
        ? 'Too many files uploaded. Maximum 5 images are allowed.'
        : err.message;

    return res.status(400).json({ message });
  }

  console.error('[GlobalError]', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
}
