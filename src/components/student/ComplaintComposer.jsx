import { ClipboardList, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { inferComplaintCategory, inferComplaintPriority } from '../../utils/helpers';
import { CategoryBadge } from './CategoryBadge';
import { PriorityBadge } from './PriorityBadge';

function Field({ label, children, className = '', required = false, hint = '' }) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </span>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

export function ComplaintComposer({ user, loading, onSubmit }) {
  const [form, setForm] = useState({
    scope: 'Individual',
    title: '',
    description: '',
    category: '',
    contact: '',
    hostel: '',
    roomNo: '',
  });
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);

  const detectedCategory = inferComplaintCategory(form);
  const finalCategory = form.category || detectedCategory;
  const detectedPriority = inferComplaintPriority({ ...form, category: finalCategory });

  useEffect(() => {
    const objectUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(objectUrls);

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    
    if (!form.title.trim()) {
      alert('Please enter a complaint title');
      return;
    }
    
    if (!form.description.trim()) {
      alert('Please enter a complaint description');
      return;
    }
    
    if (form.scope === 'Individual' && !form.roomNo.trim()) {
      alert('Please enter a room number for individual complaints');
      return;
    }
    
    if (!form.hostel.trim()) {
      alert('Please select a hostel');
      return;
    }

    onSubmit(
      {
        ...form,
        category: finalCategory,
        priority: detectedPriority,
        studentName: user?.name || 'Student',
        grnNumber: user?.grnNumber,
      },
      files
    );
    
    setForm({ 
      scope: 'Individual',
      title: '', 
      description: '', 
      category: '', 
      contact: '', 
      hostel: '', 
      roomNo: '' 
    });
    setFiles([]);
  };

  const addFiles = (incomingFiles) => {
    const accepted = Array.from(incomingFiles || []).filter((file) => file.type.startsWith('image/'));
    if (accepted.length) {
      setFiles((current) => [...current, ...accepted].slice(0, 5));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <section id="new-complaint" className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-lg sm:p-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
          <ClipboardList className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Register Complaint</h3>
          <p className="text-sm text-slate-600">Submit an issue with details and photos. We'll auto-detect the category.</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Complaint Scope Selection */}
        <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
          <p className="mb-3 text-sm font-semibold text-slate-700">Complaint Scope</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => update('scope', 'Individual')}
              className={`rounded-lg border-2 py-3 px-4 font-medium transition ${
                form.scope === 'Individual'
                  ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              🏠 Individual Room
            </button>
            <button
              type="button"
              onClick={() => update('scope', 'General')}
              className={`rounded-lg border-2 py-3 px-4 font-medium transition ${
                form.scope === 'General'
                  ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              🏢 General Hostel
            </button>
          </div>
        </div>

        {/* Main Form Fields */}
        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Complaint Title" required>
            <input
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              placeholder="e.g., Water leaking from ceiling"
            />
          </Field>

          <Field label="Hostel" required>
            <input
              value={form.hostel}
              onChange={(event) => update('hostel', event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              placeholder="e.g., A, B, C"
            />
          </Field>

          {/* Conditional: Show Room Number only for Individual Complaints */}
          {form.scope === 'Individual' && (
            <Field label="Room Number" required hint="Required for individual complaints">
              <input
                value={form.roomNo}
                onChange={(event) => update('roomNo', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                placeholder="e.g., 204, 301"
              />
            </Field>
          )}

          {/* Conditional: Show General Area only for General Complaints */}
          {form.scope === 'General' && (
            <Field label="General Area" required hint="Specify the location in hostel">
              <input
                value={form.roomNo}
                onChange={(event) => update('roomNo', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                placeholder="e.g., Common room, Corridor, Kitchen"
              />
            </Field>
          )}

          <Field label="Contact Number" hint="Optional - we'll notify you here">
            <input
              value={form.contact}
              onChange={(event) => update('contact', event.target.value)}
              type="tel"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              placeholder="9876543210"
            />
          </Field>

          <Field label="Category (Optional - we'll detect it)" className="lg:col-span-2">
            <select
              value={form.category}
              onChange={(event) => update('category', event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="">Auto-detect from description</option>
              <option>Water</option>
              <option>Electricity</option>
              <option>Security</option>
              <option>Internet</option>
              <option>Cleaning</option>
              <option>Food</option>
              <option>Furniture</option>
              <option>Tiles</option>
              <option>Others</option>
            </select>
          </Field>

          {/* Auto-Detection Display */}
          <div className="lg:col-span-2 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-4 border border-blue-200">
            <p className="mb-3 text-sm font-semibold text-slate-700">✨ Smart Detection</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-slate-600">Category</p>
                <CategoryBadge category={finalCategory} />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-slate-600">Priority</p>
                <PriorityBadge priority={detectedPriority} />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <Field label="Description" required hint="Provide detailed information about the issue">
          <textarea
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            className="min-h-32 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            placeholder="Describe what happened, what's broken, and any other details..."
          />
        </Field>

        {/* Image Upload */}
        <div 
          className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition hover:border-cyan-400 hover:bg-slate-100"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <label className="flex cursor-pointer flex-col items-center gap-3">
            <Plus className="h-8 w-8 text-slate-400" />
            <span className="text-center">
              <p className="font-semibold text-slate-700">Click or drag images here</p>
              <p className="text-sm text-slate-500">Up to 5 images, PNG/JPG only</p>
            </span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => addFiles(e.target.files)}
              className="hidden"
            />
          </label>
        </div>

        {/* Image Previews */}
        {previewUrls.length > 0 && (
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
            <p className="mb-3 text-sm font-semibold text-slate-700">Uploaded Images ({previewUrls.length}/5)</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative rounded-lg overflow-hidden bg-white border border-slate-200">
                  <img src={url} alt={`preview-${idx}`} className="h-24 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFiles((f) => f.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-slate-400 disabled:to-slate-400 py-4 font-semibold text-white transition shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          {loading ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </form>
    </section>
  );
}
