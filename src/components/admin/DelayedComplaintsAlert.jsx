import { useEffect, useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders } from '../../utils/auth';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Skeleton from '../common/Skeleton';

export default function DelayedComplaintsAlert() {
  const [delayedComplaints, setDelayedComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDelayedComplaints();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDelayedComplaints, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDelayedComplaints = async () => {
    try {
      const res = await fetch(`${API_BASE}${API_ENDPOINTS.GET_DELAYED_COMPLAINTS}`, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setDelayedComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error('Failed to fetch delayed complaints:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (delayedComplaints.length === 0 && !isLoading) {
    return null; // Don't show if no delayed complaints
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20" />
      </div>
    );
  }

  return (
    <Card className="border-l-4 border-l-red-500 bg-red-50">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Delayed Complaints Alert</h3>
            <p className="text-sm text-red-700 mt-1">
              {delayedComplaints.length} complaint{delayedComplaints.length !== 1 ? 's' : ''} pending for more than 4 days
            </p>
          </div>
        </div>
        <button
          onClick={fetchDelayedComplaints}
          className="text-xs font-medium text-red-600 hover:text-red-700 whitespace-nowrap"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        {delayedComplaints.slice(0, 5).map((complaint) => (
          <div key={complaint._id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-red-200">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{complaint.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-3 w-3 text-red-600" />
                <span className="text-xs text-slate-600">{complaint.daysOpen} days open</span>
                <span className="text-xs text-slate-600">•</span>
                <span className="text-xs text-slate-600">{complaint.category}</span>
                {complaint.assignedTo && (
                  <>
                    <span className="text-xs text-slate-600">•</span>
                    <span className="text-xs text-slate-600">Assigned to: {complaint.assignedTo}</span>
                  </>
                )}
              </div>
            </div>
            <div className="ml-2 flex items-center gap-2">
              <Badge priority={complaint.priority}>{complaint.priority}</Badge>
              <Badge status={complaint.status}>{complaint.status}</Badge>
            </div>
          </div>
        ))}
      </div>

      {delayedComplaints.length > 5 && (
        <p className="text-xs text-red-600 mt-3 text-center">
          ... and {delayedComplaints.length - 5} more delayed complaints
        </p>
      )}
    </Card>
  );
}
