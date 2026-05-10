import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm',
  secondary: 'bg-white text-slate-700 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 shadow-sm',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
  ghost: 'bg-transparent text-slate-600 hover:bg-gray-100 active:bg-gray-200',
  link: 'bg-transparent text-primary-600 hover:text-primary-700 underline-offset-2 hover:underline',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

const Button = forwardRef(function Button(
  { children, variant = 'primary', size = 'md', isLoading = false, disabled = false, className = '', icon: Icon, ...props },
  ref
) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {!isLoading && Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
});

export default Button;
