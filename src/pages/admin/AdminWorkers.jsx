import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Edit2, Power } from 'lucide-react';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders, getToken } from '../../utils/auth';
import { CATEGORIES } from '../../utils/constants';
import { useToast } from '../../contexts/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';
import Badge from '../../components/common/Badge';

export default function AdminWorkers() {
  const { success, error: showError } = useToast();
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', specializations: [], maxWorkload: 5, isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWorkers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}${API_ENDPOINTS.GET_WORKERS}`, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setWorkers(data);
      } else {
        console.error('Failed to fetch workers');
      }
    } catch (err) {
      console.error('Fetch workers error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!form.name || !form.phone) {
      showError('Name and phone are required');
      return;
    }
    
    if (!editingWorker && (!form.email || !form.password)) {
      showError('Email and password are required for new workers');
      return;
    }
    
    if (!editingWorker && form.password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }
    
    // Check if user is authenticated
    if (!getToken()) {
      showError('Your session has expired. Please log in again.');
      return;
    }
    
    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const url = editingWorker
        ? `${API_BASE}${API_ENDPOINTS.UPDATE_WORKER(editingWorker.id || editingWorker._id)}`
        : `${API_BASE}${API_ENDPOINTS.CREATE_WORKER}`;
      const method = editingWorker ? 'PATCH' : 'POST';
      const body = editingWorker
        ? { name: form.name, phone: form.phone, specializations: form.specializations, maxWorkload: form.maxWorkload, isActive: form.isActive }
        : form;

      const headers = getAuthHeaders();
      const res = await fetch(url, {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        let errorMessage = `Failed to ${editingWorker ? 'update' : 'create'} worker`;
        try {
          const data = await res.json();
          if (res.status === 401) {
            errorMessage = 'Your session has expired. Please log in again.';
          } else {
            errorMessage = data.message || errorMessage;
          }
        } catch {
          if (res.status === 401) {
            errorMessage = 'Your session has expired. Please log in again.';
          } else {
            errorMessage = `HTTP ${res.status}: ${res.statusText}`;
          }
        }
        showError(errorMessage);
        return;
      }
      
      const data = await res.json();
      success(editingWorker ? 'Worker updated successfully' : 'Worker created successfully');
      setShowModal(false);
      setEditingWorker(null);
      setForm({ name: '', email: '', phone: '', password: '', specializations: [], maxWorkload: 5, isActive: true });
      fetchWorkers();
    } catch (err) {
      console.error('Worker submission error:', err);
      showError(err.message || 'Failed to process request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (worker) => {
    if (!window.confirm(`Delete ${worker.name}?`)) return;
    try {
      const res = await fetch(`${API_BASE}${API_ENDPOINTS.DELETE_WORKER(worker.id || worker._id)}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        success('Worker deleted successfully');
        fetchWorkers();
      } else {
        const data = await res.json();
        showError(data.message || 'Failed to delete worker');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showError('Failed to delete worker');
    }
  };

  const handleToggle = async (worker) => {
    try {
      const res = await fetch(`${API_BASE}${API_ENDPOINTS.TOGGLE_WORKER(worker.id || worker._id)}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        success(worker.isActive ? 'Worker deactivated' : 'Worker activated');
        fetchWorkers();
      } else {
        const data = await res.json();
        showError(data.message || 'Failed to update worker status');
      }
    } catch (err) {
      console.error('Toggle error:', err);
      showError('Failed to update worker status');
    }
  };

  const openEdit = (worker) => {
    setEditingWorker(worker);
    setForm({
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      password: '',
      specializations: worker.specializations || [],
      maxWorkload: worker.maxWorkload || 5,
      isActive: worker.isActive !== false,
    });
    setShowModal(true);
  };

  const columns = [
    { key: 'name', header: 'Name', render: (v, row) => <span className="font-medium text-slate-900">{v}</span> },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'specializations',
      header: 'Specializations',
      render: (v) => (
        <div className="flex flex-wrap gap-1">
          {(v || []).map((s) => (
            <span key={s} className="rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700">{s}</span>
          ))}
        </div>
      ),
    },
    { key: 'pendingComplaints', header: 'Pending' },
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
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" icon={Edit2} onClick={(e) => { e.stopPropagation(); openEdit(row); }} />
          <Button size="sm" variant="ghost" icon={Power} onClick={(e) => { e.stopPropagation(); handleToggle(row); }} />
          <Button size="sm" variant="ghost" icon={Trash2} onClick={(e) => { e.stopPropagation(); handleDelete(row); }} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage worker accounts and specializations</p>
        </div>
        <Button onClick={() => { setEditingWorker(null); setForm({ name: '', email: '', phone: '', password: '', specializations: [], maxWorkload: 5, isActive: true }); setShowModal(true); }} icon={Plus}>
          Add Worker
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={workers}
        isLoading={isLoading}
        keyExtractor={(row) => row.id || row._id}
        emptyState={<EmptyState title="No workers" message="Add workers to start assigning complaints." actionLabel="Add Worker" onAction={() => setShowModal(true)} />}
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingWorker ? 'Edit Worker' : 'Add Worker'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-primary-400" />
          </div>
          {!editingWorker && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-primary-400" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
            <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-primary-400" />
          </div>
          {!editingWorker && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required minLength={6} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-primary-400" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Specializations</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <label key={cat} className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${form.specializations.includes(cat) ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={form.specializations.includes(cat)}
                    onChange={(e) => {
                      setForm((p) => ({
                        ...p,
                        specializations: e.target.checked
                          ? [...p.specializations, cat]
                          : p.specializations.filter((s) => s !== cat),
                      }));
                    }}
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Workload</label>
              <input type="number" min={1} max={20} value={form.maxWorkload} onChange={(e) => setForm((p) => ({ ...p, maxWorkload: parseInt(e.target.value) || 5 }))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-primary-400" />
            </div>
            {editingWorker && (
              <div className="flex items-center gap-3 pt-7">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700">Active</label>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>{editingWorker ? 'Save' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
