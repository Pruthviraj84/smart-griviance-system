import { priorityColors } from '../../utils/helpers';

export function PriorityBadge({ priority = 'Low', showIcon = true }) {
  const colors = priorityColors[priority] || priorityColors.Low;
  const icon = colors.icon || '•';

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 border ${colors.bg} ${colors.text} ${colors.border}`}>
      {showIcon && <span className="text-lg">{icon}</span>}
      <span className="text-sm font-semibold">{priority}</span>
    </div>
  );
}
