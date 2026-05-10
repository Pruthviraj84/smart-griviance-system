import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = {
  Pending: '#f59e0b', // amber-500
  Assigned: '#3b82f6', // blue-500
  'In Progress': '#0ea5e9', // sky-500
  Solved: '#10b981', // emerald-500
  Delayed: '#ef4444' // red-500
};

export function AnalyticsChart({ complaints }) {
  if (!complaints || complaints.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-500">
        No data available for analytics
      </div>
    );
  }

  // Count complaints by status
  const dataMap = complaints.reduce((acc, item) => {
    let status = item.status;
    if (['Resolved', 'Verified', 'Solved'].includes(status)) status = 'Solved';
    if (['Completed', 'Awaiting Verification'].includes(status)) status = 'In Progress';
    
    // Also consider delayed
    if (status !== 'Solved' && status !== 'In Progress') {
      const reference = new Date(item.created_at || item.createdAt || Date.now());
      if (Date.now() - reference.getTime() >= 2 * 86400000) {
        status = 'Delayed';
      }
    }

    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(dataMap).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
