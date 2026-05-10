import { Edit3 } from 'lucide-react';

export function StudentProfile({ student, onEditProfile }) {
  const avatarLabel = student?.avatarUrl ? null : (student?.name || 'Student').trim().charAt(0).toUpperCase() || 'S';

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl font-black text-white shadow-lg shadow-cyan-500/20">
            {student?.avatarUrl ? (
              <img src={student.avatarUrl} alt={student?.name || 'Student avatar'} className="h-full w-full object-cover" />
            ) : (
              avatarLabel
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">Student Profile</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{student?.name || 'Student'}</h2>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
              <p><span className="font-semibold text-slate-900">GRN:</span> {student?.grnNumber || 'Not set'}</p>
              <p><span className="font-semibold text-slate-900">Hostel:</span> {student?.hostelName || 'Not set'}</p>
              <p><span className="font-semibold text-slate-900">Room:</span> {student?.roomNumber || 'Not set'}</p>
              <p><span className="font-semibold text-slate-900">Role:</span> Student</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onEditProfile}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-gray-200 px-4 py-3 text-sm font-bold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:bg-gray-50 shadow-sm"
        >
          <Edit3 className="h-4 w-4" />
          Edit Profile
        </button>
      </div>
    </section>
  );
}
