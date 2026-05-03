import express from 'express';
import { getCollections } from '../config/db.js';
import { hashPassword, verifyPassword, verifyPasswordLegacy, generateToken } from '../utils/authUtils.js';

const router = express.Router();

router.post('/students/register', async (req, res) => {
  try {
    const { students } = getCollections();
    const { email, password, name, phone, roomNo, hostelBlock } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existing = await students.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Student already registered. Please login.' });
    }

    const hashedPassword = await hashPassword(password);
    const student = { 
      email, 
      password: hashedPassword, 
      name: name || email.split('@')[0],
      phone: phone || '',
      roomNo: roomNo || '',
      hostelBlock: hostelBlock || '',
      role: 'Student',
      isVerified: false,
      createdAt: new Date() 
    };
    
    const result = await students.insertOne(student);
    const token = generateToken({ ...student, _id: result.insertedId });
    
    return res.status(201).json({ 
      message: 'Registered successfully.',
      token,
      user: {
        id: result.insertedId.toString(),
        email: student.email,
        name: student.name,
        role: 'Student'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: error.message });
  }
});

router.post('/students/login', async (req, res) => {
  try {
    const { students } = getCollections();
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const student = await students.findOne({ email });
    if (!student) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatch = await verifyPassword(password, student.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(student);
    return res.json({ 
      token,
      user: {
        id: student._id.toString(),
        email: student.email, 
        name: student.name, 
        role: 'Student' 
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: error.message });
  }
});

router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const adminEmail = 'admin@hostel.com';
  const adminPassword = 'Admin@123';

  if (email === adminEmail && password === adminPassword) {
    const adminUser = {
      _id: 'admin-id',
      email: adminEmail,
      name: 'Hostel Admin',
      role: 'Admin'
    };
    const token = generateToken(adminUser);
    return res.json({ 
      token,
      user: {
        id: adminUser._id,
        email: adminUser.email,
        name: adminUser.name,
        role: 'Admin'
      }
    });
  }
  return res.status(401).json({ message: 'Invalid admin credentials.' });
});

router.post('/superadmin/login', async (req, res) => {
  const { email, password } = req.body;
  const superAdminEmail = 'superadmin@hostel.com';
  const superAdminPassword = 'SuperAdmin@123';

  if (email === superAdminEmail && password === superAdminPassword) {
    const superAdminUser = {
      _id: 'superadmin-id',
      email: superAdminEmail,
      name: 'Super Admin',
      role: 'SuperAdmin'
    };
    const token = generateToken(superAdminUser);
    return res.json({ 
      token,
      user: {
        id: superAdminUser._id,
        email: superAdminUser.email,
        name: superAdminUser.name,
        role: 'SuperAdmin'
      }
    });
  }
  return res.status(401).json({ message: 'Invalid superadmin credentials.' });
});

router.post('/worker/login', async (req, res) => {
  try {
    const { workers } = getCollections();
    const { email, password } = req.body;

    const worker = await workers.findOne({ email });
    
    if (!worker) {
      return res.status(401).json({ message: 'Invalid worker credentials.' });
    }

    let passwordMatch = false;
    try {
      passwordMatch = await verifyPassword(password, worker.password);
    } catch {
      passwordMatch = verifyPasswordLegacy(password, worker.password);
    }

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid worker credentials.' });
    }

    const token = generateToken(worker);
    return res.json({ 
      token,
      user: {
        id: worker._id.toString(),
        email: worker.email, 
        name: worker.name, 
        role: 'Worker' 
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
