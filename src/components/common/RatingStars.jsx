import { useState } from 'react';
import { Star } from 'lucide-react';

export default function RatingStars({ rating = 0, onChange, size = 'md', readOnly = false }) {
  const [hover, setHover] = useState(0);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hover || rating);
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readOnly && setHover(star)}
            onMouseLeave={() => !readOnly && setHover(0)}
            className={`transition-transform ${!readOnly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              className={`${sizeClasses[size]} transition-colors ${
                isFilled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-gray-500'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
