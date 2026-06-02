'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogIn, LayoutDashboard, Briefcase } from 'lucide-react';

export default function PublicLayout({ children }) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white hover:text-indigo-400 transition-colors">
                <Briefcase className="w-6 h-6 text-indigo-500" />
                <span>EMS<span className="text-indigo-500">Portal</span></span>
              </Link>
            </div>
            
            {/* Navigation links */}
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Contact
              </Link>
            </nav>

            {/* Auth Action Button */}
            <div>
              {user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-indigo-400 border border-slate-700 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:flex md:items-center md:justify-between">
          <div className="flex justify-center space-x-6 md:order-2">
            <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">Home</Link>
            <Link href="/about" className="text-sm text-slate-400 hover:text-white transition-colors">About</Link>
            <Link href="/contact" className="text-sm text-slate-400 hover:text-white transition-colors">Contact</Link>
            <a href="http://localhost:3001/login" className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Admin Panel</a>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-sm text-slate-400">&copy; {new Date().getFullYear()} Employee Attendance & Payroll Management System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

