import { useEffect, useState, useRef, useCallback } from 'react';
import { Download, FileText, Calendar } from 'lucide-react';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders } from '../../utils/auth';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { generatePDF } from '../../utils/pdfGenerator';

export default function AdminReports() {
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportType, setReportType] = useState('complaints');
  const reportRef = useRef(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredComplaints = complaints.filter((c) => {
    if (!dateFrom && !dateTo) return true;
    const d = new Date(c.createdAt);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const handleExport = async () => {
    if (!reportRef.current) return;
    await generatePDF(reportRef.current, `report-${reportType}-${new Date().toISOString().slice(0, 10)}`);
  };

  const stats = {
    total: filteredComplaints.length,
    pending: filteredComplaints.filter((c) => c.status === 'Pending').length,
    inProgress: filteredComplaints.filter((c) => ['Assigned', 'In Progress'].includes(c.status)).length,
    completed: filteredComplaints.filter((c) => ['Completed', 'Verified', 'Resolved'].includes(c.status)).length,
    byCategory: filteredComplaints.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {}),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Generate and export complaint reports</p>
      </div>

      <Card padding="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary-400">
              <option value="complaints">Complaint Summary</option>
              <option value="workers">Worker Performance</option>
            </select>
          </div>
          <Button icon={Download} onClick={handleExport}>Export PDF</Button>
        </div>
      </Card>

      {/* Report Preview */}
      <div ref={reportRef} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-card space-y-8">
        <div className="text-center border-b border-gray-100 pb-6">
          <h2 className="text-2xl font-bold text-slate-900">Smart Grievance Management System</h2>
          <p className="text-slate-500 mt-1 capitalize">{reportType} Report</p>
          <p className="text-sm text-slate-500 mt-1">
            {dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All time'}
          </p>
        </div>

        {reportType === 'complaints' ? (
          <>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-primary-50">
                <p className="text-2xl font-bold text-primary-700">{stats.total}</p>
                <p className="text-xs text-primary-600 font-medium">Total</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-amber-50">
                <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                <p className="text-xs text-amber-600 font-medium">Pending</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-sky-50">
                <p className="text-2xl font-bold text-sky-700">{stats.inProgress}</p>
                <p className="text-xs text-sky-600 font-medium">In Progress</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-emerald-50">
                <p className="text-2xl font-bold text-emerald-700">{stats.completed}</p>
                <p className="text-xs text-emerald-600 font-medium">Completed</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">By Category</h3>
              <div className="space-y-2">
                {Object.entries(stats.byCategory).map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <span className="text-sm font-medium text-slate-700">{cat}</span>
                    <span className="text-sm font-bold text-slate-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Complaint Details</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredComplaints.slice(0, 20).map((c) => (
                  <div key={c._id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition-colors hover:bg-gray-100/50">
                    <p className="text-sm font-semibold text-slate-900 truncate">{c.title}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                      <span>{c.category}</span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-3">
                      <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700 shadow-sm border border-gray-200">
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Worker Performance</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workers.map((w) => (
                <div key={w.id || w._id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition-colors hover:bg-gray-100/50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-semibold text-slate-900">{w.name}</h4>
                    <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">{w.rating || 0} ⭐</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3 truncate" title={(w.specializations || []).join(', ')}>
                    {(w.specializations || []).join(', ') || 'No specializations'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm pt-3 border-t border-gray-100">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500">Pending</span>
                      <span className="font-bold text-amber-600">{w.pendingComplaints || 0}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500">Completed</span>
                      <span className="font-bold text-emerald-600">{w.totalCompleted || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-xs text-slate-500 pt-6 border-t border-gray-100">
          Generated on {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}
