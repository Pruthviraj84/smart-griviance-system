const categoryKeywords = {
  Water: ['water', 'tap', 'pipe', 'leak', 'leaking', 'bathroom', 'washroom', 'flush', 'drain', 'geyser'],
  Electricity: ['electric', 'electricity', 'light', 'fan', 'switch', 'socket', 'wire', 'power', 'bulb', 'charging'],
  Security: ['security', 'lock', 'door', 'theft', 'stolen', 'cctv', 'guard', 'unsafe', 'window'],
  Internet: ['internet', 'wifi', 'wi-fi', 'network', 'router', 'lan', 'speed', 'connection'],
  Cleaning: ['clean', 'cleaning', 'dirty', 'dust', 'garbage', 'trash', 'smell', 'hygiene'],
  Food: ['food', 'mess', 'meal', 'breakfast', 'lunch', 'dinner', 'canteen', 'quality'],
  Furniture: ['chair', 'table', 'bed', 'cot', 'mattress', 'cupboard', 'almirah', 'furniture'],
  Tiles: ['tile', 'tiles', 'floor', 'wall', 'crack', 'broken tile'],
};

export const categoryPriority = {
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

export const statusFlow = ['Pending', 'Assigned', 'In Progress', 'Solved'];

export function displayStatus(item) {
  if (['Resolved', 'Verified', 'Solved'].includes(item.status)) return 'Solved';
  if (['Completed', 'Awaiting Verification'].includes(item.status)) return 'In Progress';
  return item.status || 'Pending';
}

export function inferComplaintCategory({ title = '', description = '', location = '' }) {
  const text = `${title} ${description} ${location}`.toLowerCase();
  const match = Object.entries(categoryKeywords).find(([, keywords]) =>
    keywords.some((keyword) => text.includes(keyword))
  );
  return match?.[0] || 'Others';
}

export function formatDate(value) {
  if (!value) return 'Today';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function hasRole(user, role) {
  return user?.role === role;
}

export function isSolvedComplaint(item) {
  return displayStatus(item) === 'Solved';
}

export function resolutionRate(complaints) {
  if (!complaints.length) return 0;
  const resolved = complaints.filter(isSolvedComplaint).length;
  return Math.round((resolved / complaints.length) * 100);
}

export function workerMatchesComplaint(worker, complaint) {
  const workerId = worker?.id || worker?._id;
  return (
    String(complaint.assigned_worker_id || '') === String(workerId || '') ||
    String(complaint.workerId || '') === String(workerId || '') ||
    complaint.assignedTo === worker?.name ||
    complaint.workerName === worker?.name
  );
}

export function workerWorkload(worker, complaints) {
  const assigned = complaints.filter((complaint) => workerMatchesComplaint(worker, complaint));
  const doneStatuses = ['Completed', 'Verified', 'Resolved', 'Solved'];
  return {
    totalAssignedComplaints: assigned.length,
    pendingComplaints: assigned.filter((complaint) => !doneStatuses.includes(complaint.status)).length,
    completedComplaints: assigned.filter((complaint) => doneStatuses.includes(complaint.status)).length,
  };
}

export function isDelayedComplaint(item) {
  if (isSolvedComplaint(item) || displayStatus(item) === 'In Progress') return false;
  const reference = new Date(item.created_at || item.createdAt || Date.now());
  return Date.now() - reference.getTime() >= 4 * 86400000; // 4 days
}

export function escalatedPriority(priority = 'Low') {
  if (priority === 'Urgent') return 'Urgent';
  if (priority === 'High') return 'Urgent';
  if (priority === 'Medium') return 'High';
  return 'Medium';
}

export function shortId(item) {
  return String(item._id || '000000').slice(-6).toUpperCase();
}

export function imageList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
