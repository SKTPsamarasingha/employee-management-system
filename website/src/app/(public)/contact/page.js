'use client';

import { useState } from 'react';
import { Send, CheckCircle2, AlertTriangle, Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState({ loading: false, success: null, error: null });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: null, error: null });

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({ loading: false, success: 'Your message has been sent successfully!', error: null });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus({ loading: false, success: null, error: data.error || 'Failed to send message.' });
      }
    } catch (err) {
      setStatus({ loading: false, success: null, error: 'Network error. Please check your connection and try again.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>

      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">Contact Support</h1>
        <p className="mt-4 text-slate-400 text-lg">
          Have an issue with clock-ins, leaves or payroll? Submit a ticket below, and our HR operations team will reply shortly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Info Grid */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
            <Mail className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-white">Email Address</h3>
              <p className="text-sm text-slate-400 mt-1">support@company.com</p>
              <p className="text-xs text-slate-500">24/7 Corporate Helpline</p>
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
            <Phone className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-white">Corporate Hotlines</h3>
              <p className="text-sm text-slate-400 mt-1">+1 (555) 019-2834</p>
              <p className="text-xs text-slate-500">Mon - Fri, 9:00 AM - 6:00 PM EST</p>
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
            <MapPin className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-white">HR Head Office</h3>
              <p className="text-sm text-slate-400 mt-1">500 Corporate Parkway</p>
              <p className="text-xs text-slate-500">Suite 1200, New York, NY</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 glass-card p-8 sm:p-10 rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Corporate Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  placeholder="john@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                placeholder="Inquiry regarding payslip EMP-001"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">Message Content</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm resize-none"
                placeholder="Describe your issue or query in detail..."
              />
            </div>

            {/* Notification messages */}
            {status.success && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>{status.success}</span>
              </div>
            )}
            {status.error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{status.error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status.loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-all cursor-pointer text-sm"
            >
              {status.loading ? 'Sending Message...' : 'Send Inquiry'}
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
