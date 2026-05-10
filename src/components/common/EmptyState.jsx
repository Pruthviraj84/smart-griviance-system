import { ClipboardList, SearchX } from 'lucide-react';
import Button from './Button';

export default function EmptyState({ title = 'Nothing here yet', message = 'No items to display.', icon = 'clipboard', actionLabel, onAction }) {
  const Icon = icon === 'search' ? SearchX : ClipboardList;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-slate-500 mb-4">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-xs">{message}</p>
      {actionLabel && onAction && (
        <Button variant="primary" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
