import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../utils/constants';

export default function Badge({ children, status, priority, className = '' }) {
  const colors = status ? STATUS_COLORS[status] : priority ? PRIORITY_COLORS[priority] : null;

  const renderIcon = () => {
    if (status === 'Pending') return <AlertTriangle className="w-3.5 h-3.5" />;
    if (status === 'In Progress') return <Clock className="w-3.5 h-3.5" />;
    if (status === 'Completed' || status === 'Resolved' || status === 'Verified') return <CheckCircle2 className="w-3.5 h-3.5" />;
    return null;
  };

  if (!colors) {
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-700 ${className}`}>
        {children}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border} ${className} shadow-sm`}>
      {renderIcon() || (colors.dot && <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />)}
      {children}
    </span>
  );
}
