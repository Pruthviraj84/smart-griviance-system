export const VALID_STATUSES = ['Pending', 'Assigned', 'In Progress', 'Completed', 'Verified', 'Resolved', 'Solved', 'Awaiting Verification'];
export const CLOSED_STATUSES = ['Resolved', 'Solved', 'Verified'];
export const WORKLOAD_DONE_STATUSES = ['Completed', 'Resolved', 'Solved', 'Verified'];

export const normalizeStatus = (status) => {
  if (status === 'Solved') return 'Resolved';
  if (status === 'Awaiting Verification') return 'Completed';
  return status;
};

export const escalatePriority = (priority = 'Low') => {
  if (priority === 'Urgent') return 'Urgent';
  if (priority === 'High') return 'Urgent';
  if (priority === 'Medium') return 'High';
  return 'Medium';
};

export const CATEGORY_PRIORITY = {
  Water: 'High',
  Electricity: 'High',
  Security: 'High',
  Internet: 'Medium',
  Cleaning: 'Medium',
  Food: 'Medium',
  Furniture: 'Low',
  Tiles: 'Low',
  Others: 'Low',
};

const CATEGORY_KEYWORDS = {
  Water: ['water', 'tap', 'pipe', 'leak', 'leaking', 'bathroom', 'washroom', 'flush', 'drain', 'geyser'],
  Electricity: ['electric', 'electricity', 'light', 'fan', 'switch', 'socket', 'wire', 'power', 'bulb', 'charging'],
  Security: ['security', 'lock', 'door', 'theft', 'stolen', 'cctv', 'guard', 'unsafe', 'window'],
  Internet: ['internet', 'wifi', 'wi-fi', 'network', 'router', 'lan', 'speed', 'connection'],
  Cleaning: ['clean', 'cleaning', 'dirty', 'dust', 'garbage', 'trash', 'smell', 'hygiene'],
  Food: ['food', 'mess', 'meal', 'breakfast', 'lunch', 'dinner', 'canteen', 'quality'],
  Furniture: ['chair', 'table', 'bed', 'cot', 'mattress', 'cupboard', 'almirah', 'furniture'],
  Tiles: ['tile', 'tiles', 'floor', 'wall', 'crack', 'broken tile'],
};

export const inferComplaintCategory = ({ title = '', description = '', location = '' }) => {
  const text = `${title} ${description} ${location}`.toLowerCase();
  const match = Object.entries(CATEGORY_KEYWORDS).find(([, keywords]) =>
    keywords.some((keyword) => text.includes(keyword))
  );

  return match?.[0] || 'Others';
};

export const toJSON = (doc) => ({
  ...doc,
  _id: doc._id.toString(),
  assigned_worker_id: doc.assigned_worker_id?.toString?.() || doc.assigned_worker_id || null,
  status: normalizeStatus(doc.status),
  before_image: doc.before_image || doc.images || [],
  after_image: doc.after_image || doc.workerProofImages || [],
});

export const workerToJSON = (doc, workload = {}) => ({
  _id: doc._id.toString(),
  id: doc._id.toString(),
  name: doc.name,
  email: doc.email,
  phone: doc.phone || '',
  role: doc.role || 'worker',
  created_at: doc.created_at || doc.createdAt,
  totalAssignedComplaints: workload.total || 0,
  pendingComplaints: workload.pending || 0,
  completedComplaints: workload.completed || 0,
});

export const canManageWorkers = (role) => ['Admin', 'SuperAdmin', 'Super Admin'].includes(role);

export const workerMatchesComplaint = (worker, complaint) =>
  String(complaint.assigned_worker_id || '') === String(worker._id) ||
  complaint.assignedTo === worker.name ||
  complaint.workerName === worker.name;

export const workloadForWorker = (worker, complaintList) => {
  const assigned = complaintList.filter((complaint) => workerMatchesComplaint(worker, complaint));
  return {
    total: assigned.length,
    pending: assigned.filter((complaint) => !WORKLOAD_DONE_STATUSES.includes(normalizeStatus(complaint.status))).length,
    completed: assigned.filter((complaint) => WORKLOAD_DONE_STATUSES.includes(normalizeStatus(complaint.status))).length,
  };
};

export const buildStatusUpdate = (status, actor = 'System') => {
  const normalizedStatus = normalizeStatus(status);
  const update = {
    status: normalizedStatus,
    lastUpdatedAt: new Date(),
  };

  if (normalizedStatus === 'Completed') {
    update.workerSubmittedProof = true;
    update.verificationStatus = 'Worker Completed';
    update.completed_at = new Date();
    update.completedAt = update.completed_at;
  }

  if (normalizedStatus === 'Verified') {
    update.verificationStatus = 'Verified';
    update.verifiedBy = actor;
    update.verifiedAt = new Date();
  }

  if (normalizedStatus === 'Resolved') {
    update.verificationStatus = 'Resolved';
    update.resolvedBy = actor;
    update.resolvedAt = new Date();
    update.completed_at = update.resolvedAt;
    update.completedAt = update.resolvedAt;
    update.studentConfirmed = true;
  }

  if (normalizedStatus === 'In Progress') {
    update.resolvedBy = null;
    update.resolvedAt = null;
    update.started_at = new Date();
    update.startedAt = update.started_at;
  }

  return update;
};
