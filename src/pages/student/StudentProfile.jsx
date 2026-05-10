import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders } from '../../utils/auth';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';

export default function StudentProfile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: '', hostelName: '', roomNumber: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}${API_ENDPOINTS.STUDENT_ME}`, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        const student = data.student;
        setProfile(student);
        setForm({
          name: student.name || '',
          hostelName: student.hostelName || '',
          roomNumber: student.roomNumber || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}${API_ENDPOINTS.STUDENT_ME}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.student);
        updateUser(data.student);
        setMessage('Profile updated successfully');
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your personal information</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">GR Number</label>
            <input
              value={profile?.grnNumber || ''}
              disabled
              className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Hostel</label>
              <input
                value={form.hostelName}
                onChange={(e) => setForm((p) => ({ ...p, hostelName: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Room</label>
              <input
                value={form.roomNumber}
                onChange={(e) => setForm((p) => ({ ...p, roomNumber: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
              />
            </div>
          </div>

          {message && (
            <div className={`rounded-xl px-4 py-2.5 text-sm ${message.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          <Button type="submit" isLoading={isSaving}>
            Save Changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
