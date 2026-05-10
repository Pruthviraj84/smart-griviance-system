import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Zap } from 'lucide-react';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders } from '../../utils/auth';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Skeleton from '../common/Skeleton';

export default function WorkerPerformanceTable() {
  const [workers, setWorkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWorkerWorkload();
  }, []);

  const fetchWorkerWorkload = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}${API_ENDPOINTS.GET_WORKER_WORKLOAD}`, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setWorkers(data);
      }
    } catch (err) {
      console.error('Failed to fetch worker workload:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getWorkloadColor = (percentage) => {
    if (percentage <= 40) return 'bg-green-100 text-green-700';
    if (percentage <= 70) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getWorkloadLabel = (percentage) => {
    if (percentage <= 40) return 'Low';
    if (percentage <= 70) return 'Medium';
    return 'High';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16" count={5} />
      </div>
    );
  }

  return (
    <Card>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary-600" />
          Worker Performance & Workload
        </h2>
        <button 
          onClick={fetchWorkerWorkload}
          className="text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Worker</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Specialization</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Active Tasks</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Workload</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Today</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Rating</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {workers.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                  No workers found
                </td>
              </tr>
            ) : (
              workers.map((worker) => (
                <tr key={worker._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{worker.name}</p>
                      <p className="text-xs text-slate-500">{worker.activeTaskCount} active</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {worker.specializations.length === 0 ? (
                        <span className="text-xs text-slate-500">—</span>
                      ) : (
                        worker.specializations.map((spec) => (
                          <span key={spec} className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                            {spec}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge className="bg-blue-100 text-blue-700">
                      {worker.activeTaskCount}/{worker.maxWorkload}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            worker.workloadPercentage <= 40
                              ? 'bg-green-500'
                              : worker.workloadPercentage <= 70
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(worker.workloadPercentage, 100)}%` }}
                        />
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getWorkloadColor(worker.workloadPercentage)}`}>
                        {worker.workloadPercentage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge className="bg-purple-100 text-purple-700">
                      {worker.completedToday}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-semibold text-slate-900">{worker.rating.toFixed(1)}</span>
                      <span className="text-yellow-500">★</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      className={
                        worker.isActive
                          ? worker.status === 'Busy'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }
                    >
                      {worker.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span>Low workload (≤40%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <span>Medium workload (41-70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span>High workload (&gt;70%)</span>
        </div>
      </div>
    </Card>
  );
}
