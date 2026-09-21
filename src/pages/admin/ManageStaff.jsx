import React, { useState, useEffect } from 'react';
import { UserPlus, MoreHorizontal, Mail, X, Shield, Lock, Briefcase, User, Trash2, Calendar, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getStaff, addStaff, deleteStaff, updateStaff, updateStaffStatus, getDepartments, createManagerAccount } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const DEPARTMENTS_SUB_MAP = {
  'Support Department': ['LMS Related', 'Scholarship Form Related', 'Challan Related', 'LMS Portal Not Assign / Error Related', 'Courses Related', 'Candidate Portal Related'],
  'Technical Department': ['Assignment/Quiz Related', 'Assignment/Quiz Unavailable Issues Related', 'Assignment/Quiz Uploading Unavailable Issues Related', 'Course/Lecture Related'],
};

const ManageStaff = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({ name: '', email: '', dept: '', password: '', assignedSubDepartments: [] });
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState(null);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [managerForm, setManagerForm] = useState({ name: '', email: '', password: '', department: '' });
  const [managerLoading, setManagerLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [staffData, deptData] = await Promise.all([getStaff(), getDepartments()]);
      setStaffMembers(staffData);
      
      // Bulletproof: handle both old array format and new success object format
      const depts = Array.isArray(deptData) ? deptData : (deptData.departments || []);
      setDepartments(depts);
    } catch (err) {
      toast.error('Failed to load system data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const update = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await updateStaff(currentStaffId, {
          name: formData.name,
          email: formData.email,
          department: formData.dept,
          assignedSubDepartments: formData.assignedSubDepartments
        });
        toast.success('Team member updated successfully!');
      } else {
        await addStaff({
          name: formData.name,
          email: formData.email,
          department: formData.dept,
          password: formData.password,
          assignedSubDepartments: formData.assignedSubDepartments
        });
        toast.success('New team member added successfully!');
      }
      setIsModalOpen(false);
      setFormData({ name: '', email: '', dept: '', password: '', assignedSubDepartments: [] });
      setIsEditMode(false);
      setCurrentStaffId(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process request');
    }
  };

  const handleEditClick = (staff) => {
    setIsEditMode(true);
    setCurrentStaffId(staff._id);
    setFormData({
      name: staff.name,
      email: staff.email,
      dept: staff.department,
      password: '', // Password not editable here for security
      assignedSubDepartments: staff.assignedSubDepartments || []
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setCurrentStaffId(null);
    setFormData({ name: '', email: '', dept: '', password: '', assignedSubDepartments: [] });
  };

  const handleCreateManager = async (e) => {
    e.preventDefault();
    setManagerLoading(true);
    try {
      await createManagerAccount(managerForm);
      toast.success('Manager account created successfully!');
      setIsManagerModalOpen(false);
      setManagerForm({ name: '', email: '', password: '', department: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create manager');
    } finally {
      setManagerLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await deleteStaff(id);
      toast.success('Staff member removed');
      fetchData();
    } catch (err) {
      toast.error('Failed to remove staff member');
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Leave' ? 'Active' : 'Leave';
    try {
      await updateStaffStatus(id, newStatus);
      toast.success(`Staff marked as ${newStatus}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Prepare data for performance chart (Only for staff who handle tickets)
  const performanceData = staffMembers
    .filter(u => u.role === 'staff')
    .map(staff => ({
      name: staff.name?.split(' ')[0] || 'Unknown',
      fullName: staff.name,
      resolved: staff.resolvedCount || 0,
      active: staff.activeCount || 0,
    })).sort((a, b) => b.resolved - a.resolved);

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Team</h1>
          <p className="text-slate-500 text-sm mt-1">Add, update, or remove team members</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsManagerModalOpen(true)}
            className="btn btn-secondary gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <Shield size={16} /> Create Manager
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary gap-2"
          >
            <UserPlus size={18} /> Add New Team Member
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Team Member</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department / Sub Department</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Resolved</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">Loading team members...</td></tr>
              ) : staffMembers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-medium">
                    No team members found in the database.
                  </td>
                </tr>
              ) : staffMembers.map((staff) => (
                <tr key={staff._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gov-light text-gov-primary flex items-center justify-center font-bold">
                        {staff.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{staff.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail size={12} /> {staff.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      staff.role === 'manager' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-slate-700 px-2.5 py-1 bg-slate-100 rounded-md font-medium border border-slate-200 w-fit">{staff.department || 'All'}</span>
                      {staff.assignedSubDepartments?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {staff.assignedSubDepartments.map(sd => (
                            <span key={sd} className="text-[9px] bg-gov-light text-gov-primary px-1.5 py-0.5 rounded font-bold uppercase">{sd}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {staff.role === 'staff' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gov-primary">{staff.resolvedCount || 0}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Closed</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No tickets</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(staff)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Assignments"
                      >
                        <Settings size={18} />
                      </button>
                      <button 
                        onClick={() => handleStatusToggle(staff._id, staff.status)}
                        title={staff.status === 'Leave' ? 'Mark as Active' : 'Mark as on Leave'}
                        className={`p-2 rounded-lg transition-colors ${staff.status === 'Leave' ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'}`}
                      >
                        <Calendar size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(staff._id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Chart Section */}
      {!loading && staffMembers.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Team Performance Overview</h2>
                <p className="text-sm text-slate-500">Tickets resolved per team member</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-gov-primary"></div>
                  <span className="text-slate-600">Resolved</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-gov-light border border-gov-mid"></div>
                  <span className="text-slate-600">Active</span>
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={performanceData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  barSize={32}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="resolved" fill="#004d40" radius={[4, 4, 0, 0]} name="Resolved" />
                  <Bar dataKey="active" fill="#e0f2f1" stroke="#004d40" strokeWidth={1} radius={[4, 4, 0, 0]} name="Active" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 animate-fade-in overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-gov-dark via-gov-mid to-gov-accent" />
            
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{isEditMode ? 'Edit Team Member' : 'Add New Team Member'}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{isEditMode ? 'Update assignments and profile' : 'Register a new representative to a department'}</p>
              </div>
              <button onClick={handleModalClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input type="text" required className="input pl-10" placeholder="e.g. Asad Ali"
                      value={formData.name} onChange={update('name')} />
                  </div>
                </div>

                <div>
                  <label className="label">Official Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input type="email" required className="input pl-10" placeholder="name@punjab.gov.pk"
                      value={formData.email} onChange={update('email')} />
                  </div>
                </div>

                <div>
                  <label className="label">Department Assignment</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <select required className="input pl-10 appearance-none"
                      value={formData.dept} onChange={update('dept')}>
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d._id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.dept && (
                  <div className="animate-fade-in">
                    <label className="label">Sub Department</label>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                      {(DEPARTMENTS_SUB_MAP[formData.dept.trim()] || []).map(sd => (
                        <label key={sd} className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-gov-primary focus:ring-gov-mid"
                            checked={formData.assignedSubDepartments.includes(sd)}
                            onChange={(e) => {
                              const newArr = e.target.checked 
                                ? [...formData.assignedSubDepartments, sd]
                                : formData.assignedSubDepartments.filter(item => item !== sd);
                              setFormData({ ...formData, assignedSubDepartments: newArr });
                            }}
                          />
                          <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">{sd}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 italic">Note: If none selected, staff will see all tickets in this department.</p>
                  </div>
                )}

                {!isEditMode && (
                  <div>
                    <label className="label">Assign Temporary Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                      <input type="password" required className="input pl-10" placeholder="••••••••"
                        value={formData.password} onChange={update('password')} />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                  <button type="button" onClick={handleModalClose} className="btn btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    <Shield size={16} /> {isEditMode ? 'Update Staff' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Manager Modal ── */}
      {isManagerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsManagerModalOpen(false)} />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 animate-fade-in overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-400" />
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Shield size={18} className="text-indigo-600" /> Create Manager Account
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Manager team ki progress dekhega lekin tickets handle nahi karega</p>
              </div>
              <button onClick={() => setIsManagerModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateManager} className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input type="text" required className="input pl-10" placeholder="e.g. Bilal Manager"
                      value={managerForm.name} onChange={e => setManagerForm({...managerForm, name: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input type="email" required className="input pl-10" placeholder="manager@punjab.gov.pk"
                      value={managerForm.email} onChange={e => setManagerForm({...managerForm, email: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="label">Department (Optional)</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <select className="input pl-10 appearance-none"
                      value={managerForm.department} onChange={e => setManagerForm({...managerForm, department: e.target.value})}>
                      <option value="">All Departments (Global Manager)</option>
                      {departments.map(d => (
                        <option key={d._id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input type="password" required className="input pl-10" placeholder="••••••••"
                      value={managerForm.password} onChange={e => setManagerForm({...managerForm, password: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2">
                  <button type="button" onClick={() => setIsManagerModalOpen(false)} className="btn btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={managerLoading} className="btn btn-primary flex-1 bg-indigo-600 hover:bg-indigo-700 border-indigo-600">
                    {managerLoading ? 'Creating...' : <><Shield size={15} /> Create Manager</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStaff;
