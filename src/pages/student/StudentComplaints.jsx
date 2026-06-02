import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Mic, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders } from '../../utils/auth';
import { CATEGORIES, PRIORITIES } from '../../utils/constants';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ImageUploader from '../../components/common/ImageUploader';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';
import { analyzeComplaint } from '../../utils/helpers';

const tabs = ['All', 'Pending', 'In Progress', 'Completed'];

export default function StudentComplaints() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [showNewModal, setShowNewModal] = useState(searchParams.get('new') === 'true');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    contact: '',
    locationScope: 'Room',
    locationDetail: '',
  });
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [listeningField, setListeningField] = useState(null);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const analysis = useMemo(() => analyzeComplaint(form), [form]);
  const descriptionLength = form.description.trim().length;

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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchParams]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition;

    setRecognitionSupported(Boolean(SpeechRecognition));
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const startVoiceTyping = (field) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('');

      setForm((current) => ({
        ...current,
        [field]: `${current[field]} ${transcript}`.trim(),
      }));
    };

    recognition.onend = () => {
      setListeningField(null);
    };

    recognition.onerror = () => {
      setListeningField(null);
    };

    setListeningField(field);
    recognition.start();
  };

  const validateForm = () => {
    const errors = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.description.trim()) errors.description = 'Description is required';
    if (form.description.trim().length < 20) errors.description = 'Description must be at least 20 characters';
    if (!form.category) errors.category = 'Category is required';
    if (form.locationScope === 'Hostel' && form.locationDetail.trim().length < 3) {
      errors.locationDetail = 'Enter the hostel area or location';
    }
    if (analysis.categoryMismatch) errors.category = 'Selected category does not match your complaint description. Please select the correct category.';
    if (analysis.urgentMisuse) errors.priority = 'This issue does not qualify for urgent priority.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('category', form.category);
      formData.append('priority', analysis.urgentMisuse ? 'Medium' : form.priority);
      formData.append('locationScope', form.locationScope);
      formData.append('locationDetail', form.locationScope === 'Room' ? `Room ${user?.roomNumber || ''}` : form.locationDetail.trim());
      if (form.contact) formData.append('contact', form.contact);
      images.forEach((img) => formData.append('images', img.file));

      const res = await fetch(`${API_BASE}${API_ENDPOINTS.CREATE_COMPLAINT}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit complaint');

      // Check if it's a duplicate complaint
      if (data.isDuplicate) {
        success(`Similar complaint already exists. Your report has been added to the queue (Total: ${data.complaintCount} reports)`);
      } else {
        success('Complaint submitted successfully!');
      }

      setForm({ title: '', description: '', category: '', priority: 'Medium', contact: '', locationScope: 'Room', locationDetail: '' });
      setImages([]);
      setFormErrors({});
      setShowNewModal(false);
      fetchComplaints();
    } catch (err) {
      showError(err.message || 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {/* New Complaint Modal */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="Raise New Complaint">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Title <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-2">
              <input
                value={form.title}
                onChange={(e) => { setForm((p) => ({ ...p, title: e.target.value })); if (formErrors.title) setFormErrors((p) => ({ ...p, title: '' })); }}
                className={`flex-1 rounded-xl border bg-gray-50 px-4 py-2.5 text-sm focus:ring-2 outline-none ${formErrors.title ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-primary-400 focus:ring-primary-100'}`}
                placeholder="Brief title of the issue"
              />
              {recognitionSupported && (
                <button
                  type="button"
                  onClick={() => startVoiceTyping('title')}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-600 transition hover:border-primary-400 hover:bg-primary-50 ${listeningField === 'title' ? 'border-red-300 bg-red-50 text-red-600' : ''}`}
                  title={listeningField === 'title' ? 'Listening for title...' : 'Voice type title'}
                >
                  <Mic className="h-5 w-5" />
                </button>
              )}
            </div>
            {formErrors.title && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.title}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description <span className="text-red-500">*</span></label>
            <div className="flex flex-col gap-2">
              <textarea
                value={form.description}
                onChange={(e) => { setForm((p) => ({ ...p, description: e.target.value })); if (formErrors.description) setFormErrors((p) => ({ ...p, description: '' })); }}
                rows={3}
                className={`w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-sm focus:ring-2 outline-none resize-none ${formErrors.description ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-primary-400 focus:ring-primary-100'}`}
                placeholder="Describe the issue in detail"
              />
              {recognitionSupported && (
                <button
                  type="button"
                  onClick={() => startVoiceTyping('description')}
                  className={`inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary-400 hover:bg-primary-50 ${listeningField === 'description' ? 'border-red-300 bg-red-50 text-red-600' : ''}`}
                  title={listeningField === 'description' ? 'Listening for description...' : 'Voice type description'}
                >
                  <Mic className="h-4 w-4" />
                  {listeningField === 'description' ? 'Listening...' : 'Voice type description'}
                </button>
              )}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className={descriptionLength < 20 ? 'text-amber-600' : 'text-slate-500'}>{descriptionLength}/20 minimum characters</span>
              <span className="font-medium text-slate-600">Score {analysis.priorityScore}</span>
            </div>
            {formErrors.description && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.description}</p>
            )}
          </div>
          {(form.title || form.description) && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-900">Smart suggestions</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge className="bg-white text-blue-800 border border-blue-100">Suggested Category: {analysis.suggestedCategory}</Badge>
                <Badge priority={analysis.recommendedPriority}>Recommended Priority: {analysis.recommendedPriority}</Badge>
              </div>
              {analysis.warnings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {analysis.warnings.map((warning) => (
                    <p key={warning} className="flex items-center gap-1 text-xs font-medium text-amber-700">
                      <AlertCircle className="h-3 w-3" />{warning}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Complaint location: <span className="font-semibold text-slate-900">{user?.hostelName || 'Hostel not set'}</span>, Room <span className="font-semibold text-slate-900">{user?.roomNumber || 'not set'}</span>
          </div>
          <div className="space-y-3 rounded-xl border border-slate-200 p-3">
            <label className="block text-sm font-medium text-slate-700">Where is the issue? <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {['Room', 'Hostel'].map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, locationScope: scope, locationDetail: scope === 'Room' ? '' : prev.locationDetail }))}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${form.locationScope === scope ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  {scope === 'Room' ? 'My Room' : 'Hostel Area'}
                </button>
              ))}
            </div>
            {form.locationScope === 'Hostel' ? (
              <div>
                <input
                  value={form.locationDetail}
                  onChange={(e) => { setForm((prev) => ({ ...prev, locationDetail: e.target.value })); if (formErrors.locationDetail) setFormErrors((prev) => ({ ...prev, locationDetail: '' })); }}
                  className={`w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-sm focus:ring-2 outline-none ${formErrors.locationDetail ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-primary-400 focus:ring-primary-100'}`}
                  placeholder="e.g., corridor, common bathroom, mess, staircase"
                />
                {formErrors.locationDetail && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.locationDetail}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">This complaint will be linked to your registered room only.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category <span className="text-red-500">*</span></label>
              <select
                value={form.category}
                onChange={(e) => { setForm((p) => ({ ...p, category: e.target.value })); if (formErrors.category) setFormErrors((p) => ({ ...p, category: '' })); }}
                className={`w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-sm focus:ring-2 outline-none ${formErrors.category ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-primary-400 focus:ring-primary-100'}`}
              >
                <option value="">Select</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {formErrors.category && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.category}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => { setForm((p) => ({ ...p, priority: e.target.value })); if (formErrors.priority) setFormErrors((p) => ({ ...p, priority: '' })); }}
                className={`w-full rounded-xl border bg-gray-50 px-4 py-2.5 text-sm focus:ring-2 outline-none ${formErrors.priority ? 'border-amber-300 focus:border-amber-400 focus:ring-amber-100' : 'border-gray-200 focus:border-primary-400 focus:ring-primary-100'}`}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {formErrors.priority && (
                <p className="mt-1 text-xs text-amber-700 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.priority}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Contact Number</label>
            <input
              value={form.contact}
              onChange={(e) => setForm((p) => ({ ...p, contact: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
              placeholder="Your phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Images <span className="text-slate-500 font-normal">(optional)</span></label>
            <ImageUploader images={images} onChange={setImages} maxFiles={5} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowNewModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              Submit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
