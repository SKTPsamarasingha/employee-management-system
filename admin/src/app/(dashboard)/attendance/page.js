'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Save, Search } from 'lucide-react';

const statuses = ['present', 'late', 'half-day', 'absent', 'on-leave', 'holiday'];

function toDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

export default function AttendancePage() {
  const [date, setDate] = useState(toDateInput(new Date()));
  const [records, setRecords] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [message, setMessage] = useState('');


  const filteredRecords = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return records;
    return records.filter(({ employee }) => (
      `${employee.firstName} ${employee.lastName} ${employee.employeeId} ${employee.department}`.toLowerCase().includes(needle)
    ));
  }, [records, query]);

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/attendance?date=${date}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setRecords(data.attendance);
        const nextDrafts = {};
        data.attendance.forEach((item) => {
          nextDrafts[item.employee.id] = {
            status: item.status,
            checkIn: toLocalInput(item.record?.checkIn),
            checkOut: toLocalInput(item.record?.checkOut),
            notes: item.record?.notes || '',
          };
        });
        setDrafts(nextDrafts);
      }
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  function updateDraft(employeeId, key, value) {
    setDrafts((prev) => ({ ...prev, [employeeId]: { ...prev[employeeId], [key]: value } }));
  }

  async function saveRecord(item) {
    const draft = drafts[item.employee.id];
    setSavingId(item.employee.id);
    setMessage('');
    try {
      const res = await fetch('/api/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: item.employee.id,
          dateStr: date,
          status: draft.status,
          checkIn: draft.checkIn,
          checkOut: draft.checkOut,
          notes: draft.notes,
        }),
      });
      const data = await res.json();
      setMessage(res.ok && data.success ? data.message : data.error || 'Could not save attendance.');
      if (res.ok && data.success) await loadAttendance();
    } finally {
      setSavingId('');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Attendance Registers</h1>
          <p className="text-slate-400 mt-1">Review daily attendance and apply manual HR adjustments.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search employee..." className="w-full sm:w-64 bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500" />
          </div>
        </div>
      </div>

      {message && <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">{message}</div>}

      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" /></div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm"><CalendarCheck className="w-12 h-12 mx-auto mb-3 text-slate-600" /><p>No attendance rows found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Employee</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Check In</th>
                  <th className="py-4 px-4">Check Out</th>
                  <th className="py-4 px-4">Hours</th>
                  <th className="py-4 px-4">Notes</th>
                  <th className="py-4 px-6 text-right">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {filteredRecords.map((item) => {
                  const draft = drafts[item.employee.id] || {};
                  return (
                    <tr key={item.employee.id} className="hover:bg-slate-900/30">
                      <td className="py-4 px-6">
                        <p className="font-bold text-white">{item.employee.firstName} {item.employee.lastName}</p>
                        <p className="text-xs text-slate-500">{item.employee.employeeId} - {item.employee.department}</p>
                      </td>
                      <td className="py-4 px-4">
                        <select value={draft.status || 'absent'} onChange={(e) => updateDraft(item.employee.id, 'status', e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white capitalize">
                          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </td>
                      <td className="py-4 px-4"><input type="datetime-local" value={draft.checkIn || ''} onChange={(e) => updateDraft(item.employee.id, 'checkIn', e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" /></td>
                      <td className="py-4 px-4"><input type="datetime-local" value={draft.checkOut || ''} onChange={(e) => updateDraft(item.employee.id, 'checkOut', e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" /></td>
                      <td className="py-4 px-4 text-slate-300">{item.record?.workingHours || 0}h</td>
                      <td className="py-4 px-4"><input value={draft.notes || ''} onChange={(e) => updateDraft(item.employee.id, 'notes', e.target.value)} className="w-44 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" /></td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => saveRecord(item)} disabled={savingId === item.employee.id} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-60">
                          <Save className="w-3.5 h-3.5" /> {savingId === item.employee.id ? 'Saving' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


