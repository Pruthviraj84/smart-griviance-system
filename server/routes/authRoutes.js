import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import { hashPassword, verifyPassword, verifyPasswordLegacy, generateToken } from '../utils/authUtils.js';
import { requireRole, verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/students/register', async (req, res) => {
  try {
    const { students } = getCollections();
    const { grnNumber, password, name, hostelName, roomNumber } = req.body;
    
    if (!grnNumber || !password) {
      return res.status(400).json({ message: 'GRN Number and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existing = await students.findOne({ grnNumber });
    if (existing) {
      return res.status(409).json({ message: 'Student with this GRN Number already registered. Please login.' });
    }

    const hashedPassword = await hashPassword(password);
    const student = { 
      grnNumber, 
      password: hashedPassword, 
      name: name || `Student-${grnNumber}`,
      hostelName: hostelName || '',
      roomNumber: roomNumber || '',
      role: 'Student',
      createdAt: new Date() 
    };
    
    const result = await students.insertOne(student);
    const token = generateToken({ ...student, _id: result.insertedId });
    
    return res.status(201).json({ 
      message: 'Registered successfully.',
      token,
      user: {
        id: result.insertedId.toString(),
        grnNumber: student.grnNumber,
        name: student.name,
        hostelName: student.hostelName,
        roomNumber: student.roomNumber,
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
    const { grnNumber, password } = req.body;
    if (!grnNumber || !password) {
      return res.status(400).json({ message: 'GRN Number and password are required.' });
    }

    const student = await students.findOne({ grnNumber });
    if (!student) {
      return res.status(401).json({ message: 'Invalid GRN Number or password.' });
    }

    const passwordMatch = await verifyPassword(password, student.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid GRN Number or password.' });
    }

    const token = generateToken(student);
    return res.json({ 
      token,
      user: {
        id: student._id.toString(),
        grnNumber: student.grnNumber, 
        name: student.name, 
        hostelName: student.hostelName,
        roomNumber: student.roomNumber,
        role: 'Student' 
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: error.message });
  }
});

router.get('/students/me', verifyToken, requireRole('Student'), async (req, res) => {
  try {
    const { students } = getCollections();
    const student = await students.findOne({ grnNumber: req.user.grnNumber || req.user.email || req.user.name });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    return res.json({
      student: {
        id: student._id.toString(),
        grnNumber: student.grnNumber,
        name: student.name,
        email: student.email || '',
        hostelName: student.hostelName || '',
        roomNumber: student.roomNumber || '',
        role: 'Student',
        avatarUrl: student.avatarUrl || '',
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/students/me', verifyToken, requireRole('Student'), async (req, res) => {
  try {
    const { students } = getCollections();
    const updates = {};
    const { name, hostelName, roomNumber, avatarUrl } = req.body;

    if (typeof name === 'string') updates.name = name.trim();
    if (typeof hostelName === 'string') updates.hostelName = hostelName.trim();
    if (typeof roomNumber === 'string') updates.roomNumber = roomNumber.trim();
    if (typeof avatarUrl === 'string') updates.avatarUrl = avatarUrl.trim();

    const result = await students.findOneAndUpdate(
      { grnNumber: req.user.grnNumber || req.user.email || req.user.name },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    return res.json({
      student: {
        id: result.value._id.toString(),
        grnNumber: result.value.grnNumber,
        name: result.value.name,
        email: result.value.email || '',
        hostelName: result.value.hostelName || '',
        roomNumber: result.value.roomNumber || '',
        role: 'Student',
        avatarUrl: result.value.avatarUrl || '',
      },
    });
  } catch (error) {
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

router.post('/login', async (req, res) => {
  try {
    const { students, workers } = getCollections();
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email / GR Number and password are required.' });
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();

    // 1. Try Student (GR Number exact match)
    const student = await students.findOne({ grnNumber: identifier.trim() });
    if (student) {
      const passwordMatch = await verifyPassword(password, student.password);
      if (passwordMatch) {
        const token = generateToken(student);
        return res.json({
          token,
          user: {
            id: student._id.toString(),
            grnNumber: student.grnNumber,
            name: student.name,
            hostelName: student.hostelName,
            roomNumber: student.roomNumber,
            role: 'Student'
          }
        });
      }
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 2. Try Worker (email match)
    const worker = await workers.findOne({ email: normalizedIdentifier });
    if (worker) {
      let passwordMatch = false;
      try {
        passwordMatch = await verifyPassword(password, worker.password);
      } catch {
        passwordMatch = verifyPasswordLegacy(password, worker.password);
      }
      if (passwordMatch) {
        if (!worker.role) worker.role = 'Worker';
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
      }
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 3. Try Admin
    const adminEmail = 'admin@hostel.com';
    const adminPassword = 'Admin@123';
    if (normalizedIdentifier === adminEmail.toLowerCase() && password === adminPassword) {
      const adminUser = { _id: 'admin-id', email: adminEmail, name: 'Hostel Admin', role: 'Admin' };
      const token = generateToken(adminUser);
      return res.json({
        token,
        user: { id: adminUser._id, email: adminUser.email, name: adminUser.name, role: 'Admin' }
      });
    }

    // 4. Try SuperAdmin
    const superAdminEmail = 'superadmin@hostel.com';
    const superAdminPassword = 'SuperAdmin@123';
    if (normalizedIdentifier === superAdminEmail.toLowerCase() && password === superAdminPassword) {
      const superAdminUser = { _id: 'superadmin-id', email: superAdminEmail, name: 'Super Admin', role: 'SuperAdmin' };
      const token = generateToken(superAdminUser);
      return res.json({
        token,
        user: { id: superAdminUser._id, email: superAdminUser.email, name: superAdminUser.name, role: 'SuperAdmin' }
      });
    }

    return res.status(401).json({ message: 'Invalid credentials.' });
  } catch (error) {
    console.error('Unified login error:', error);
    return res.status(500).json({ message: error.message });
  }
});

router.post('/worker/login', async (req, res) => {
  try {
    const { workers } = getCollections();
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    let worker = await workers.findOne({ email: normalizedEmail });
    
    // For existing workers, ensure role is set
    if (worker && !worker.role) {
      worker.role = 'Worker';
      // Update database to add role if missing
      await workers.updateOne({ _id: worker._id }, { $set: { role: 'Worker' } });
    }
    
    if (!worker) {
      const defaultAccounts = [
        { name: 'Vikram', email: 'vikram@hostel.com', phone: '9876543201', specializations: ['Electric', 'Internet'] },
        { name: 'Rajesh', email: 'rajesh@hostel.com', phone: '9876543202', specializations: ['Plumbing', 'Cleaning'] },
        { name: 'Suresh', email: 'suresh@hostel.com', phone: '9876543203', specializations: ['Electric', 'Plumbing'] },
        { name: 'Amit', email: 'amit@hostel.com', phone: '9876543204', specializations: ['Cleaning', 'Internet'] },
        { name: 'Nitin', email: 'nitin@hostel.com', phone: '9876543205', specializations: ['Plumbing', 'Cleaning', 'Electric'] },
      ];
      const fallback = defaultAccounts.find((account) => account.email === normalizedEmail && password === 'Worker@123');
      if (fallback) {
        const hashedPassword = await hashPassword(password);
        const result = await workers.insertOne({
          name: fallback.name,
          email: fallback.email,
          phone: fallback.phone,
          role: 'Worker',
          password: hashedPassword,
          specializations: fallback.specializations,
          specialization: fallback.specializations[0] || 'General',
          maxWorkload: 5,
          isActive: true,
          rating: 0,
          totalCompleted: 0,
          createdAt: new Date(),
        });
        worker = { ...fallback, _id: result.insertedId, password: hashedPassword, role: 'Worker' };
      }
    }

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

    // Final safety check: ensure role is present in token
    if (!worker.role) {
      worker.role = 'Worker';
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

router.get('/worker/me', verifyToken, requireRole('Worker'), async (req, res) => {
  try {
    const { workers } = getCollections();
    const worker = await workers.findOne({ _id: new ObjectId(req.user.id || req.user._id) });

    if (!worker) {
      return res.status(404).json({ message: 'Worker profile not found.' });
    }

    return res.json({
      worker: {
        id: worker._id.toString(),
        _id: worker._id.toString(),
        name: worker.name,
        email: worker.email,
        phone: worker.phone || '',
        role: 'Worker',
        specialization: worker.specialization || worker.specializations?.[0] || 'General',
        specializations: worker.specializations || [],
        maxWorkload: worker.maxWorkload || 5,
        isActive: worker.isActive !== false,
        availabilityStatus: worker.availabilityStatus || 'Available',
        totalCompleted: worker.totalCompleted || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/admin/me', verifyToken, requireRole('Admin'), async (req, res) => {
  try {
    return res.json({
      admin: {
        id: req.user._id || req.user.id || 'admin-id',
        email: req.user.email || 'admin@hostel.com',
        name: req.user.name || 'Hostel Admin',
        role: 'Admin',
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/superadmin/me', verifyToken, requireRole('SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    return res.json({
      superadmin: {
        id: req.user._id || req.user.id || 'superadmin-id',
        email: req.user.email || 'superadmin@hostel.com',
        name: req.user.name || 'Super Admin',
        role: 'SuperAdmin',
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
