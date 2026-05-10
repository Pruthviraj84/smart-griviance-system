import { categoryIcons, categoryColors } from '../../utils/helpers';

export function CategoryBadge({ category = 'Others', showIcon = true }) {
  const colors = categoryColors[category] || categoryColors.Others;
  const icon = categoryIcons[category] || categoryIcons.Others;

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 border ${colors.bg} ${colors.text} ${colors.border}`}>
      {showIcon && <span className="text-lg">{icon}</span>}
      <span className="text-sm font-semibold">{category}</span>
    </div>
  );
}
