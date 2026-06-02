'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Calendar,
  Clock,
  ClipboardList,
  DollarSign,
  Coffee,
  CheckCircle,
  AlertCircle,
  Play,
  Square
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [clockActionLoading, setClockActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch stats and today's attendance record
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch summary stats
        const statsRes = await fetch('/api/attendance/summary');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success) {
            setStats(statsData.summary);
          }
        }

        // Fetch attendance records to find today's clock status
        const attRes = await fetch('/api/attendance');
        if (attRes.ok) {
          const attData = await attRes.json();
          if (attData.success && attData.records.length > 0) {
            // Check if latest record is today's record
            const latest = attData.records[0];
            const latestDate = new Date(latest.date);
            const today = new Date();
            
            if (
              latestDate.getUTCDate() === today.getUTCDate() &&
              latestDate.getUTCMonth() === today.getUTCMonth() &&
              latestDate.getUTCFullYear() === today.getUTCFullYear()
            ) {
              setTodayRecord(latest);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchData();
  }, [clockActionLoading]); // Re-fetch on clock-in/out to update stats

  const handleClockAction = async (action) => {
    setClockActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        setTodayRecord(data.record);
        setNotes('');
      } else {
        setErrorMsg(data.error || 'Clock action failed.');
      }
    } catch (err) {
      setErrorMsg('Failed to process clock action.');
    } finally {
      setClockActionLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLeaveRemaining = () => {
    if (!user || !user.leaveBalances) return 0;
    const balances = user.leaveBalances;
    let totalRem = 0;
    Object.keys(balances).forEach((key) => {
      totalRem += (balances[key].total - balances[key].used);
    });
    return totalRem;
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Info banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">{user.firstName}!</span>
          </h1>
          <p className="text-slate-400 mt-1">
            Department: {user.department} &bull; Designation: {user.position}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 self-start md:self-auto">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Working Hours</p>
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
            {loadingStats ? '...' : `${stats?.totalWorkingHours || 0} hrs`}
          </p>
          <p className="text-xs text-slate-500 mt-1">Total this month</p>
        </div>

        {/* Stat 2 */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Present Days</p>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
            {loadingStats ? '...' : `${stats?.daysPresent || 0} days`}
          </p>
          <p className="text-xs text-slate-500 mt-1">Days clocked present</p>
        </div>

        {/* Stat 3 */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Leaves Left</p>
            <Coffee className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
            {getLeaveRemaining()} days
          </p>
          <p className="text-xs text-slate-500 mt-1">Available balance</p>
        </div>

        {/* Stat 4 */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-start">
            <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Overtime</p>
            <Clock className="w-5 h-5 text-pink-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
            {loadingStats ? '...' : `${stats?.totalOvertimeHours || 0} hrs`}
          </p>
          <p className="text-xs text-slate-500 mt-1">OT accrued this month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Marking Widget */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Daily Attendance Console</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            {/* Console Status */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400">Clock In Time:</span>
                <span className="font-semibold text-white">{todayRecord?.checkIn ? formatTime(todayRecord.checkIn) : '--:--'}</span>
              </div>
              <div className="flex justify-between items-center text-sm p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400">Clock Out Time:</span>
                <span className="font-semibold text-white">{todayRecord?.checkOut ? formatTime(todayRecord.checkOut) : '--:--'}</span>
              </div>
              <div className="flex justify-between items-center text-sm p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400">Today&apos;s Status:</span>
                <span className={`font-semibold capitalize ${
                  todayRecord?.status === 'present' ? 'text-emerald-400' :
                  todayRecord?.status === 'late' ? 'text-amber-400' :
                  todayRecord?.status === 'half-day' ? 'text-orange-400' : 'text-slate-400'
                }`}>{todayRecord ? todayRecord.status : 'not clocked in'}</span>
              </div>
            </div>

            {/* Console Controls */}
            <div className="space-y-4">
              <div>
                <label htmlFor="notes" className="block text-xs text-slate-400 mb-1">Activity Notes (Optional)</label>
                <input
                  type="text"
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={todayRecord && todayRecord.checkIn && todayRecord.checkOut}
                  placeholder="E.g. worked on project reports..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status messages */}
              {errorMsg && (
                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                  <CheckCircle className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => handleClockAction('checkIn')}
                  disabled={clockActionLoading || (todayRecord && todayRecord.checkIn)}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 transition-all cursor-pointer shadow-lg shadow-emerald-600/10"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Clock In
                </button>
                <button
                  onClick={() => handleClockAction('checkOut')}
                  disabled={clockActionLoading || !todayRecord || (todayRecord && !todayRecord.checkIn) || (todayRecord && todayRecord.checkOut)}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:hover:bg-rose-600 transition-all cursor-pointer shadow-lg shadow-rose-600/10"
                >
                  <Square className="w-4 h-4 fill-white" />
                  Clock Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links panel */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
            <ClipboardList className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Portal Navigation</h2>
          </div>

          <div className="space-y-3">
            <Link
              href="/attendance"
              className="flex justify-between items-center p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all group"
            >
              <span className="text-sm text-slate-300">Attendance Log</span>
              <span className="text-xs text-indigo-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
            <Link
              href="/leave"
              className="flex justify-between items-center p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all group"
            >
              <span className="text-sm text-slate-300">Request Leaves</span>
              <span className="text-xs text-indigo-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
            <Link
              href="/payroll"
              className="flex justify-between items-center p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all group"
            >
              <span className="text-sm text-slate-300">Salary & Payslips</span>
              <span className="text-xs text-indigo-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
            <Link
              href="/reports"
              className="flex justify-between items-center p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all group"
            >
              <span className="text-sm text-slate-300">Analytics Reports</span>
              <span className="text-xs text-indigo-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



