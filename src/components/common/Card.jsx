import { forwardRef } from 'react';

const Card = forwardRef(function Card({ children, className = '', hover = false, padding = 'p-6', ...props }, ref) {
  return (
    <div
      ref={ref}
      className={`rounded-2xl border border-gray-100 bg-white shadow-card transition-shadow ${
        hover ? 'hover:shadow-elevated' : ''
      } ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

export default Card;
