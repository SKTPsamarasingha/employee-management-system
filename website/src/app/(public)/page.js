import Link from 'next/link';
import { Calendar, CreditCard, ClipboardList, ShieldAlert, Award, FileText } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <div className="relative pt-24 pb-20 sm:pt-32 sm:pb-28">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-20">
          <div className="absolute -top-40 left-0 w-80 h-80 rounded-full bg-indigo-500 blur-[120px]"></div>
          <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-purple-500 blur-[150px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-6">
              <Award className="w-3 h-3" /> Professional HR Solutions
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Optimize Team <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Attendance & Payroll</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-400 leading-relaxed">
              Empower your employees and simplify HR operations with our secure, unified portal for tracking hours, requesting time off, and managing monthly payrolls.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all"
              >
                Access Employee Portal
              </Link>
              <a
                href="http://localhost:3001/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-slate-300 border border-slate-700 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-600 transition-all text-center"
              >
                Admin Panel Login
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-slate-900/60 border-y border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">99.8%</p>
              <p className="mt-2 text-sm text-slate-400">Payroll Accuracy</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">&lt; 3 Secs</p>
              <p className="mt-2 text-sm text-slate-400">Attendance Clock-in</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">24 Hours</p>
              <p className="mt-2 text-sm text-slate-400">Leave Approval Turnaround</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">100%</p>
              <p className="mt-2 text-sm text-slate-400">Cloud Data Integrity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Core System Features</h2>
          <p className="mt-4 text-slate-400">
            A comprehensive, all-in-one corporate software workspace for modern companies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-card glass-card-hover p-8 rounded-2xl flex flex-col items-start">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Attendance System</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Clock-in and clock-out with a single tap, track monthly working hours, monitor overtime, and review daily attendance logs.
            </p>
            <span className="text-indigo-400 text-xs font-semibold">Active Monitoring &bull; Shift Calculation</span>
          </div>

          {/* Card 2 */}
          <div className="glass-card glass-card-hover p-8 rounded-2xl flex flex-col items-start">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Leave Management</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Submit requests for sick, annual, or casual leaves, calculate requested days, track request approval history, and check balances.
            </p>
            <span className="text-purple-400 text-xs font-semibold">Auto Balance Deductions &bull; Flow approvals</span>
          </div>

          {/* Card 3 */}
          <div className="glass-card glass-card-hover p-8 rounded-2xl flex flex-col items-start">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-6">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Payroll & Compensation</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              View monthly salary summaries, detailed earnings and deductions breakdown, past pay stub archives, and secure payment status.
            </p>
            <span className="text-pink-400 text-xs font-semibold">PDF Reports &bull; HRA, PF & Tax Deductions</span>
          </div>
        </div>
      </div>

      {/* Info CTA Section */}
      <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="glass-card p-10 sm:p-16 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
          <div className="max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">Are you an HR Administrator?</h3>
            <p className="text-slate-400 leading-relaxed">
              Login to the dedicated Admin Panel to manage employee profiles, departments, modify attendance registers, issue payrolls, and review contact queries.
            </p>
          </div>
          <div className="flex-shrink-0">
            <a
              href="http://localhost:3001/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 transition-all shadow-lg shadow-indigo-500/10"
            >
              Go to Admin Panel
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

