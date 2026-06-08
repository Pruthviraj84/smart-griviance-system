import express from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import { upload } from '../middleware/upload.js';
import { complaintImageUpload } from '../middleware/cloudinaryUpload.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validateComplaint } from '../middleware/validateComplaint.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import * as complaintController from '../controllers/complaintController.js';
import {
  CATEGORY_PRIORITY, 
  inferPriorityFromText,
  validateComplaintIntelligence,
  normalizeCategory,
  toJSON, 
  normalizeStatus,
  CLOSED_STATUSES 
} from '../utils/complaintUtils.js';
import { findBestWorker, countActiveTasksForWorker } from '../utils/autoAssign.js';
import { emitNotification, emitToComplaintRoom } from '../utils/socket.js';

const router = express.Router();

const submissionBuckets = new Map();

const checkSubmissionRateLimit = (key) => {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const maxSubmissions = 8;
  const recent = (submissionBuckets.get(key) || []).filter((time) => now - time < windowMs);

  if (recent.length >= maxSubmissions) return false;
  recent.push(now);
  submissionBuckets.set(key, recent);
  return true;
};

const hasAssignedWorker = (complaint = {}) =>
  Boolean(
    complaint.assignedWorkerId ||
    complaint.assigned_worker_id ||
    complaint.workerId ||
    (complaint.assignedTo && complaint.assignedTo !== 'Not assigned')
  );

const assignedWorkerNotificationTarget = (complaint = {}) => {
  const id = complaint.assignedWorkerId || complaint.assigned_worker_id || complaint.workerId;
  return id ? { role: 'Worker', id } : {};
};

const refreshWorkerAvailability = async (workerId) => {
  if (!workerId) return;
  const { workers } = getCollections();
  const activeComplaintsCount = await countActiveTasksForWorker(workerId);
  const worker = await workers.findOne({ _id: new ObjectId(workerId) });
  if (!worker) return;

  const maxWorkload = worker.maxWorkload || 5;
  const availabilityStatus = worker.isActive === false
    ? 'Inactive'
    : activeComplaintsCount >= maxWorkload
      ? 'Busy'
      : 'Available';

  await workers.updateOne(
    { _id: worker._id },
    { $set: { activeComplaintsCount, availabilityStatus, updatedAt: new Date() } }
  );
};

const assignWorkerToComplaint = async ({ complaint, worker, adminName, estimatedCompletionTime, reason = 'Manual assignment', action = 'Assigned' }) => {
  const { complaints } = getCollections();
  const assignedDate = new Date();
  const assignmentEntry = {
    workerId: worker._id,
    workerName: worker.name,
    assignedBy: adminName,
    assignedAt: assignedDate,
    estimatedCompletionTime: estimatedCompletionTime || null,
    action,
    reason,
  };

  const result = await complaints.findOneAndUpdate(
    { _id: complaint._id },
    {
      $set: {
        assigned_worker_id: worker._id,
        assignedWorkerId: worker._id.toString(),
        assignedWorkerName: worker.name,
        assignedTo: worker.name,
        workerName: worker.name,
        workerId: worker._id.toString(),
        workerContact: worker.phone || 'Not provided',
        status: 'Assigned',
        assignedAt: assignedDate,
        assigned_at: assignedDate,
        assignedDate,
        assignedBy: adminName,
        assignedByAdmin: adminName,
        estimatedCompletionTime: estimatedCompletionTime || null,
        lastUpdatedAt: new Date(),
      },
      $push: { assignmentHistory: assignmentEntry },
    },
    { returnDocument: 'after' }
  );

  await refreshWorkerAvailability(worker._id);

  emitNotification({ role: 'Worker', id: worker._id }, {
    type: action === 'Reassigned' ? 'task_reassigned' : 'task_assigned',
    message: action === 'Reassigned' ? 'Complaint reassigned to you.' : 'New complaint assigned.',
    complaintId: complaint._id.toString(),
    createdAt: new Date(),
  });

  emitNotification({ role: 'Student', grnNumber: complaint.grnNumber }, {
    type: 'complaint_assigned',
    message: 'Your complaint has been assigned to a worker.',
    complaintId: complaint._id.toString(),
    createdAt: new Date(),
  });

  emitToComplaintRoom(complaint._id.toString(), 'complaint_updated', {
    type: action === 'Reassigned' ? 'complaint_reassigned' : 'complaint_assigned',
    message: `Complaint assigned to ${worker.name}`,
    complaint: toJSON(result.value),
  });

  return result.value;
};

// Shared handler for status updates
const updateComplaintStatus = async (req, res) => {
  try {
    const { complaints } = getCollections();
    const { id } = req.params;
    const { status } = req.body;
    
    const normalizedStatus = normalizeStatus(status);
    const complaint = await complaints.findOne({ _id: new ObjectId(id) });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    if (complaint.status === 'Resolved') {
      return res.status(400).json({ message: 'Resolved complaints are locked and cannot be changed.' });
    }

    const allowedTransitions = {
      Pending: ['Assigned'],
      Assigned: ['In Progress'],
      'In Progress': ['Completed'],
      Completed: ['Verified'],
      Verified: ['Resolved'],
    };

    if (!allowedTransitions[complaint.status]?.includes(normalizedStatus)) {
      return res.status(400).json({
        message: `Invalid status transition from ${complaint.status} to ${normalizedStatus}.`,
      });
    }

    if (normalizedStatus === 'Assigned' && !complaint.assigned_worker_id && !complaint.workerId) {
      return res.status(400).json({ message: 'Please assign a worker before changing complaint status.' });
    }

    const completionProofImage = complaint.completionImage || complaint.after_image?.[0] || complaint.workerProofImages?.[0];

    if (['Verified', 'Resolved'].includes(normalizedStatus) && !completionProofImage) {
      return res.status(400).json({ message: 'Completion image is required before verification' });
    }

    if (normalizedStatus === 'Verified' && complaint.status !== 'Completed') {
      return res.status(400).json({ message: 'Complaint must be Completed before it can be Verified.' });
    }

    if (normalizedStatus === 'Resolved' && complaint.status !== 'Verified') {
      return res.status(400).json({ message: 'Complaint must be Verified before it can be Resolved.' });
    }

    const nextUpdate = {
      status: normalizedStatus,
      lastUpdatedAt: new Date(),
    };

    if (completionProofImage && !complaint.completionImage) {
      nextUpdate.completionImage = completionProofImage;
    }

    if (normalizedStatus === 'Verified') {
      nextUpdate.verifiedAt = new Date();
      nextUpdate.verifiedBy = req.user.id || req.user._id?.toString() || req.user.name;
      nextUpdate.verifiedByName = req.user.name;
      nextUpdate.verificationStatus = 'Verified';

      emitNotification({ role: 'Student', grnNumber: complaint.grnNumber }, {
        type: 'complaint_verified',
        message: 'Your complaint has been verified',
        complaintId: id,
        createdAt: new Date(),
      });

      emitNotification(assignedWorkerNotificationTarget(complaint), {
        type: 'complaint_verified',
        message: 'Your work has been verified',
        complaintId: id,
        createdAt: new Date(),
      });
    }

    if (normalizedStatus === 'Resolved') {
      nextUpdate.resolvedAt = new Date();
      nextUpdate.resolvedBy = req.user.id || req.user._id?.toString() || req.user.name;
      nextUpdate.verificationStatus = 'Resolved';

      emitNotification({ role: 'Student', grnNumber: complaint.grnNumber }, {
        type: 'complaint_resolved',
        message: 'Your complaint has been resolved',
        complaintId: id,
        createdAt: new Date(),
      });

      emitNotification(assignedWorkerNotificationTarget(complaint), {
        type: 'complaint_resolved',
        message: 'Your work has been verified',
        complaintId: id,
        createdAt: new Date(),
      });
    }

    const result = await complaints.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: nextUpdate },
      { returnDocument: 'after' }
    );

    if (!result.value) return res.status(404).json({ message: 'Complaint not found.' });

    emitToComplaintRoom(id, 'complaint_updated', {
      type: 'status_updated',
      message: `Status updated to ${normalizedStatus}.`,
      complaint: toJSON(result.value),
    });

    return res.json(toJSON(result.value));
  } catch (error) {
    console.error('[complaintRoutes:updateComplaintStatus]', error);
    return res.status(500).json({ message: error.message });
  }
};

router.get('/', verifyToken, asyncWrapper(complaintController.getAllComplaints));

router.post('/', verifyToken, complaintImageUpload.array('images', 5), validateComplaint, asyncWrapper(complaintController.createComplaint));

router.put('/:id', verifyToken, complaintImageUpload.array('images', 5), validateComplaint, asyncWrapper(complaintController.updateComplaint));

// Routes for status update (both patterns supported)
router.patch('/status/:id', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), updateComplaintStatus);
router.patch('/:id/status', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), updateComplaintStatus);

// Admin: Verify Completed Complaint
router.patch('/verify/:id', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { complaints } = getCollections();
    const { id } = req.params;
    const adminId = req.user.id || req.user._id?.toString() || req.user.name;
    const adminName = req.user.name;

    const complaint = await complaints.findOne({ _id: new ObjectId(id) });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    if (complaint.status === 'Verified') {
      return res.status(400).json({ message: 'Complaint is already verified.' });
    }

    if (complaint.status !== 'Completed') {
      return res.status(400).json({ message: 'Only completed complaints can be verified.' });
    }

    const completionProofImage = complaint.completionImage || complaint.after_image?.[0] || complaint.workerProofImages?.[0];
    if (!completionProofImage) {
      return res.status(400).json({ message: 'No completion image found to verify.' });
    }

    const result = await complaints.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'Verified',
          completionImage: completionProofImage,
          verifiedAt: new Date(),
          verifiedBy: adminId,
          verifiedByName: adminName,
          verificationStatus: 'Verified',
          lastUpdatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    emitToComplaintRoom(id, 'complaint_updated', {
      type: 'work_verified',
      message: 'Admin verified the work completion.',
      complaint: toJSON(result.value),
    });

    emitNotification({ role: 'Student', grnNumber: complaint.grnNumber }, {
      type: 'complaint_verified',
      message: 'Your complaint has been verified',
      complaintId: id,
      createdAt: new Date(),
    });

    emitNotification(assignedWorkerNotificationTarget(complaint), {
      type: 'complaint_verified',
      message: 'Work verified by admin',
      complaintId: id,
      createdAt: new Date(),
    });

    return res.json(toJSON(result.value));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/assign-worker/:id', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { complaints, workers } = getCollections();
    const { id } = req.params;
    const { workerId, estimatedCompletionTime } = req.body;

    if (!workerId) {
      return res.status(400).json({ success: false, message: 'Please select a worker before assigning complaint.' });
    }

    const complaint = await complaints.findOne({ _id: new ObjectId(id) });
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (complaint.status !== 'Pending' || hasAssignedWorker(complaint)) {
      return res.status(400).json({ success: false, message: 'Only pending unassigned complaints can be assigned manually.' });
    }

    const worker = await workers.findOne({ _id: new ObjectId(workerId), role: 'Worker' });
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    if (worker.isActive === false) {
      return res.status(400).json({ success: false, message: 'Selected worker is currently inactive.' });
    }

    const activeComplaintsCount = await countActiveTasksForWorker(worker._id);
    if (activeComplaintsCount >= (worker.maxWorkload || 5)) {
      return res.status(400).json({ success: false, message: 'Selected worker is at maximum workload.' });
    }

    const updated = await assignWorkerToComplaint({
      complaint,
      worker,
      adminName: req.user.name || 'Hostel Admin',
      estimatedCompletionTime,
      reason: 'Manual assignment',
      action: 'Assigned',
    });

    return res.json({
      success: true,
      message: 'Worker assigned successfully',
      complaint: toJSON(updated),
    });
  } catch (error) {
    console.error('[complaintRoutes:assign-worker]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/assign', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { complaints, workers } = getCollections();
    const { id } = req.params;
    const { assignedTo, workerId, estimatedCompletionTime } = req.body;
    const adminName = req.user.name;
    const currentComplaint = await complaints.findOne({ _id: new ObjectId(id) });

    if (!currentComplaint) return res.status(404).json({ message: 'Complaint not found.' });
    if (currentComplaint.status === 'Verified') {
      return res.status(400).json({ message: 'Verified complaints cannot be reassigned.' });
    }
    
    const worker = workerId
      ? await workers.findOne({ _id: new ObjectId(workerId) })
      : await workers.findOne({ name: assignedTo });

    if (!worker) return res.status(404).json({ message: 'Worker not found.' });

    const assignedDate = new Date();
    const assignmentEntry = {
      workerId: worker._id,
      workerName: worker.name,
      assignedBy: adminName,
      assignedAt: assignedDate,
      estimatedCompletionTime: estimatedCompletionTime || null,
      action: currentComplaint.assigned_worker_id ? 'Reassigned' : 'Assigned',
    };

    const result = await complaints.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          assigned_worker_id: worker._id,
          assignedWorkerId: worker._id.toString(),
          assignedWorkerName: worker.name,
          assignedTo: worker.name, 
          workerName: worker.name,
          workerId: worker._id.toString(),
          workerContact: worker.phone || 'Not provided',
          status: 'Assigned',
          assignedAt: assignedDate,
          assigned_at: assignedDate,
          assignedDate,
          lastUpdatedAt: new Date(),
          assignedBy: adminName,
          assignedByAdmin: adminName,
          estimatedCompletionTime: estimatedCompletionTime || null,
        },
        $push: { assignmentHistory: assignmentEntry },
      },
      { returnDocument: 'after' }
    );

    if (!result.value) return res.status(404).json({ message: 'Complaint not found.' });
    await refreshWorkerAvailability(worker._id);

    // Emit notifications
    emitNotification({ role: 'Worker', id: worker._id }, {
      type: 'task_assigned',
      message: `New complaint assigned to you: ${currentComplaint.title}`,
      complaintId: id,
      createdAt: new Date(),
    });

    emitNotification({ role: 'Student', grnNumber: currentComplaint.grnNumber }, {
      type: 'complaint_assigned',
      message: `Your complaint has been assigned to ${worker.name}`,
      complaintId: id,
      createdAt: new Date(),
    });

    emitToComplaintRoom(id, 'complaint_updated', {
      type: 'complaint_assigned',
      message: `Complaint assigned to ${worker.name}`,
      complaint: toJSON(result.value),
    });

    console.log(`[complaintRoutes:assign] Complaint ${id} assigned to ${worker.name} by ${adminName}`);
    return res.json(toJSON(result.value));
  } catch (error) {
    console.error('[complaintRoutes:assign]', error);
    return res.status(500).json({ message: error.message });
  }
});

// Get delayed complaints (pending or in-progress for more than 4 days)
router.get('/delayed/list', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { complaints } = getCollections();
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    
    const delayedComplaints = await complaints.find({
      status: { $in: ['Assigned', 'In Progress'] },
      createdAt: { $lt: fourDaysAgo }
    }).sort({ createdAt: 1 }).toArray();
    
    return res.json({
      count: delayedComplaints.length,
      complaints: delayedComplaints.map(c => ({
        _id: c._id,
        title: c.title,
        status: c.status,
        assignedTo: c.assignedTo,
        category: c.category,
        priority: c.priority,
        createdAt: c.createdAt,
        daysOpen: Math.floor((Date.now() - new Date(c.createdAt)) / (24 * 60 * 60 * 1000)),
        grnNumber: c.grnNumber
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Get worker workload info
router.get('/workers/workload', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { workers, complaints } = getCollections();
    
    const workerList = await workers.find({}).toArray();
    const complaintList = await complaints.find({}).toArray();
    
    const workerWorkload = await Promise.all(
      workerList.map(async (worker) => {
        const activeCount = await countActiveTasksForWorker(worker._id);
        const completedToday = complaintList.filter(c => 
          c.assigned_worker_id && 
          c.assigned_worker_id.toString() === worker._id.toString() &&
          c.status === 'Completed' &&
          new Date(c.lastUpdatedAt).toDateString() === new Date().toDateString()
        ).length;
        const status = worker.isActive ? (activeCount >= (worker.maxWorkload || 5) ? 'Busy' : 'Available') : 'Inactive';
        
        return {
          _id: worker._id,
          id: worker._id.toString(),
          name: worker.name,
          specialization: worker.specialization || worker.specializations?.[0] || 'General',
          specializations: worker.specializations || [],
          activeTaskCount: activeCount,
          activeComplaintsCount: activeCount,
          maxWorkload: worker.maxWorkload || 5,
          totalCompleted: worker.totalCompleted || 0,
          rating: worker.rating || 0,
          isActive: worker.isActive,
          workloadPercentage: Math.round((activeCount / (worker.maxWorkload || 5)) * 100),
          completedToday,
          status,
          availabilityStatus: status,
        };
      })
    );
    
    return res.json(workerWorkload);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/:id', verifyToken, asyncWrapper(complaintController.getComplaintById));

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

router.post('/:id/auto-assign', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { complaints, workers } = getCollections();
    const { id } = req.params;
    
    const complaint = await complaints.findOne({ _id: new ObjectId(id) });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
    if (complaint.status === 'Verified' || complaint.status === 'Resolved') {
      return res.status(400).json({ message: 'Verified/Resolved complaints cannot be reassigned.' });
    }
    
    // Find best worker based on skills and workload
    const assignmentResult = await findBestWorker(complaint);
    const bestWorker = assignmentResult.worker;
    
    if (!bestWorker) {
      // NO WORKER FOUND - Keep status as Pending
      return res.status(400).json({ 
        message: assignmentResult.reason || 'No suitable active worker found.',
        details: assignmentResult,
        complaintId: id,
        status: 'Pending' // Status should remain Pending
      });
    }

    // WORKER FOUND - Now update status to Assigned
    const activeTaskCount = await countActiveTasksForWorker(bestWorker._id);
    const assignedDate = new Date();
    
    const result = await complaints.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          assigned_worker_id: bestWorker._id,
          assignedWorkerId: bestWorker._id.toString(),
          assignedWorkerName: bestWorker.name,
          assignedTo: bestWorker.name, 
          workerName: bestWorker.name,
          workerId: bestWorker._id.toString(),
          workerContact: bestWorker.phone || 'Not provided',
          status: 'Assigned', // ONLY change status when worker is actually assigned
          assignedAt: assignedDate,
          assigned_at: assignedDate,
          assignedDate,
          assignedBy: req.user.name || 'System',
          assignedByAdmin: req.user.name || 'System',
          autoAssigned: true,
          lastUpdatedAt: new Date() 
        },
        $push: {
          assignmentHistory: {
            workerId: bestWorker._id,
            workerName: bestWorker.name,
            assignedBy: req.user.name || 'System',
            assignedAt: assignedDate,
            action: 'Auto Assigned',
          },
        },
      },
      { returnDocument: 'after' }
    );

    if (!result.value) return res.status(404).json({ message: 'Complaint not found.' });
    await refreshWorkerAvailability(bestWorker._id);

    // Notify worker of assignment
    emitNotification({ role: 'Worker', id: bestWorker._id }, {
      type: 'task_assigned',
      message: `New complaint assigned to you: ${complaint.title}`,
      complaintId: id,
      priority: complaint.priority,
      category: complaint.category,
      createdAt: new Date(),
    });

    // Notify student
    emitNotification({ role: 'Student', grnNumber: complaint.grnNumber }, {
      type: 'complaint_assigned',
      message: `Your complaint has been assigned to ${bestWorker.name}`,
      complaintId: id,
      createdAt: new Date(),
    });

    // Real-time socket update
    emitToComplaintRoom(id, 'complaint_updated', {
      type: 'auto_assigned',
      message: `Complaint auto-assigned to ${bestWorker.name} (Active tasks: ${activeTaskCount}/${bestWorker.maxWorkload})`,
      complaint: toJSON(result.value),
    });

    console.log(`[auto-assign] Complaint ${id} assigned to ${bestWorker.name} (Tasks: ${activeTaskCount}/${bestWorker.maxWorkload || 5})`);
    
    return res.json({
      ...toJSON(result.value),
      assignmentInfo: {
        workerName: bestWorker.name,
        activeTaskCount,
        maxWorkload: bestWorker.maxWorkload || 5,
        specializationMatch: assignmentResult.selectedInfo?.specialization,
      }
    });
  } catch (error) {
    console.error('[complaintRoutes:auto-assign]', error);
    return res.status(500).json({ message: error.message });
  }
});

// Reassign worker with history tracking
router.patch('/:id/reassign', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { complaints } = getCollections();
    const { id } = req.params;
    const { workerId, estimatedCompletionTime } = req.body;
    const adminName = req.user.name;
    
    const complaint = await complaints.findOne({ _id: new ObjectId(id) });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
    if (complaint.status === 'Resolved') {
      return res.status(400).json({ message: 'Resolved complaints cannot be reassigned.' });
    }
    
    const { workers } = getCollections();
    const worker = await workers.findOne({ _id: new ObjectId(workerId) });
    if (!worker) return res.status(404).json({ message: 'Worker not found.' });
    
    const previousWorker = complaint.assignedTo;
    const reassignmentHistory = complaint.reassignmentHistory || [];
    reassignmentHistory.push({
      previousWorker,
      previousWorkerId: complaint.assigned_worker_id,
      newWorker: worker.name,
      newWorkerId: worker._id,
      reassignedBy: adminName,
      reassignedAt: new Date(),
      reason: req.body.reason || 'Admin reassignment',
      estimatedCompletionTime: estimatedCompletionTime || null,
    });
    const assignedDate = new Date();
    
    const result = await complaints.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          assigned_worker_id: worker._id,
          assignedWorkerId: worker._id.toString(),
          assignedWorkerName: worker.name,
          assignedTo: worker.name,
          workerName: worker.name,
          workerId: worker._id.toString(),
          assignedDate,
          assignedAt: assignedDate,
          assignedBy: adminName,
          assignedByAdmin: adminName,
          estimatedCompletionTime: estimatedCompletionTime || complaint.estimatedCompletionTime || null,
          reassignmentHistory,
          lastUpdatedAt: new Date()
        },
        $push: {
          assignmentHistory: {
            workerId: worker._id,
            workerName: worker.name,
            assignedBy: adminName,
            assignedAt: assignedDate,
            estimatedCompletionTime: estimatedCompletionTime || null,
            action: 'Reassigned',
          },
        },
      },
      { returnDocument: 'after' }
    );
    await refreshWorkerAvailability(worker._id);
    if (complaint.assigned_worker_id) await refreshWorkerAvailability(complaint.assigned_worker_id);
    
    // Notify new worker
    emitNotification({ role: 'Worker', id: worker._id }, {
      type: 'task_reassigned',
      message: `You have been reassigned complaint: ${complaint.title}`,
      complaintId: id,
      createdAt: new Date(),
    });
    
    console.log(`[reassign] Complaint ${id} reassigned from ${previousWorker} to ${worker.name}`);
    return res.json(toJSON(result.value));
  } catch (error) {
    console.error('[complaintRoutes:reassign]', error);
    return res.status(500).json({ message: error.message });
  }
});

router.post('/:id/rate', verifyToken, requireRole('Student'), async (req, res) => {
  try {
    const { complaints } = getCollections();
    const { id } = req.params;
    const { rating, feedback } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }
    
    const result = await complaints.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { studentRating: rating, studentFeedback: feedback || '', lastUpdatedAt: new Date() } },
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

    await complaintController.deleteComplaint(complaint);

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

// Worker: Start Work (Assigned → In Progress)
router.patch('/:id/start-work', verifyToken, requireRole('Worker'), async (req, res) => {
  try {
    const { complaints } = getCollections();
    const { id } = req.params;
    const { name: workerName } = req.user;

    const complaint = await complaints.findOne({ _id: new ObjectId(id) });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    // Verify worker is assigned to this complaint
    const workerId = req.user.id || req.user._id;
    if (
      complaint.assignedTo !== workerName &&
      complaint.workerName !== workerName &&
      String(complaint.assignedWorkerId || '') !== String(workerId || '') &&
      String(complaint.assigned_worker_id || '') !== String(workerId || '') &&
      String(complaint.workerId || '') !== String(workerId || '')
    ) {
      return res.status(403).json({ message: 'You are not assigned to this complaint.' });
    }

    // Only allow transition from Assigned to In Progress
    if (complaint.status !== 'Assigned') {
      return res.status(400).json({ 
        message: `Cannot start work. Current status is ${complaint.status}. Must be 'Assigned'.` 
      });
    }

    const result = await complaints.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'In Progress',
          workStartedAt: new Date(),
          lastUpdatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    emitToComplaintRoom(id, 'complaint_updated', {
      type: 'work_started',
      message: `${workerName} started working on this complaint.`,
      complaint: toJSON(result.value)
    });

    return res.json(toJSON(result.value));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Worker: Mark as Completed with Image Proof
router.patch('/:id/complete-work', verifyToken, requireRole('Worker'), upload.single('completionImage'), async (req, res) => {
  try {
    const { complaints } = getCollections();
    const { id } = req.params;
    const { remarks } = req.body;
    const { name: workerName } = req.user;

    if (!req.file) {
      return res.status(400).json({ message: 'Completion image proof is required.' });
    }

    const complaint = await complaints.findOne({ _id: new ObjectId(id) });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    // Verify worker is assigned
    const workerId = req.user.id || req.user._id;
    if (
      complaint.assignedTo !== workerName &&
      complaint.workerName !== workerName &&
      String(complaint.assignedWorkerId || '') !== String(workerId || '') &&
      String(complaint.assigned_worker_id || '') !== String(workerId || '') &&
      String(complaint.workerId || '') !== String(workerId || '')
    ) {
      return res.status(403).json({ message: 'You are not assigned to this complaint.' });
    }

    // Only allow completion from In Progress or Assigned status
    if (!['In Progress', 'Assigned'].includes(complaint.status)) {
      return res.status(400).json({ 
        message: `Cannot complete work. Current status is ${complaint.status}.` 
      });
    }

    const completionImage = `/uploads/${req.file.filename}`;

    const result = await complaints.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'Completed',
          completionImage,
          after_image: [completionImage],
          workerProofImages: [completionImage],
          remarks: remarks || '',
          workerRemarks: remarks || '',
          workerSubmittedProof: true,
          workCompletedAt: new Date(),
          lastUpdatedAt: new Date(),
          verificationStatus: 'Awaiting'
        } 
      },
      { returnDocument: 'after' }
    );

    emitNotification({ role: 'Admin' }, {
      type: 'work_completed',
      message: `${complaint.title} marked as completed by worker. Awaiting verification.`,
      complaintId: id,
      createdAt: new Date(),
    });
    emitNotification({ role: 'SuperAdmin' }, {
      type: 'work_completed',
      message: `${complaint.title} marked as completed by worker. Awaiting verification.`,
      complaintId: id,
      createdAt: new Date(),
    });

    emitToComplaintRoom(id, 'complaint_updated', {
      type: 'work_completed',
      message: `${workerName} completed the work. Image proof uploaded.`,
      complaint: toJSON(result.value)
    });

    return res.json(toJSON(result.value));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Admin: Verify Completed Work
router.patch('/:id/verify', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { complaints } = getCollections();
    const { id } = req.params;
    const { adminName } = req.user;

    const complaint = await complaints.findOne({ _id: new ObjectId(id) });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    // Only allow verification of completed complaints
    if (complaint.status !== 'Completed') {
      return res.status(400).json({ 
        message: `Cannot verify. Complaint status must be 'Completed', not '${complaint.status}'.` 
      });
    }

    const completionProofImage = complaint.completionImage || complaint.after_image?.[0] || complaint.workerProofImages?.[0];
    if (!completionProofImage) {
      return res.status(400).json({ message: 'No completion image found to verify.' });
    }

    const result = await complaints.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'Verified',
          completionImage: completionProofImage,
          verifiedBy: adminName || req.user.name,
          verifiedAt: new Date(),
          verificationStatus: 'Verified',
          lastUpdatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    emitToComplaintRoom(id, 'complaint_updated', {
      type: 'work_verified',
      message: 'Admin verified the work completion.',
      complaint: toJSON(result.value),
    });

    emitNotification({ role: 'Student', grnNumber: complaint.grnNumber }, {
      type: 'complaint_verified',
      message: `Your complaint "${complaint.title}" has been verified as resolved.`,
      complaintId: id,
      createdAt: new Date(),
    });

    return res.json(toJSON(result.value));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Reject verification and send back to In Progress
router.patch('/:id/reject-verification', verifyToken, requireRole('Admin', 'SuperAdmin', 'Super Admin'), async (req, res) => {
  try {
    const { complaints } = getCollections();
    const { id } = req.params;
    const { reason } = req.body;

    const complaint = await complaints.findOne({ _id: new ObjectId(id) });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });

    if (complaint.status !== 'Completed') {
      return res.status(400).json({ message: 'Only completed complaints can be rejected.' });
    }

    const result = await complaints.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'In Progress',
          verificationStatus: 'Rejected',
          rejectionReason: reason || '',
          lastUpdatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );

    emitToComplaintRoom(id, 'complaint_updated', {
      type: 'verification_rejected',
      message: `Your work on "${complaint.title}" was rejected. Reason: ${reason || 'See details'}`,
      complaintId: id,
      createdAt: new Date(),
    });

    emitNotification(assignedWorkerNotificationTarget(complaint), {
      type: 'verification_rejected',
      message: `Your work on "${complaint.title}" was rejected. Reason: ${reason || 'See details'}`,
      complaintId: id,
      createdAt: new Date(),
    });

    return res.json(toJSON(result.value));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
