import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Armchair, Droplets, Flame, Search, Shield, UserCheck, Wifi, Wrench, Zap, Image, Eye } from 'lucide-react';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders } from '../../utils/auth';
import { CATEGORIES, PRIORITIES, COMPLAINT_STATUSES } from '../../utils/constants';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../contexts/ToastContext';
import { formatDateTime, normalizeCategory, getImageUrl } from '../../utils/helpers';

const categoryIconMap = {
  Electric: Zap,
  Plumbing: Droplets,
  Internet: Wifi,
  Security: Shield,
  Furniture: Armchair,
  Cleaning: Wrench,
  Food: Flame,
};

const getSlaText = (complaint) => {
  const created = new Date(complaint.createdAt || complaint.created_at || Date.now()).getTime();
  const hoursOpen = Math.max(0, Math.floor((Date.now() - created) / 3600000));
  const limit = complaint.priority === 'Urgent' ? 6 : complaint.priority === 'High' ? 24 : complaint.priority === 'Medium' ? 48 : 72;
  const remaining = limit - hoursOpen;
  if (['Resolved', 'Verified', 'Completed'].includes(complaint.status)) return 'SLA complete';
  return remaining < 0 ? `${Math.abs(remaining)}h overdue` : `${remaining}h left`;
};

const isComplaintAssigned = (complaint = {}) =>
  Boolean(
    complaint.assignedWorkerId ||
    complaint.assigned_worker_id ||
    complaint.workerId ||
    (complaint.assignedTo && complaint.assignedTo !== 'Not assigned')
  );

const workerMatchesCategory = (worker, category) => {
  const complaintCategory = normalizeCategory(category);
  const skills = worker.specializations?.length ? worker.specializations : [worker.specialization];
  return skills.some((skill) => normalizeCategory(skill) === complaintCategory);
};

export default function AdminComplaints() {
  const navigate = useNavigate();
  const { success, error: showError, info } = useToast();
  const [searchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    assignedTo: '',
    search: searchParams.get('search') || '',
  });
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignWorkerId, setAssignWorkerId] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [estimatedCompletionTime, setEstimatedCompletionTime] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
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

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}${API_ENDPOINTS.GET_WORKER_WORKLOAD}`, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      if (res.ok) setWorkers(await res.json());
    } catch (err) {
      console.error('Failed to fetch workers:', err);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
    fetchWorkers();
  }, [fetchComplaints, fetchWorkers]);

  const openAssignModal = (complaint) => {
    setSelectedComplaint(complaint);
    setAssignWorkerId('');
    setEstimatedCompletionTime('');
    setShowAssignModal(true);
  };

  const openImageGallery = (complaint) => {
    const images = complaint.images?.length ? complaint.images : complaint.before_image?.map((url) => ({ url })) || [];
    setGalleryImages(images);
    setSelectedImageIndex(0);
    setShowImageModal(true);
  };

  const handleAssign = async () => {
    if (!assignWorkerId) {
      info('Select Worker First');
      return;
    }

    setIsAssigning(true);
    try {
      const worker = workers.find((w) => (w._id || w.id) === assignWorkerId);
      const isReassign = selectedComplaint?.assignedTo && selectedComplaint.assignedTo !== 'Not assigned';
      const endpoint = isReassign
        ? `${API_BASE}${API_ENDPOINTS.REASSIGN_WORKER(selectedComplaint._id)}`
        : `${API_BASE}${API_ENDPOINTS.ASSIGN_WORKER_MANUAL(selectedComplaint._id)}`;

      const res = await fetch(endpoint, {
        method: isReassign ? 'PATCH' : 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: assignWorkerId,
          assignedTo: worker?.name,
          estimatedCompletionTime,
          reason: isReassign ? 'Admin reassignment' : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Assignment failed.');

      success(isReassign ? 'Worker reassigned successfully.' : 'Worker assigned successfully.');
      setShowAssignModal(false);
      setSelectedComplaint(null);
      setAssignWorkerId('');
      setEstimatedCompletionTime('');
      fetchComplaints();
    } catch (err) {
      showError(err.message || 'Assignment failed. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAutoAssign = async (complaint) => {
    try {
      const res = await fetch(`${API_BASE}${API_ENDPOINTS.AUTO_ASSIGN(complaint._id)}`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'No suitable worker found');

      success('Worker assigned successfully.');
      fetchComplaints();
    } catch (err) {
      showError(`Could not auto-assign: ${err.message}`);
    }
  };

  const columns = [
    { key: 'title', header: 'Title', render: (value) => <span className="font-medium text-slate-900">{value}</span> },
    {
      key: 'category',
      header: 'Category',
      render: (value) => {
        const Icon = categoryIconMap[value] || Wrench;
        return <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700"><Icon className="h-4 w-4 text-slate-500" />{value}</span>;
      },
    },
    { key: 'priority', header: 'Priority', render: (value) => <Badge priority={value}>{value}</Badge> },
    { key: 'status', header: 'Status', render: (value) => <Badge status={value}>{value}</Badge> },
    {
      key: 'images',
      header: 'Images',
      render: (_, row) => {
        const thumb = row.images?.[0]?.url || row.before_image?.[0];
        return thumb ? (
          <button type="button" onClick={(event) => { event.stopPropagation(); openImageGallery(row); }} className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50">
            <Image className="h-3.5 w-3.5 text-slate-500 group-hover:text-cyan-600" />
            {row.images?.length || row.before_image?.length || 1}
          </button>
        ) : (
          <span className="text-xs text-slate-500">No images</span>
        );
      },
    },
    {
      key: 'assignedWorkerName',
      header: 'Assigned Worker',
      render: (value, row) => value || row.assignedTo || 'Not assigned',
    },
    {
      key: 'assignedDate',
      header: 'Assignment Date',
      render: (value, row) => {
        const date = value || row.assignedAt;
        return <span className="text-xs text-slate-600">{date ? formatDateTime(date) : 'Not assigned'}</span>;
      },
    },
    {
      key: 'sla',
      header: 'SLA',
      render: (_, row) => {
        const text = getSlaText(row);
        return <span className={`text-xs font-semibold ${text.includes('overdue') ? 'text-red-700' : 'text-slate-600'}`}>{text}</span>;
      },
    },
    {
      key: '_id',
      header: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex flex-wrap gap-2">
          {row.status === 'Pending' && !isComplaintAssigned(row) && (
            <>
              <Button size="sm" variant="secondary" icon={UserCheck} className="hover:-translate-y-0.5 hover:shadow-md" onClick={(event) => { event.stopPropagation(); openAssignModal(row); }} title="Assign worker manually">
                Assign Worker
              </Button>
              <Button size="sm" variant="ghost" icon={Zap} onClick={(event) => { event.stopPropagation(); handleAutoAssign(row); }} title="Auto-assign based on skills and workload">
                Auto
              </Button>
            </>
          )}
          {isComplaintAssigned(row) && row.status !== 'Resolved' && row.status !== 'Verified' && (
            <Button size="sm" variant="ghost" icon={UserCheck} onClick={(event) => { event.stopPropagation(); openAssignModal(row); }} title="Reassign to different worker">
              Reassign
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); navigate(`/admin/complaints?id=${row._id}`); }}>
            View
          </Button>
        </div>
      ),
    },
  ];

  const selectedWorker = workers.find((worker) => (worker._id || worker.id) === assignWorkerId);
  const isReassign = selectedComplaint?.assignedTo && selectedComplaint.assignedTo !== 'Not assigned';
  const matchingWorkers = selectedComplaint
    ? workers
      .filter((worker) => workerMatchesCategory(worker, selectedComplaint.category))
      .sort((a, b) => (a.activeTaskCount || a.activeComplaintsCount || 0) - (b.activeTaskCount || b.activeComplaintsCount || 0))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Complaints</h1>
        <p className="text-sm text-slate-500 mt-1">Manage workflow, assignment, SLA, and worker capacity</p>
      </div>

      <Card padding="p-4">
        <div className="flex flex-wrap gap-3">
          <select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary-400">
            <option value="">All Statuses</option>
            {COMPLAINT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={filters.category} onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary-400">
            <option value="">All Categories</option>
            {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <select value={filters.priority} onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value }))} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary-400">
            <option value="">All Priorities</option>
            {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={filters.search} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} placeholder="Search complaints..." className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary-400" />
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={complaints}
        isLoading={isLoading}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => navigate(`/admin/complaints?id=${row._id}`)}
        emptyState={<EmptyState title="No complaints found" message="Try adjusting your filters." />}
      />

      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title={isReassign ? 'Reassign Worker' : 'Assign Worker'} size="lg">
        <div className="space-y-4">
          {selectedComplaint && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Complaint details</p>
                  <h3 className="mt-1 text-base font-semibold text-blue-950">{selectedComplaint.title}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge priority={selectedComplaint.priority}>{selectedComplaint.priority}</Badge>
                  <Badge className="bg-white text-blue-800 border border-blue-100">{selectedComplaint.category}</Badge>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-blue-800 sm:grid-cols-2">
                <span>Student: {selectedComplaint.studentName || 'Not recorded'}</span>
                <span>Hostel: {selectedComplaint.hostel || selectedComplaint.hostelName || 'N/A'}</span>
                <span>Room: {selectedComplaint.roomNo || selectedComplaint.roomNumber || 'N/A'}</span>
                <span>Status: {selectedComplaint.status}</span>
                <span>SLA: {getSlaText(selectedComplaint)}</span>
                <span>Assigned by: {selectedComplaint.assignedByAdmin || selectedComplaint.assignedBy || 'Not assigned'}</span>
                <span>Assigned date: {formatDateTime(selectedComplaint.assignedDate || selectedComplaint.assignedAt)}</span>
              </div>
              <p className="mt-3 rounded-lg bg-white/70 p-3 text-sm text-blue-950">{selectedComplaint.description || 'No description provided.'}</p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Worker</label>
            <select value={assignWorkerId} onChange={(event) => setAssignWorkerId(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-primary-400">
              <option value="">Select worker</option>
              {matchingWorkers
                .map((worker) => {
                  const activeCount = worker.activeTaskCount || worker.activeComplaintsCount || 0;
                  const maxWorkload = worker.maxWorkload || 5;
                  const isBusy = worker.availabilityStatus === 'Busy' || activeCount >= maxWorkload;
                  return (
                    <option key={worker._id || worker.id} value={worker._id || worker.id} disabled={isBusy}>
                      {worker.name} - {worker.specialization || worker.specializations?.[0] || selectedComplaint?.category} worker - {activeCount} active complaints {isBusy ? '(BUSY)' : ''}
                    </option>
                  );
                })}
            </select>
            {selectedComplaint && matchingWorkers.length === 0 && (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                No specialized worker available currently.
              </p>
            )}
            {!assignWorkerId && <p className="mt-1 text-xs font-medium text-amber-700">Select Worker First</p>}
          </div>

          {matchingWorkers.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {matchingWorkers.map((worker) => {
                const workerId = worker._id || worker.id;
                const activeCount = worker.activeTaskCount || worker.activeComplaintsCount || 0;
                const maxWorkload = worker.maxWorkload || 5;
                const isBusy = worker.availabilityStatus === 'Busy' || activeCount >= maxWorkload;
                const isSelected = assignWorkerId === workerId;
                return (
                  <button
                    key={workerId}
                    type="button"
                    disabled={isBusy}
                    onClick={() => setAssignWorkerId(workerId)}
                    className={`rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${isSelected ? 'border-primary-300 bg-primary-50 shadow-sm' : 'border-slate-200 bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{worker.name}</p>
                        <p className="text-xs text-slate-500">{worker.specialization || worker.specializations?.[0] || selectedComplaint?.category} Worker</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${isBusy ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {isBusy ? 'Busy' : worker.availabilityStatus || 'Available'}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-600">{activeCount} Active Complaints</p>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                      <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${Math.min(100, Math.round((activeCount / maxWorkload) * 100))}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Estimated completion time</label>
            <input type="datetime-local" value={estimatedCompletionTime} onChange={(event) => setEstimatedCompletionTime(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-primary-400" />
          </div>

          {selectedWorker && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-900">
                {selectedWorker.name} has {selectedWorker.activeTaskCount || 0}/{selectedWorker.maxWorkload || 5} active tasks.
              </p>
              {selectedComplaint && selectedWorker.specializations?.includes(selectedComplaint.category) && (
                <p className="mt-1 text-xs text-green-700">Has expertise in {selectedComplaint.category}.</p>
              )}
            </div>
          )}

          {selectedComplaint?.assignmentHistory?.length > 0 && (
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Assignment history</p>
              <div className="mt-2 space-y-2">
                {selectedComplaint.assignmentHistory.slice(-3).map((entry, index) => (
                  <div key={`${entry.workerName}-${entry.assignedAt}-${index}`} className="flex items-center justify-between gap-3 text-xs text-slate-600">
                    <span>{entry.action || 'Assigned'} to {entry.workerName}</span>
                    <span>{formatDateTime(entry.assignedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button className="flex-1" isLoading={isAssigning} onClick={handleAssign} disabled={!assignWorkerId}>
              {!assignWorkerId ? 'Select Worker First' : isReassign ? 'Reassign Worker' : 'Assign Complaint'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showImageModal} onClose={() => setShowImageModal(false)} title="Complaint Images" size="xl">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {galleryImages.map((image, index) => {
              const url = getImageUrl(image);
              return (
                <button
                  key={`${image.public_id || index}-${index}`}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`rounded-2xl overflow-hidden border p-1 transition ${selectedImageIndex === index ? 'border-cyan-400 shadow-sm' : 'border-slate-200'}`}
                >
                  <img src={url} alt={`Complaint image ${index + 1}`} className="h-28 w-full object-cover" />
                </button>
              );
            })}
          </div>

          {galleryImages[selectedImageIndex] && (
            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 p-2">
              <img src={getImageUrl(galleryImages[selectedImageIndex])} alt="Selected complaint" className="w-full max-h-[550px] object-contain" />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
