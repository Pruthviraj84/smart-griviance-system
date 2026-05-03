import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { toJSON } from '../utils/complaintUtils.js';

const router = express.Router();

router.patch('/complaints/:id/verify', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'verify', 'resolve', or 'reject'
  
  try {
    const { complaints } = getCollections();
    const complaint = await complaints.findOne({ _id: new ObjectId(id) });
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found.' });
    }
    
    let updateFields = { lastUpdatedAt: new Date() };
    
    if (action === 'verify' || action === 'approve') {
      if (!complaint.workerSubmittedProof && !complaint.workerProofImages?.length) {
        return res.status(400).json({ 
          message: 'Cannot verify: Worker solved image proof is required.' 
        });
      }
      updateFields.status = 'Verified';
      updateFields.verificationStatus = 'Verified';
      updateFields.verifiedBy = 'Admin';
      updateFields.verifiedAt = new Date();
    } else if (action === 'resolve') {
      updateFields.status = 'Resolved';
      updateFields.verificationStatus = 'Resolved';
      updateFields.resolvedBy = 'Admin';
      updateFields.resolvedAt = new Date();
      updateFields.studentConfirmed = true;
    } else if (action === 'reject') {
      // Reject - send back to In Progress
      updateFields.status = 'In Progress';
      updateFields.verificationStatus = 'Rejected';
      updateFields.workerSubmittedProof = false;
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
