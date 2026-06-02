'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Building,
  UserCheck,
  AlertCircle,
  X
} from 'lucide-react';

export default function EmployeesManagementPage() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Modal control states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    department: '',
    position: '',
    role: 'employee',
    baseSalary: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load employees and departments
  useEffect(() => {
    fetchData();
    // Search and department filters intentionally refresh the table.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, deptFilter]);

  async function fetchData() {
    try {
      setLoading(true);
      const url = `/api/employees?search=${search}&department=${deptFilter}`;
      const empRes = await fetch(url);
      const empData = await empRes.json();
      if (empRes.ok && empData.success) {
        setEmployees(empData.employees);
      }

      const deptRes = await fetch('/api/departments');
      const deptData = await deptRes.json();
      if (deptRes.ok && deptData.success) {
        setDepartments(deptData.departments);
      }
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setFormData({
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      department: departments[0]?._id || '',
      position: '',
      role: 'employee',
      baseSalary: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
    });
    setFormError('');
    setFormSuccess('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      password: '', // Leave blank unless editing
      phone: emp.phone,
      department: emp.department?._id || '',
      position: emp.position,
      role: emp.role,
      baseSalary: emp.salary?.baseSalary || '',
      bankName: emp.bankDetails?.bankName || '',
      accountNumber: emp.bankDetails?.accountNumber || '',
      ifscCode: emp.bankDetails?.ifscCode || '',
    });
    setFormError('');
    setFormSuccess('');
    setIsEditModalOpen(true);
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFormSuccess('Employee added successfully!');
        setTimeout(() => {
          setIsAddModalOpen(false);
          fetchData();
        }, 1000);
      } else {
        setFormError(data.error || 'Failed to add employee.');
      }
    } catch (err) {
      setFormError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/employees/${selectedEmployee._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFormSuccess('Employee updated successfully!');
        setTimeout(() => {
          setIsEditModalOpen(false);
          fetchData();
        }, 1000);
      } else {
        setFormError(data.error || 'Failed to update employee.');
      }
    } catch (err) {
      setFormError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        fetchData();
      } else {
        alert(data.error || 'Failed to delete employee.');
      }
    } catch (err) {
      alert('Failed to process deletion request.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Employee Management</h1>
          <p className="text-slate-400 mt-1">Manage corporate staff details, department mappings, and salaries.</p>
        </div>
        <div>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by ID, name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Department Filter */}
        <div className="relative">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <Users className="w-12 h-12 text-slate-650 mx-auto mb-3" />
            <p>No employees found matching the filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Employee</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Position</th>
                  <th className="py-4 px-6">Base Salary</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-sm">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-900/30 transition-all">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-bold text-white">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{emp.employeeId} &bull; {emp.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-medium">
                      {emp.department ? emp.department.name : <span className="text-slate-600">N/A</span>}
                    </td>
                    <td className="py-4 px-6 text-slate-300">{emp.position}</td>
                    <td className="py-4 px-6 text-slate-300 font-semibold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: emp.salary?.currency || 'USD' }).format(emp.salary?.baseSalary || 0)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
                        emp.role === 'manager' ? 'bg-indigo-500/10 text-indigo-400' :
                        emp.role === 'team_lead' ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {emp.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(emp)}
                          className="p-2 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp._id)}
                          className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900">
              <h2 className="text-lg font-bold text-white">Add New Employee</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">Employee ID</label>
                  <input type="text" name="employeeId" required value={formData.employeeId} onChange={handleInputChange} placeholder="EMP-004" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-455 uppercase mb-1">Position / Job Title</label>
                  <input type="text" name="position" required value={formData.position} onChange={handleInputChange} placeholder="Frontend Engineer" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">First Name</label>
                  <input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange} placeholder="Michael" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">Last Name</label>
                  <input type="text" name="lastName" required value={formData.lastName} onChange={handleInputChange} placeholder="Scott" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">Corporate Email</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange} placeholder="michael@company.com" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">Phone Number</label>
                  <input type="text" name="phone" required value={formData.phone} onChange={handleInputChange} placeholder="55501992" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">Department</label>
                  <select name="department" required value={formData.department} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-455 uppercase mb-1">Portal Password</label>
                  <input type="password" name="password" required value={formData.password} onChange={handleInputChange} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">Base Monthly Salary ($)</label>
                  <input type="number" name="baseSalary" required value={formData.baseSalary} onChange={handleInputChange} placeholder="6000" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">Role / Permissions</label>
                  <select name="role" required value={formData.role} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                    <option value="employee">Employee</option>
                    <option value="team_lead">Team Lead</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">Bank Name</label>
                  <input type="text" name="bankName" value={formData.bankName} onChange={handleInputChange} placeholder="Chase Bank" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">Bank Account Number</label>
                  <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} placeholder="9876543210" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">IFSC / Routing Code</label>
                  <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} placeholder="CHAS000123" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
              </div>

              {formError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{formError}</div>
              )}
              {formSuccess && (
                <div className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">{formSuccess}</div>
              )}

              <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer">
                {isSubmitting ? 'Saving employee details...' : 'Add Employee Record'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900">
              <h2 className="text-lg font-bold text-white">Edit Employee Details</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleEditEmployee} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">First Name</label>
                  <input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">Last Name</label>
                  <input type="text" name="lastName" required value={formData.lastName} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">Corporate Email</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">Phone Number</label>
                  <input type="text" name="phone" required value={formData.phone} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">Department</label>
                  <select name="department" required value={formData.department} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-455 uppercase mb-1">Portal Password (leave blank to keep current)</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">Base Monthly Salary ($)</label>
                  <input type="number" name="baseSalary" required value={formData.baseSalary} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">Role / Permissions</label>
                  <select name="role" required value={formData.role} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                    <option value="employee">Employee</option>
                    <option value="team_lead">Team Lead</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">Bank Name</label>
                  <input type="text" name="bankName" value={formData.bankName} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">Bank Account Number</label>
                  <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-450 uppercase mb-1">IFSC / Routing Code</label>
                  <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
              </div>

              {formData.position !== undefined && (
                <div>
                  <label className="block text-xs font-semibold text-slate-455 uppercase mb-1">Position / Job Title</label>
                  <input type="text" name="position" required value={formData.position} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white" />
                </div>
              )}

              {formError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{formError}</div>
              )}
              {formSuccess && (
                <div className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">{formSuccess}</div>
              )}

              <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer">
                {isSubmitting ? 'Updating employee details...' : 'Save Employee Details'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


