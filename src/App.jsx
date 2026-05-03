import { useEffect, useMemo, useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BadgeCheck,
  Bell,
  CalendarClock,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  EyeOff,
  FileImage,
  Gauge,
  Home,
  Image,
  LayoutDashboard,
  ListChecks,
  Lock,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserCog,
  Users,
  Wrench,
  X,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { getToken, getUser, setAuth, clearAuth, validateEmail, validatePassword, validatePhone } from './utils/auth';
import { API_BASE, API_ENDPOINTS } from './utils/api';
import useApi from './hooks/useApi';
import { AnalyticsChart } from './components/features/AnalyticsChart';
import { ImageGallery } from './components/common/ImageGallery';
import { Pagination } from './components/common/Pagination';

const demoWorkers = [
  { _id: 'demo-worker-vikram', id: 'demo-worker-vikram', name: 'Vikram', email: 'vikram@hostel.com', phone: '9876543201', totalAssignedComplaints: 1, pendingComplaints: 1, completedComplaints: 0 },
  { _id: 'demo-worker-rajesh', id: 'demo-worker-rajesh', name: 'Rajesh', email: 'rajesh@hostel.com', phone: '9876543202', totalAssignedComplaints: 1, pendingComplaints: 0, completedComplaints: 1 },
  { _id: 'demo-worker-amit', id: 'demo-worker-amit', name: 'Amit', email: 'amit@hostel.com', phone: '9876543203', totalAssignedComplaints: 0, pendingComplaints: 0, completedComplaints: 0 },
  { _id: 'demo-worker-suresh', id: 'demo-worker-suresh', name: 'Suresh', email: 'suresh@hostel.com', phone: '9876543204', totalAssignedComplaints: 0, pendingComplaints: 0, completedComplaints: 0 },
];
const statusFlow = ['Pending', 'Assigned', 'In Progress', 'Solved'];

const featureCards = [
  {
    title: 'Easy Complaint Submission',
    description: 'Students can submit hostel issues with category, priority, location, and images.',
    icon: ClipboardList,
  },
  {
    title: 'Real-time Tracking',
    description: 'Every role sees clear status updates from pending work to final resolution.',
    icon: Gauge,
  },
  {
    title: 'Fast Resolution',
    description: 'Admins assign workers, workers upload solved proof, and admins verify closure.',
    icon: BadgeCheck,
  },
];

const categoryPriority = {
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

const statusStyles = {
  Pending: 'bg-amber-100 text-amber-700 ring-amber-200',
  Assigned: 'bg-blue-100 text-blue-700 ring-blue-200',
  'In Progress': 'bg-sky-100 text-sky-700 ring-sky-200',
  Completed: 'bg-violet-100 text-violet-700 ring-violet-200',
  'Awaiting Verification': 'bg-violet-100 text-violet-700 ring-violet-200',
  Verified: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
  Resolved: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  Solved: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  Delayed: 'bg-red-100 text-red-700 ring-red-200',
};

const priorityStyles = {
  Urgent: 'bg-red-100 text-red-700 ring-red-200',
  High: 'bg-rose-100 text-rose-700 ring-rose-200',
  Medium: 'bg-orange-100 text-orange-700 ring-orange-200',
  Low: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
};

const demoComplaints = [
  {
    _id: 'demo-1',
    studentName: 'Aanya Sharma',
    email: 'aanya@student.edu',
    title: 'Leaking bathroom pipe',
    description: 'Bathroom pipe is leaking continuously near room 204.',
    category: 'Water',
    priority: 'High',
    status: 'Pending',
    assignedTo: 'Not assigned',
    roomNo: '204',
    contact: '9876543210',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    images: [],
    workerProofImages: [],
  },
  {
    _id: 'demo-2',
    studentName: 'Rohan Patel',
    email: 'rohan@student.edu',
    title: 'Broken corridor light',
    description: 'The second-floor corridor light has not worked since yesterday.',
    category: 'Electricity',
    priority: 'High',
    status: 'Assigned',
    assignedTo: 'Vikram',
    assigned_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    roomNo: '118',
    contact: '9876543211',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    images: [],
    workerProofImages: [],
  },
  {
    _id: 'demo-3',
    studentName: 'Meera Nair',
    email: 'meera@student.edu',
    title: 'Chair repair needed',
    description: 'Study chair leg is damaged and unsafe to use.',
    category: 'Furniture',
    priority: 'Low',
    status: 'Resolved',
    assignedTo: 'Rajesh',
    assigned_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    started_at: new Date(Date.now() - 86400000).toISOString(),
    completed_at: new Date().toISOString(),
    roomNo: '312',
    contact: '9876543212',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    images: [],
    workerProofImages: [],
    workerSubmittedProof: true,
  },
];

function App() {
  const navigate = useNavigate();
  const { call: apiCall } = useApi();
  const [user, setUser] = useState(() => getUser());
  const [complaints, setComplaints] = useState([]);
  const [workerDirectory, setWorkerDirectory] = useState(demoWorkers);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (title, message, tone = 'success') => {
    setToast({ title, message, tone });
    window.setTimeout(() => setToast(null), 2600);
  };

  const loadComplaints = async () => {
    try {
      const token = getToken();
      if (!token) {
        setComplaints(demoComplaints);
        return;
      }

      const response = await fetch(`${API_BASE}/api/complaints`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Unable to load complaints.');
      const data = await response.json();
      setComplaints(data.length ? data : demoComplaints);
    } catch (error) {
      setComplaints(demoComplaints);
      showToast('Demo data loaded', 'Start the server to use live complaints.', 'info');
    }
  };

  const loadWorkers = async () => {
    try {
      const token = getToken();
      if (!token) {
        setWorkerDirectory(demoWorkers);
        return;
      }

      const response = await fetch(`${API_BASE}/api/admin/workers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Unable to load workers.');
      const data = await response.json();
      setWorkerDirectory(data.length ? data : demoWorkers);
    } catch (error) {
      setWorkerDirectory(demoWorkers);
    }
  };

  useEffect(() => {
    if (user) {
      loadComplaints();
      loadWorkers();
    }
  }, [user]);

  const dashboardPath = (role) => {
    if (role === 'Student') return '/student';
    if (role === 'Worker') return '/worker';
    if (role === 'Admin') return '/admin';
    return '/superadmin';
  };

  const handleLogin = async ({ email, password, role }) => {
    setLoading(true);
    try {
      const endpointByRole = {
        Student: '/api/students/login',
        Worker: '/api/worker/login',
        Admin: '/api/admin/login',
        'Super Admin': '/api/superadmin/login',
      };
      const response = await fetch(`${API_BASE}${endpointByRole[role]}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed.');

      const normalizedRole = role === 'Super Admin' ? 'SuperAdmin' : role;
      const userData = { 
        id: data.user?.id || data.id, 
        email: data.user?.email || data.email, 
        name: data.user?.name || data.name || role, 
        role: normalizedRole 
      };
      
      // Save token and user data
      if (data.token) {
        setAuth(data.token, userData);
      }
      
      setUser(userData);
      showToast('Login successful', `Redirecting to ${role} dashboard.`);
      navigate(dashboardPath(normalizedRole));
    } catch (error) {
      showToast('Login failed', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    navigate('/');
    showToast('Signed out', 'You are back on the homepage.', 'info');
  };

  const addComplaint = async (values, files) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => formData.append(key, value));
      files.forEach((file) => formData.append('images', file));

      const response = await fetch(`${API_BASE}/api/complaints`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to submit complaint.');

      setComplaints((current) => [data, ...current]);
      showToast('Complaint registered', 'Your issue is now marked Pending.');
    } catch (error) {
      showToast('Submission failed', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const patchStatus = async (id, status, message = `Complaint moved to ${status}.`) => {
    try {
      const response = await fetch(`${API_BASE}/api/complaints/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to update status.');

      setComplaints((current) => current.map((item) => (item._id === id ? data : item)));
      loadWorkers();
      showToast('Status updated', message);
    } catch (error) {
      showToast('Update failed', error.message, 'error');
    }
  };

  const assignWorker = async (id, worker) => {
    const workerRecord = typeof worker === 'string' ? workerDirectory.find((item) => item.name === worker || item.id === worker || item._id === worker) : worker;
    const assignedTo = workerRecord?.name || worker;
    try {
      if (id?.startsWith('demo-')) {
        setComplaints((current) => current.map((item) => (
          item._id === id
            ? {
                ...item,
                assignedTo,
                workerName: assignedTo,
                workerId: workerRecord?.id || workerRecord?._id || `WRK-${assignedTo.toUpperCase().slice(0, 3)}`,
                assigned_worker_id: workerRecord?.id || workerRecord?._id || null,
                workerContact: workerRecord?.phone || 'Not provided',
                status: 'Assigned',
                assigned_at: new Date().toISOString(),
                assignedAt: new Date().toISOString(),
              }
            : item
        )));
        showToast('Worker assigned', `${assignedTo} is assigned. Waiting for work to start.`);
        return;
      }

      const response = await fetch(`${API_BASE}/api/complaints/${id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo, workerId: workerRecord?.id || workerRecord?._id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to assign worker.');

      setComplaints((current) => current.map((item) => (item._id === id ? data : item)));
      loadWorkers();
      showToast('Worker assigned', `${assignedTo} is assigned. Waiting for work to start.`);
    } catch (error) {
      showToast('Assignment failed', error.message, 'error');
    }
  };

  const addWorker = async (values) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, role: user?.role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to add worker.');

      setWorkerDirectory((current) => [data, ...current]);
      showToast('Worker added', `${data.name} can now receive complaints.`);
    } catch (error) {
      showToast('Add worker failed', error.message, 'error');
    }
  };

  const deleteWorker = async (worker) => {
    const confirmed = window.confirm(`Delete ${worker.name}? Their assigned complaints will be set to Not assigned.`);
    if (!confirmed) return;

    try {
      if (worker.id?.startsWith('demo-worker')) {
        setWorkerDirectory((current) => current.filter((item) => item.id !== worker.id));
        setComplaints((current) => current.map((item) => (
          workerMatchesComplaint(worker, item)
            ? { ...item, assigned_worker_id: null, assignedTo: 'Not assigned', workerName: null, workerId: null, workerContact: null }
            : item
        )));
        showToast('Worker removed', 'Demo worker removed and complaints were unassigned.');
        return;
      }

      const response = await fetch(`${API_BASE}/api/admin/workers/${worker.id || worker._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: user?.role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to delete worker.');

      setWorkerDirectory((current) => current.filter((item) => (item.id || item._id) !== (worker.id || worker._id)));
      await loadComplaints();
      await loadWorkers();
      showToast('Worker removed', data.message || 'Worker deleted.');
    } catch (error) {
      showToast('Delete worker failed', error.message, 'error');
    }
  };

  const removeComplaint = async (complaint, actorRole) => {
    if (!isSolvedComplaint(complaint)) {
      showToast('Remove blocked', 'Only solved complaints can be removed.', 'error');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to remove this complaint?');
    if (!confirmed) return;

    try {
      if (complaint._id?.startsWith('demo-')) {
        setComplaints((current) => current.filter((item) => item._id !== complaint._id));
        showToast('Complaint removed', 'Demo complaint removed from the dashboard.');
        return;
      }

      const response = await fetch(`${API_BASE}/api/complaints/${complaint._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: user?.name || actorRole, role: actorRole }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to remove complaint.');

      setComplaints((current) => current.filter((item) => item._id !== complaint._id));
      showToast('Complaint removed', 'Solved complaint archived with an audit log.');
    } catch (error) {
      showToast('Remove failed', error.message, 'error');
    }
  };

  const submitProof = async (id, files, remarks) => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('proofImages', file));
      formData.append('remarks', remarks);

      const response = await fetch(`${API_BASE}/api/workers/complaints/${id}/complete`, {
        method: 'PATCH',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to upload proof.');

      setComplaints((current) => current.map((item) => (item._id === id ? data : item)));
      loadWorkers();
      showToast('Proof uploaded', 'Worker marked the complaint as Completed.');
    } catch (error) {
      showToast('Proof upload failed', error.message, 'error');
    }
  };

  const visibleStudentComplaints = useMemo(() => {
    if (!user?.email) return complaints;
    return complaints.filter((item) => item.email === user.email || item._id?.startsWith('demo-'));
  }, [complaints, user]);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#eef7ff_0%,#f8efff_48%,#ecfff8_100%)] text-slate-900">
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage loading={loading} onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage loading={loading} onRegister={handleLogin} showToast={showToast} />} />
        <Route
          path="/student"
          element={<StudentDashboard user={user} complaints={visibleStudentComplaints} loading={loading} onSubmit={addComplaint} />}
        />
        <Route
          path="/worker"
          element={<WorkerDashboard user={user} complaints={complaints} workers={workerDirectory} onSubmitProof={submitProof} />}
        />
        <Route
          path="/admin"
          element={<AdminDashboard user={user} complaints={complaints} workers={workerDirectory} onAddWorker={addWorker} onDeleteWorker={deleteWorker} onAssign={assignWorker} onStatus={patchStatus} onRemove={removeComplaint} />}
        />
        <Route
          path="/superadmin"
          element={<SuperAdminDashboard user={user} complaints={complaints} workers={workerDirectory} onAddWorker={addWorker} onDeleteWorker={deleteWorker} onStatus={patchStatus} onRemove={removeComplaint} />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-white/70 bg-white/90 p-4 shadow-2xl backdrop-blur">
          <p className={`font-semibold ${toast.tone === 'error' ? 'text-rose-700' : 'text-slate-950'}`}>{toast.title}</p>
          <p className="mt-1 text-sm text-slate-600">{toast.message}</p>
        </div>
      )}
    </div>
  );
}

function Navbar({ user, onLogout }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-3 font-bold text-slate-950">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white shadow-lg shadow-cyan-900/20">
            <Home className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">Smart Hostel</span>
        </NavLink>
        <nav className="flex items-center gap-2 text-sm font-medium text-slate-600">
          {user && <span className="hidden rounded-full bg-slate-100 px-3 py-2 sm:inline">{user.role}</span>}
          {user ? (
            <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-white transition hover:bg-slate-800">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          ) : (
            <NavLink to="/login" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-white transition hover:bg-slate-800">
              <Lock className="h-4 w-4" />
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}

function HomePage() {
  return (
    <main>
      <section className="mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl flex-col justify-center px-4 py-12 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4 text-cyan-600" />
            Hostel issue reporting, tracking, and verification
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
            Smart Hostel Grievance System
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Report and track hostel issues easily.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <NavLink to="/login" className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-7 py-4 font-bold text-white shadow-xl shadow-cyan-900/20 transition hover:-translate-y-0.5 hover:bg-cyan-500">
              Login
              <ArrowRight className="h-5 w-5" />
            </NavLink>
            <NavLink to="/register" className="inline-flex items-center gap-2 rounded-2xl border-2 border-cyan-600 px-7 py-4 font-bold text-cyan-600 shadow-xl transition hover:-translate-y-0.5 hover:bg-cyan-50">
              Register
              <ArrowRight className="h-5 w-5" />
            </NavLink>
          </div>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {featureCards.map(({ title, description, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-white/70 bg-white/70 p-6 text-center shadow-xl shadow-slate-200/60 backdrop-blur">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-white">
                <Icon className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/70 bg-white/55 px-4 py-16 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-700">About</p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">One clear system for every hostel complaint</h2>
          <p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-600">
            Students submit issues with images, admins assign workers, workers upload solved image proof, and admins verify the result before resolving the complaint.
          </p>
          <Lifecycle />
        </div>
      </section>

      <footer className="px-4 py-8 text-center text-sm text-slate-600">
        © 2026 Smart Hostel Grievance System. Built for transparent hostel maintenance.
      </footer>
    </main>
  );
}

function LoginPage({ loading, onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', role: 'Student' });

  const submit = (event) => {
    event.preventDefault();
    onLogin(form);
  };

  return (
    <main className="grid min-h-[calc(100vh-73px)] place-items-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/60 bg-white/35 p-7 shadow-2xl shadow-slate-300/50 backdrop-blur-2xl">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-white">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl font-black text-slate-950">Role Login</h1>
          <p className="mt-2 text-sm text-slate-600">Access the right dashboard based on your role.</p>
        </div>

        <label className="mt-8 block text-sm font-semibold text-slate-700">
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-slate-950 shadow-sm"
            placeholder="name@hostel.com"
          />
        </label>

        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Password
          <span className="mt-2 flex rounded-2xl border border-white/80 bg-white/75 shadow-sm">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="min-w-0 flex-1 rounded-2xl bg-transparent px-4 py-3 text-slate-950"
              placeholder="Enter password"
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="px-4 text-slate-500 hover:text-slate-950" aria-label="Toggle password visibility">
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </span>
        </label>

        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Role
          <select
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
            className="mt-2 w-full rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-slate-950 shadow-sm"
          >
            <option>Student</option>
            <option>Admin</option>
            <option>Worker</option>
            <option>Super Admin</option>
          </select>
        </label>

        <div className="mt-4 flex justify-end">
          <a href="#forgot-password" className="text-sm font-semibold text-cyan-700 hover:text-cyan-600">Forgot password?</a>
        </div>

        <button disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Logging in...' : 'Login'}
          <ArrowRight className="h-5 w-5" />
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Don't have an account?{' '}
            <NavLink to="/register" className="font-semibold text-cyan-700 hover:text-cyan-600">
              Register here
            </NavLink>
          </p>
        </div>
      </form>
    </main>
  );
}

function RegisterPage({ loading, showToast }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    roomNo: '',
    hostelBlock: '',
    password: '',
    confirmPassword: '',
  });

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = 'Name is required.';
    if (!form.email.trim()) newErrors.email = 'Email is required.';
    else if (!validateEmail(form.email)) newErrors.email = 'Invalid email format.';

    if (!form.phone.trim()) newErrors.phone = 'Phone is required.';
    else if (!validatePhone(form.phone)) newErrors.phone = 'Phone must be 10 digits.';

    if (!form.password) newErrors.password = 'Password is required.';
    else if (!validatePassword(form.password)) newErrors.password = 'Password must be at least 6 characters.';

    if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    try {
      const response = await fetch(`${API_BASE}/api/students/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          roomNo: form.roomNo,
          hostelBlock: form.hostelBlock,
          password: form.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed.');

      // Save token if returned
      if (data.token && data.user) {
        setAuth(data.token, data.user);
      }

      showToast('Registration successful', 'Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      showToast('Registration failed', error.message, 'error');
    }
  };

  return (
    <main className="grid min-h-[calc(100vh-73px)] place-items-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/60 bg-white/35 p-7 shadow-2xl shadow-slate-300/50 backdrop-blur-2xl">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-white">
            <UserCog className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl font-black text-slate-950">Student Registration</h1>
          <p className="mt-2 text-sm text-slate-600">Create your account to submit complaints</p>
        </div>

        <FormField label="Full Name" error={errors.name} required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={`w-full rounded-2xl border bg-white/75 px-4 py-3 text-slate-950 shadow-sm ${
              errors.name ? 'border-red-500' : 'border-white/80'
            }`}
            placeholder="John Doe"
          />
        </FormField>

        <FormField label="Email" error={errors.email} required>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={`w-full rounded-2xl border bg-white/75 px-4 py-3 text-slate-950 shadow-sm ${
              errors.email ? 'border-red-500' : 'border-white/80'
            }`}
            placeholder="student@hostel.com"
          />
        </FormField>

        <FormField label="Phone" error={errors.phone} required>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={`w-full rounded-2xl border bg-white/75 px-4 py-3 text-slate-950 shadow-sm ${
              errors.phone ? 'border-red-500' : 'border-white/80'
            }`}
            placeholder="9876543210"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Room No.">
            <input
              type="text"
              value={form.roomNo}
              onChange={(e) => setForm({ ...form, roomNo: e.target.value })}
              className="w-full rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-slate-950 shadow-sm"
              placeholder="101"
            />
          </FormField>

          <FormField label="Hostel Block">
            <input
              type="text"
              value={form.hostelBlock}
              onChange={(e) => setForm({ ...form, hostelBlock: e.target.value })}
              className="w-full rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-slate-950 shadow-sm"
              placeholder="A/B/C"
            />
          </FormField>
        </div>

        <FormField label="Password" error={errors.password} required>
          <span className="flex rounded-2xl border border-white/80 bg-white/75 shadow-sm">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="min-w-0 flex-1 rounded-2xl bg-transparent px-4 py-3 text-slate-950"
              placeholder="At least 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="px-4 text-slate-500 hover:text-slate-950"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </span>
        </FormField>

        <FormField label="Confirm Password" error={errors.confirmPassword} required>
          <input
            type={showPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className={`w-full rounded-2xl border bg-white/75 px-4 py-3 text-slate-950 shadow-sm ${
              errors.confirmPassword ? 'border-red-500' : 'border-white/80'
            }`}
            placeholder="Confirm password"
          />
        </FormField>

        <button
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Registering...' : 'Register'}
          <ArrowRight className="h-5 w-5" />
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <NavLink to="/login" className="font-semibold text-cyan-700 hover:text-cyan-600">
              Login here
            </NavLink>
          </p>
        </div>
      </form>
    </main>
  );
}

function FormField({ label, children, error, required }) {
  return (
    <label className="mt-4 block text-sm font-semibold text-slate-700">
      {label}
      {required && <span className="text-red-500">*</span>}
      {error && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function StudentDashboard({ user, complaints, loading, onSubmit }) {
  if (!hasRole(user, 'Student')) return <Restricted role="Student" />;

  const stats = [
    ['Total Complaints', complaints.length, ClipboardList],
    ['Pending', complaints.filter((item) => displayStatus(item) === 'Pending').length, Clock],
    ['Solved', complaints.filter(isSolvedComplaint).length, CheckCircle2],
  ];

  return (
    <DashboardShell
      title={`Welcome, ${user.name || 'Student'}`}
      subtitle="Submit complaints, upload issue images, and track resolution progress."
      role="Student"
      menu={['Dashboard', 'Submit Complaint', 'My Complaints', 'Profile']}
    >
      <StatsGrid stats={stats} />
      <ComplaintForm user={user} loading={loading} onSubmit={onSubmit} />
      <Panel title="My Complaints" action={<a href="#new-complaint" className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" />New Complaint</a>}>
        <ComplaintTable complaints={complaints} columns={['Title', 'Category', 'Status', 'Priority', 'Date']} />
      </Panel>
    </DashboardShell>
  );
}

function ComplaintForm({ user, loading, onSubmit }) {
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    contact: '',
  });
  const detectedCategory = inferComplaintCategory(form);

  const submit = (event) => {
    event.preventDefault();
    onSubmit(
      {
        ...form,
        category: detectedCategory,
        studentName: user.name || 'Student',
        email: user.email,
        priority: categoryPriority[detectedCategory] || 'Low',
      },
      files
    );
    setForm({ title: '', description: '', location: '', contact: '' });
    setFiles([]);
  };

  return (
    <Panel title="Submit Complaint" id="new-complaint">
      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
        <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="Complaint title" />
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <span className="text-sm font-semibold text-slate-500">Auto category</span>
          <span className="rounded-full bg-cyan-100 px-3 py-1 text-sm font-black text-cyan-800">{detectedCategory}</span>
        </div>
        <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="Room / location" />
        <input value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="Contact number" />
        <textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 lg:col-span-2" placeholder="Describe the issue" />
        <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-cyan-300 bg-cyan-50 px-4 py-5 font-semibold text-cyan-800 lg:col-span-2">
          <Upload className="h-5 w-5" />
          Upload image option
          <input type="file" multiple accept="image/*" onChange={(event) => setFiles(Array.from(event.target.files || []))} className="hidden" />
        </label>
        {files.length > 0 && <p className="text-sm font-medium text-slate-500 lg:col-span-2">{files.length} image(s) selected</p>}
        <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-60 lg:col-span-2">
          <Plus className="h-5 w-5" />
          Register Complaint
        </button>
      </form>
    </Panel>
  );
}

function WorkerDashboard({ user, complaints, workers, onSubmitProof }) {
  if (!hasRole(user, 'Worker')) return <Restricted role="Worker" />;

  const currentWorker = workers.find((worker) => worker.email === user.email || worker.name === user.name || worker.id === user.id || worker._id === user.id);
  const assigned = complaints.filter((item) => currentWorker ? workerMatchesComplaint(currentWorker, item) : item.assignedTo === user.name);
  const actionable = assigned.filter((item) => ['In Progress', 'Pending'].includes(displayStatus(item)));

  return (
    <DashboardShell
      title="Assigned Complaints"
      subtitle="Review tasks, update status, and upload solved image proof."
      role="Worker"
      menu={['Assigned Complaints', 'Update Status', 'Upload Proof']}
    >
      <StatsGrid stats={[
        ['Assigned', assigned.length, Wrench],
        ['Pending Work', actionable.length, AlertTriangle],
        ['Solved', assigned.filter(isSolvedComplaint).length, CheckCircle2],
      ]} />
      <div className="grid gap-5 xl:grid-cols-2">
        {assigned.map((item) => <WorkerCard key={item._id} complaint={item} onSubmitProof={onSubmitProof} />)}
      </div>
    </DashboardShell>
  );
}

function WorkerCard({ complaint, onSubmitProof }) {
  const [status, setStatus] = useState(displayStatus(complaint) === 'Pending' ? 'In Progress' : displayStatus(complaint));
  const [files, setFiles] = useState([]);
  const [remarks, setRemarks] = useState('');

  return (
    <article className={`rounded-2xl border bg-white p-5 shadow-sm ${displayStatus(complaint) === 'Pending' ? 'border-amber-300' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-950">{complaint.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{complaint.description}</p>
        </div>
        <StatusBadge value={displayStatus(complaint)} />
      </div>
      <ImageStrip images={complaint.images} label="Complaint image" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <option>In Progress</option>
          <option>Completed</option>
        </select>
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-300 bg-cyan-50 px-3 py-2 font-semibold text-cyan-800">
          <Camera className="h-4 w-4" />
          Solved Image
          <input type="file" multiple accept="image/*" onChange={(event) => setFiles(Array.from(event.target.files || []))} className="hidden" />
        </label>
      </div>
      <textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" placeholder="Work remarks" />
      <button
        onClick={() => onSubmitProof(complaint._id, files, remarks || `Marked ${status}`)}
        disabled={files.length === 0}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 font-bold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CheckCircle2 className="h-5 w-5" />
        Mark as Completed
      </button>
    </article>
  );
}

function AdminDashboard({ user, complaints, workers, onAddWorker, onDeleteWorker, onAssign, onStatus, onRemove }) {
  if (!hasRole(user, 'Admin')) return <Restricted role="Admin" />;

  return (
    <DashboardShell
      title="Admin Dashboard"
      subtitle="Manage complaints, assign workers, verify uploaded images, and resolve cases."
      role="Admin"
      menu={['Dashboard', 'Manage Workers', 'Worker Workload Overview', 'All Complaints', 'Reports']}
    >
      <StatsGrid stats={[
        ['Total Complaints', complaints.length, ClipboardList],
        ['Pending', complaints.filter((item) => displayStatus(item) === 'Pending').length, Clock],
        ['In Progress', complaints.filter((item) => ['Assigned', 'In Progress'].includes(displayStatus(item))).length, Wrench],
        ['Solved', complaints.filter(isSolvedComplaint).length, CheckCircle2],
      ]} />
      <ManageWorkersPanel workers={workers} complaints={complaints} onAddWorker={onAddWorker} onDeleteWorker={onDeleteWorker} />
      <WorkerWorkloadPanel workers={workers} complaints={complaints} />
      <ComplaintBrowser
        title="All Complaints"
        complaints={complaints}
        workers={workers}
        role="Admin"
        onAssign={onAssign}
        onStatus={onStatus}
        onRemove={onRemove}
      />
    </DashboardShell>
  );
}

function SuperAdminDashboard({ user, complaints, workers, onAddWorker, onDeleteWorker, onStatus, onRemove }) {
  if (!hasRole(user, 'SuperAdmin')) return <Restricted role="Super Admin" />;

  const delayedComplaints = complaints.filter(isDelayedComplaint);

  return (
    <DashboardShell
      title="System Overview"
      subtitle="Monitor analytics, admin performance, unresolved complaints, and priority escalation."
      role="Super Admin"
      menu={['System Overview', 'Manage Workers', 'Worker Workload Overview', 'Complaint Monitoring', 'Reports']}
    >
      <StatsGrid stats={[
        ['Complaints per day', Math.max(1, Math.round(complaints.length / 7)), BarChart3],
        ['Delayed > 4 days', delayedComplaints.length, AlertTriangle],
        ['Admins Active', 3, UserCog],
        ['Resolved Rate', `${resolutionRate(complaints)}%`, BadgeCheck],
      ]} />
      <ManageWorkersPanel workers={workers} complaints={complaints} onAddWorker={onAddWorker} onDeleteWorker={onDeleteWorker} />
      <WorkerWorkloadPanel workers={workers} complaints={complaints} />
      {delayedComplaints.length > 0 && (
        <Panel title="Delay Notifications" action={<Bell className="h-5 w-5 text-red-600" />}>
          <div className="space-y-3">
            {delayedComplaints.map((item) => (
              <div key={item._id} className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
                <p className="font-black">Complaint ID #{shortId(item)} has not been processed for 4 days</p>
                <p className="mt-1 text-sm">{item.title} · {item.studentName} · priority escalates to {escalatedPriority(item.priority)}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}
      <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
        <Panel title="Complaint Analytics">
          <AnalyticsChart complaints={complaints} />
        </Panel>
        <Panel title="Admin Management">
          <div className="space-y-3">
            {['Hostel Admin', 'Block Admin', 'Maintenance Admin'].map((admin, index) => (
              <div key={admin} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div>
                  <p className="font-bold">{admin}</p>
                  <p className="text-sm text-slate-500">{index + 4} resolved this week</p>
                </div>
                <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">{index === 2 ? 'Remove' : 'Active'}</button>
              </div>
            ))}
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-bold text-white">
              <Plus className="h-4 w-4" />
              Add Admin
            </button>
          </div>
        </Panel>
      </div>
      <Panel title="Unresolved & Escalation Monitor">
        <div className="grid gap-4 md:grid-cols-2">
          {complaints.filter((item) => !isSolvedComplaint(item)).map((item) => (
            <div key={item._id} className={`rounded-2xl border p-4 ${isDelayedComplaint(item) ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.studentName} · {item.category}</p>
                </div>
                <PriorityBadge value={isDelayedComplaint(item) ? escalatedPriority(item.priority) : item.priority} />
              </div>
              <p className="mt-3 text-sm text-slate-600">{isDelayedComplaint(item) ? `Delayed complaint. Auto-priority: ${escalatedPriority(item.priority)}.` : 'Normal queue'}</p>
              <button onClick={() => onStatus(item._id, 'Solved', 'Super Admin solved this complaint.')} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Force Solve</button>
            </div>
          ))}
        </div>
      </Panel>
      <ComplaintBrowser
        title="All Complaints"
        complaints={complaints}
        workers={workers}
        role="SuperAdmin"
        onStatus={onStatus}
        onRemove={onRemove}
      />
    </DashboardShell>
  );
}

function ManageWorkersPanel({ workers, complaints, onAddWorker, onDeleteWorker }) {
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  const filteredWorkers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return workers
      .map((worker) => ({ ...worker, ...workerWorkload(worker, complaints) }))
      .filter((worker) => !query || [worker.name, worker.email, worker.phone].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)));
  }, [workers, complaints, search]);

  const submit = (event) => {
    event.preventDefault();
    onAddWorker(form);
    setForm({ name: '', email: '', phone: '', password: '' });
  };

  return (
    <Panel
      id="manage-workers"
      title="Manage Workers"
      action={
        <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600">
          <Search className="h-4 w-4" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-48 bg-transparent" placeholder="Search worker" />
        </label>
      }
    >
      <form onSubmit={submit} className="grid gap-3 lg:grid-cols-[1fr,1fr,1fr,1fr,auto]">
        <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="Name" />
        <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="Email" />
        <input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="Phone" />
        <input required type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="rounded-2xl border border-slate-200 bg-white px-4 py-3" placeholder="Password" />
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white">
          <Plus className="h-5 w-5" />
          Add
        </button>
      </form>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              {['Name', 'Email', 'Phone', 'Total Assigned Complaints', 'Action'].map((head) => (
                <th key={head} className="whitespace-nowrap px-4 py-3 font-bold">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredWorkers.map((worker) => (
              <tr key={worker.id || worker._id}>
                <td className="px-4 py-4 font-semibold text-slate-950">{worker.name}</td>
                <td className="px-4 py-4 text-slate-600">{worker.email}</td>
                <td className="px-4 py-4 text-slate-600">{worker.phone || 'Not provided'}</td>
                <td className="px-4 py-4 font-black text-slate-950">{worker.totalAssignedComplaints}</td>
                <td className="px-4 py-4">
                  <button onClick={() => onDeleteWorker(worker)} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 font-bold text-white">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredWorkers.length === 0 && <p className="py-8 text-center text-slate-500">No workers found.</p>}
      </div>
    </Panel>
  );
}

function WorkerWorkloadPanel({ workers, complaints }) {
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  const rows = workers.map((worker) => ({ ...worker, ...workerWorkload(worker, complaints) }));

  return (
    <Panel
      id="worker-workload-overview"
      title="Worker Workload Overview"
      action={
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600">
          {['All', 'Pending', 'Assigned', 'In Progress', 'Solved'].map((item) => <option key={item}>{item}</option>)}
        </select>
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              {['Worker Name', 'Total', 'Pending', 'Done'].map((head) => (
                <th key={head} className="whitespace-nowrap px-4 py-3 font-bold">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((worker) => (
              <tr key={worker.id || worker._id} onClick={() => setSelectedWorker(worker)} className="cursor-pointer transition hover:bg-cyan-50/60">
                <td className="px-4 py-4 font-semibold text-slate-950">{worker.name}</td>
                <td className="px-4 py-4 font-black">{worker.totalAssignedComplaints}</td>
                <td className="px-4 py-4 text-amber-700 font-black">{worker.pendingComplaints}</td>
                <td className="px-4 py-4 text-emerald-700 font-black">{worker.completedComplaints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedWorker && (
        <WorkerDetailsModal
          worker={selectedWorker}
          complaints={complaints.filter((complaint) => workerMatchesComplaint(selectedWorker, complaint))}
          statusFilter={statusFilter}
          onClose={() => setSelectedWorker(null)}
        />
      )}
    </Panel>
  );
}

function WorkerDetailsModal({ worker, complaints, statusFilter, onClose }) {
  const filteredComplaints = complaints.filter((complaint) => statusFilter === 'All' || displayStatus(complaint) === statusFilter);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-white/70 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-700">Worker Details</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{worker.name}</h2>
            <p className="mt-1 text-slate-600">{worker.email} · {worker.phone || 'No phone'}</p>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200" aria-label="Close worker details">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                {['Complaint ID', 'Student Name', 'Complaint Type', 'Description', 'Status', 'Submitted Date', 'Before Image', 'After Image'].map((head) => (
                  <th key={head} className="whitespace-nowrap px-4 py-3 font-bold">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.map((complaint) => (
                <tr key={complaint._id}>
                  <td className="px-4 py-4 font-mono text-xs text-slate-500">#{shortId(complaint)}</td>
                  <td className="px-4 py-4 font-semibold">{complaint.studentName}</td>
                  <td className="px-4 py-4">{complaint.category}</td>
                  <td className="max-w-sm px-4 py-4 text-slate-600">{complaint.description}</td>
                  <td className="px-4 py-4"><StatusBadge value={displayStatus(complaint)} /></td>
                  <td className="px-4 py-4 text-slate-500">{formatDateTime(complaint.created_at || complaint.createdAt)}</td>
                  <td className="px-4 py-4"><ImageStrip compact images={imageList(complaint.before_image || complaint.images)} /></td>
                  <td className="px-4 py-4"><ImageStrip compact images={imageList(complaint.after_image || complaint.workerProofImages)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredComplaints.length === 0 && <p className="py-8 text-center text-slate-500">No assigned complaints match this filter.</p>}
        </div>
      </section>
    </div>
  );
}

function ComplaintBrowser({ title, complaints, workers = [], role, onAssign, onStatus, onRemove }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return complaints.filter((item) => {
      const status = displayStatus(item);
      const matchesStatus =
        statusFilter === 'All' ||
        status === statusFilter ||
        (statusFilter === 'Delayed' && isDelayedComplaint(item));
      const matchesSearch =
        !query ||
        [item.studentName, item._id, item.category, item.title]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [complaints, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Panel
      id="all-complaints"
      title={title}
      action={
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600">
            <Search className="h-4 w-4" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-48 bg-transparent"
              placeholder="Student, ID, category"
            />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600">
            {['All', 'Pending', 'Assigned', 'In Progress', 'Solved', 'Delayed'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              {['Complaint ID', 'Student Name', 'Issue', 'Priority', 'Status', 'Proof', 'Assign Worker', 'Actions'].map((head) => (
                <th key={head} className="whitespace-nowrap px-4 py-3 font-bold">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.map((item) => (
              <tr
                key={item._id}
                onClick={() => setSelected(item)}
                className={`cursor-pointer transition hover:bg-cyan-50/60 ${isDelayedComplaint(item) ? 'bg-red-50 text-red-950' : ''}`}
              >
                <td className="px-4 py-4 font-mono text-xs text-slate-500">#{shortId(item)}</td>
                <td className="px-4 py-4 font-semibold">{item.studentName}</td>
                <td className="max-w-sm px-4 py-4">
                  <p className="font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1 text-slate-500">{item.category}</p>
                </td>
                <td className="px-4 py-4"><PriorityBadge value={isDelayedComplaint(item) ? escalatedPriority(item.priority) : item.priority} /></td>
                <td className="px-4 py-4"><StatusBadge value={isDelayedComplaint(item) ? 'Delayed' : displayStatus(item)} /></td>
                <td className="px-4 py-4"><ImageGallery compact images={[...imageList(item.images || item.before_image), ...imageList(item.workerProofImages || item.after_image)]} /></td>
                <td className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                  {onAssign ? (
                    <select onChange={(event) => {
                      const worker = workers.find((entry) => (entry.id || entry._id) === event.target.value);
                      if (worker) onAssign(item._id, worker);
                    }} defaultValue="" className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <option value="">{item.assignedTo && item.assignedTo !== 'Not assigned' ? item.assignedTo : 'Assign Worker'}</option>
                      {workers.map((worker) => <option key={worker.id || worker._id} value={worker.id || worker._id}>{worker.name}</option>)}
                    </select>
                  ) : (
                    <span className="text-slate-500">{item.assignedTo || 'Not assigned'}</span>
                  )}
                </td>
                <td className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => onStatus(item._id, 'Verified', 'Admin verified the solved image.')} className="rounded-xl bg-indigo-600 px-3 py-2 font-bold text-white">Verify</button>
                    <button onClick={() => onStatus(item._id, 'Solved', 'Complaint marked as Solved.')} className="rounded-xl bg-emerald-600 px-3 py-2 font-bold text-white">Solve</button>
                    {isSolvedComplaint(item) && (
                      <button onClick={() => onRemove(item, role)} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 font-bold text-white">
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="py-8 text-center text-slate-500">No complaints match this view.</p>}
        {filtered.length > 0 && (
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        )}
      </div>
      {selected && <ComplaintDetailsModal complaint={selected} onClose={() => setSelected(null)} />}
    </Panel>
  );
}

function ComplaintDetailsModal({ complaint, onClose }) {
  const beforeImages = imageList(complaint.before_image || complaint.images);
  const afterImages = imageList(complaint.after_image || complaint.workerProofImages);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/70 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-700">Complaint #{shortId(complaint)}</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{complaint.title}</h2>
            <p className="mt-2 text-slate-600">{complaint.description}</p>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200" aria-label="Close complaint details">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <DetailCard title="Complaint Full Details" rows={[
            ['Student Name', complaint.studentName],
            ['Student ID / Room No', complaint.studentId || complaint.student_id || complaint.roomNo || complaint.location || 'Not provided'],
            ['Category', complaint.category],
            ['Submission Date & Time', formatDateTime(complaint.created_at || complaint.createdAt)],
            ['Current Status', displayStatus(complaint)],
          ]} />
          <DetailCard title="Worker Details" rows={[
            ['Worker Name', complaint.workerName || complaint.assignedTo || 'Not assigned'],
            ['Worker ID', complaint.workerId || complaint.worker_id || 'Not provided'],
            ['Contact Info', complaint.workerContact || complaint.worker_contact || complaint.contact || 'Not provided'],
            ['Assigned Date', formatDateTime(complaint.assigned_at || complaint.assignedAt)],
          ]} />
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-black text-slate-950">Images Section</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <ImageComparePanel title="Before Image" images={beforeImages} />
            <ImageComparePanel title="After Image" images={afterImages} />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-black text-slate-950">View Timeline</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            {[
              ['Complaint Submitted', complaint.created_at || complaint.createdAt],
              ['Assigned to Worker', complaint.assigned_at || complaint.assignedAt],
              ['Work Started', complaint.started_at || complaint.startedAt],
              ['Completed', complaint.completed_at || complaint.completedAt || complaint.resolvedAt],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <CalendarClock className="h-5 w-5 text-cyan-700" />
                <p className="mt-3 font-bold text-slate-950">{label}</p>
                <p className="mt-1 text-sm text-slate-500">{formatDateTime(value)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function DetailCard({ title, rows }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <h3 className="font-black text-slate-950">{title}</h3>
      <dl className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 text-sm">
            <dt className="font-semibold text-slate-500">{label}</dt>
            <dd className="text-right font-bold text-slate-900">{value || 'Not provided'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ImageComparePanel({ title, images }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="font-black text-slate-950">{title}</p>
      {images.length ? (
        <div className="mt-3 grid gap-3">
          {images.slice(0, 2).map((src, index) => (
            <a key={`${src}-${index}`} href={`${API_BASE}${src}`} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img src={`${API_BASE}${src}`} alt={title} className="h-64 w-full object-cover" />
            </a>
          ))}
        </div>
      ) : (
        <div className="mt-3 grid h-64 place-items-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm font-semibold text-slate-400">No image uploaded</div>
      )}
    </div>
  );
}

function DashboardShell({ title, subtitle, role, menu, children }) {
  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[16rem,1fr] lg:px-8">
      <aside className="h-fit rounded-3xl border border-white/70 bg-white/70 p-4 shadow-xl shadow-slate-200/60 backdrop-blur">
        <div className="flex items-center gap-3 rounded-2xl bg-slate-950 p-4 text-white">
          <LayoutDashboard className="h-5 w-5" />
          <div>
            <p className="text-xs text-slate-300">Role</p>
            <p className="font-bold">{role}</p>
          </div>
        </div>
        <nav className="mt-4 space-y-2">
          {menu.map((item) => (
            <a key={item} href={`#${item.toLowerCase().replaceAll(' ', '-')}`} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
              <ListChecks className="h-4 w-4" />
              {item}
            </a>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 space-y-6">
        <div className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-xl shadow-slate-200/60 backdrop-blur">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">{role}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1>
          <p className="mt-2 text-slate-600">{subtitle}</p>
          <Lifecycle />
        </div>
        {children}
      </section>
    </main>
  );
}

function StatsGrid({ stats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(([label, value, Icon]) => (
        <div key={label} className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500">{label}</p>
            <Icon className="h-5 w-5 text-cyan-700" />
          </div>
          <p className="mt-3 text-3xl font-black text-slate-950">{value}</p>
        </div>
      ))}
    </div>
  );
}

function Panel({ title, action, id, children }) {
  return (
    <section id={id} className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-xl shadow-slate-200/50 backdrop-blur">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ComplaintTable({ complaints }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            {['Title', 'Category', 'Status', 'Priority', 'Date'].map((head) => (
              <th key={head} className="px-4 py-3 font-bold">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {complaints.map((item) => (
            <tr key={item._id}>
              <td className="max-w-sm px-4 py-4 font-semibold text-slate-950">{item.title}</td>
              <td className="px-4 py-4 text-slate-600">{item.category}</td>
              <td className="px-4 py-4"><StatusBadge value={displayStatus(item)} /></td>
              <td className="px-4 py-4"><PriorityBadge value={item.priority} /></td>
              <td className="px-4 py-4 text-slate-500">{formatDate(item.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {complaints.length === 0 && <p className="py-8 text-center text-slate-500">No complaints yet.</p>}
    </div>
  );
}

function Lifecycle() {
  return (
    <div className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-2">
      {statusFlow.map((status, index) => (
        <span key={status} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm ring-1 ring-slate-200">
          {index + 1}. {status}
        </span>
      ))}
    </div>
  );
}

function StatusBadge({ value }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ring-1 ${statusStyles[value] || statusStyles.Pending}`}>{value}</span>;
}

function PriorityBadge({ value }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ring-1 ${priorityStyles[value] || priorityStyles.Low}`}>{value || 'Low'}</span>;
}

function ImageStrip({ images = [], compact = false, label = 'Image' }) {
  return <ImageGallery images={images} compact={compact} label={label} />;
}

function Filter({ value, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600">
      <Search className="h-4 w-4" />
      <select value={value} onChange={(event) => onChange(event.target.value)} className="bg-transparent">
        <option>All</option>
        {Object.keys(categoryPriority).map((item) => <option key={item}>{item}</option>)}
      </select>
    </label>
  );
}

function Restricted({ role }) {
  return (
    <main className="grid min-h-[calc(100vh-73px)] place-items-center px-4">
      <div className="max-w-md rounded-3xl border border-white/70 bg-white/80 p-8 text-center shadow-xl">
        <Lock className="mx-auto h-10 w-10 text-slate-950" />
        <h1 className="mt-4 text-2xl font-black text-slate-950">Role-based access control</h1>
        <p className="mt-3 text-slate-600">{role} access only. Login with the correct role to open this dashboard.</p>
        <NavLink to="/login" className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white">Go to Login</NavLink>
      </div>
    </main>
  );
}

function NotFound() {
  return (
    <main className="grid min-h-[calc(100vh-73px)] place-items-center px-4">
      <div className="rounded-3xl bg-white/80 p-8 text-center shadow-xl">
        <FileImage className="mx-auto h-10 w-10 text-slate-400" />
        <h1 className="mt-4 text-2xl font-black">Page not found</h1>
        <NavLink to="/" className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white">Return Home</NavLink>
      </div>
    </main>
  );
}

function displayStatus(item) {
  if (['Resolved', 'Verified', 'Solved'].includes(item.status)) return 'Solved';
  if (['Completed', 'Awaiting Verification'].includes(item.status)) return 'In Progress';
  return item.status || 'Pending';
}

function inferComplaintCategory({ title = '', description = '', location = '' }) {
  const text = `${title} ${description} ${location}`.toLowerCase();
  const match = Object.entries(categoryKeywords).find(([, keywords]) =>
    keywords.some((keyword) => text.includes(keyword))
  );

  return match?.[0] || 'Others';
}

function formatDate(value) {
  if (!value) return 'Today';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function hasRole(user, role) {
  return user?.role === role;
}

function resolutionRate(complaints) {
  if (!complaints.length) return 0;
  const resolved = complaints.filter(isSolvedComplaint).length;
  return Math.round((resolved / complaints.length) * 100);
}

function isSolvedComplaint(item) {
  return displayStatus(item) === 'Solved';
}

function workerMatchesComplaint(worker, complaint) {
  const workerId = worker?.id || worker?._id;
  return (
    String(complaint.assigned_worker_id || '') === String(workerId || '') ||
    String(complaint.workerId || '') === String(workerId || '') ||
    complaint.assignedTo === worker?.name ||
    complaint.workerName === worker?.name
  );
}

function workerWorkload(worker, complaints) {
  const assigned = complaints.filter((complaint) => workerMatchesComplaint(worker, complaint));
  const doneStatuses = ['Completed', 'Verified', 'Resolved', 'Solved'];
  return {
    totalAssignedComplaints: assigned.length,
    pendingComplaints: assigned.filter((complaint) => !doneStatuses.includes(complaint.status)).length,
    completedComplaints: assigned.filter((complaint) => doneStatuses.includes(complaint.status)).length,
  };
}

function isDelayedComplaint(item) {
  if (isSolvedComplaint(item) || displayStatus(item) === 'In Progress') return false;
  const reference = new Date(item.created_at || item.createdAt || Date.now());
  return Date.now() - reference.getTime() >= 4 * 86400000;
}

function escalatedPriority(priority = 'Low') {
  if (priority === 'Urgent') return 'Urgent';
  if (priority === 'High') return 'Urgent';
  if (priority === 'Medium') return 'High';
  return 'Medium';
}

function shortId(item) {
  return String(item._id || '000000').slice(-6).toUpperCase();
}

function imageList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default App;
