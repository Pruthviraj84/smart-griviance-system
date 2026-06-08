import { Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Badge from './Badge';
import Button from './Button';
import Card from './Card';
import { ImageGallery } from './ImageGallery';
import { getImageUrl } from '../../utils/helpers';

export default function WorkerComplaintCard({ complaint, onStartWork, onCompleteWork, isLoading, userRole }) {
  const isWorker = userRole === 'Worker';
  const isAssigned = complaint?.status === 'Assigned';
  const isInProgress = complaint?.status === 'In Progress';
  const isCompleted = complaint?.status === 'Completed';
  const isVerified = complaint?.status === 'Verified';

  const getStatusColor = (status) => {
    const colors = {
      'Assigned': 'bg-orange-100 text-orange-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-yellow-100 text-yellow-800',
      'Verified': 'bg-green-100 text-green-800',
      'Resolved': 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <Card className="mb-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 pb-4 border-b border-slate-200">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-slate-900">{complaint?.title}</h3>
            <Badge className={getStatusColor(complaint?.status)}>
              {complaint?.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">
            {complaint?.roomNo && `Room ${complaint.roomNo}`}
            {complaint?.roomNo && complaint?.hostel && ' • '}
            {complaint?.hostel && `Hostel ${complaint.hostel}`}
          </p>
        </div>
        {complaint?.complaintCount > 1 && (
          <div className="mt-2 md:mt-0 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
            {complaint.complaintCount} students reported
          </div>
        )}
      </div>

      {/* Description */}
      <div className="mb-4 pb-4 border-b border-slate-200">
        <p className="text-sm text-slate-700">{complaint?.description}</p>
        {complaint?.remarks && (
          <div className="mt-3 p-3 bg-slate-50 rounded-lg">
            <p className="text-xs font-medium text-slate-600 mb-1">Remarks:</p>
            <p className="text-sm text-slate-700">{complaint.remarks}</p>
          </div>
        )}
      </div>

      {/* Images Section */}
      {(complaint?.images?.length > 0 || complaint?.completionImage) && (
        <div className="mb-4 pb-4 border-b border-slate-200">
          <div className="space-y-3">
            {complaint?.images?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Problem Images</p>
                <ImageGallery images={complaint.images} />
              </div>
            )}
            {complaint?.completionImage && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Completion Proof</p>
                <img
                  src={getImageUrl(complaint.completionImage)}
                  alt="Completion proof"
                  className="w-full h-auto max-h-72 object-cover rounded-lg border border-slate-200"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="mb-4 pb-4 border-b border-slate-200">
        <p className="text-xs font-medium text-slate-600 mb-3">Timeline</p>
        <div className="space-y-2 text-sm text-slate-600">
          {complaint?.createdAt && (
            <p>📝 <strong>Created:</strong> {new Date(complaint.createdAt).toLocaleString()}</p>
          )}
          {complaint?.workStartedAt && (
            <p>▶️ <strong>Work Started:</strong> {new Date(complaint.workStartedAt).toLocaleString()}</p>
          )}
          {complaint?.workCompletedAt && (
            <p>✅ <strong>Work Completed:</strong> {new Date(complaint.workCompletedAt).toLocaleString()}</p>
          )}
          {complaint?.verifiedAt && (
            <p>🔍 <strong>Verified:</strong> {new Date(complaint.verifiedAt).toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Status Info Box */}
      {isInProgress && !isCompleted && (
        <div className="flex gap-3 rounded-lg bg-blue-50 p-3 border border-blue-200 mb-4">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Work in Progress</p>
            <p className="text-xs text-blue-800">Complete the work and upload proof image to mark as completed.</p>
          </div>
        </div>
      )}

      {isCompleted && !isVerified && (
        <div className="flex gap-3 rounded-lg bg-yellow-50 p-3 border border-yellow-200 mb-4">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-900">Awaiting Verification</p>
            <p className="text-xs text-yellow-800">Admin is reviewing your completion proof.</p>
          </div>
        </div>
      )}

      {isVerified && (
        <div className="flex gap-3 rounded-lg bg-green-50 p-3 border border-green-200 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900">Work Verified</p>
            <p className="text-xs text-green-800">Your completion proof was approved by admin.</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {isWorker && (
        <div className="flex flex-col sm:flex-row gap-3">
          {isAssigned && !isInProgress && (
            <Button
              onClick={onStartWork}
              disabled={isLoading}
              isLoading={isLoading}
              className="flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Work
            </Button>
          )}

          {(isAssigned || isInProgress) && !isCompleted && (
            <Button
              onClick={onCompleteWork}
              variant="secondary"
              disabled={isLoading}
              className="flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark as Completed
            </Button>
          )}

          {isCompleted && !isVerified && (
            <div className="flex items-center gap-2 text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              Awaiting admin verification...
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
