import { useEffect, useState, useCallback } from 'react';
import { Trash2, Users, UserCheck } from 'lucide-react';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders } from '../../utils/auth';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';

export default function SuperAdminUsers() {
  const [students, setStudents] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const wRes = await fetch(`${API_BASE}${API_ENDPOINTS.GET_WORKERS}`, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      if (wRes.ok) setWorkers(await wRes.json());
      // Students endpoint doesn't exist for listing, we'd need to add it
      setStudents([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteWorker = async (worker) => {
    if (!window.confirm(`Delete ${worker.name}?`)) return;
    try {
      await fetch(`${API_BASE}${API_ENDPOINTS.DELETE_WORKER(worker.id || worker._id)}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const workerColumns = [
    { key: 'name', header: 'Name', render: (v) => <span className="font-medium text-slate-900">{v}</span> },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'specializations', header: 'Specializations', render: (v) => (v || []).join(', ') },
    { key: 'maxWorkload', header: 'Max Workload' },
    {
      key: 'isActive',
      header: 'Status',
      render: (v) => <Badge status={v ? 'Resolved' : 'Delayed'}>{v ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: '_id',
      header: 'Actions',
      sortable: false,
      render: (_, row) => (
        <Button size="sm" variant="ghost" icon={Trash2} onClick={(e) => { e.stopPropagation(); handleDeleteWorker(row); }} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage all system users</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('students')}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'students' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'text-slate-600 hover:bg-gray-100'}`}
        >
          Students
        </button>
        <button
          onClick={() => setActiveTab('workers')}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'workers' ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'text-slate-600 hover:bg-gray-100'}`}
        >
          Workers
        </button>
      </div>

      {activeTab === 'workers' ? (
        <DataTable
          columns={workerColumns}
          data={workers}
          isLoading={isLoading}
          keyExtractor={(row) => row.id || row._id}
          emptyState={<EmptyState title="No workers" message="No workers in the system." />}
        />
      ) : (
        <EmptyState title="Student list unavailable" message="Student listing endpoint needs to be added to backend." />
      )}
    </div>
  );
}
