import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { toJSON, CLOSED_STATUSES } from '../utils/complaintUtils.js';

const router = express.Router();

router.get('/delayed', verifyToken, requireRole('SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { complaints } = getCollections();
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const delayedComplaints = await complaints.find({
      status: { $in: ['Pending', 'Assigned'] },
      $or: [{ started_at: { $exists: false } }, { started_at: null }],
      createdAt: { $lte: fourDaysAgo }
    }).sort({ createdAt: 1 }).toArray();

    return res.json(delayedComplaints.map(toJSON));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/escalated', verifyToken, requireRole('SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { complaints } = getCollections();
    const escalatedComplaints = await complaints.find({
      escalated: true,
      status: { $nin: CLOSED_STATUSES }
    }).sort({ escalatedAt: -1 }).toArray();

    return res.json(escalatedComplaints.map(toJSON));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.patch('/complaints/:id/override', verifyToken, requireRole('SuperAdmin', 'Super Admin'), async (req, res) => {
  const { id } = req.params;
  const { action, priority } = req.body;
  
  try {
    const { complaints } = getCollections();
    const complaint = await complaints.findOne({ _id: new ObjectId(id) });
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }
    
    let updateFields = { 
      lastUpdatedAt: new Date(),
      resolvedBy: 'SuperAdmin' 
    };
    
    switch (action) {
      case 'complete':
      case 'resolve':
        updateFields.status = 'Resolved';
        updateFields.verificationStatus = 'Resolved';
        updateFields.studentConfirmed = true; 
        updateFields.workerSubmittedProof = true; 
        updateFields.resolvedAt = new Date();
        break;
        
      case 'reopen':
        updateFields.status = 'In Progress';
        updateFields.verificationStatus = 'Pending';
        updateFields.resolvedBy = null;
        break;
        
      case 'changePriority':
        if (priority && ['High', 'Medium', 'Low'].includes(priority)) {
          updateFields.priority = priority;
        } else {
          return res.status(400).json({ message: 'Invalid priority value.' });
        }
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid action. Use: complete, resolve, reopen, or changePriority' });
    }
    
    const result = await complaints.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    return res.json(toJSON(result.value));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
