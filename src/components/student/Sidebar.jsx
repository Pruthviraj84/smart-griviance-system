import { ChevronDown, ClipboardList, LayoutDashboard, Menu, Search, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    id: 'complaints',
    label: 'Complaints',
    icon: ClipboardList,
    children: [
      { id: 'new-complaint', label: 'New Complaint' },
      { id: 'current-complaints', label: 'Current Complaints' },
      { id: 'pending-complaints', label: 'Pending Complaints' },
      { id: 'solved-complaints', label: 'Solved Complaints' },
    ],
  },
];

export function Sidebar({ activeSection, activeTab, onSectionChange, onTabChange }) {
  const [complaintsOpen, setComplaintsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (section) => {
    onSectionChange(section);
    setMobileOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen((value) => !value)}
        className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-sm font-bold text-slate-900 shadow-lg backdrop-blur lg:hidden"
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        Menu
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[18rem] transform border-r border-white/70 bg-white/90 p-4 shadow-2xl backdrop-blur-xl transition-transform duration-300 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center gap-3 rounded-[1.5rem] bg-white border border-gray-100 px-4 py-4 text-slate-900 shadow-sm">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Student Space</p>
            <p className="font-black">Dashboard Menu</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <Search className="h-4 w-4" />
          Search complaints coming soon
        </div>

        <nav className="mt-5 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const hasChildren = Boolean(item.children?.length);

            if (!hasChildren) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition duration-200 ${isActive ? 'bg-primary-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            }

            return (
              <div key={item.id} className="rounded-2xl border border-slate-100 bg-white">
                <button
                  type="button"
                  onClick={() => setComplaintsOpen((value) => !value)}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${isActive ? 'bg-cyan-50 text-cyan-800' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${complaintsOpen ? 'rotate-180' : ''}`} />
                </button>

                <div className={`grid transition-all duration-300 ${complaintsOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden px-2 pb-2">
                    <div className="space-y-1 pl-2">
                      {item.children.map((child) => {
                        const childActive = activeTab === child.id;
                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => {
                              handleNavigate(child.id);
                              onTabChange(child.id);
                            }}
                            className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition duration-200 ${childActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                          >
                            {child.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileOpen(false)} />}
    </>
  );
}
