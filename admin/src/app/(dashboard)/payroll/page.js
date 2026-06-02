'use client';

import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Play, Save } from 'lucide-react';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const currentDate = new Date();

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

export default function PayrollPage() {
  const [records, setRecords] = useState([]);
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [drafts, setDrafts] = useState({});

  const totals = useMemo(() => records.reduce((acc, record) => ({
    gross: acc.gross + (record.grossPay || 0),
    net: acc.net + (record.netPay || 0),
    paid: acc.paid + (record.paymentStatus === 'paid' ? 1 : 0),
  }), { gross: 0, net: 0, paid: 0 }), [records]);

  useEffect(() => {
    loadRecords();
  }, [month, year]);

  async function loadRecords() {
    try {
      setLoading(true);
      const res = await fetch(`/api/payroll?month=${month}&year=${year}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setRecords(data.records);
        const nextDrafts = {};
        data.records.forEach((record) => {
          nextDrafts[record._id] = {
            bonus: record.earnings?.bonus || 0,
            allowances: record.earnings?.allowances || 0,
            otherDeductions: record.deductions?.otherDeductions || 0,
            paymentStatus: record.paymentStatus,
            paymentMethod: record.paymentMethod || 'bank_transfer',
            transactionId: record.transactionId || '',
            remarks: record.remarks || '',
          };
        });
        setDrafts(nextDrafts);
      }
    } finally {
      setLoading(false);
    }
  }

  function updateDraft(id, key, value) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  }

  async function generatePayroll() {
    setMessage('');
    const res = await fetch('/api/payroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year }),
    });
    const data = await res.json();
    setMessage(res.ok && data.success ? data.message : data.error || 'Could not generate payroll.');
    if (res.ok && data.success) await loadRecords();
  }

  async function savePayroll(record) {
    const draft = drafts[record._id];
    setUpdatingId(record._id);
    setMessage('');
    try {
      const res = await fetch(`/api/payroll/${record._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      setMessage(res.ok && data.success ? data.message : data.error || 'Could not update payroll.');
      if (res.ok && data.success) await loadRecords();
    } finally {
      setUpdatingId('');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Payroll Operations</h1>
          <p className="text-slate-400 mt-1">Generate salary slips, adjust allowances, and track payment status.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
            {monthNames.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
          <button onClick={generatePayroll} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm">
            <Play className="w-4 h-4" /> Generate Payroll
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl"><p className="text-xs uppercase text-slate-500 font-bold">Gross Payroll</p><p className="text-2xl font-black text-white mt-2">{money(totals.gross)}</p></div>
        <div className="glass-card p-5 rounded-2xl"><p className="text-xs uppercase text-slate-500 font-bold">Net Payroll</p><p className="text-2xl font-black text-white mt-2">{money(totals.net)}</p></div>
        <div className="glass-card p-5 rounded-2xl"><p className="text-xs uppercase text-slate-500 font-bold">Paid Slips</p><p className="text-2xl font-black text-white mt-2">{totals.paid}/{records.length}</p></div>
      </div>

      {message && <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">{message}</div>}

      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" /></div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm"><CreditCard className="w-12 h-12 mx-auto mb-3 text-slate-600" /><p>No payroll records for this period. Generate payroll to begin.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Employee</th>
                  <th className="py-4 px-4">Earnings</th>
                  <th className="py-4 px-4">Deductions</th>
                  <th className="py-4 px-4">Net Pay</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Transaction</th>
                  <th className="py-4 px-6 text-right">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {records.map((record) => {
                  const draft = drafts[record._id] || {};
                  return (
                    <tr key={record._id} className="hover:bg-slate-900/30 align-top">
                      <td className="py-4 px-6">
                        <p className="font-bold text-white">{record.employeeSnapshot?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{record.employeeSnapshot?.employeeId} - {record.employeeSnapshot?.department}</p>
                      </td>
                      <td className="py-4 px-4 space-y-2">
                        <p className="text-slate-300">Base: {money(record.earnings?.baseSalary)}</p>
                        <input type="number" value={draft.allowances ?? 0} onChange={(e) => updateDraft(record._id, 'allowances', e.target.value)} className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white" title="Allowances" />
                        <input type="number" value={draft.bonus ?? 0} onChange={(e) => updateDraft(record._id, 'bonus', e.target.value)} className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white" title="Bonus" />
                      </td>
                      <td className="py-4 px-4 space-y-2">
                        <p className="text-slate-300">Tax/PF: {money((record.deductions?.tax || 0) + (record.deductions?.providentFund || 0))}</p>
                        <input type="number" value={draft.otherDeductions ?? 0} onChange={(e) => updateDraft(record._id, 'otherDeductions', e.target.value)} className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white" title="Other deductions" />
                      </td>
                      <td className="py-4 px-4 font-bold text-white">{money(record.netPay)}</td>
                      <td className="py-4 px-4">
                        <select value={draft.paymentStatus || 'pending'} onChange={(e) => updateDraft(record._id, 'paymentStatus', e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white capitalize">
                          {['pending', 'processed', 'paid', 'failed'].map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </td>
                      <td className="py-4 px-4 space-y-2">
                        <select value={draft.paymentMethod || 'bank_transfer'} onChange={(e) => updateDraft(record._id, 'paymentMethod', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                          <option value="bank_transfer">Bank transfer</option>
                          <option value="check">Check</option>
                          <option value="cash">Cash</option>
                        </select>
                        <input value={draft.transactionId || ''} onChange={(e) => updateDraft(record._id, 'transactionId', e.target.value)} placeholder="Transaction ID" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600" />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => savePayroll(record)} disabled={updatingId === record._id} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-60">
                          <Save className="w-3.5 h-3.5" /> {updatingId === record._id ? 'Saving' : 'Save'}
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

