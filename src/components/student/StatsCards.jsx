export function StatsCards({ stats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, tone, ring }) => (
        <article key={label} className={`rounded-[1.75rem] bg-white/90 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.08)] ring-1 ${ring} transition duration-300 hover:-translate-y-1`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
            </div>
            <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${tone} text-white shadow-lg shadow-slate-200/50`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
