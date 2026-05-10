// Status colors mapping
export const STATUS_COLORS = {
  Pending: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-500' },
  Assigned: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-500' },
  'In Progress': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  Completed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', dot: 'bg-green-500' },
  'Awaiting Verification': { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200', dot: 'bg-violet-500' },
  Verified: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', dot: 'bg-green-500' },
  Resolved: { bg: 'bg-emerald-200', text: 'text-emerald-900', border: 'border-emerald-300', dot: 'bg-emerald-700' },
  Solved: { bg: 'bg-emerald-200', text: 'text-emerald-900', border: 'border-emerald-300', dot: 'bg-emerald-700' },
  Delayed: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', dot: 'bg-rose-500' },
};

export const PRIORITY_COLORS = {
  Urgent: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  High: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  Medium: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  Low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

export const COMPLAINT_STATUSES = [
  'Pending',
  'Assigned',
  'In Progress',
  'Completed',
  'Verified',
  'Resolved',
];

export const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'];

export const CATEGORIES = [
  'Electric',
  'Plumbing',
  'Cleaning',
  'Internet',
  'Security',
  'Food',
  'Furniture',
  'Tiles',
  'Others',
];

export const ROLE_NAV_ITEMS = {
  Student: [
    { label: 'Dashboard', path: '/student', icon: 'LayoutDashboard' },
    { label: 'Complaints', path: '/student/complaints', icon: 'ClipboardList' },
    { label: 'Profile', path: '/student/profile', icon: 'User' },
  ],
  Worker: [
    { label: 'Dashboard', path: '/worker', icon: 'LayoutDashboard' },
    { label: 'My Tasks', path: '/worker/tasks', icon: 'Wrench' },
    { label: 'Profile', path: '/worker/profile', icon: 'User' },
  ],
  Admin: [
    { label: 'Dashboard', path: '/admin', icon: 'LayoutDashboard' },
    { label: 'Complaints', path: '/admin/complaints', icon: 'ClipboardList' },
    { label: 'Workers', path: '/admin/workers', icon: 'Users' },
    { label: 'Reports', path: '/admin/reports', icon: 'FileText' },
  ],
  SuperAdmin: [
    { label: 'Dashboard', path: '/superadmin', icon: 'LayoutDashboard' },
    { label: 'Analytics', path: '/superadmin/analytics', icon: 'BarChart3' },
    { label: 'Users', path: '/superadmin/users', icon: 'Users' },
    { label: 'Complaints', path: '/superadmin/complaints', icon: 'ClipboardList' },
  ],
};

export const STATUS_FLOW = ['Pending', 'Assigned', 'In Progress', 'Completed', 'Verified', 'Resolved'];

export const CATEGORY_PRIORITY_MAP = {
  Electric: 'High',
  Plumbing: 'High',
  Cleaning: 'Medium',
  Internet: 'High',
  Security: 'High',
  Food: 'Medium',
  Furniture: 'Low',
  Tiles: 'Medium',
  Others: 'Low',
};
