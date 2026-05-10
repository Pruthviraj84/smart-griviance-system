import { useState, useCallback } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';

export default function ImageUploader({ images = [], onChange, maxFiles = 5, accept = 'image/*' }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (files) => {
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      const remaining = maxFiles - images.length;
      const toAdd = imageFiles.slice(0, remaining);
      const newImages = toAdd.map((file) => ({ file, preview: URL.createObjectURL(file) }));
      onChange([...images, ...newImages]);
    },
    [images, onChange, maxFiles]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = useCallback(
    (index) => {
      const updated = [...images];
      if (updated[index].preview?.startsWith('blob:')) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);
      onChange(updated);
    },
    [images, onChange]
  );

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              <img
                src={img.preview || img}
                alt={`Preview ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < maxFiles && (
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
            isDragging
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
            <Upload className="h-5 w-5 text-slate-500" />
          </div>
          <p className="mt-2 text-sm font-medium text-slate-700">
            Click to upload or drag and drop
          </p>
          <p className="mt-1 text-xs text-slate-500">PNG, JPG up to 5MB</p>
          <input
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      )}
    </div>
  );
}
