import React, { useState, useEffect } from 'react';
import { Plus, Settings, Trash2, Users, FileText, X } from 'lucide-react';
import { getDepartments, addDepartment, deleteDepartment, getAdminStats } from '../../services/api';
import { toast } from 'react-hot-toast';

const Departments = () => {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', head: '', description: '' });

  const fetchDepts = async () => {
    try {
      setLoading(true);
      // console.log('Fetching departments...');
      const data = await getDepartments();
      const departments = Array.isArray(data) ? data : (data.departments || []);
      setDepts(departments);
    } catch (err) {
      console.error('Error fetching depts:', err);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addDepartment(formData);
      toast.success('Department created successfully');
      setIsModalOpen(false);
      setFormData({ name: '', head: '', description: '' });
      fetchDepts();
    } catch (err) {
      toast.error('Failed to create department');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await deleteDepartment(id);
      toast.success('Department removed');
      fetchDepts();
    } catch (err) {
      toast.error('Failed to delete department');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Departments</h1>
          <p className="text-slate-500 text-sm mt-1">Oversee all academic departments and their activity</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={18} /> Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading departments...</div>
        ) : depts.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-50 border border-slate-100 rounded-2xl">
            <p className="text-slate-500 font-medium">No departments found in the database.</p>
          </div>
        ) : depts.map((dept) => (
          <div key={dept._id} className="card p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{dept.name}</h3>
                <p className="text-sm text-slate-500 mt-0.5">Head: {dept.head}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(dept._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-2">
                  <Users size={14} />
                  <span className="text-xs font-bold uppercase tracking-wide">Team</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{dept.staffCount || 0}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100">
                <div className="flex items-center justify-center gap-1.5 text-red-400 mb-2">
                  <FileText size={14} />
                  <span className="text-xs font-bold uppercase tracking-wide">Active</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{dept.activeTickets || 0}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 p-6">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl font-bold text-slate-900">Add New Department</h3>
               <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
             </div>
             <form onSubmit={handleAdd} className="space-y-4">
               <div>
                 <label className="label">Department Name</label>
                 <input type="text" required className="input" placeholder="e.g. Computer Science" 
                   value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               </div>
               <div>
                 <label className="label">Department Head</label>
                 <input type="text" required className="input" placeholder="e.g. Dr. Ahmed Ali" 
                   value={formData.head} onChange={e => setFormData({...formData, head: e.target.value})} />
               </div>
               <div>
                 <label className="label">Description (Optional)</label>
                 <textarea className="input min-h-[100px]" placeholder="Brief description..."
                   value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
               </div>
               <button type="submit" className="btn btn-primary w-full mt-4">Create Department</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
