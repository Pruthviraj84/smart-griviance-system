import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { toJSON } from '../utils/complaintUtils.js';

const router = express.Router();

// Dashboard Statistics
router.get('/dashboard/stats', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { complaints, workers, students } = getCollections();

    const totalComplaints = await complaints.countDocuments();
    const pendingCount = await complaints.countDocuments({ status: 'Pending' });
    const assignedCount = await complaints.countDocuments({ status: 'Assigned' });
    const inProgressCount = await complaints.countDocuments({ status: 'In Progress' });
    const completedCount = await complaints.countDocuments({ status: 'Completed' });
    const verifiedCount = await complaints.countDocuments({ status: 'Verified' });
    const resolvedCount = await complaints.countDocuments({ status: 'Resolved' });
    
    const delayedComplaints = await complaints.countDocuments({
      status: { $in: ['Pending', 'Assigned', 'In Progress'] },
      createdAt: { $lt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }
    });

    const totalWorkers = await workers.countDocuments();
    const activeWorkers = await workers.countDocuments({ isActive: true });
    const totalStudents = await students.countDocuments();

    // Get complaint counts by category
    const byCategory = await complaints.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    // Get complaint counts by priority
    const byPriority = await complaints.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    return res.json({
      stats: {
        totalComplaints,
        pendingCount,
        assignedCount,
        inProgressCount,
        completedCount,
        verifiedCount,
        resolvedCount,
        delayedComplaints,
        totalWorkers,
        activeWorkers,
        totalStudents,
      },
      byCategory: byCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Detailed Analytics
router.get('/analytics', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { complaints, workers } = getCollections();

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Complaints created in last 24 hours
    const complaintsLast24h = await complaints.countDocuments({
      createdAt: { $gte: twentyFourHoursAgo }
    });

    // Complaints resolved in last 24 hours
    const resolvedLast24h = await complaints.countDocuments({
      status: 'Resolved',
      resolvedAt: { $gte: twentyFourHoursAgo }
    });

    // Complaints created in last 7 days
    const complaintsLast7d = await complaints.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Resolved in last 7 days
    const resolvedLast7d = await complaints.countDocuments({
      status: 'Resolved',
      resolvedAt: { $gte: sevenDaysAgo }
    });

    // Get average resolution time
    const resolvedComplaints = await complaints.find({
      status: 'Resolved',
      resolvedAt: { $exists: true },
      createdAt: { $exists: true }
    }).toArray();

    let avgResolutionTime = 0;
    if (resolvedComplaints.length > 0) {
      const totalTime = resolvedComplaints.reduce((sum, c) => {
        const createdAt = new Date(c.createdAt);
        const resolvedAt = new Date(c.resolvedAt);
        const hours = (resolvedAt - createdAt) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);
      avgResolutionTime = Math.round(totalTime / resolvedComplaints.length);
    }

    // Top workers by completed complaints
    const topWorkers = await complaints.aggregate([
      { $match: { status: 'Resolved', assigned_worker_id: { $exists: true } } },
      { $group: { _id: '$assigned_worker_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).toArray();

    const topWorkerDetails = await Promise.all(
      topWorkers.map(async (worker) => {
        const workerDoc = await workers.findOne({ _id: worker._id });
        return {
          workerId: worker._id.toString(),
          workerName: workerDoc?.name || 'Unknown',
          resolvedCount: worker.count
        };
      })
    );

    return res.json({
      analytics: {
        last24Hours: {
          complaintsCreated: complaintsLast24h,
          complaintsResolved: resolvedLast24h
        },
        last7Days: {
          complaintsCreated: complaintsLast7d,
          complaintsResolved: resolvedLast7d
        },
        avgResolutionTimeHours: avgResolutionTime,
        topWorkers: topWorkerDetails
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

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

router.get('/delayed', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
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

export default router;
