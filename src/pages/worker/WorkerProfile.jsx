import { useEffect, useMemo, useState } from 'react';
import { Mail, Phone, User, Wrench } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders } from '../../utils/auth';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';

export default function WorkerProfile() {
  const { user } = useAuth();
  const [workerProfile, setWorkerProfile] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [workersRes, complaintsRes] = await Promise.all([
          fetch(`${API_BASE}${API_ENDPOINTS.WORKER_ME}`, {
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          }),
          fetch(`${API_BASE}${API_ENDPOINTS.GET_COMPLAINTS}`, {
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          }),
        ]);

        if (workersRes.ok) {
          const data = await workersRes.json();
          setWorkerProfile(data.worker || null);
        }
        if (complaintsRes.ok) {
          const data = await complaintsRes.json();
          setComplaints(data.complaints || []);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const worker = workerProfile || user;

  const myComplaints = useMemo(() => {
    const userId = user?.id || user?._id;
    return complaints.filter((complaint) =>
      complaint.assignedTo === user?.name ||
      complaint.workerName === user?.name ||
      String(complaint.assignedWorkerId || '') === String(userId || '') ||
      String(complaint.assigned_worker_id || '') === String(userId || '') ||
      String(complaint.workerId || '') === String(userId || '')
    );
  }, [complaints, user]);

  const stats = {
    active: myComplaints.filter((item) => ['Assigned', 'In Progress'].includes(item.status)).length,
    completed: myComplaints.filter((item) => ['Completed', 'Verified', 'Resolved'].includes(item.status)).length,
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Worker account and workload details</p>
      </div>

      <Card>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{worker?.name || user?.name || 'Worker'}</h2>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{worker?.email || user?.email || 'Email not set'}</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{worker?.phone || 'Phone not set'}</p>
                <p className="flex items-center gap-2"><Wrench className="h-4 w-4" />{worker?.availabilityStatus || 'Available'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-56">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
              <p className="text-xs font-medium text-slate-500">Active</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
              <p className="text-xs font-medium text-slate-500">Completed</p>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="mb-3 text-sm font-semibold text-slate-700">Specializations</p>
          <div className="flex flex-wrap gap-2">
            {(worker?.specializations?.length ? worker.specializations : ['General']).map((skill) => (
              <Badge key={skill} className="bg-primary-50 text-primary-700 border border-primary-100">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
