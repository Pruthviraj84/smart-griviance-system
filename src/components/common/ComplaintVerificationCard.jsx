import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Badge from './Badge';
import Button from './Button';
import Card from './Card';
import { useState } from 'react';
import { getImageUrl } from '../../utils/helpers';

export default function ComplaintVerificationCard({ complaint, onVerify, onReject, isLoading, userRole }) {
  const isAdmin = ['Admin', 'SuperAdmin', 'Super Admin'].includes(userRole);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const completionImage = getImageUrl(complaint?.completionImage || complaint?.workerProofImages?.[0] || complaint?.after_image?.[0]);
  const beforeImage = getImageUrl(complaint?.images?.[0] || complaint?.before_image?.[0]);

  if (!isAdmin || complaint?.status !== 'Completed') {
    return null;
  }

  const handleRejectSubmit = async () => {
    if (rejectionReason.trim()) {
      await onReject(rejectionReason);
      setShowRejectForm(false);
      setRejectionReason('');
    }
  };

  return (
    <Card className="border-l-4 border-l-amber-500 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Verification Required</h3>
          <p className="text-sm text-slate-500 mt-1">
            Completed by <strong>{complaint?.assignedTo}</strong>
          </p>
        </div>
        <Badge className="bg-amber-100 text-amber-800">
          {complaint?.status}
        </Badge>
      </div>

      {/* Complaint Details */}
      <div className="mb-4 pb-4 border-b border-slate-200">
        <h4 className="text-sm font-semibold text-slate-900 mb-2">{complaint?.title}</h4>
        <p className="text-sm text-slate-600 mb-3">{complaint?.description}</p>
        
        {complaint?.complaintCount > 1 && (
          <div className="mb-2 px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-medium border border-orange-200">
            Warning: {complaint.complaintCount} students reported this issue
          </div>
        )}

        {complaint?.remarks && (
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <p className="text-xs font-medium text-slate-600 mb-1">Worker Remarks:</p>
            <p className="text-sm text-slate-700">{complaint.remarks}</p>
          </div>
        )}
      </div>

      {/* Completion Image Section */}
      {completionImage && (
        <div className="mb-4 pb-4 border-b border-slate-200">
          <p className="text-sm font-semibold text-slate-900 mb-3">Completion Proof Image</p>
          <div className="space-y-3">
            {beforeImage && (
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Before:</p>
                <img
                  src={beforeImage}
                  alt="Before"
                  className="w-full h-auto max-h-64 object-cover rounded-lg border border-slate-200"
                />
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">After (Proof):</p>
              <img
                src={completionImage}
                alt="After - Completion Proof"
                className="w-full h-auto max-h-64 object-cover rounded-lg border-2 border-green-300 shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="mb-4 pb-4 border-b border-slate-200">
        <p className="text-xs font-medium text-slate-600 mb-2">Timeline</p>
        <div className="space-y-1 text-xs text-slate-600">
          {complaint?.createdAt && (
            <p>Created: {new Date(complaint.createdAt).toLocaleString()}</p>
          )}
          {complaint?.workStartedAt && (
            <p>Work Started: {new Date(complaint.workStartedAt).toLocaleString()}</p>
          )}
          {complaint?.workCompletedAt && (
            <p>Completed: {new Date(complaint.workCompletedAt).toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Verification Instructions */}
      <div className="flex gap-3 rounded-lg bg-blue-50 p-3 border border-blue-200 mb-4">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium">Verification Checklist:</p>
          <ul className="text-xs mt-1 space-y-1 ml-5 list-disc">
            <li>Image clearly shows the completed work</li>
            <li>Work appears to match the complaint requirements</li>
            <li>Quality meets standards</li>
          </ul>
        </div>
      </div>

      {/* Rejection Form */}
      {showRejectForm && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200 space-y-3">
          <p className="text-sm font-medium text-red-900">Reject this completion?</p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Reason for rejection (will be sent to worker)..."
            className="w-full rounded border border-red-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-red-500"
            rows="3"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleRejectSubmit}
              variant="danger"
              size="sm"
              disabled={!rejectionReason.trim() || isLoading}
              isLoading={isLoading}
            >
              Confirm Rejection
            </Button>
            <Button
              onClick={() => {
                setShowRejectForm(false);
                setRejectionReason('');
              }}
              variant="secondary"
              size="sm"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onVerify}
          variant="primary"
          disabled={isLoading || showRejectForm}
          isLoading={isLoading}
          className="flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Verify & Complete
        </Button>

        {!showRejectForm && (
          <Button
            onClick={() => setShowRejectForm(true)}
            variant="secondary"
            disabled={isLoading}
            className="flex items-center justify-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        )}
      </div>
    </Card>
  );
}
