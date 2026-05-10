const categoryKeywords = {
  Plumbing: ['water', 'tap', 'pipe', 'leak', 'leaking', 'leakage', 'bathroom', 'washroom', 'flush', 'drain', 'geyser'],
  Electric: ['electric', 'electricity', 'light', 'fan', 'switch', 'socket', 'wire', 'power', 'bulb', 'charging', 'short circuit', 'spark'],
  Security: ['security', 'lock', 'door', 'theft', 'stolen', 'cctv', 'guard', 'unsafe', 'window'],
  Internet: ['internet', 'wifi', 'wi-fi', 'network', 'router', 'lan', 'speed', 'connection'],
  Cleaning: ['clean', 'cleaning', 'dirty', 'dust', 'garbage', 'trash', 'smell', 'hygiene'],
  Food: ['food', 'mess', 'meal', 'breakfast', 'lunch', 'dinner', 'canteen', 'quality'],
  Furniture: ['chair', 'table', 'bed', 'cot', 'mattress', 'cupboard', 'almirah', 'furniture'],
  Tiles: ['tile', 'tiles', 'floor', 'wall', 'crack', 'broken tile'],
};

const priorityKeywords = {
  Urgent: ['fire', 'spark', 'sparks', 'electric shock', 'dangerous', 'critical', 'emergency', 'flood', 'severe leak', 'major water leakage', 'short circuit', 'broken lock', 'safety issue'],
  High: ['water leakage', 'leak', 'electrical issue', 'not working', 'broken', 'power off', 'no water', 'locked', 'unsafe', 'urgent repair'],
  Medium: ['slow', 'intermittent', 'minor', 'needs repair', 'minor damage', 'not optimal', 'unclear', 'issue'],
  Low: ['maintenance', 'cosmetic', 'minor clean', 'preference', 'suggestion', 'could be better'],
};

const urgentAllowedKeywords = ['spark', 'sparks', 'major water leakage', 'fire', 'security issue', 'short circuit', 'broken lock', 'safety issue', 'electric shock', 'smoke'];

const priorityScoreKeywords = {
  safety: ['fire', 'spark', 'sparks', 'short circuit', 'security', 'broken lock', 'safety', 'unsafe', 'shock', 'smoke'],
  damage: ['leakage', 'leak', 'flood', 'broken', 'damage', 'crack', 'not working', 'burst'],
  minor: ['noise', 'noisy', 'slow', 'minor', 'loose', 'dirty', 'cleaning', 'small'],
};

const categoryAliases = {
  Water: 'Plumbing',
  Electricity: 'Electric',
  Electrical: 'Electric',
  Other: 'Others',
};

export function normalizeCategory(category = 'Others') {
  return categoryAliases[category] || category || 'Others';
}

export const categoryIcons = {
  Water: '🚰',
  Electricity: '⚡',
  Security: '🔒',
  Internet: '📡',
  Cleaning: '🧹',
  Food: '🍽️',
  Furniture: '🪑',
  Tiles: '🧱',
  Others: '📋',
};

export const categoryColors = {
  Water: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  Electricity: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  Security: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  Internet: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  Cleaning: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  Food: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  Furniture: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
  Tiles: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  Others: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
};

export const priorityColors = {
  Urgent: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', icon: '🔥' },
  High: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', icon: '⚠️' },
  Medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', icon: '📌' },
  Low: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', icon: '✓' },
};

export const categoryPriority = {
  Plumbing: 'High',
  Electric: 'High',
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
  return normalizeCategory(match?.[0] || 'Others');
}

export function calculatePriorityScore({ title = '', description = '' }) {
  const text = `${title} ${description}`.toLowerCase();
  let score = 0;
  if (priorityScoreKeywords.safety.some((kw) => text.includes(kw))) score += 5;
  if (priorityScoreKeywords.damage.some((kw) => text.includes(kw))) score += 3;
  if (priorityScoreKeywords.minor.some((kw) => text.includes(kw))) score += 1;
  return score || 1;
}

export function recommendedPriorityFromScore(score) {
  if (score >= 9) return 'Urgent';
  if (score >= 6) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
}

export function analyzeComplaint({ title = '', description = '', category = '', priority = 'Medium' }) {
  const autoDetectedCategory = inferComplaintCategory({ title, description });
  const selectedCategory = normalizeCategory(category);
  const priorityScore = calculatePriorityScore({ title, description });
  const recommendedPriority = recommendedPriorityFromScore(priorityScore);
  const text = `${title} ${description}`.toLowerCase();
  const categoryMismatch = Boolean(
    selectedCategory &&
    selectedCategory !== 'Others' &&
    autoDetectedCategory !== 'Others' &&
    selectedCategory !== autoDetectedCategory
  );
  const urgentAllowed = urgentAllowedKeywords.some((kw) => text.includes(kw));
  const urgentMisuse = priority === 'Urgent' && !urgentAllowed && recommendedPriority !== 'Urgent';

  return {
    autoDetectedCategory,
    suggestedCategory: autoDetectedCategory,
    priorityScore,
    recommendedPriority,
    categoryMismatch,
    urgentMisuse,
    warnings: [
      ...(categoryMismatch ? ['Selected category does not match your complaint description. Please select the correct category.'] : []),
      ...(urgentMisuse ? ['This issue does not qualify for urgent priority.'] : []),
    ],
  };
}

export function inferComplaintPriority({ title = '', description = '', category = '' }) {
  const text = `${title} ${description}`.toLowerCase();
  
  if (priorityKeywords.Urgent.some(kw => text.includes(kw))) {
    return 'Urgent';
  }
  
  if (priorityKeywords.High.some(kw => text.includes(kw))) {
    return 'High';
  }
  
  if (priorityKeywords.Medium.some(kw => text.includes(kw))) {
    return 'Medium';
  }
  
  if (priorityKeywords.Low.some(kw => text.includes(kw))) {
    return 'Low';
  }
  
  return categoryPriority[normalizeCategory(category)] || 'Low';
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
  return Date.now() - reference.getTime() >= 2 * 86400000; // 2 days
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
