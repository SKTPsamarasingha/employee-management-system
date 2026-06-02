import { ShieldCheck, Database, Server, Compass, FileText } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
      <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">About The System</h1>
        <p className="mt-4 text-slate-400 text-lg">
          A secure, high-performance employee attendance and payroll management environment built on next-generation tech stack.
        </p>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Our Mission & Operations</h2>
          <p className="text-slate-400 leading-relaxed mb-6">
            Managing employee records, calculating daily clock-ins, and approving payrolls shouldn&apos;t be tedious. Our platform aims to unify multiple corporate workflows under a singular secure roof. 
          </p>
          <p className="text-slate-400 leading-relaxed">
            By connecting frontend interfaces directly with standard MongoDB collections and secure Next.js API Routes, we ensure complete accuracy in calculating work hours, evaluating overtime pay, maintaining leave requests, and issuing payslips.
          </p>
        </div>
        <div className="glass-card p-8 rounded-2xl border border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4">Core System Objective</h3>
          <ul className="space-y-4 text-sm text-slate-400">
            <li className="flex gap-3 items-start">
              <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <span>Provide role-based secure routes with encrypted cookies.</span>
            </li>
            <li className="flex gap-3 items-start">
              <Database className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <span>Enforce schema validations with strict MongoDB indices.</span>
            </li>
            <li className="flex gap-3 items-start">
              <Server className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <span>Calculate decimal-level working hours and overtime multipliers automatically.</span>
            </li>
            <li className="flex gap-3 items-start">
              <Compass className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <span>Allow quick navigation between pages via a responsive client sidebar.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="border-t border-slate-800 pt-16">
        <h2 className="text-2xl font-bold text-white text-center mb-10">Application Architecture</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-xl text-center">
            <h3 className="font-bold text-indigo-400 mb-2">Next.js</h3>
            <p className="text-xs text-slate-400">Server-side rendering, routing structure, and App Router configuration.</p>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <h3 className="font-bold text-purple-400 mb-2">Tailwind CSS</h3>
            <p className="text-xs text-slate-400">Tailwind v4 utility layouts, transitions, responsive UI elements.</p>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <h3 className="font-bold text-pink-400 mb-2">Mongoose & DB</h3>
            <p className="text-xs text-slate-400">Strict schema mapping, auto calculations, and cached serverless pools.</p>
          </div>
          <div className="glass-card p-6 rounded-xl text-center">
            <h3 className="font-bold text-amber-400 mb-2">JWT Authentication</h3>
            <p className="text-xs text-slate-400">Edge middleware validation with secure HTTP-only cookies.</p>
          </div>
        </div>
      </div>
    </div>
  );
}



