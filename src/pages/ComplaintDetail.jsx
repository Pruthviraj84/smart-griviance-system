import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Calendar, MessageSquare, Star, Maximize2, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE, API_ENDPOINTS } from '../utils/api';
import { getAuthHeaders } from '../utils/auth';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Timeline from '../components/common/Timeline';
import ChatBox from '../components/common/ChatBox';
import RatingStars from '../components/common/RatingStars';
import Skeleton from '../components/common/Skeleton';
import Modal from '../components/common/Modal';
import { getImageUrl } from '../utils/helpers';

export default function ComplaintDetail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [complaint, setComplaint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const role = user?.role;
  const basePath = `/${role.toLowerCase()}`;
  const backPath = (() => {
    switch (role) {
      case 'Student': return '/student/complaints';
      case 'Worker': return '/worker/tasks';
      case 'Admin': return '/admin/complaints';
      case 'SuperAdmin': return '/superadmin/complaints';
      default: return basePath;
    }
  })();

  const fetchComplaint = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}${API_ENDPOINTS.GET_COMPLAINT(id)}`, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setComplaint(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  const submitRating = async () => {
    if (!rating) return;
    setIsSubmittingRating(true);
    try {
      const res = await fetch(`${API_BASE}${API_ENDPOINTS.RATE_COMPLAINT(id)}`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      });
      if (res.ok) {
        setShowRatingModal(false);
        fetchComplaint();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const isResolved = ['Resolved', 'Verified', 'Completed'].includes(complaint?.status);
  const canRate = role === 'Student' && isResolved && !complaint?.studentRating;
  const isAdmin = ['Admin', 'SuperAdmin', 'Super Admin'].includes(role);
  const statusOptions = ['Pending', 'Assigned', 'In Progress', 'Completed', 'Verified', 'Resolved'];
  const hasCompletionProof = Boolean(complaint?.completionImage || complaint?.after_image?.length || complaint?.workerProofImages?.length);
  const hasAssignedWorker = Boolean(
    complaint?.assignedWorkerId ||
    complaint?.assigned_worker_id ||
    complaint?.workerId ||
    (complaint?.assignedTo && complaint.assignedTo !== 'Not assigned')
  );

  const getAllowedStatuses = (currentStatus) => {
    const flow = {
      Pending: ['Assigned'],
      Assigned: ['In Progress'],
      'In Progress': ['Completed'],
      Completed: ['Verified'],
      Verified: ['Resolved'],
      Resolved: [],
    };

    return flow[currentStatus] || [];
  };

  const canChangeStatus = isAdmin && complaint?.status !== 'Resolved';

  const openImage = (src) => {
    setImageModalSrc(src);
    setShowImageModal(true);
  };

  const handleStatusChange = async (nextStatus) => {
    if (!isAdmin || !nextStatus || nextStatus === complaint?.status) return;

    const allowedStatuses = getAllowedStatuses(complaint?.status);
    if (!allowedStatuses.includes(nextStatus)) {
      setStatusMessage({ type: 'error', message: `Invalid status transition from ${complaint?.status} to ${nextStatus}.` });
      setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
      return;
    }

    if (nextStatus === 'Assigned' && !hasAssignedWorker) {
      setStatusMessage({ type: 'error', message: 'Please assign a worker before changing complaint status.' });
      setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
      return;
    }

    if (['Verified', 'Resolved'].includes(nextStatus) && !complaint?.completionImage) {
      setStatusMessage({ type: 'error', message: 'Worker must upload completion proof before verification' });
      setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
      return;
    }

    setIsUpdatingStatus(true);
    setStatusMessage({ type: '', message: '' });
    try {
      const res = await fetch(`${API_BASE}${API_ENDPOINTS.UPDATE_COMPLAINT_STATUS(id)}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setComplaint(updated);
        setStatusMessage({ type: 'success', message: 'Status updated successfully' });
        setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
      } else {
        const raw = await res.text();
        let errorMessage = 'Status update failed';
        try {
          const errorData = raw ? JSON.parse(raw) : null;
          errorMessage = errorData?.message || errorMessage;
        } catch {
          errorMessage = raw || errorMessage;
        }
        setStatusMessage({ type: 'error', message: errorMessage });
        setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', message: 'An error occurred while updating status' });
      setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Complaint not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate(backPath)}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(backPath)}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to complaints
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{complaint.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge status={complaint.status}>{complaint.status}</Badge>
            <Badge priority={complaint.priority}>{complaint.priority}</Badge>
            <span className="text-xs text-slate-500">{complaint.category}</span>
          </div>
        </div>
        {canRate && (
          <Button onClick={() => setShowRatingModal(true)} icon={Star}>
            Rate & Feedback
          </Button>
        )}
        {complaint.studentRating && (
          <div className="flex items-center gap-2">
            <RatingStars rating={complaint.studentRating} readOnly size="sm" />
            <span className="text-sm text-slate-500">({complaint.studentRating}/5)</span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wide">Progress</h3>
        <Timeline currentStatus={complaint.status} />
      </Card>

      {statusMessage.message && (
        <div className={`flex items-center gap-3 rounded-xl border p-4 ${statusMessage.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
          <CheckCircle2 className="h-5 w-5" />
          <p className="text-sm font-medium">{statusMessage.message}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Description</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{complaint.description}</p>
          </Card>

          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Complaint Details</h3>
                <p className="text-xs text-slate-500 mt-1">View complaint information and update the workflow status.</p>
              </div>
              {isAdmin && (
                <div className="min-w-[240px]">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Status</label>
                  <div className="relative">
                    {isUpdatingStatus && (
                      <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                    )}
                    <select
                      value={complaint.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={isUpdatingStatus || !canChangeStatus}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    >
                      {statusOptions.map((status) => {
                        const isAllowed = status === complaint.status || getAllowedStatuses(complaint.status).includes(status);
                        const requiresProof = ['Verified', 'Resolved'].includes(status) && !hasCompletionProof;
                        const requiresWorker = status === 'Assigned' && !hasAssignedWorker;
                        return (
                          <option key={status} value={status} disabled={!isAllowed || requiresProof || requiresWorker}>
                            {requiresWorker ? 'Assigned - Select Worker First' : status}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {complaint.status === 'Completed' && !hasCompletionProof && (
                    <p className="mt-2 text-xs font-medium text-amber-700">Completion image is required before verification</p>
                  )}
                  {complaint.status === 'Pending' && !hasAssignedWorker && (
                    <p className="mt-2 text-xs font-medium text-amber-700">Select Worker First</p>
                  )}
                </div>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-600">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Hostel</p>
                <p className="font-medium text-slate-900">{complaint.hostel || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Room Number</p>
                <p className="font-medium text-slate-900">{complaint.roomNo || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Category</p>
                <p className="font-medium text-slate-900">{complaint.category}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Priority</p>
                <p className="font-medium text-slate-900">{complaint.priority}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Current Status</p>
                <div className="mt-1 inline-flex">
                  <Badge
                    status={complaint.status}
                    className={complaint.status === 'Verified' ? 'bg-green-600 text-white border-green-600' : complaint.status === 'Resolved' ? 'bg-emerald-700 text-white border-emerald-700' : ''}
                  >
                    {complaint.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Assigned Worker</p>
                <p className="font-medium text-slate-900">{complaint.assignedTo || 'Not assigned'}</p>
                {complaint.workerContact && <p className="text-xs text-slate-500">{complaint.workerContact}</p>}
              </div>
            </div>
          </Card>

          {(() => {
            const problemImages = complaint.images?.length 
              ? complaint.images 
              : complaint.before_image?.map(img => typeof img === 'string' ? { url: img } : img) || [];
            if (!problemImages.length) return null;
            return (
              <Card>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Before Images</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {problemImages.map((img, i) => {
                    const url = getImageUrl(img);
                    return (
                      <button key={i} type="button" onClick={() => openImage(url)} className="group relative overflow-hidden rounded-xl border border-gray-100 aspect-square">
                        <img src={url} alt="Before" className="h-full w-full object-cover transition group-hover:scale-105" />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                          <Maximize2 className="h-5 w-5" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            );
          })()}

          {complaint.after_image?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">After Images</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {complaint.after_image.map((img, i) => {
                  const url = getImageUrl(img);
                  return (
                    <button key={i} type="button" onClick={() => openImage(url)} className="group relative overflow-hidden rounded-xl border border-gray-100 aspect-square">
                      <img src={url} alt="After" className="h-full w-full object-cover transition group-hover:scale-105" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                        <Maximize2 className="h-5 w-5" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {complaint.completionImage && (
            <Card>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Completion Proof Uploaded by Worker</h3>
                  <p className="text-xs text-slate-500 mt-1">Review the uploaded proof carefully before verifying.</p>
                </div>
              </div>
              <button type="button" onClick={() => openImage(getImageUrl(complaint.completionImage))} className="group relative block w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img
                  src={getImageUrl(complaint.completionImage)}
                  alt="Completion proof uploaded by worker"
                  className="max-h-[28rem] w-full object-contain bg-slate-100"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/10 group-hover:opacity-100">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-4 py-2 text-sm font-medium">
                    <Maximize2 className="h-4 w-4" />
                    View Full Screen
                  </span>
                </span>
              </button>
            </Card>
          )}

          {complaint.workerRemarks && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Worker Remarks</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{complaint.workerRemarks}</p>
            </Card>
          )}

          {complaint.studentFeedback && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Your Feedback</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{complaint.studentFeedback}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wide">Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Student</p>
                  <p className="text-sm font-medium text-slate-900">{complaint.studentName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Contact</p>
                  <p className="text-sm font-medium text-slate-900">{complaint.contact || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Created</p>
                  <p className="text-sm font-medium text-slate-900">{new Date(complaint.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {complaint.assignedTo && complaint.assignedTo !== 'Not assigned' && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Assigned Worker</p>
                    <p className="text-sm font-medium text-slate-900">{complaint.assignedTo}</p>
                    {complaint.workerContact && (
                      <p className="text-xs text-slate-500">{complaint.workerContact}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Chat toggle */}
          <Button
            variant={showChat ? 'secondary' : 'primary'}
            className="w-full"
            icon={MessageSquare}
            onClick={() => setShowChat(!showChat)}
          >
            {showChat ? 'Hide Chat' : 'Open Chat'}
          </Button>

          {showChat && (
            <ChatBox complaintId={id} currentUser={user} />
          )}
        </div>
      </div>

      {/* Rating Modal */}
      <Modal isOpen={showRatingModal} onClose={() => setShowRatingModal(false)} title="Rate & Provide Feedback">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Your Rating</label>
            <RatingStars rating={rating} onChange={setRating} size="lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Feedback (optional)</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
              placeholder="Share your experience..."
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowRatingModal(false)}>
              Cancel
            </Button>
            <Button className="flex-1" isLoading={isSubmittingRating} onClick={submitRating} disabled={!rating}>
              Submit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Preview Modal */}
      <Modal isOpen={showImageModal} onClose={() => setShowImageModal(false)} title="Image Preview" size="full">
        <div className="flex min-h-[70vh] items-center justify-center bg-slate-950 p-4">
          <img src={imageModalSrc} alt="Preview" className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl" />
        </div>
      </Modal>
    </div>
  );
}
