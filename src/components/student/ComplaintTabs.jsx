import { CheckCircle2, Clock, ClipboardList, Sparkles } from 'lucide-react';

const tabs = [
  { id: 'all', label: 'All', icon: ClipboardList },
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'in-progress', label: 'In Progress', icon: Sparkles },
  { id: 'solved', label: 'Solved', icon: CheckCircle2 },
];

export function ComplaintTabs({ activeTab, counts, onChange }) {
  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-white/85 p-2 shadow-lg shadow-slate-200/50 backdrop-blur">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex items-center justify-between rounded-[1.25rem] px-4 py-3 text-left transition duration-200 ${isActive ? 'bg-primary-600 text-white shadow-md' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
            >
              <span className="flex items-center gap-2 text-sm font-bold">
                <Icon className="h-4 w-4" />
                {tab.label}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${isActive ? 'bg-white/15' : 'bg-white text-slate-900'}`}>
                {counts[tab.id] ?? 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
