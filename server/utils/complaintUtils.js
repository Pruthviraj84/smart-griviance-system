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
  Electric: 'High',
  Electrical: 'High',
  Plumbing: 'High',
  Cleaning: 'Medium',
  Internet: 'Medium',
  Furniture: 'Low',
  Security: 'High',
  Other: 'Low',
  Others: 'Low',
};

export const CATEGORY_ALIASES = {
  Electrical: 'Electric',
  Electricity: 'Electric',
  Electric: 'Electric',
  Water: 'Plumbing',
  Other: 'Others',
};

export const normalizeCategory = (category = 'Others') => CATEGORY_ALIASES[category] || category || 'Others';

export const CATEGORY_KEYWORDS = {
  Electric: ['wire', 'switch', 'fan', 'light', 'electricity', 'electric', 'socket', 'power', 'bulb', 'short circuit', 'spark'],
  Plumbing: ['water', 'leakage', 'leak', 'tap', 'pipe', 'bathroom', 'washroom', 'flush', 'drain', 'geyser'],
  Internet: ['wifi', 'wi-fi', 'network', 'internet', 'router', 'lan', 'connection'],
  Furniture: ['bed', 'table', 'chair', 'cupboard', 'almirah', 'mattress', 'furniture'],
  Security: ['security', 'lock', 'broken lock', 'door', 'theft', 'stolen', 'cctv', 'guard', 'safety'],
  Cleaning: ['clean', 'cleaning', 'dirty', 'dust', 'garbage', 'trash', 'smell', 'hygiene'],
  Food: ['food', 'mess', 'meal', 'canteen', 'breakfast', 'lunch', 'dinner'],
  Tiles: ['tile', 'tiles', 'floor', 'wall', 'crack'],
};

export const URGENT_ALLOWED_KEYWORDS = [
  'spark',
  'sparks',
  'major water leakage',
  'fire',
  'security issue',
  'short circuit',
  'broken lock',
  'safety issue',
  'electric shock',
  'smoke',
];

export const PRIORITY_SCORE_KEYWORDS = {
  safety: ['fire', 'spark', 'sparks', 'short circuit', 'security', 'broken lock', 'safety', 'unsafe', 'shock', 'smoke'],
  damage: ['leakage', 'leak', 'flood', 'broken', 'damage', 'crack', 'not working', 'burst'],
  minor: ['noise', 'noisy', 'slow', 'minor', 'loose', 'dirty', 'cleaning', 'small'],
};

export const PRIORITY_KEYWORDS = {
  Urgent: URGENT_ALLOWED_KEYWORDS,
  High: ['major leakage', 'water leakage', 'broken', 'not working', 'failure', 'outage', 'danger', 'unsafe'],
  Medium: ['dirty', 'dusty', 'noisy', 'slow', 'weak', 'partial', 'minor', 'small'],
  Low: ['cosmetic', 'aesthetic', 'suggestion', 'improvement', 'optional'],
};

const includesAny = (text, keywords) => keywords.some((kw) => text.includes(kw));

export const calculatePriorityScore = ({ title = '', description = '' }) => {
  const text = `${title} ${description}`.toLowerCase();
  let score = 0;

  if (includesAny(text, PRIORITY_SCORE_KEYWORDS.safety)) score += 5;
  if (includesAny(text, PRIORITY_SCORE_KEYWORDS.damage)) score += 3;
  if (includesAny(text, PRIORITY_SCORE_KEYWORDS.minor)) score += 1;

  return score || 1;
};

export const recommendedPriorityFromScore = (score) => {
  if (score >= 9) return 'Urgent';
  if (score >= 6) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
};

export const inferPriorityFromText = ({ title = '', description = '' }) =>
  recommendedPriorityFromScore(calculatePriorityScore({ title, description }));

export const inferComplaintCategory = ({ title = '', description = '', location = '' }) => {
  const text = `${title} ${description} ${location}`.toLowerCase();
  const match = Object.entries(CATEGORY_KEYWORDS).find(([, keywords]) => includesAny(text, keywords));

  return match?.[0] || 'Others';
};

export const validateComplaintIntelligence = ({ title = '', description = '', category = '', priority = 'Medium' }) => {
  const normalizedSelectedCategory = normalizeCategory(category);
  const autoDetectedCategory = inferComplaintCategory({ title, description });
  const priorityScore = calculatePriorityScore({ title, description });
  const recommendedPriority = recommendedPriorityFromScore(priorityScore);
  const text = `${title} ${description}`.toLowerCase();
  const validationWarnings = [];

  const categoryMismatch =
    normalizedSelectedCategory &&
    normalizedSelectedCategory !== 'Others' &&
    autoDetectedCategory !== 'Others' &&
    normalizedSelectedCategory !== autoDetectedCategory;

  if (categoryMismatch) {
    validationWarnings.push('Selected category does not match your complaint description. Please select the correct category.');
  }

  const urgentAllowed = includesAny(text, URGENT_ALLOWED_KEYWORDS);
  const urgentMisuse = priority === 'Urgent' && !urgentAllowed && recommendedPriority !== 'Urgent';

  if (urgentMisuse) {
    validationWarnings.push('This issue does not qualify for urgent priority.');
  }

  return {
    autoDetectedCategory,
    validatedCategory: categoryMismatch ? autoDetectedCategory : normalizedSelectedCategory || autoDetectedCategory,
    priorityScore,
    recommendedPriority,
    finalPriority: urgentMisuse ? 'Medium' : priority || recommendedPriority,
    validationWarnings,
    categoryMismatch,
    urgentMisuse,
  };
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
  specialization: doc.specialization || doc.specializations?.[0] || 'General',
  specializations: doc.specializations || (doc.specialization ? [doc.specialization] : []),
  maxWorkload: doc.maxWorkload || 5,
  isActive: doc.isActive !== false,
  activeComplaintsCount: workload.pending || 0,
  availabilityStatus: doc.isActive === false
    ? 'Inactive'
    : (workload.pending || 0) >= (doc.maxWorkload || 5)
      ? 'Busy'
      : 'Available',
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
