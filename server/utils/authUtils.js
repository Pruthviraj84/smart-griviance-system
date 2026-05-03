import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id?.toString?.() || user._id,
      email: user.email,
      role: user.role,
      name: user.name 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Legacy support for older passwords
export const verifyPasswordLegacy = (password, storedPassword = '') => {
  if (!storedPassword.includes(':')) return password === storedPassword;
  const [salt, hash] = storedPassword.split(':');
  const candidate = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
};
