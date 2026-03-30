import { useEffect, useMemo, useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ClipboardList,
  Home,
  ListChecks,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Loader2,
  UserCheck,
  Users,
  Edit3,
  Bell,
  BadgeCheck,
  Tag,
} from 'lucide-react';

const features = [
  { title: 'Submit complaints easily', icon: Home, description: 'Create complaints from any device in seconds.' },
  { title: 'Track complaint status', icon: ListChecks, description: 'Know exactly where your request stands.' },
  { title: 'Category-based complaints', icon: Tag, description: 'Organized issues for faster resolution.' },
  { title: 'Admin verification system', icon: ShieldCheck, description: 'Only admins can approve completion.' },
];

const categoryStyles = {
  Water: 'bg-cyan-500/10 text-cyan-200',
  Electricity: 'bg-amber-500/10 text-amber-200',
  Tiles: 'bg-violet-500/10 text-violet-200',
  Furniture: 'bg-emerald-500/10 text-emerald-200',
};

const priorityStyles = {
  High: 'bg-red-500/10 text-red-300',
  Medium: 'bg-orange-500/10 text-orange-300',
  Low: 'bg-emerald-500/10 text-emerald-300',
};

const statusStyles = {
  Pending: 'bg-amber-500/10 text-amber-300',
  'In Progress': 'bg-sky-500/10 text-sky-300',
  'Awaiting Confirmation': 'bg-violet-500/10 text-violet-300',
  Completed: 'bg-emerald-500/10 text-emerald-300',
};

const defaultComplaints = [
  {
    id: 1,
    studentName: 'Aanya',
    email: 'aanya@student.edu',
    title: 'Leaking bathroom pipe',
    description: 'The washroom pipe is leaking and flooding the floor daily.',
    category: 'Water',
    priority: 'High',
    status: 'Pending',
    assignedTo: 'Not assigned',
  },
  {
    id: 2,
    studentName: 'Rohan',
    email: 'rohan@student.edu',
    title: 'Broken room light',
    description: 'The ceiling light is not working in room 204.',
    category: 'Electricity',
    priority: 'Medium',
    status: 'In Progress',
    assignedTo: 'Vikram',
  },
];

const adminCredentials = {
  email: 'admin@hostel.com',
  password: 'Admin@123',
};

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

  const assignedComplaints = useMemo(
    () => complaints.filter((item) => item.assignedTo && item.assignedTo !== 'Not assigned'),
    [complaints]
  );

  const filterMyComplaints = useMemo(
    () => complaints.filter((item) => user?.email && item.email === user.email),
    [complaints, user]
  );

  const handleAuth = async (values, mode = 'login') => {
    setLoading(true);
    try {
      if (values.role === 'Student') {
        if (mode === 'register') {
          const response = await fetch(`${API_BASE}/api/students/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'Registration failed');

          setToast({ title: 'Registration successful', message: 'Student registered. Please login now.', type: 'success' });
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE}/api/students/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed');

        setUser({ role: 'Student', email: data.email, name: data.name });
        setToast({ title: 'Welcome, Student!', message: 'You are logged in successfully.', type: 'success' });
        navigate('/student');
        setLoading(false);
        return;
      }

      setUser({ role: values.role, email: values.email, name: values.name });
      setToast({ title: 'Welcome!', message: `Logged in as ${values.role}.`, type: 'success' });
      if (values.role === 'Worker') navigate('/worker');
    } catch (error) {
      setToast({ title: 'Auth error', message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = (values) => {
    setLoading(true);
    setTimeout(() => {
      if (values.email === adminCredentials.email && values.password === adminCredentials.password) {
        setUser({ role: 'Admin', email: values.email, name: 'Hostel Admin' });
        setToast({ title: 'Welcome, Admin!', message: 'Secure admin access granted.', type: 'success' });
        navigate('/admin');
      } else {
        setToast({ title: 'Login failed', message: 'Invalid admin credentials.', type: 'error' });
      }
      setLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/');
    setToast({ title: 'Signed out', message: 'You have been logged out.', type: 'info' });
  };

  const showToast = (toastData) => {
    setToast(toastData);
    window.setTimeout(() => setToast(null), 10000);
  };

  const fetchComplaints = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/complaints`);
      if (!response.ok) throw new Error('Unable to load complaints');
      const data = await response.json();
      setComplaints(data);
    } catch (error) {
      console.error(error);
      setToast({ title: 'Load error', message: error.message, type: 'error' });
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const addComplaint = async (complaint) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: user.name,
          email: user.email,
          location: complaint.location,
          contact: complaint.contact,
          ...complaint,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to submit complaint');

      setComplaints((prev) => [data, ...prev]);
      showToast({ title: 'Complaint submitted', message: 'Your request is now in the queue.', type: 'success' });
    } catch (error) {
      setToast({ title: 'Submit error', message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, nextStatus) => {
    if (nextStatus === 'Awaiting Confirmation') {
      const confirmComplete = window.confirm('Verify with the student before sending this complaint for completion confirmation. Continue?');
      if (!confirmComplete) return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/complaints/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update status');

      setComplaints((prev) => prev.map((item) => (item._id === data._id ? data : item)));
      showToast({ title: 'Status updated', message: `Complaint marked ${nextStatus}.`, type: 'success' });
    } catch (error) {
      setToast({ title: 'Update error', message: error.message, type: 'error' });
    }
  };

  const assignWorker = async (id, worker) => {
    try {
      const response = await fetch(`${API_BASE}/api/complaints/${id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: worker }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to assign worker');

      setComplaints((prev) => prev.map((item) => (item._id === data._id ? data : item)));
      showToast({ title: 'Worker assigned', message: `${worker} is now assigned.`, type: 'success' });
    } catch (error) {
      setToast({ title: 'Assignment error', message: error.message, type: 'error' });
    }
  };

  const confirmCompletion = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/complaints/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to confirm completion');

      setComplaints((prev) => prev.map((item) => (item._id === data._id ? data : item)));
      showToast({ title: 'Request closed', message: 'Complaint marked as completed by student.', type: 'success' });
    } catch (error) {
      setToast({ title: 'Update error', message: error.message, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/70 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <NavLink to="/" className="inline-flex items-center gap-3 text-2xl font-semibold text-white">
            <Sparkles className="h-7 w-7 text-indigo-400" />
            Smart Hostel
          </NavLink>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <NavLink to="/" className={({ isActive }) => isActive ? 'text-white' : 'hover:text-white'}>Home</NavLink>
            <NavLink to="/auth" className={({ isActive }) => isActive ? 'text-white' : 'hover:text-white'}>Login</NavLink>
            <NavLink to="/admin-login" className={({ isActive }) => isActive ? 'text-white' : 'hover:text-white'}>Admin Login</NavLink>
            {user && (
              <button onClick={handleLogout} className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700">
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage onSubmit={handleAuth} loading={loading} />} />
          <Route path="/admin-login" element={<AdminLoginPage onSubmit={handleAdminLogin} loading={loading} />} />
          <Route path="/student" element={<StudentDashboard user={user} complaints={filterMyComplaints} loading={loading} onSubmit={addComplaint} onConfirm={confirmCompletion} />} />
          <Route path="/admin" element={<AdminDashboard user={user} complaints={complaints} onAssign={assignWorker} onUpdate={updateStatus} />} />
          <Route path="/worker" element={<WorkerDashboard user={user} complaints={complaints} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-fade-in">
          <div className="w-80 rounded-3xl border border-slate-800/80 bg-slate-900/95 p-4 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-2xl bg-slate-700/80 p-2 text-slate-50">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-white">{toast.title}</p>
                <p className="mt-1 text-sm text-slate-400">{toast.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HomePage() {
  return (
    <section className="space-y-16">
      <div className="rounded-[2rem] border border-slate-700/80 bg-slate-900/80 bg-hero-gradient p-8 shadow-soft backdrop-blur sm:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-fuchsia-500/15 px-4 py-2 text-sm text-fuchsia-200">
              <Sparkles className="h-4 w-4" />
              Modern hostel grievance platform
            </div>
            <div className="max-w-2xl space-y-6">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Smart Hostel Grievance System
              </h1>
              <p className="text-slate-400 sm:text-lg">
                Solve hostel problems digitally with a fast complaint flow, progress tracking, and role-based management for students, admins, and workers.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <NavLink to="/auth" className="inline-flex items-center gap-2 rounded-2xl bg-fuchsia-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400">
                Login <ArrowRight className="h-4 w-4" />
              </NavLink>
              <NavLink to="/auth" className="inline-flex items-center gap-2 rounded-2xl border border-fuchsia-500/30 bg-slate-950/95 px-6 py-3 text-sm text-fuchsia-200 transition hover:bg-slate-900">
                Register
              </NavLink>
              <NavLink to="/admin-login" className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/60 bg-cyan-500/10 px-6 py-3 text-sm text-cyan-200 transition hover:bg-cyan-500/15">
                Admin Login
              </NavLink>
            </div>
            <div className="grid gap-3 rounded-3xl border border-slate-700/90 bg-slate-950/95 p-6 text-slate-300 shadow-soft sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-slate-400">Built for fast reporting</p>
                <p className="font-semibold text-white">Instant complaint creation</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400">Clear roles and workflows</p>
                <p className="font-semibold text-white">Student, Admin, Worker</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-fuchsia-500/15 via-cyan-500/10 to-slate-950/80 p-8 shadow-soft backdrop-blur sm:p-10">
            <div className="absolute inset-0 bg-hero-gradient opacity-80" />
            <div className="relative space-y-6 text-white">
              <div className="flex items-center gap-3 rounded-3xl bg-slate-950/80 px-5 py-4 shadow-xl shadow-slate-950/20">
                <ShieldCheck className="h-6 w-6 text-cyan-300" />
                <div>
                  <p className="text-sm text-slate-300">Verified process</p>
                  <p className="font-semibold">Admin approval before completion</p>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-xl shadow-slate-950/20">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">How it works</p>
                <ul className="mt-5 space-y-4 text-sm text-slate-200">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-fuchsia-400/20 text-fuchsia-300">1</span>
                    Submit a complaint and select category, priority, and description.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-400/20 text-cyan-300">2</span>
                    Admin assigns a worker and tracks progress with status badges.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-300">3</span>
                    Worker completes the repair, admin verifies, and closes the ticket.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="rounded-3xl border border-slate-700/90 bg-slate-900/80 p-6 shadow-soft transition hover:-translate-y-1 hover:border-fuchsia-500/40">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-300">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 text-slate-400">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AuthPage({ onSubmit, loading }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Student');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authMode, setAuthMode] = useState('register');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ email, role, password, name: name || email.split('@')[0] }, authMode);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-[2rem] border border-slate-800/90 bg-slate-900/90 p-8 shadow-soft sm:p-12">
        <div className="mb-8 space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Access your dashboard</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Login or Register</h1>
          <p className="mx-auto max-w-2xl text-slate-400">
            Choose a role and enter your credentials to experience the smart hostel grievance workflow.
          </p>
          <div className="mx-auto flex max-w-sm items-center justify-center gap-2 rounded-3xl border border-slate-700/80 bg-slate-950/80 p-2 text-sm text-slate-300">
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`rounded-3xl px-4 py-2 transition ${authMode === 'register' ? 'bg-indigo-500 text-white' : 'bg-transparent hover:bg-slate-900'}`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`rounded-3xl px-4 py-2 transition ${authMode === 'login' ? 'bg-indigo-500 text-white' : 'bg-transparent hover:bg-slate-900'}`}
            >
              Login
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-200">
              Your name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Student or admin name"
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-200">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-200">
              Role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
              >
                <option value="Student">Student</option>
                <option value="Worker">Worker</option>
              </select>
            </label>
          </div>
          <p className="text-sm text-slate-500">Admin users should use the dedicated Admin Login page for extra security.</p>
          {authMode === 'login' && role === 'Student' && (
            <p className="text-sm text-amber-300">If you don't have a student account yet, switch to Register first.</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : authMode === 'register' ? 'Register student' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminLoginPage({ onSubmit, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-[2rem] border border-slate-800/90 bg-slate-900/90 p-8 shadow-soft sm:p-12">
        <div className="mb-8 space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Admin Access</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Secure Admin Login</h1>
          <p className="mx-auto max-w-2xl text-slate-400">
            Sign in with the secure admin credentials to manage complaints and verify completion.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="space-y-2 text-sm text-slate-200">
            Admin email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@hostel.com"
              required
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-200">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              required
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in as Admin'}
          </button>
          <p className="text-sm text-slate-500">Use the dedicated admin login page to keep admin access separate and secure.</p>
        </form>
      </div>
    </div>
  );
}

function StudentDashboard({ user, complaints, onSubmit, onConfirm, loading }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Water');
  const [priority, setPriority] = useState('Medium');
  const [location, setLocation] = useState('Room 101, North Hostel');
  const [contact, setContact] = useState('');

  if (!user || user.role !== 'Student') {
    return <Unauthenticated message="Student access only. Please login with a student account." />;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ title, description, category, priority, location, contact });
    setTitle('');
    setDescription('');
    setCategory('Water');
    setPriority('Medium');
    setLocation('Room 101, North Hostel');
    setContact('');
  };

  return (
    <div className="space-y-10">
      <div className="rounded-[2rem] border border-slate-800/90 bg-slate-900/80 p-8 shadow-soft sm:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Student Dashboard</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Welcome back, {user.name}</h2>
            <p className="mt-2 text-slate-400">Create new complaints and track their progress in a modern workspace.</p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-950/80 px-5 py-4 text-slate-300 shadow-soft">
            <UserCheck className="h-5 w-5 text-indigo-300" />
            <div>
              <p className="text-sm text-slate-400">Role</p>
              <p className="font-semibold text-white">Student</p>
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-8 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-[2rem] border border-slate-800/90 bg-slate-900/80 p-8 shadow-soft">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Submit Complaint</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">New maintenance ticket</h3>
            </div>
            <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-800 px-4 py-2 text-sm text-slate-300">
              <Edit3 className="h-4 w-4 text-indigo-300" /> Fill details
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-200">
                Title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Broken faucet"
                  className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                Category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                >
                  <option>Water</option>
                  <option>Electricity</option>
                  <option>Tiles</option>
                  <option>Furniture</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-200">
                Location / Room
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  placeholder="Room 204, North Hostel"
                  className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-200">
                Contact number
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                  placeholder="9876543210"
                  className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                />
              </label>
            </div>
            <label className="space-y-2 text-sm text-slate-200">
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows="4"
                placeholder="Describe the issue in detail..."
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-200">
                Priority
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit complaint'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="rounded-[2rem] border border-slate-800/90 bg-slate-900/80 p-8 shadow-soft">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">My Complaints</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Recent tickets</h3>
            </div>
            <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-950/80 px-4 py-2 text-sm text-slate-300">
              <ClipboardList className="h-4 w-4 text-sky-300" /> {complaints.length} items
            </div>
          </div>
          {complaints.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800/70 bg-slate-950/70 p-8 text-center text-slate-400">
              <p className="text-lg font-semibold text-white">No complaints yet</p>
              <p className="mt-2 text-sm">Submit your first complaint to track it here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((item) => (
                <article key={item._id} className="rounded-3xl border border-slate-800/90 bg-slate-950/80 p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-fuchsia-400/50 hover:bg-slate-900/95 hover:shadow-xl">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityStyles[item.priority]}`}>{item.priority}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>{item.status}</span>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-2">
                    <p className="rounded-2xl bg-slate-900/80 px-3 py-2">Category: {item.category}</p>
                    <p className="rounded-2xl bg-slate-900/80 px-3 py-2">Assigned: {item.assignedTo}</p>
                    <p className="rounded-2xl bg-slate-900/80 px-3 py-2">Location: {item.location}</p>
                    <p className="rounded-2xl bg-slate-900/80 px-3 py-2">Contact: {item.contact}</p>
                  </div>
                  {item.status === 'Awaiting Confirmation' && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => onConfirm(item._id)}
                        className="rounded-3xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AdminDashboard({ user, complaints, onAssign, onUpdate }) {
  const [selectedWorker, setSelectedWorker] = useState('Vikram');

  if (!user || user.role !== 'Admin') {
    return <Unauthenticated message="Admin access only. Please login with an admin account." />;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-800/90 bg-slate-900/80 p-8 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Admin Dashboard</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Manage all complaints</h2>
            <p className="mt-2 text-slate-400">Assign workers, update statuses, and verify completion.</p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-950/80 px-5 py-4 text-slate-300 shadow-soft">
            <Users className="h-5 w-5 text-indigo-300" />
            <div>
              <p className="text-sm text-slate-400">Role</p>
              <p className="font-semibold text-white">Admin</p>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-[2rem] border border-slate-800/90 bg-slate-900/80 p-6 shadow-soft overflow-x-auto">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">All Complaints</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Ticket management</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-3xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300">{complaints.length} complaints</span>
            <div className="flex items-center gap-2 rounded-3xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300">
              <BadgeCheck className="h-4 w-4 text-sky-300" /> Verify before complete
            </div>
          </div>
        </div>
        <table className="min-w-full border-separate border-spacing-y-4 text-left text-sm">
          <thead>
            <tr className="text-slate-400">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Contact No.</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Worker</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((item) => (
              <tr key={item._id} className="rounded-3xl bg-slate-950/90 shadow-soft">
                <td className="px-4 py-4 font-medium text-white">{item.studentName}</td>
                <td className="px-4 py-4 text-slate-300">{item.contact}</td>
                <td className="px-4 py-4 text-slate-300">{item.location}</td>
                <td className="px-4 py-4 max-w-[24rem] break-words text-slate-300">{item.description}</td>
                <td className="px-4 py-4 text-slate-300">{item.priority}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>{item.status}</span>
                </td>
                <td className="px-4 py-4 text-slate-300">{item.assignedTo}</td>
                <td className="px-4 py-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onUpdate(item._id, 'Pending')}
                      className="rounded-2xl bg-slate-800 px-3 py-2 text-xs text-slate-200 transition hover:bg-slate-700"
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => onUpdate(item._id, 'In Progress')}
                      className="rounded-2xl bg-slate-800 px-3 py-2 text-xs text-slate-200 transition hover:bg-slate-700"
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => onUpdate(item._id, 'Awaiting Confirmation')}
                      className="rounded-2xl bg-slate-800 px-3 py-2 text-xs text-slate-200 transition hover:bg-slate-700"
                    >
                      Verify Complete
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedWorker}
                      onChange={(e) => setSelectedWorker(e.target.value)}
                      className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                    >
                      <option>Vikram</option>
                      <option>Priya</option>
                      <option>Rahul</option>
                    </select>
                    <button
                      onClick={() => onAssign(item._id, selectedWorker)}
                      className="rounded-2xl bg-indigo-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-400"
                    >
                      Assign Worker
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorkerDashboard({ user, complaints }) {
  if (!user || user.role !== 'Worker') {
    return <Unauthenticated message="Worker access only. Please login with a worker account." />;
  }

  const assignedList = complaints.filter((item) => item.assignedTo && item.assignedTo !== 'Not assigned');

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-slate-800/90 bg-slate-900/80 p-8 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Worker Dashboard</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Assigned repair tasks</h2>
            <p className="mt-2 text-slate-400">Review your assigned work and check status details.</p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-950/80 px-5 py-4 text-slate-300 shadow-soft">
            <Users className="h-5 w-5 text-sky-300" />
            <div>
              <p className="text-sm text-slate-400">Role</p>
              <p className="font-semibold text-white">Worker</p>
            </div>
          </div>
        </div>
      </div>
      {assignedList.length === 0 ? (
        <div className="rounded-[2rem] border border-slate-800/90 bg-slate-900/80 p-10 text-center text-slate-300 shadow-soft">
          <p className="text-xl font-semibold text-white">No assigned tasks yet</p>
          <p className="mt-3 text-slate-400">Once an admin assigns a complaint to you, it will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {assignedList.map((item) => (
            <div key={item._id} className="rounded-[2rem] border border-slate-800/90 bg-slate-950/80 p-6 shadow-soft transition hover:-translate-y-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{item.category}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{item.title}</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>{item.status}</span>
              </div>
              <p className="mt-4 text-slate-300">{item.description}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-900/70 p-4 text-slate-300">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Priority</p>
                  <p className="mt-2 font-semibold text-white">{item.priority}</p>
                </div>
                <div className="rounded-3xl bg-slate-900/70 p-4 text-slate-300">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Student</p>
                  <p className="mt-2 font-semibold text-white">{item.studentName}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Unauthenticated({ message }) {
  return (
    <div className="rounded-[2rem] border border-slate-800/90 bg-slate-900/80 p-10 text-center shadow-soft">
      <h2 className="text-2xl font-semibold text-white">Access Restricted</h2>
      <p className="mt-4 text-slate-400">{message}</p>
      <p className="mt-2 text-slate-500">Use the login page to enter with the correct role.</p>
      <NavLink to="/auth" className="mt-6 inline-flex rounded-3xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400">
        Go to Login
      </NavLink>
    </div>
  );
}

function NotFound() {
  return (
    <div className="rounded-[2rem] border border-slate-800/90 bg-slate-900/80 p-12 text-center shadow-soft">
      <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">404 error</p>
      <h1 className="mt-5 text-4xl font-semibold text-white">Page not found</h1>
      <p className="mt-4 text-slate-400">The route you are looking for does not exist.</p>
      <NavLink to="/" className="mt-8 inline-flex rounded-3xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400">
        Return home
      </NavLink>
    </div>
  );
}

export default App;
