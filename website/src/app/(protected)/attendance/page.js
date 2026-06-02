'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAttendance() {
      try {
        const res = await fetch('/api/attendance');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setRecords(data.records);
          }
        }
      } catch (err) {
        console.error('Error fetching attendance logs', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAttendance();
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'present':
        return <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Present</span>;
      case 'late':
        return <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Late</span>;
      case 'half-day':
        return <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">Half Day</span>;
      case 'absent':
        return <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Absent</span>;
      case 'on-leave':
        return <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">On Leave</span>;
      default:
        return <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Attendance Logs</h1>
        <p className="text-slate-400 mt-1">Review your daily check-in, check-out and working hours history.</p>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-sm">No attendance records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Check In</th>
                  <th className="py-4 px-6">Check Out</th>
                  <th className="py-4 px-6">Working Hours</th>
                  <th className="py-4 px-6">Overtime</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Activity Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {records.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-900/30 transition-all">
                    <td className="py-4 px-6 text-white font-medium">{formatDate(record.date)}</td>
                    <td className="py-4 px-6 text-slate-300">{formatTime(record.checkIn)}</td>
                    <td className="py-4 px-6 text-slate-300">{formatTime(record.checkOut)}</td>
                    <td className="py-4 px-6 text-slate-300 font-semibold">{record.workingHours || 0} hrs</td>
                    <td className="py-4 px-6 text-slate-300">{record.overtimeHours || 0} hrs</td>
                    <td className="py-4 px-6">{getStatusBadge(record.status)}</td>
                    <td className="py-4 px-6 text-slate-400 max-w-xs truncate" title={record.notes}>
                      {record.notes || <span className="text-slate-600">No notes</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
