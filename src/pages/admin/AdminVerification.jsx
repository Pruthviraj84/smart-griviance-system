import { useEffect, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders } from '../../utils/auth';
import ComplaintVerificationCard from '../../components/common/ComplaintVerificationCard';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';
import Card from '../../components/common/Card';

export default function AdminVerification() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState({ type: '', message: '' });
  const [activeTab, setActiveTab] = useState('awaiting'); // awaiting, verified, rejected

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/complaints`, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error(err);
      setVerificationMessage({ type: 'error', message: 'Failed to load complaints' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleVerify = async (complaintId) => {
    setIsVerifying(true);
    setVerificationMessage({ type: '', message: '' });
    try {
      const res = await fetch(`${API_BASE}${API_ENDPOINTS.UPDATE_COMPLAINT_STATUS(complaintId)}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Verified' }),
      });

      if (res.ok) {
        const updated = await res.json();
        setComplaints(prev => prev.map(c => c._id === updated._id ? updated : c));
        setVerificationMessage({
          type: 'success',
          message: 'Status updated successfully'
        });
        setTimeout(() => setVerificationMessage({ type: '', message: '' }), 3000);
      } else {
        const raw = await res.text();
        let errorMessage = 'Failed to verify';
        try {
          const errorData = raw ? JSON.parse(raw) : null;
          errorMessage = errorData?.message || errorMessage;
        } catch {
          errorMessage = raw || errorMessage;
        }
        setVerificationMessage({ type: 'error', message: errorMessage });
      }
    } catch (err) {
      console.error(err);
      setVerificationMessage({ type: 'error', message: 'An error occurred during verification' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReject = async (complaintId, reason) => {
    setIsVerifying(true);
    setVerificationMessage({ type: '', message: '' });
    try {
      const res = await fetch(`${API_BASE}/api/complaints/${complaintId}/reject-verification`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        const updated = await res.json();
        setComplaints(prev => prev.map(c => c._id === updated._id ? updated : c));
        setVerificationMessage({
          type: 'success',
          message: 'Status updated successfully'
        });
        setTimeout(() => setVerificationMessage({ type: '', message: '' }), 3000);
      } else {
        const raw = await res.text();
        let errorMessage = 'Failed to reject';
        try {
          const errorData = raw ? JSON.parse(raw) : null;
          errorMessage = errorData?.message || errorMessage;
        } catch {
          errorMessage = raw || errorMessage;
        }
        setVerificationMessage({ type: 'error', message: errorMessage });
      }
    } catch (err) {
      console.error(err);
      setVerificationMessage({ type: 'error', message: 'An error occurred during rejection' });
    } finally {
      setIsVerifying(false);
    }
  };

  const awaiting = complaints.filter(c => c.status === 'Completed');
  const verified = complaints.filter(c => c.status === 'Verified');
  const rejected = complaints.filter(c => c.verificationStatus === 'Rejected');

  const filtered = {
    awaiting,
    verified,
    rejected
  }[activeTab] || [];

  const stats = {
    awaiting: awaiting.length,
    verified: verified.length,
    rejected: rejected.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Verification Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1">Review and verify worker completion proofs</p>
      </div>

      {/* Status Message */}
      {verificationMessage.message && (
        <div className={`flex gap-3 rounded-lg p-4 border ${
          verificationMessage.type === 'success'
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {verificationMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <div className="text-sm font-medium">{verificationMessage.message}</div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-2xl font-bold text-yellow-900">{stats.awaiting}</p>
          <p className="text-xs text-yellow-700 font-medium mt-1">Awaiting Verification</p>
        </div>
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-2xl font-bold text-green-900">{stats.verified}</p>
          <p className="text-xs text-green-700 font-medium mt-1">Verified</p>
        </div>
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
          <p className="text-xs text-red-700 font-medium mt-1">Rejected</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {['awaiting', 'verified', 'rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab === 'awaiting' ? 'Awaiting Verification' : tab === 'verified' ? 'Verified' : 'Rejected'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-96" count={2} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={`No ${activeTab} complaints`}
            message={activeTab === 'awaiting' ? 'All workers have completed their tasks!' : 'No complaints in this category.'}
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((complaint) => (
              <ComplaintVerificationCard
                key={complaint._id}
                complaint={complaint}
                userRole={user?.role}
                onVerify={() => handleVerify(complaint._id)}
                onReject={(reason) => handleReject(complaint._id, reason)}
                isLoading={isVerifying}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      {activeTab === 'awaiting' && awaiting.length > 0 && (
        <Card className="bg-blue-50 border border-blue-200">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Verification Guide</p>
              <ul className="text-xs text-blue-800 mt-2 space-y-1 ml-5 list-disc">
                <li>Check if the before/after images match the complaint</li>
                <li>Ensure the completion proof is clear and shows finished work</li>
                <li>Verify that the work quality meets standards</li>
                <li>Check the worker's remarks for any additional context</li>
                <li>If unsure, reject and ask for better documentation</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
