import { getCollections } from '../config/db.js';
import { ObjectId } from 'mongodb';

/**
 * Count active complaints for a worker (Assigned + In Progress only)
 * Do NOT count: Completed, Verified, Resolved
 */
export const countActiveTasksForWorker = async (workerId) => {
  const { complaints } = getCollections();
  if (!workerId) return 0;
  
  const count = await complaints.countDocuments({
    assigned_worker_id: new ObjectId(workerId),
    status: { $in: ['Assigned', 'In Progress'] }
  });
  
  return count;
};

/**
 * Find best worker based on:
 * 1. Worker specialization matches category
 * 2. Active workload (only count Assigned + In Progress)
 * 3. Worker is active and within capacity
 * 4. Highest rating as tiebreaker
 */
export const findBestWorker = async (complaint) => {
  const { workers, complaints } = getCollections();
  const category = complaint.category || 'Others';

  // Get all active workers
  const activeWorkers = await workers.find({ isActive: true }).toArray();
  if (!activeWorkers.length) return { worker: null, reason: 'No active workers available' };

  // Score each worker
  const scoredWorkers = await Promise.all(
    activeWorkers.map(async (worker) => {
      // Check specialization match
      const specializationMatch = (worker.specializations || []).includes(category);
      
      // Count ONLY active tasks (Assigned + In Progress)
      const activeTaskCount = await countActiveTasksForWorker(worker._id);
      const maxWorkload = worker.maxWorkload || 5;
      const withinCapacity = activeTaskCount < maxWorkload;
      
      const rating = worker.rating || 0;
      const completedCount = worker.totalCompleted || 0;

      return {
        worker,
        specializationMatch,
        activeTaskCount,
        withinCapacity,
        rating,
        completedCount,
        maxWorkload,
      };
    })
  );

  // Filter workers within capacity
  const eligible = scoredWorkers.filter((s) => s.withinCapacity);
  
  if (!eligible.length) {
    return { 
      worker: null, 
      reason: 'No workers available within capacity. All workers are at/over max workload.',
      availableWorkers: scoredWorkers.length,
      overloadedCount: scoredWorkers.filter(s => !s.withinCapacity).length
    };
  }

  // Sort by:
  // 1. Specialization match (matched first)
  // 2. Lowest active task count (least busy)
  // 3. Highest rating (better performer)
  eligible.sort((a, b) => {
    if (a.specializationMatch !== b.specializationMatch) {
      return b.specializationMatch - a.specializationMatch;
    }
    if (a.activeTaskCount !== b.activeTaskCount) {
      return a.activeTaskCount - b.activeTaskCount;
    }
    return b.rating - a.rating;
  });

  const bestWorker = eligible[0];
  return {
    worker: bestWorker.worker,
    reason: null,
    selectedInfo: {
      specialization: bestWorker.specializationMatch ? 'matched' : 'not-matched',
      activeTaskCount: bestWorker.activeTaskCount,
      maxWorkload: bestWorker.maxWorkload,
      rating: bestWorker.rating,
    }
  };
};
