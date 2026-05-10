import { useEffect, useState, useMemo } from 'react';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders } from '../../utils/auth';
import Card from '../../components/common/Card';
import Skeleton from '../../components/common/Skeleton';

export default function SuperAdminAnalytics() {
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, wRes] = await Promise.all([
        fetch(`${API_BASE}${API_ENDPOINTS.GET_COMPLAINTS}?limit=1000`, { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }),
        fetch(`${API_BASE}${API_ENDPOINTS.GET_WORKERS}`, { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }),
      ]);
      if (cRes.ok) setComplaints((await cRes.json()).complaints || []);
      if (wRes.ok) setWorkers(await wRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const trends = useMemo(() => {
    const byMonth = {};
    complaints.forEach((c) => {
      const month = new Date(c.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      byMonth[month] = (byMonth[month] || 0) + 1;
    });
    return Object.entries(byMonth).slice(-6);
  }, [complaints]);

  const categoryBreakdown = useMemo(() => {
    const counts = {};
    complaints.forEach((c) => { counts[c.category] = (counts[c.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [complaints]);

  const workerRanking = useMemo(() => {
    return [...workers].sort((a, b) => (b.totalCompleted || 0) - (a.totalCompleted || 0)).slice(0, 10);
  }, [workers]);

  const avgResolution = useMemo(() => {
    const resolved = complaints.filter((c) => c.resolvedAt && c.createdAt);
    if (!resolved.length) return 0;
    const totalMs = resolved.reduce((acc, c) => acc + (new Date(c.resolvedAt) - new Date(c.createdAt)), 0);
    return Math.round(totalMs / resolved.length / (1000 * 60 * 60 * 24));
  }, [complaints]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Deep insights into system performance</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total Complaints</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{complaints.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Avg Resolution Time</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{avgResolution} days</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Total Workers</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{workers.length}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Complaint Trends</h3>
          <div className="space-y-3">
            {trends.map(([month, count]) => (
              <div key={month} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-20">{month}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-lg transition-all"
                    style={{ width: `${Math.min(100, (count / Math.max(...trends.map((t) => t[1]))) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-900 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">By Category</h3>
          <div className="space-y-3">
            {categoryBreakdown.map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-24 truncate">{cat}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-lg transition-all"
                    style={{ width: `${Math.min(100, (count / Math.max(...categoryBreakdown.map((t) => t[1]))) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-900 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Worker Performance Ranking</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workerRanking.map((w, i) => (
            <div key={w.id || w._id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition-colors hover:bg-gray-100/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl font-bold text-slate-900">#{i + 1}</span>
                <span className="text-sm font-semibold text-slate-700 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">{w.rating || 0} ⭐</span>
              </div>
              <h4 className="text-lg font-semibold text-slate-900">{w.name}</h4>
              <p className="text-sm text-slate-600 mt-1 truncate" title={(w.specializations || []).join(', ')}>
                {(w.specializations || []).join(', ') || 'No specializations'}
              </p>
              <div className="mt-3 flex items-center justify-between text-sm pt-3 border-t border-gray-100">
                <span className="text-slate-500 font-medium">Tasks Completed</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">{w.totalCompleted || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
