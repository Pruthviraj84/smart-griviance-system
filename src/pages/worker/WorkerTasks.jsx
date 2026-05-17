import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders } from '../../utils/auth';
import WorkerComplaintCard from '../../components/common/WorkerComplaintCard';
import CompleteWorkModal from '../../components/common/CompleteWorkModal';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';

const tabs = ['All', 'Assigned', 'In Progress', 'Completed', 'Verified'];

export default function WorkerTasks() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}${API_ENDPOINTS.GET_COMPLAINTS}`, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        const userId = user?.id || user?._id;
        const mine = (data.complaints || []).filter(
          (c) =>
            c.assignedTo === user?.name ||
            c.workerName === user?.name ||
            String(c.assignedWorkerId || '') === String(userId || '') ||
            String(c.assigned_worker_id || '') === String(userId || '') ||
            String(c.workerId || '') === String(userId || '')
        );
        setComplaints(mine);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', message: 'Failed to load tasks' });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?._id, user?.name]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleStartWork = async (complaint) => {
    setIsUpdating(true);
    setStatusMessage({ type: '', message: '' });
    try {
      const res = await fetch(`${API_BASE}/api/complaints/${complaint._id}/start-work`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const updated = await res.json();
        setComplaints(prev => prev.map(c => c._id === updated._id ? updated : c));
        setStatusMessage({ 
          type: 'success', 
          message: 'Work started successfully. Status changed to "In Progress"' 
        });
        setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
      } else {
        const errorData = await res.json();
        setStatusMessage({ type: 'error', message: errorData.message || 'Failed to start work' });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', message: 'An error occurred while starting work' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteWork = (complaint) => {
    setSelectedComplaint(complaint);
    setShowCompleteModal(true);
  };

  const handleCompleteWorkSubmit = async (formData) => {
    setIsUpdating(true);
    setStatusMessage({ type: '', message: '' });
    try {
      const res = await fetch(`${API_BASE}/api/complaints/${selectedComplaint._id}/complete-work`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (res.ok) {
        const updated = await res.json();
        setComplaints(prev => prev.map(c => c._id === updated._id ? updated : c));
        setStatusMessage({ 
          type: 'success', 
          message: 'Work completed and proof uploaded. Awaiting admin verification.' 
        });
        setShowCompleteModal(false);
        setSelectedComplaint(null);
        setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
      } else {
        const errorData = await res.json();
        setStatusMessage({ type: 'error', message: errorData.message || 'Failed to complete work' });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', message: 'An error occurred while submitting completion' });
    } finally {
      setIsUpdating(false);
    }
  };

  const filtered = complaints.filter((c) => {
    const search = searchParams.get('search')?.trim().toLowerCase();
    const matchesSearch = !search ||
      c.title?.toLowerCase().includes(search) ||
      c.description?.toLowerCase().includes(search) ||
      c.category?.toLowerCase().includes(search) ||
      c.studentName?.toLowerCase().includes(search);

    if (!matchesSearch) return false;
    if (activeTab === 'All') return true;
    if (activeTab === 'Completed') return ['Completed', 'Verified', 'Resolved'].includes(c.status);
    return c.status === activeTab;
  });

  const stats = {
    assigned: complaints.filter(c => c.status === 'Assigned').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    completed: complaints.filter(c => ['Completed', 'Verified', 'Resolved'].includes(c.status)).length,
    awaiting: complaints.filter(c => c.status === 'Completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
        <p className="text-sm text-slate-600 mt-1">Manage your assigned complaints and complete work</p>
      </div>

      {/* Status Message */}
      {statusMessage.message && (
        <div className={`flex gap-3 rounded-lg p-4 border ${
          statusMessage.type === 'success'
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <div className="text-sm font-medium">{statusMessage.message}</div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
          <p className="text-2xl font-bold text-orange-900">{stats.assigned}</p>
          <p className="text-xs text-orange-700 font-medium mt-1">Assigned</p>
        </div>
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-2xl font-bold text-blue-900">{stats.inProgress}</p>
          <p className="text-xs text-blue-700 font-medium mt-1">In Progress</p>
        </div>
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-2xl font-bold text-yellow-900">{stats.awaiting}</p>
          <p className="text-xs text-yellow-700 font-medium mt-1">Awaiting Verification</p>
        </div>
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
          <p className="text-xs text-green-700 font-medium mt-1">Completed</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32" count={3} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`No ${activeTab === 'All' ? 'tasks' : activeTab.toLowerCase()}`}
          message="No complaints match the selected filter."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((complaint) => (
            <WorkerComplaintCard
              key={complaint._id}
              complaint={complaint}
              userRole={user?.role}
              onStartWork={() => handleStartWork(complaint)}
              onCompleteWork={() => handleCompleteWork(complaint)}
              isLoading={isUpdating}
            />
          ))}
        </div>
      )}

      {/* Complete Work Modal */}
      {showCompleteModal && selectedComplaint && (
        <CompleteWorkModal
          complaint={selectedComplaint}
          onClose={() => {
            setShowCompleteModal(false);
            setSelectedComplaint(null);
          }}
          onSubmit={handleCompleteWorkSubmit}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
}
