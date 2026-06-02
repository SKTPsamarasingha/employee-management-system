'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building, Edit2, Plus, Trash2, Users, X } from 'lucide-react';

const emptyForm = { name: '', code: '', description: '', head: '' };

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const employeeOptions = useMemo(() => employees.map((employee) => ({
    id: employee._id,
    name: `${employee.firstName} ${employee.lastName}`,
    label: `${employee.firstName} ${employee.lastName} (${employee.employeeId})`,
  })), [employees]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [deptRes, empRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/employees'),
      ]);
      const deptData = await deptRes.json();
      const empData = await empRes.json();

      if (deptRes.ok && deptData.success) setDepartments(deptData.departments);
      if (empRes.ok && empData.success) setEmployees(empData.employees);
    } catch (err) {
      setError('Failed to load department records.');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setSelectedDepartment(null);
    setFormData(emptyForm);
    setError('');
    setMessage('');
    setIsModalOpen(true);
  }

  function openEditModal(department) {
    setSelectedDepartment(department);
    setFormData({
      name: department.name || '',
      code: department.code || '',
      description: department.description || '',
      head: department.head?._id || '',
    });
    setError('');
    setMessage('');
    setIsModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const url = selectedDepartment ? `/api/departments/${selectedDepartment._id}` : '/api/departments';
      const res = await fetch(url, {
        method: selectedDepartment ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Could not save department.');
        return;
      }

      setMessage(data.message || 'Department saved.');
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError('Network error while saving department.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(department) {
    if (!confirm(`Delete ${department.name}?`)) return;

    try {
      const res = await fetch(`/api/departments/${department._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Could not delete department.');
        return;
      }
      await loadData();
    } catch (err) {
      alert('Network error while deleting department.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Departments</h1>
          <p className="text-slate-400 mt-1">Maintain teams, codes, leaders, and staffing counts.</p>
        </div>
        <button onClick={openCreateModal} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</div>}

      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" /></div>
        ) : departments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <Building className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p>No active departments found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Code</th>
                  <th className="py-4 px-6">Head</th>
                  <th className="py-4 px-6">Employees</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {departments.map((department) => (
                  <tr key={department._id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-white">{department.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{department.description || 'No description'}</p>
                    </td>
                    <td className="py-4 px-6"><span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-indigo-300">{department.code}</span></td>
                    <td className="py-4 px-6 text-slate-300">{department.head ? `${department.head.firstName} ${department.head.lastName}` : 'Not assigned'}</td>
                    <td className="py-4 px-6 text-slate-300">
                      <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-500" />{department.employeeCount || 0}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(department)} className="p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/10" title="Edit department"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(department)} className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10" title="Delete department"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-xl w-full rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900">
              <h2 className="text-lg font-bold text-white">{selectedDepartment ? 'Edit Department' : 'Add Department'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Name</span>
                  <input required value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white" />
                </label>
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Code</span>
                  <input required value={formData.code} onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white uppercase" />
                </label>
              </div>
              <label className="space-y-1 block">
                <span className="block text-xs font-semibold text-slate-400 uppercase">Department Head</span>
                <select value={formData.head} onChange={(e) => setFormData((prev) => ({ ...prev, head: e.target.value }))} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white">
                  <option value="">No head assigned</option>
                  {employeeOptions.map((employee) => <option key={employee.id} value={employee.id}>{employee.label}</option>)}
                </select>
              </label>
              <label className="space-y-1 block">
                <span className="block text-xs font-semibold text-slate-400 uppercase">Description</span>
                <textarea rows={4} value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white resize-none" />
              </label>
              <button disabled={saving} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Department'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
