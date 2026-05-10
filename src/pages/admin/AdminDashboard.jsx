import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle2, AlertTriangle, TrendingUp, Users, ArrowRight } from 'lucide-react';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders } from '../../utils/auth';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import WorkerPerformanceTable from '../../components/admin/WorkerPerformanceTable';
import DelayedComplaintsAlert from '../../components/admin/DelayedComplaintsAlert';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [delayed, setDelayed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, wRes, dRes] = await Promise.all([
        fetch(`${API_BASE}${API_ENDPOINTS.GET_COMPLAINTS}`, { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }),
        fetch(`${API_BASE}${API_ENDPOINTS.GET_WORKERS}`, { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }),
        fetch(`${API_BASE}${API_ENDPOINTS.DELAYED_COMPLAINTS}`, { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }),
      ]);
      if (cRes.ok) setComplaints((await cRes.json()).complaints || []);
      if (wRes.ok) setWorkers(await wRes.json());
      if (dRes.ok) setDelayed(await dRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter((c) => c.status === 'Pending').length;
    const inProgress = complaints.filter((c) => ['Assigned', 'In Progress'].includes(c.status)).length;
    const completed = complaints.filter((c) => ['Completed', 'Verified', 'Resolved'].includes(c.status)).length;
    return { total, pending, inProgress, completed };
  }, [complaints]);

  const statCards = [
    { label: 'Total', value: stats.total, icon: ClipboardList, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of all complaints and operations</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} padding="p-5" hover>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg} ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500 font-medium">{card.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {delayed.length > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold text-slate-900">Delayed Complaints ({delayed.length})</h2>
          </div>
          <div className="space-y-2">
            {delayed.slice(0, 3).map((c) => (
              <div key={c._id} className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{c.title}</p>
                  <p className="text-xs text-slate-500">{c.category} • {new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
                <Badge status="Delayed">Delayed</Badge>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/admin/complaints')} className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700">
            View all complaints →
          </button>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Recent Complaints</h2>
            <button onClick={() => navigate('/admin/complaints')} className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View all
            </button>
          </div>
          {isLoading ? (
            <Skeleton className="h-16" count={3} />
          ) : complaints.slice(0, 5).length === 0 ? (
            <EmptyState title="No complaints" message="No complaints have been submitted yet." />
          ) : (
            <div className="space-y-3">
              {complaints.slice(0, 5).map((c) => (
                <button
                  key={c._id}
                  onClick={() => navigate(`/admin/complaints?id=${c._id}`)}
                  className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{c.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.assignedTo || 'Unassigned'}</p>
                  </div>
                  <Badge status={c.status}>{c.status}</Badge>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Workers</h2>
            <button onClick={() => navigate('/admin/workers')} className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Manage
            </button>
          </div>
          {isLoading ? (
            <Skeleton className="h-16" count={3} />
          ) : workers.length === 0 ? (
            <EmptyState title="No workers" message="Add workers to start assigning complaints." />
          ) : (
            <div className="space-y-3">
              {workers.slice(0, 5).map((w) => (
                <div key={w.id || w._id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{w.name}</p>
                    <p className="text-xs text-slate-500">{w.specializations?.join(', ') || 'General'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{w.pendingComplaints || 0} pending</span>
                    <div className={`h-2.5 w-2.5 rounded-full ${w.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Delay Detection Section */}
      <DelayedComplaintsAlert />

      {/* Worker Task Monitoring */}
      <WorkerPerformanceTable />
    </div>
  );
}
