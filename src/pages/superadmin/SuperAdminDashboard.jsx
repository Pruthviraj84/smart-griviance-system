import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle2, AlertTriangle, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders } from '../../utils/auth';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [delayed, setDelayed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, dRes] = await Promise.all([
        fetch(`${API_BASE}${API_ENDPOINTS.GET_COMPLAINTS}`, { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }),
        fetch(`${API_BASE}${API_ENDPOINTS.DELAYED_COMPLAINTS}`, { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }),
      ]);
      if (cRes.ok) setComplaints((await cRes.json()).complaints || []);
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
    const avgResolution = complaints.filter((c) => c.resolvedAt && c.createdAt).reduce((acc, c) => {
      return acc + (new Date(c.resolvedAt) - new Date(c.createdAt));
    }, 0) / (complaints.filter((c) => c.resolvedAt).length || 1);
    const avgDays = Math.round(avgResolution / (1000 * 60 * 60 * 24));
    return { total, pending, inProgress, completed, delayed: delayed.length, avgDays };
  }, [complaints, delayed]);

  const statCards = [
    { label: 'Total', value: stats.total, icon: ClipboardList, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Delayed', value: stats.delayed, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Avg Resolution', value: `${stats.avgDays}d`, icon: BarChart3, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Super Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">System-wide analytics and monitoring</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Delayed</h2>
          {isLoading ? <Skeleton className="h-16" count={3} /> : delayed.slice(0, 5).length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No delayed complaints</p>
          ) : (
            <div className="space-y-2">
              {delayed.slice(0, 5).map((c) => (
                <div key={c._id} className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{c.title}</p>
                    <p className="text-xs text-slate-500">{c.category}</p>
                  </div>
                  <Badge status="Delayed">Delayed</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Status Breakdown</h2>
          <div className="space-y-3">
            {['Pending', 'Assigned', 'In Progress', 'Completed', 'Verified', 'Resolved'].map((status) => {
              const count = complaints.filter((c) => c.status === status).length;
              const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{status}</span>
                    <span className="font-medium text-slate-900">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
