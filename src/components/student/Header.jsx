import { Plus, LogOut, User } from 'lucide-react';

export function Header({ student, onLogout, onNewComplaint }) {
  return (
    <header className="sticky top-4 z-20 rounded-[2rem] border border-white/70 bg-white/85 px-4 py-4 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-50 text-primary-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">Student Dashboard</p>
            <h1 className="text-xl font-black text-slate-950 sm:text-2xl">Welcome back, {student?.name || 'Student'}</h1>
            <p className="text-sm text-slate-500">GRN {student?.grnNumber || 'Not set'} · {student?.hostelName || 'Hostel not set'} · Room {student?.roomNumber || 'Not set'}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onNewComplaint}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-primary-700 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Complaint
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
