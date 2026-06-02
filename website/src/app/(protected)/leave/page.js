'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Calendar, ClipboardList, CheckCircle2, AlertTriangle, Send } from 'lucide-react';

export default function LeaveRequestPage() {
  const { user, setUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [formData, setFormData] = useState({ leaveType: 'annual', startDate: '', endDate: '', reason: '' });
  const [status, setStatus] = useState({ loading: false, success: null, error: null });

  // Load leave requests history
  useEffect(() => {
    async function fetchLeaves() {
      try {
        const res = await fetch('/api/leave');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setRequests(data.requests);
          }
        }
      } catch (err) {
        console.error('Error fetching leaves history', err);
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchLeaves();
  }, [status.loading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: null, error: null });

    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({ loading: false, success: 'Leave request submitted successfully!', error: null });
        setFormData({ leaveType: 'annual', startDate: '', endDate: '', reason: '' });
        
        // Re-load employee profile to sync leave balances if needed
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success) {
            setUser(meData.user);
          }
        }
      } else {
        setStatus({ loading: false, success: null, error: data.error || 'Failed to submit leave request.' });
      }
    } catch (err) {
      setStatus({ loading: false, success: null, error: 'Network error. Please try again.' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Approved</span>;
      case 'pending':
        return <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>;
      case 'rejected':
        return <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Rejected</span>;
      case 'cancelled':
        return <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700">Cancelled</span>;
      default:
        return <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700">{status}</span>;
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getBalanceRemaining = (type) => {
    if (!user || !user.leaveBalances || !user.leaveBalances[type]) return 0;
    const balance = user.leaveBalances[type];
    return balance.total - balance.used;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Leave Management</h1>
        <p className="text-slate-400 mt-1">Submit leaves, view remaining balance, and monitor past approvals.</p>
      </div>

      {/* Leave Balances Grids */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Annual Leave */}
        <div className="glass-card p-5 rounded-2xl border-l-4 border-indigo-500">
          <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Annual Leaves</h4>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{getBalanceRemaining('annual')}</span>
            <span className="text-xs text-slate-500">/ {user?.leaveBalances?.annual?.total || 20} days left</span>
          </div>
        </div>

        {/* Sick Leave */}
        <div className="glass-card p-5 rounded-2xl border-l-4 border-purple-500">
          <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sick Leaves</h4>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{getBalanceRemaining('sick')}</span>
            <span className="text-xs text-slate-500">/ {user?.leaveBalances?.sick?.total || 10} days left</span>
          </div>
        </div>

        {/* Casual Leave */}
        <div className="glass-card p-5 rounded-2xl border-l-4 border-pink-500">
          <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Casual Leaves</h4>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{getBalanceRemaining('casual')}</span>
            <span className="text-xs text-slate-500">/ {user?.leaveBalances?.casual?.total || 5} days left</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Request Form */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-6">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Apply for Leave</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="leaveType" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Leave Type</label>
              <select
                id="leaveType"
                name="leaveType"
                value={formData.leaveType}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-3.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  required
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-3.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  required
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-3.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reason" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reason</label>
              <textarea
                id="reason"
                name="reason"
                required
                rows={4}
                value={formData.reason}
                onChange={handleChange}
                placeholder="Brief description of time off..."
                className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-3.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Notification messages */}
            {status.success && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{status.success}</span>
              </div>
            )}
            {status.error && (
              <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{status.error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status.loading}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
            >
              {status.loading ? 'Submitting...' : 'Submit Request'}
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Leave Requests History */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <ClipboardList className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Request History</h2>
          </div>

          {loadingHistory ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-indigo-500"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No leave requests found.</div>
          ) : (
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
              {requests.map((req) => (
                <div key={req._id} className="p-4 rounded-xl bg-slate-900 border border-slate-850 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white capitalize">{req.leaveType} Leave</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDate(req.startDate)} - {formatDate(req.endDate)} &bull; {req.totalDays} day{req.totalDays > 1 ? 's' : ''}
                      </p>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                  <div className="text-xs text-slate-400 italic">
                    &ldquo;{req.reason}&rdquo;
                  </div>
                  {req.status === 'rejected' && req.rejectionReason && (
                    <div className="text-xs text-rose-400 bg-rose-500/5 p-2 rounded-lg border border-rose-500/15">
                      <span className="font-semibold">HR Reason:</span> {req.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
