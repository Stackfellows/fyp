import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getManagerComplaints, deleteComplaint } from '../../services/api';
import { Search, Filter, Download, Eye, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Pagination from '../../components/Pagination';

const AllTickets = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Parse query params
  const queryParams = new URLSearchParams(location.search);
  const initialStatus = queryParams.get('status') || 'All';
  const initialTime   = queryParams.get('time')   || 'all';

  const [filters, setFilters] = useState({ 
    status: initialStatus, 
    department: 'All', 
    staffId: 'All',
    search: '', 
    time: initialTime 
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getManagerComplaints();
        setTickets(data);
      } catch (error) {
        toast.error('Failed to fetch tickets');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Extract unique staff members assigned to tickets
  const staffList = Array.from(
    new Map(
      tickets
        .filter(t => t.assignedTo?._id)
        .map(t => [t.assignedTo._id, t.assignedTo])
    ).values()
  );

  const filtered = tickets.filter(t => {
    const s = filters.status === 'All' || t.status === filters.status;
    const c = filters.department === 'All' || t.department === filters.department;
    const st = filters.staffId === 'All' 
      ? true 
      : filters.staffId === 'Unassigned' 
        ? !t.assignedTo?._id 
        : t.assignedTo?._id === filters.staffId;
    const q = !filters.search
      || t.subject.toLowerCase().includes(filters.search.toLowerCase())
      || t.complaintId.toLowerCase().includes(filters.search.toLowerCase())
      || t.user?.name?.toLowerCase().includes(filters.search.toLowerCase());

    // Time filter logic
    let timeMatch = true;
    if (filters.time !== 'all') {
      const ticketDate = new Date(t.createdAt);
      const now = new Date();
      if (filters.time === 'daily') {
        const oneDayAgo = new Date(now.setDate(now.getDate() - 1));
        timeMatch = ticketDate >= oneDayAgo;
      } else if (filters.time === 'weekly') {
        const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
        timeMatch = ticketDate >= oneWeekAgo;
      } else if (filters.time === 'monthly') {
        const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
        timeMatch = ticketDate >= oneMonthAgo;
      } else if (filters.time === 'yearly') {
        const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
        timeMatch = ticketDate >= oneYearAgo;
      }
    }

    return s && c && st && q && timeMatch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedTickets = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const set = (field) => (e) => setFilters({ ...filters, [field]: e.target.value });

  const handlePrintPDF = () => {
    window.print();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        await deleteComplaint(id);
        setTickets(tickets.filter(t => t._id !== id));
        toast.success('Ticket deleted successfully');
      } catch (error) {
        toast.error('Failed to delete ticket');
        console.error(error);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0 print:bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <h1 className="text-2xl font-bold text-slate-900">Department Complaints</h1>
        <button
          onClick={handlePrintPDF}
          className="btn btn-primary gap-2 text-sm shrink-0 shadow-lg shadow-gov-primary/20"
        >
          <Download size={15} /> Export PDF/Print
        </button>
      </div>



      {/* Filter Bar */}
      <div className="card p-4 bg-slate-50/60 flex flex-wrap gap-3 items-center print:hidden">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text" placeholder="Search ID, student, subject…"
            className="input pl-9 h-10 text-sm"
            value={filters.search} onChange={set('search')}
          />
        </div>
        <select className="input h-10 text-sm w-auto" value={filters.staffId} onChange={set('staffId')}>
          <option value="All">All Staff Members</option>
          <option value="Unassigned">Unassigned</option>
          {staffList.map(member => (
            <option key={member._id} value={member._id}>{member.name}</option>
          ))}
        </select>
        <select className="input h-10 text-sm w-auto font-bold text-emerald-700 bg-white" value={filters.time} onChange={set('time')}>
          <option value="all">All Time</option>
          <option value="daily">Last 24 Hours</option>
          <option value="weekly">Last 7 Days</option>
          <option value="monthly">Last Month</option>
          <option value="yearly">Last Year</option>
        </select>
        <select className="input h-10 text-sm w-auto" value={filters.status} onChange={set('status')}>
          <option value="All">All Statuses</option>
          {['Open', 'In Progress', 'Resolved', 'Closed'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="input h-10 text-sm w-auto" value={filters.department} onChange={set('department')}>
          <option value="All">All Departments</option>
          {['Support Department', 'Technical Department', 'Others'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden print:shadow-none print:border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left print:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 print:bg-slate-100">
              <tr>
                {['Sr. No', 'Ticket ID', 'Subject', 'Student', 'Department', 'Assigned To', 'Date', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${i === 8 ? 'print:hidden text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-200">
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-10 text-center text-slate-400">Loading…</td></tr>
              ) : paginatedTickets.length > 0 ? paginatedTickets.map((t, index) => (
                <tr key={t._id} className="hover:bg-slate-50 transition-colors print:break-inside-avoid">
                  <td className="px-6 py-4 text-sm font-bold text-slate-500">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="px-6 py-4 text-sm font-mono font-bold text-emerald-700">{t.complaintId}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 max-w-[180px] truncate print:whitespace-normal">{t.subject}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{t.user?.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{t.department}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">{t.assignedTo?.name || <span className="text-slate-400 font-normal italic">Unassigned</span>}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        t.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                        t.status === 'Open' ? 'bg-red-100 text-red-700' :
                        t.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>{t.status}</span>
                      {!['Resolved', 'Closed'].includes(t.status) && (
                        t.messages?.length <= 1 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                            ✨ New
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${t.messages[t.messages.length - 1].sender === t.user?._id ? 'bg-rose-100 text-rose-700 animate-pulse border-rose-200' : 'bg-purple-100 text-purple-700 border-purple-200'}`}>
                            {t.messages[t.messages.length - 1].sender === t.user?._id ? '🚨 Reply (Student)' : '💬 Reply'}
                          </span>
                        )
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right print:hidden flex flex-wrap justify-end gap-1.5">
                    <button
                      onClick={() => navigate(`/manager/tickets/${t._id}`)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(t._id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Ticket"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400">No tickets match filters.</td></tr>
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

export default AllTickets;
