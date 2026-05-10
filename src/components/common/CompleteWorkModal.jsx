import { useState, useRef } from 'react';
import { X, Upload, Check, AlertCircle } from 'lucide-react';
import Button from './Button';
import Card from './Card';

export default function CompleteWorkModal({ complaint, onClose, onSubmit, isLoading }) {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageChange({ target: { files } });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      setError('Image proof is required to complete this complaint');
      return;
    }

    const formData = new FormData();
    formData.append('completionImage', imageFile);
    formData.append('remarks', remarks);

    await onSubmit(formData);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Complete Work</h2>
            <p className="text-sm text-slate-500 mt-1">{complaint?.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Upload Proof Image <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Upload an image showing the completed work (JPG or PNG, max 5MB)
            </p>

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition"
              >
                <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">
                  Drag and drop or click to upload
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  JPG, PNG up to 5MB
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Replace Image
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={isLoading}
            />
          </div>

          {/* Remarks Section */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Remarks <span className="text-slate-400 text-xs font-normal">(Optional)</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any additional notes about the completed work..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary-500 focus:bg-white resize-none"
              rows="4"
              disabled={isLoading}
            />
            <p className="text-xs text-slate-500 mt-1">
              {remarks.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex gap-3 rounded-lg bg-red-50 p-3 border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Checklist */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-2">
            <p className="text-sm font-medium text-blue-900">Checklist before submitting:</p>
            <ul className="space-y-1 text-sm text-blue-800">
              <li className="flex gap-2">
                <Check className="h-4 w-4 flex-shrink-0" />
                Image clearly shows the completed work
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 flex-shrink-0" />
                Image is in good lighting and focus
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 flex-shrink-0" />
                Any relevant remarks have been added
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={!imageFile || isLoading}
              isLoading={isLoading}
            >
              Submit Completion
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
