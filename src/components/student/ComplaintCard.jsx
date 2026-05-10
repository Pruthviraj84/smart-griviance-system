import { CalendarDays, MapPin, MessageSquareText, Paperclip } from 'lucide-react';
import { formatDate, imageList } from '../../utils/helpers';

export function ComplaintCard({ complaint, statusLabel, onClick }) {
  const attachments = imageList(complaint.images);

  return (
    <article
      onClick={onClick}
      className="group cursor-pointer rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Complaint</p>
          <h3 className="mt-2 text-lg font-black text-slate-950">{complaint.title}</h3>
        </div>
        <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-black text-primary-800 border border-primary-200">{statusLabel}</span>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{complaint.description}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1"><MapPin className="h-3.5 w-3.5" />{complaint.roomNo || 'Room not set'}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(complaint.createdAt || complaint.created_at)}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1"><MessageSquareText className="h-3.5 w-3.5" />{complaint.priority || 'Low'}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {attachments.slice(0, 3).map((src, index) => (
          <div key={`${src}-${index}`} className="relative overflow-hidden rounded-2xl bg-slate-100">
            <img src={src} alt={`Complaint attachment ${index + 1}`} className="h-24 w-full object-cover transition duration-300 group-hover:scale-105" />
          </div>
        ))}
        {attachments.length === 0 && (
          <div className="col-span-full flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8 text-sm font-semibold text-slate-500">
            <Paperclip className="mr-2 h-4 w-4" />
            No attachments
          </div>
        )}
      </div>
    </article>
  );
}
