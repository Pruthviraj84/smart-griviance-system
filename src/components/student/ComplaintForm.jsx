import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Mic, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders } from '../../utils/auth';
import { analyzeComplaint } from '../../utils/helpers';
import Button from '../common/Button';
import Badge from '../common/Badge';
import ImageUploader from '../common/ImageUploader';

const MAX_IMAGES = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ComplaintForm({ user, onSuccess, onClose }) {
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
  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listeningField, setListeningField] = useState(null);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const inputRef = useRef(null);

  const analysis = useMemo(() => analyzeComplaint(form), [form]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition;
    setRecognitionSupported(Boolean(SpeechRecognition));
  }, []);

  const validate = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Title is required.';
    if (!form.description.trim()) nextErrors.description = 'Description is required.';
    if (form.description.trim().length < 20) nextErrors.description = 'Description must be at least 20 characters.';
    if (images.length > MAX_IMAGES) nextErrors.images = `Maximum ${MAX_IMAGES} images are allowed.`;
    if (form.locationScope === 'Hostel' && form.locationDetail.trim().length < 3) {
      nextErrors.locationDetail = 'Please enter a valid hostel area.';
    }
    if (analysis.categoryMismatch) {
      nextErrors.category = 'Selected category does not match the issue description.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const startVoiceTyping = (field) => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
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

    recognition.onend = () => setListeningField(null);
    recognition.onerror = () => setListeningField(null);
    setListeningField(field);
    recognition.start();
  };

  const handleImagesChange = (nextImages) => {
    const filtered = nextImages.filter((item) => ACCEPTED_TYPES.includes(item.file ? item.file.type : item.type));
    const limited = filtered.slice(0, MAX_IMAGES);
    setImages(limited);
    if (limited.length !== nextImages.length) {
      setErrors((prev) => ({ ...prev, images: `Only ${MAX_IMAGES} valid images are allowed.` }));
    }
  };

  const removeImage = (index) => {
    setImages((current) => current.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('description', form.description.trim());
    formData.append('category', form.category || analysis.autoDetectedCategory || 'Others');
    formData.append('priority', form.priority);
    formData.append('locationScope', form.locationScope);
    formData.append('locationDetail', form.locationScope === 'Hostel' ? form.locationDetail.trim() : `Room ${user?.roomNumber || ''}`);
    if (form.contact.trim()) formData.append('contact', form.contact.trim());
    if (form.hostel?.trim()) formData.append('hostel', form.hostel.trim());
    if (form.roomNo?.trim()) formData.append('roomNo', form.roomNo.trim());

    images.forEach((image) => {
      const file = image.file || image;
      formData.append('images', file);
    });

    try {
      setIsSubmitting(true);
      setUploadProgress(0);

      const response = await axios.post(`${API_BASE}${API_ENDPOINTS.CREATE_COMPLAINT}`, formData, {
        headers: {
          ...getAuthHeaders(),
        },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        },
      });

      onSuccess(response.data);
      setForm({ title: '', description: '', category: '', priority: 'Medium', contact: '', locationScope: 'Room', locationDetail: '' });
      setImages([]);
      setErrors({});
      setUploadProgress(0);
      if (onClose) onClose();
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Unable to upload complaint.';
      setErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <label className="block">
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
            <span>Title</span>
            {errors.title && <span className="text-red-600 text-xs">{errors.title}</span>}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={form.title}
              onChange={(event) => handleFieldChange('title', event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              placeholder="Describe the issue in one line"
            />
            {recognitionSupported && (
              <button
                type="button"
                onClick={() => startVoiceTyping('title')}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 text-slate-600 transition hover:border-cyan-500 hover:bg-cyan-50 ${listeningField === 'title' ? 'border-red-400 bg-red-50 text-red-600' : ''}`}
                title={listeningField === 'title' ? 'Listening for title...' : 'Voice type title'}
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
          </div>
        </label>

        <label className="block">
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
            <span>Category</span>
            {errors.category && <span className="text-red-600 text-xs">{errors.category}</span>}
          </div>
          <select
            value={form.category}
            onChange={(event) => handleFieldChange('category', event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
          >
            <option value="">Auto-detect category</option>
            <option value="Water">Water</option>
            <option value="Electricity">Electricity</option>
            <option value="Cleaning">Cleaning</option>
            <option value="Internet">Internet</option>
            <option value="Furniture">Furniture</option>
            <option value="Security">Security</option>
            <option value="Food">Food</option>
            <option value="Others">Others</option>
          </select>
        </label>

        <label className="block lg:col-span-2">
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
            <span>Description</span>
            {errors.description && <span className="text-red-600 text-xs">{errors.description}</span>}
          </div>
          <textarea
            value={form.description}
            onChange={(event) => handleFieldChange('description', event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            placeholder="Explain the issue, location, and any visible damage"
          />
          <div className="mt-2 text-xs text-slate-500">{form.description.trim().length} / 20 characters</div>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Hostel Block</span>
          <input
            value={form.hostel}
            onChange={(event) => handleFieldChange('hostel', event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            placeholder="Block A, B, C"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Room Number</span>
          <input
            value={form.roomNo}
            onChange={(event) => handleFieldChange('roomNo', event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            placeholder="204, 301"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Contact Number</span>
          <input
            value={form.contact}
            onChange={(event) => handleFieldChange('contact', event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            placeholder="Optional phone number"
          />
        </label>
      </div>

      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
        <p className="text-sm font-semibold text-slate-700">Upload Images</p>
        <p className="text-xs text-slate-500">Maximum {MAX_IMAGES} images, JPG / JPEG / PNG / WEBP, 5MB each.</p>
        <ImageUploader images={images} onChange={handleImagesChange} maxFiles={MAX_IMAGES} accept="image/jpeg,image/png,image/webp" />
        {errors.images && <p className="mt-2 text-xs text-red-600">{errors.images}</p>}
      </div>

      {images.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {images.map((image, index) => {
            const preview = image.preview || URL.createObjectURL(image.file || image);
            return (
              <div key={index} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
                <img src={preview} alt={`preview-${index}`} className="h-32 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {uploadProgress > 0 && (
        <div className="rounded-xl bg-slate-100 p-3">
          <div className="mb-2 text-xs font-semibold text-slate-600">Upload progress</div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
          <div className="mt-2 text-right text-xs font-medium text-slate-600">{uploadProgress}%</div>
        </div>
      )}

      {errors.submit && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errors.submit}</div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
        </Button>
      </div>
    </form>
  );
}
