import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle2, TrendingUp, Wrench } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders } from '../../utils/auth';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await fetch(`${API_BASE}${API_ENDPOINTS.GET_COMPLAINTS}?limit=5`, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const myComplaints = complaints.filter(
    (c) => c.assignedTo === user?.name || c.workerName === user?.name
  );

  const stats = useMemo(() => {
    const total = myComplaints.length;
    const pending = myComplaints.filter((c) => ['Pending', 'Assigned'].includes(c.status)).length;
    const inProgress = myComplaints.filter((c) => c.status === 'In Progress').length;
    const completed = myComplaints.filter((c) => ['Completed', 'Verified', 'Resolved'].includes(c.status)).length;
    return { total, pending, inProgress, completed };
  }, [myComplaints]);

  const statCards = [
    { label: 'Assigned', value: stats.total, icon: ClipboardList, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'In Progress', value: stats.inProgress, icon: TrendingUp, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Worker Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back, {user?.name}</p>
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

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Recent Tasks</h2>
          <button onClick={() => navigate('/worker/tasks')} className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View all
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16" count={3} />
          </div>
        ) : myComplaints.length === 0 ? (
          <EmptyState title="No tasks assigned" message="You don't have any assigned complaints yet." />
        ) : (
          <div className="space-y-3">
            {myComplaints.slice(0, 5).map((c) => (
              <button
                key={c._id}
                onClick={() => navigate(`/worker/tasks?id=${c._id}`)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{c.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.category} • {new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
                <Badge status={c.status}>{c.status}</Badge>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
