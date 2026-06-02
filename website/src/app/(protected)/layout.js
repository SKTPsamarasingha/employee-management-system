'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  CreditCard,
  BarChart3,
  MessageSquare,
  LogOut,
  User,
  Menu,
  Briefcase
} from 'lucide-react';

export default function ProtectedLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Attendance', path: '/attendance', icon: Calendar },
    { name: 'Leave Requests', path: '/leave', icon: ClipboardList },
    { name: 'Payroll', path: '/payroll', icon: CreditCard },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Support', path: '/contact', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0 flex-col w-64 bg-slate-900 border-r border-slate-800">
        {/* Branding header */}
        <div className="flex items-center h-16 px-6 border-b border-slate-800 gap-2">
          <Briefcase className="w-6 h-6 text-indigo-500" />
          <span className="font-bold text-lg text-white">EMS<span className="text-indigo-500">Portal</span></span>
        </div>

        {/* Sidebar user profile snapshot */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-white truncate">{user.firstName} {user.lastName}</h4>
              <p className="text-xs text-slate-500 truncate">{user.position}</p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout button at bottom */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-rose-400 hover:text-white hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Layout Container */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-16 px-6 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-500" />
            <span className="font-bold text-base text-white">EMS<span className="text-indigo-500">Portal</span></span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-semibold text-xs"
            >
              {user.firstName[0]}{user.lastName[0]}
            </Link>
            <button onClick={logout} className="text-rose-400 hover:text-rose-300" title="Sign Out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content Wrapper */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
