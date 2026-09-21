import React, { useEffect, useState } from 'react';
import { getStudents, deleteStudent } from '../../services/api';
import { Search, Mail, Phone, Calendar, Trash2, User, Hash, Fingerprint } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Pagination from '../../components/Pagination';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student account?')) {
      try {
        await deleteStudent(id);
        setStudents(students.filter(s => s._id !== id));
        toast.success('Student account deleted');
      } catch (error) {
        toast.error('Failed to delete student');
      }
    }
  };

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.rollNo && s.rollNo.toLowerCase().includes(search.toLowerCase())) ||
    (s.cnic && s.cnic.includes(search)) ||
    s._id.includes(search)
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedStudents = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Official registry of registered students.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card p-4 bg-slate-50/60 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by ID, Roll No, CNIC or Name..."
            className="input pl-10 h-11 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-600 shadow-sm">
          Total Students: <span className="text-gov-primary font-bold">{filtered.length}</span>
        </div>
      </div>

      <div className="card overflow-hidden shadow-xl border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Roll Number</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">CNIC / ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-40" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded-lg w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedStudents.length > 0 ? (
                paginatedStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gov-primary/10 text-gov-primary rounded-full flex items-center justify-center font-bold text-sm">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-gov-primary bg-gov-primary/5 px-2 py-1 rounded border border-gov-primary/10">
                        {student.rollNo || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{student.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">CNIC</span>
                        <span className="text-sm text-slate-700 font-medium">{student.cnic || 'Not Provided'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.phone || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(student._id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove Student"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <User size={48} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-500 font-medium">No students found matching "{search}"</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!loading && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default ManageStudents;
