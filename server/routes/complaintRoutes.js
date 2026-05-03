import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import { upload } from '../middleware/upload.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { 
  inferComplaintCategory, 
  CATEGORY_PRIORITY, 
  toJSON, 
  buildStatusUpdate, 
  normalizeStatus,
  CLOSED_STATUSES 
} from '../utils/complaintUtils.js';

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const { complaints } = getCollections();
    const { role, email } = req.user; // Get from token
    const { page = 1, limit = 10, status, category } = req.query;
    
    let query = {};
    
    // If student, only show their complaints
    if (role === 'Student') {
      query.email = email;
    }
    
    if (status) query.status = normalizeStatus(status);
    if (category) query.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await complaints.countDocuments(query);
    
    const list = await complaints.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    return res.json({
      complaints: list.map(toJSON),
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/', verifyToken, upload.array('images', 5), async (req, res) => {
  try {
    const { complaints } = getCollections();
    const { studentName, email, title, description, category, priority, location, contact } = req.body;
    
    if (!studentName || !email || !title || !description) {
      return res.status(400).json({ message: 'Missing complaint details.' });
    }

    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    const autoCategory = inferComplaintCategory({ title, description, location });
    const finalCategory = autoCategory || category || 'Others';
    const finalPriority = CATEGORY_PRIORITY[finalCategory] || priority || 'Low';

    const complaint = {
      studentName,
      email,
      title,
      description,
      category: finalCategory,
      priority: finalPriority,
      location,
      roomNo: location,
      contact,
      images,
      before_image: images,
      after_image: [],
      workerProofImages: [],
      workerRemarks: '',
      workerSubmittedProof: false,
      studentConfirmed: false,
      studentFeedback: '',
      verificationStatus: 'Pending',
      verifiedBy: null,
      verifiedAt: null,
      escalated: false,
      escalatedAt: null,
      resolvedBy: null,
      resolvedAt: null,
      status: 'Pending',
      assignedTo: 'Not assigned',
      createdAt: new Date(),
      created_at: new Date(),
      lastUpdatedAt: new Date(),
    };

    const result = await complaints.insertOne(complaint);
    return res.status(201).json({ _id: result.insertedId.toString(), ...complaint });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/status', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { complaints } = getCollections();
    const { id } = req.params;
    const { status, actor } = req.body;
    
    const normalizedStatus = normalizeStatus(status);
    const result = await complaints.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: buildStatusUpdate(normalizedStatus, actor || req.user.name) },
      { returnDocument: 'after' }
    );

    if (!result.value) return res.status(404).json({ message: 'Complaint not found.' });
    return res.json(toJSON(result.value));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/assign', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { complaints, workers } = getCollections();
    const { id } = req.params;
    const { assignedTo, workerId } = req.body;
    
    const worker = workerId
      ? await workers.findOne({ _id: new ObjectId(workerId) })
      : await workers.findOne({ name: assignedTo });

    if (!worker) return res.status(404).json({ message: 'Worker not found.' });

    const result = await complaints.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          assigned_worker_id: worker._id,
          assignedTo: worker.name, 
          workerName: worker.name,
          workerId: worker._id.toString(),
          workerContact: worker.phone || 'Not provided',
          status: 'Assigned',
          assigned_at: new Date(),
          lastUpdatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );

    if (!result.value) return res.status(404).json({ message: 'Complaint not found.' });
    return res.json(toJSON(result.value));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/priority', verifyToken, requireRole('SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { complaints } = getCollections();
    const { id } = req.params;
    const { priority } = req.body;
    
    const result = await complaints.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { priority, lastUpdatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result.value) return res.status(404).json({ message: 'Complaint not found.' });
    return res.json(toJSON(result.value));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { complaints, complaintArchive, auditLogs } = getCollections();
    const { id } = req.params;
    const { role, name: actor } = req.user;

    const complaint = await complaints.findOne({ _id: new ObjectId(id) });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    if (!CLOSED_STATUSES.includes(complaint.status)) {
      return res.status(400).json({ message: 'Only solved complaints can be removed.' });
    }

    const removedAt = new Date();
    await complaintArchive.insertOne({
      ...complaint,
      originalComplaintId: complaint._id,
      removedBy: actor,
      removedByRole: role,
      removedAt,
      archiveReason: 'Solved complaint removed from active dashboard',
    });

    await auditLogs.insertOne({
      complaintId: complaint._id,
      action: 'REMOVE_SOLVED_COMPLAINT',
      actor,
      role,
      actionAt: removedAt,
    });
    
    const result = await complaints.deleteOne({ _id: new ObjectId(id) });
    return res.json({ message: 'Complaint archived successfully.', deletedCount: result.deletedCount });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
