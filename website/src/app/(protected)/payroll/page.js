'use client';

import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, ArrowDown, ArrowUp, Calendar, AlertCircle } from 'lucide-react';

export default function PayrollPage() {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayroll() {
      try {
        const res = await fetch('/api/payroll');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setRecords(data.records);
            if (data.records.length > 0) {
              setSelectedRecord(data.records[0]); // Select latest slip by default
            }
          }
        }
      } catch (err) {
        console.error('Error fetching payroll history', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPayroll();
  }, []);

  const getMonthName = (monthNum) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNum - 1];
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Paid</span>;
      case 'processed':
        return <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Processed</span>;
      case 'pending':
        return <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>;
      default:
        return <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Salary & Payroll Slips</h1>
        <p className="text-slate-400 mt-1">Review your monthly payouts, tax deductions, and bank transaction receipts.</p>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 rounded-3xl border border-slate-800">
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-sm">No payroll records generated yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* List of Payslips */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white font-sans">Payout History</h2>
            </div>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {records.map((rec) => {
                const isSelected = selectedRecord?._id === rec._id;
                return (
                  <button
                    key={rec._id}
                    onClick={() => setSelectedRecord(rec)}
                    className={`w-full flex justify-between items-center p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-900 border-slate-850 hover:bg-slate-900 hover:border-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-bold">{getMonthName(rec.payPeriod.month)} {rec.payPeriod.year}</h4>
                      <p className={`text-xs mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                        Net Paid: {formatCurrency(rec.netPay)}
                      </p>
                    </div>
                    <div>
                      {getStatusBadge(rec.paymentStatus)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed View */}
          {selectedRecord && (
            <div className="lg:col-span-2 glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
              {/* Detailed View Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Payslip ID: {selectedRecord._id.substring(0, 12)}</span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                    Payslip for {getMonthName(selectedRecord.payPeriod.month)} {selectedRecord.payPeriod.year}
                  </h2>
                </div>
                <div className="self-start sm:self-auto">
                  {getStatusBadge(selectedRecord.paymentStatus)}
                </div>
              </div>

              {/* Earnings vs Deductions Split */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Earnings List */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-1.5 text-sm font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2">
                    <ArrowUp className="w-4 h-4 text-emerald-400" />
                    <span>Earnings</span>
                  </h3>
                  <div className="space-y-2.5 text-sm text-slate-400">
                    <div className="flex justify-between">
                      <span>Basic Salary</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(selectedRecord.earnings.baseSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Allowances</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(selectedRecord.earnings.allowances)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overtime Pay</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(selectedRecord.earnings.overtimePay)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Performance Bonus</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(selectedRecord.earnings.bonus)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-850 pt-2 font-bold text-white">
                      <span>Gross Salary</span>
                      <span>{formatCurrency(selectedRecord.grossPay)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions List */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-1.5 text-sm font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2">
                    <ArrowDown className="w-4 h-4 text-rose-400" />
                    <span>Deductions</span>
                  </h3>
                  <div className="space-y-2.5 text-sm text-slate-400">
                    <div className="flex justify-between">
                      <span>Income Tax (12%)</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(selectedRecord.deductions.tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Provident Fund (5%)</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(selectedRecord.deductions.providentFund)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Health Insurance</span>
                      <span className="font-semibold text-slate-200">{formatCurrency(selectedRecord.deductions.insurance)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-850 pt-2 font-bold text-white">
                      <span>Total Deductions</span>
                      <span>{formatCurrency(selectedRecord.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary Highlight Box */}
              <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-indigo-400">Net Take-Home Salary</h4>
                  <p className="text-xs text-slate-400 mt-1">Calculated as: Gross Pay - Total Deductions</p>
                </div>
                <div className="text-3xl font-extrabold text-white">
                  {formatCurrency(selectedRecord.netPay)}
                </div>
              </div>

              {/* Transaction details / Bank info */}
              <div className="pt-4 border-t border-slate-850 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
                <div>
                  <span className="font-semibold block text-slate-500 uppercase tracking-wider">Payment Method</span>
                  <span className="capitalize mt-1 block font-medium text-slate-300">{selectedRecord.paymentMethod.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="font-semibold block text-slate-500 uppercase tracking-wider">Transaction Ref</span>
                  <span className="mt-1 block font-medium text-slate-300 truncate" title={selectedRecord.transactionId}>
                    {selectedRecord.transactionId || <span className="text-slate-600">Pending bank transfer</span>}
                  </span>
                </div>
                <div>
                  <span className="font-semibold block text-slate-500 uppercase tracking-wider">Credit Date</span>
                  <span className="mt-1 block font-medium text-slate-300">
                    {selectedRecord.paymentDate ? new Date(selectedRecord.paymentDate).toLocaleDateString() : <span className="text-slate-600">--/--/----</span>}
                  </span>
                </div>
              </div>

              {/* Remarks info banner */}
              {selectedRecord.remarks && (
                <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-900 p-3 rounded-xl border border-slate-850">
                  <AlertCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>{selectedRecord.remarks}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
