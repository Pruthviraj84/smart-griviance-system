import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders } from '../../utils/auth';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ComplaintForm from '../../components/student/ComplaintForm';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';

const tabs = ['All', 'Pending', 'In Progress', 'Completed'];

export default function StudentComplaints() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [searchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [showNewModal, setShowNewModal] = useState(searchParams.get('new') === 'true');

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `${API_BASE}${API_ENDPOINTS.GET_COMPLAINTS}`;
      const params = new URLSearchParams();

      if (activeTab !== 'All') {
        if (activeTab === 'In Progress') {
          params.append('status', 'Assigned');
        } else if (activeTab === 'Completed') {
          params.append('status', 'Completed');
        } else {
          params.append('status', activeTab);
        }
      }

      const search = searchParams.get('search');
      if (search) params.append('search', search);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
      } else {
        const errorData = await res.json().catch(() => null);
        showError(errorData?.message || 'Failed to load complaints.');
      }
    } catch (err) {
      console.error(err);
      showError('Unable to load complaints. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchParams, showError]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const filtered = complaints.filter((c) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return c.status === 'Pending';
    if (activeTab === 'In Progress') return ['Assigned', 'In Progress'].includes(c.status);
    if (activeTab === 'Completed') return ['Completed', 'Verified', 'Resolved'].includes(c.status);
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Complaints</h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage your grievances</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} icon={Plus}>
          Raise Complaint
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
                : 'text-slate-600 hover:bg-gray-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" count={4} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No complaints found"
          message="No complaints match the selected filter."
          actionLabel="Raise Complaint"
          onAction={() => setShowNewModal(true)}
        />
      ) : (
        <div className="grid gap-4">
          {filtered.map((c) => (
            <Card key={c._id} hover padding="p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-slate-900">{c.title}</h3>
                    {c.complaintCount > 1 && (
                      <Badge className="bg-orange-100 text-orange-800 text-xs">
                        {c.complaintCount} reports
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{c.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge status={c.status}>{c.status}</Badge>
                    <Badge priority={c.priority}>{c.priority}</Badge>
                    <span className="text-xs text-slate-500">{c.category}</span>
                    <span className="text-xs text-slate-500">• {new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/student/complaints?id=${c._id}`)}
                >
                  View
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="Raise New Complaint">
        <ComplaintForm
          user={user}
          onSuccess={() => {
            success('Complaint submitted successfully!');
            setShowNewModal(false);
            fetchComplaints();
          }}
          onClose={() => setShowNewModal(false)}
        />
      </Modal>
    </div>
  );
}
