import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, Zap, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders } from '../../utils/auth';
import { CATEGORIES, PRIORITIES, COMPLAINT_STATUSES } from '../../utils/constants';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';

export default function SuperAdminComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', search: '' });

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const url = `${API_BASE}${API_ENDPOINTS.GET_COMPLAINTS}${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleOverride = async (id, action) => {
    try {
      const res = await fetch(`${API_BASE}${API_ENDPOINTS.SUPERADMIN_OVERRIDE(id)}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) fetchComplaints();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { key: 'title', header: 'Title', render: (v, row) => <span className="font-medium text-slate-900">{v}</span> },
    { key: 'category', header: 'Category' },
    { key: 'priority', header: 'Priority', render: (v) => <Badge priority={v}>{v}</Badge> },
    { key: 'status', header: 'Status', render: (v) => <Badge status={v}>{v}</Badge> },
    { key: 'assignedTo', header: 'Assigned', render: (v) => v || 'Unassigned' },
    {
      key: '_id',
      header: 'Override',
      sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" icon={CheckCircle2} onClick={(e) => { e.stopPropagation(); handleOverride(row._id, 'resolve'); }} />
          <Button size="sm" variant="ghost" icon={RotateCcw} onClick={(e) => { e.stopPropagation(); handleOverride(row._id, 'reopen'); }} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Complaints</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor and override complaints across the system</p>
      </div>

      <Card padding="p-4">
        <div className="flex flex-wrap gap-3">
          <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary-400">
            <option value="">All Statuses</option>
            {COMPLAINT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary-400">
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.priority} onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary-400">
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} placeholder="Search..." className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary-400" />
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={complaints}
        isLoading={isLoading}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => navigate(`/superadmin/complaints?id=${row._id}`)}
        emptyState={<EmptyState title="No complaints found" message="Try adjusting your filters." />}
      />
    </div>
  );
}
