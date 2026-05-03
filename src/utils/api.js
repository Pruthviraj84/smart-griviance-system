// API configuration and helpers
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export { API_BASE };

export const API_ENDPOINTS = {
  // Auth
  STUDENT_REGISTER: '/api/students/register',
  STUDENT_LOGIN: '/api/students/login',
  WORKER_LOGIN: '/api/worker/login',
  ADMIN_LOGIN: '/api/admin/login',
  SUPERADMIN_LOGIN: '/api/superadmin/login',
  
  // Complaints
  GET_COMPLAINTS: '/api/complaints',
  CREATE_COMPLAINT: '/api/complaints',
  UPDATE_STATUS: (id) => `/api/complaints/${id}/status`,
  ASSIGN_WORKER: (id) => `/api/complaints/${id}/assign`,
  UPDATE_PRIORITY: (id) => `/api/complaints/${id}/priority`,
  DELETE_COMPLAINT: (id) => `/api/complaints/${id}`,
  SUBMIT_PROOF: (id) => `/api/workers/complaints/${id}/complete`,
  VERIFY_COMPLAINT: (id) => `/api/admin/complaints/${id}/verify`,
  SUPERADMIN_OVERRIDE: (id) => `/api/superadmin/complaints/${id}/override`,
  
  // Workers
  GET_WORKERS: '/api/admin/workers',
  CREATE_WORKER: '/api/admin/workers',
  DELETE_WORKER: (id) => `/api/admin/workers/${id}`,
  GET_WORKER_COMPLAINTS: (id) => `/api/admin/workers/${id}/complaints`,
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
