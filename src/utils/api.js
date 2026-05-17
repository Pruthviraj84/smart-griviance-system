// API configuration and helpers
const API_BASE = import.meta.env.VITE_API_BASE || '';

export { API_BASE };

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/login',
  STUDENT_REGISTER: '/api/students/register',
  STUDENT_LOGIN: '/api/students/login',
  STUDENT_ME: '/api/students/me',
  WORKER_LOGIN: '/api/worker/login',
  WORKER_ME: '/api/worker/me',
  ADMIN_LOGIN: '/api/admin/login',
  SUPERADMIN_LOGIN: '/api/superadmin/login',
  
  // Complaints
  GET_COMPLAINTS: '/api/complaints',
  GET_COMPLAINT: (id) => `/api/complaints/${id}`,
  CREATE_COMPLAINT: '/api/complaints',
  UPDATE_STATUS: (id) => `/api/complaints/${id}/status`,
  UPDATE_COMPLAINT_STATUS: (id) => `/api/complaints/status/${id}`,
  ASSIGN_WORKER: (id) => `/api/complaints/${id}/assign`,
  ASSIGN_WORKER_MANUAL: (id) => `/api/complaints/assign-worker/${id}`,
  AUTO_ASSIGN: (id) => `/api/complaints/${id}/auto-assign`,
  REASSIGN_WORKER: (id) => `/api/complaints/${id}/reassign`,
  UPDATE_PRIORITY: (id) => `/api/complaints/${id}/priority`,
  DELETE_COMPLAINT: (id) => `/api/complaints/${id}`,
  SUBMIT_PROOF: (id) => `/api/admin/workers/complaints/${id}/complete`,
  VERIFY_COMPLAINT: (id) => `/api/admin/complaints/${id}/verify`,
  VERIFY_COMPLETED_COMPLAINT: (id) => `/api/complaints/verify/${id}`,
  SUPERADMIN_OVERRIDE: (id) => `/api/superadmin/complaints/${id}/override`,
  RATE_COMPLAINT: (id) => `/api/complaints/${id}/rate`,
  GET_DELAYED_COMPLAINTS: '/api/complaints/delayed/list',
  GET_WORKER_WORKLOAD: '/api/complaints/workers/workload',
  
  // Workers
  GET_WORKERS: '/api/admin/workers',
  CREATE_WORKER: '/api/admin/workers',
  UPDATE_WORKER: (id) => `/api/admin/workers/${id}`,
  TOGGLE_WORKER: (id) => `/api/admin/workers/${id}/toggle`,
  DELETE_WORKER: (id) => `/api/admin/workers/${id}`,
  GET_WORKER_COMPLAINTS: (id) => `/api/admin/workers/${id}/complaints`,
  
  // Admin
  DELAYED_COMPLAINTS: '/api/admin/delayed',
  
  // Chat
  GET_CHAT: (id) => `/api/chat/${id}`,
  SEND_CHAT: (id) => `/api/chat/${id}`,
  
  // Notifications
  GET_NOTIFICATIONS: '/api/notifications',
  MARK_READ: (id) => `/api/notifications/${id}/read`,
  MARK_ALL_READ: '/api/notifications/read-all',
  DELETE_NOTIFICATION: (id) => `/api/notifications/${id}`,
};

// Complaint status constants
export const COMPLAINT_STATUSES = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  VERIFIED: 'Verified',
  RESOLVED: 'Resolved',
  SOLVED: 'Solved',
};

export const PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const CATEGORIES = {
  WATER: 'Water',
  ELECTRICITY: 'Electricity',
  SECURITY: 'Security',
  INTERNET: 'Internet',
  CLEANING: 'Cleaning',
  FOOD: 'Food',
  FURNITURE: 'Furniture',
  TILES: 'Tiles',
  OTHERS: 'Others',
};
