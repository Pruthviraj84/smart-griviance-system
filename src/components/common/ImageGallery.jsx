import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE } from '../../utils/api';

export function ImageGallery({ images = [], label = 'Image', compact = false }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  if (!images.length) {
    return compact ? <span className="text-xs text-slate-500">No image</span> : (
      <div className="mt-3 grid h-64 place-items-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm font-semibold text-slate-500">
        No image uploaded
      </div>
    );
  }

  const handleNext = (e) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <div className={`mt-4 flex flex-wrap gap-2 ${compact ? 'mt-0' : ''}`}>
        {images.slice(0, compact ? 2 : 4).map((src, index) => (
          <button 
            key={`${src}-${index}`} 
            onClick={(e) => { e.stopPropagation(); setSelectedIndex(index); }}
            className="grid h-14 w-14 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition hover:ring-2 hover:ring-cyan-500"
          >
            <img src={`${API_BASE}${src}`} alt={`${label} ${index + 1}`} className="h-full w-full object-cover" />
          </button>
        ))}
        {images.length > (compact ? 2 : 4) && (
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedIndex(compact ? 2 : 4); }}
            className="grid h-14 w-14 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500 hover:bg-slate-200"
          >
            +{images.length - (compact ? 2 : 4)}
          </button>
        )}
      </div>

      {selectedIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md" onClick={() => setSelectedIndex(null)}>
          <button 
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
            onClick={() => setSelectedIndex(null)}
          >
            <X className="h-6 w-6" />
          </button>
          
          {images.length > 1 && (
            <button 
              className="absolute left-6 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          <img 
            src={`${API_BASE}${images[selectedIndex]}`} 
            alt={`Full size ${selectedIndex + 1}`} 
            className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />

          {images.length > 1 && (
            <button 
              className="absolute right-6 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition"
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          <div className="absolute bottom-6 flex gap-2" onClick={(e) => e.stopPropagation()}>
            {images.map((src, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`h-16 w-16 overflow-hidden rounded-lg border-2 transition ${idx === selectedIndex ? 'border-cyan-400 scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
              >
                <img src={`${API_BASE}${src}`} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
