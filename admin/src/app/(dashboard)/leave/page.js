'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, ClipboardList, Search, XCircle } from 'lucide-react';

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'N/A';
}

export default function LeaveApprovalsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [processingId, setProcessingId] = useState('');


  const filteredRequests = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus = filter === 'all' || request.status === filter;
      const employeeName = request.employee ? `${request.employee.firstName} ${request.employee.lastName} ${request.employee.employeeId}` : '';
      const matchesQuery = !needle || `${employeeName} ${request.leaveType} ${request.reason}`.toLowerCase().includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [requests, filter, query]);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leave');
      const data = await res.json();
      if (res.ok && data.success) setRequests(data.requests);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function processRequest(request, status) {
    const rejectionReason = status === 'rejected' ? prompt('Reason for rejection:', 'Not approved by HR policy.') : '';
    if (status === 'rejected' && rejectionReason === null) return;

    setProcessingId(request._id);
    setMessage('');
    try {
      const res = await fetch(`/api/leave/${request._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason }),
      });
      const data = await res.json();
      setMessage(res.ok && data.success ? data.message : data.error || 'Could not process request.');
      if (res.ok && data.success) await loadRequests();
    } finally {
      setProcessingId('');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Leave Approvals</h1>
          <p className="text-slate-400 mt-1">Review employee leave requests and update approvals.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white capitalize">
            {['pending', 'approved', 'rejected', 'cancelled', 'all'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search requests..." className="w-full sm:w-64 bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500" />
          </div>
        </div>
      </div>

      {message && <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">{message}</div>}

      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" /></div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm"><ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-600" /><p>No leave requests match this view.</p></div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredRequests.map((request) => (
              <div key={request._id} className="p-5 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_auto] gap-4 hover:bg-slate-900/30">
                <div>
                  <p className="font-bold text-white">{request.employee ? `${request.employee.firstName} ${request.employee.lastName}` : 'Unknown employee'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{request.employee?.employeeId || 'N/A'} - {request.employee?.position || 'N/A'}</p>
                  <p className="mt-3 text-sm text-slate-300">{request.reason}</p>
                </div>
                <div className="text-sm text-slate-300">
                  <p className="capitalize"><span className="text-slate-500">Type:</span> {request.leaveType}</p>
                  <p><span className="text-slate-500">Dates:</span> {formatDate(request.startDate)} to {formatDate(request.endDate)}</p>
                  <p><span className="text-slate-500">Days:</span> {request.totalDays}</p>
                  <span className={`inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                    request.status === 'approved' ? 'bg-emerald-500/10 text-emerald-300' :
                    request.status === 'rejected' ? 'bg-rose-500/10 text-rose-300' :
                    request.status === 'pending' ? 'bg-amber-500/10 text-amber-300' : 'bg-slate-800 text-slate-300'
                  }`}>{request.status}</span>
                </div>
                <div className="flex lg:flex-col gap-2 justify-end">
                  <button onClick={() => processRequest(request, 'approved')} disabled={request.status !== 'pending' || processingId === request._id} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-40">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => processRequest(request, 'rejected')} disabled={request.status !== 'pending' || processingId === request._id} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold disabled:opacity-40">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


