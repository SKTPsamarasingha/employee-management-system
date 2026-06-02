'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Building,
  Coffee,
  DollarSign,
  CalendarCheck,
  ArrowRight,
  TrendingUp,
  Clock,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';

export default function AdminOverviewDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setStats(data.stats);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  const statCards = [
    { name: 'Total Employees', value: stats?.totalEmployees || 0, icon: Users, color: 'text-indigo-400', link: '/employees' },
    { name: 'Active Departments', value: stats?.totalDepartments || 0, icon: Building, color: 'text-purple-400', link: '/departments' },
    { name: 'Pending Leaves', value: stats?.pendingLeavesCount || 0, icon: Coffee, color: 'text-amber-400', link: '/leave' },
    { name: 'Payroll Distributed', value: formatCurrency(stats?.totalPayrollPaid || 0), icon: DollarSign, color: 'text-emerald-400', link: '/payroll' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">HR Dashboard Overview</h1>
        <p className="text-slate-400 mt-1">Monitor daily attendance, evaluate leave queries and distribute monthly salaries.</p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.name} href={card.link} className="glass-card p-5 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all group">
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{card.name}</span>
                <div className={`w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center ${card.color} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-white mt-4">{card.value}</p>
            </Link>
          );
        })}
      </div>

      {/* Today Attendance Rate */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="font-bold text-white text-lg">Today&apos;s Attendance Compliance</h3>
          <p className="text-sm text-slate-400">Ratios of all registered active employees clocked in today.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="w-40 bg-slate-800 h-4 rounded-full overflow-hidden border border-slate-700">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${stats?.attendanceRate || 0}%` }}></div>
          </div>
          <span className="text-3xl font-black text-white">{stats?.attendanceRate || 0}%</span>
        </div>
      </div>

      {/* Breakdowns columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>Recent Clock-ins</span>
            </h3>
            <Link href="/attendance" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
              View Register <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {stats?.recentAttendance?.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No clock-ins marked today.</div>
          ) : (
            <div className="space-y-3">
              {stats?.recentAttendance?.map((att) => (
                <div key={att._id} className="flex justify-between items-center text-sm p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <p className="font-semibold text-white">
                      {att.employee ? `${att.employee.firstName} ${att.employee.lastName}` : 'Unknown Employee'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">ID: {att.employee?.employeeId || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-300 font-medium">Clock-in: {new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <span className={`inline-block text-[10px] uppercase font-bold mt-1 ${att.status === 'present' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {att.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leaves */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              <span>Recent Leave Requests</span>
            </h3>
            <Link href="/leave" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
              Review Queue <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {stats?.recentLeaves?.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No leave requests in queue.</div>
          ) : (
            <div className="space-y-3">
              {stats?.recentLeaves?.map((leave) => (
                <div key={leave._id} className="flex justify-between items-center text-sm p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <p className="font-semibold text-white">
                      {leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName}` : 'Unknown Employee'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">
                      {leave.leaveType} Leave &bull; {leave.totalDays} Day{leave.totalDays > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div>
                    <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      leave.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                      leave.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


