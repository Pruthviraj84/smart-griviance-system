import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import { hashPassword } from '../utils/authUtils.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { workerToJSON, workloadForWorker, canManageWorkers, toJSON } from '../utils/complaintUtils.js';

const router = express.Router();

// Get all workers (Admin/SuperAdmin)
router.get('/', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { workers, complaints } = getCollections();
    const workerList = await workers.find({}).sort({ created_at: -1 }).toArray();
    const complaintList = await complaints.find({}).toArray();
    return res.json(workerList.map((worker) => workerToJSON(worker, workloadForWorker(worker, complaintList))));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Add a new worker
router.post('/', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { workers } = getCollections();
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Name, email, phone, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existing = await workers.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Worker email already exists.' });
    }

    const hashedPassword = await hashPassword(password);
    const now = new Date();
    const worker = {
      name,
      email,
      phone,
      role: 'worker',
      password: hashedPassword,
      created_at: now,
      createdAt: now,
    };

    const result = await workers.insertOne(worker);
    return res.status(201).json(workerToJSON({ ...worker, _id: result.insertedId }));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get worker's assigned complaints
router.get('/:id/complaints', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { workers, complaints } = getCollections();
    const worker = await workers.findOne({ _id: new ObjectId(req.params.id) });
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    const assignedComplaints = await complaints.find({
      $or: [
        { assigned_worker_id: worker._id },
        { assigned_worker_id: worker._id.toString() },
        { assignedTo: worker.name },
        { workerName: worker.name },
      ],
    }).sort({ createdAt: -1 }).toArray();

    return res.json(assignedComplaints.map(toJSON));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Delete a worker
router.delete('/:id', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { workers, complaints } = getCollections();
    const worker = await workers.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    await complaints.updateMany(
      {
        $or: [
          { assigned_worker_id: worker._id },
          { assigned_worker_id: worker._id.toString() },
          { assignedTo: worker.name },
          { workerName: worker.name },
        ],
      },
      {
        $set: {
          assigned_worker_id: null,
          assignedTo: 'Not assigned',
          workerName: null,
          workerId: null,
          workerContact: null,
          lastUpdatedAt: new Date(),
        },
      }
    );

    const result = await workers.deleteOne({ _id: worker._id });
    return res.json({ message: 'Worker deleted. Assigned complaints were unassigned.', deletedCount: result.deletedCount });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Worker: Submit proof and complete complaint
router.patch('/complaints/:id/complete', verifyToken, requireRole('Worker'), upload.array('proofImages', 5), async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;
  
  try {
    const { complaints } = getCollections();
    const proofImages = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    if (proofImages.length === 0) {
      return res.status(400).json({ message: 'Solved image proof is required.' });
    }
    
    const result = await complaints.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          workerProofImages: proofImages,
          after_image: proofImages,
          workerRemarks: remarks || '',
          workerSubmittedProof: true,
          status: 'Completed',
          verificationStatus: 'Worker Completed',
          started_at: new Date(),
          startedAt: new Date(),
          completed_at: new Date(),
          completedAt: new Date(),
          lastUpdatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }
    return res.json(toJSON(result.value));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
