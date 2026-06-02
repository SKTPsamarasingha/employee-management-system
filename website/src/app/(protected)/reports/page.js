'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, CalendarCheck2, ShieldAlert } from 'lucide-react';

export default function ReportsPage() {
  const [stats, setStats] = useState(null);
  const [payHistory, setPayHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const statsRes = await fetch('/api/attendance/summary');
        const payRes = await fetch('/api/payroll');

        if (statsRes.ok && payRes.ok) {
          const statsData = await statsRes.json();
          const payData = await payRes.json();

          if (statsData.success) setStats(statsData.summary);
          if (payData.success) setPayHistory(payData.records);
        }
      } catch (err) {
        console.error('Failed to load reports details', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const getMonthName = (monthNum) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1];
  };

  const getAttendanceRate = () => {
    if (!stats || stats.totalRecords === 0) return 0;
    const presents = stats.daysPresent || 0;
    const lates = stats.daysLate || 0;
    // Late days are present, already included in daysPresent
    const totalWorking = stats.daysPresent + stats.daysAbsent + stats.leaveDays;
    if (totalWorking === 0) return 0;
    return Math.round((stats.daysPresent / totalWorking) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">HR Reports & Analytics</h1>
        <p className="text-slate-400 mt-1">Review your monthly performance ratios, working trends, and salary logs.</p>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attendance Report */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
              <CalendarCheck2 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Attendance Summary Report</h2>
            </div>

            {/* Attendance Rate dial/bar */}
            <div className="flex items-center justify-between gap-6 p-4 rounded-2xl bg-slate-900 border border-slate-850">
              <div>
                <h4 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Attendance Rate</h4>
                <p className="text-xs text-slate-500 mt-1">Evaluated present vs absent ratios.</p>
              </div>
              <div className="text-3xl font-extrabold text-white">
                {getAttendanceRate()}%
              </div>
            </div>

            {/* Attendance Breakdowns */}
            <div className="space-y-3.5">
              {/* Present */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Days Present ({stats?.daysPresent || 0} days)</span>
                  <span>{stats?.totalRecords > 0 ? Math.round(((stats.daysPresent) / (stats.daysPresent + stats.daysAbsent + stats.leaveDays)) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats?.totalRecords > 0 ? ((stats.daysPresent) / (stats.daysPresent + stats.daysAbsent + stats.leaveDays)) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Late Checkins */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Late Arrivals ({stats?.daysLate || 0} days)</span>
                  <span>{stats?.daysPresent > 0 ? Math.round((stats.daysLate / stats.daysPresent) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${stats?.daysPresent > 0 ? (stats.daysLate / stats.daysPresent) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Absent */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Absent ({stats?.daysAbsent || 0} days)</span>
                  <span>{stats?.totalRecords > 0 ? Math.round((stats.daysAbsent / (stats.daysPresent + stats.daysAbsent + stats.leaveDays)) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${stats?.totalRecords > 0 ? (stats.daysAbsent / (stats.daysPresent + stats.daysAbsent + stats.leaveDays)) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Leave */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Days on Leave ({stats?.leaveDays || 0} days)</span>
                  <span>{stats?.totalRecords > 0 ? Math.round((stats.leaveDays / (stats.daysPresent + stats.daysAbsent + stats.leaveDays)) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${stats?.totalRecords > 0 ? (stats.leaveDays / (stats.daysPresent + stats.daysAbsent + stats.leaveDays)) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Salary Trend Report */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Monthly Take-Home Salary Trend</h2>
            </div>

            {payHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No payroll history found.</div>
            ) : (
              <div className="space-y-6">
                <p className="text-xs text-slate-400">Chronological history of take-home payout totals:</p>
                <div className="space-y-3">
                  {payHistory.slice(0, 5).map((pay) => {
                    // Maximum bar height factor based on standard pays
                    const maxPayVal = 10000;
                    const widthPercent = Math.min(100, Math.round((pay.netPay / maxPayVal) * 100));

                    return (
                      <div key={pay._id} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-300">{getMonthName(pay.payPeriod.month)} {pay.payPeriod.year}</span>
                          <span className="text-white">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(pay.netPay)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-6 rounded-lg overflow-hidden flex items-center pr-2 border border-slate-850">
                          <div
                            className="bg-indigo-600/80 h-full rounded-l-lg transition-all"
                            style={{ width: `${widthPercent}%` }}
                          ></div>
                          <span className="text-[10px] text-indigo-300 font-bold ml-2">{widthPercent}% index</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
