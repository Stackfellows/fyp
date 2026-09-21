import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getComplaints, deleteComplaint } from '../../services/api';
import { Search, Filter, Download, Eye, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Pagination from '../../components/Pagination';

const AllTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'All', department: 'All', search: '', time: 'all' });
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'active';
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const setActiveTab = (newTab) => {
    setSearchParams({ ...Object.fromEntries(searchParams.entries()), tab: newTab, page: 1 });
  };
  const setCurrentPage = (newPage) => {
    setSearchParams({ ...Object.fromEntries(searchParams.entries()), tab: activeTab, page: newPage });
  };
  const itemsPerPage = 10;
  const isFirstMount = useRef(true);

  // Reset to first page when filters change (preventing infinite loops and mount reset)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const currentPageStr = searchParams.get('page');
    if (currentPageStr !== '1' && currentPageStr !== null) {
      setSearchParams({ ...Object.fromEntries(searchParams.entries()), page: 1 });
    }
  }, [filters]);

  // Reset status filter to 'All' when tab changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, status: 'All' }));
  }, [activeTab]);

  useEffect(() => {
    const fetchTickets = async () => {
      setTickets(await getComplaints());
      setLoading(false);
    };
    
    fetchTickets();
    
    const handleRefresh = () => fetchTickets();
    window.addEventListener('refresh_data', handleRefresh);
    return () => window.removeEventListener('refresh_data', handleRefresh);
  }, []);

  const filtered = tickets.filter(t => {
    const isResolved = ['Resolved', 'Closed'].includes(t.status);
    const matchesTab = activeTab === 'resolved' ? isResolved : !isResolved;
    if (!matchesTab) return false;

    const isSnoozed = t.snoozeUntil && new Date(t.snoozeUntil) > new Date();
    
    // Status filter
    let s = false;
    if (filters.status === 'Snoozed') {
      s = isSnoozed;
    } else {
      if (isSnoozed) return false; // Hide from all other active views
      s = filters.status === 'All' || t.status === filters.status;
    }

    const c = filters.department === 'All' || t.department === filters.department;
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

    return s && c && q && timeMatch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedTickets = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const set = (field) => (e) => setFilters({ ...filters, [field]: e.target.value });

  const handlePrintPDF = () => {
    window.print();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to "cut" (delete) this ticket?')) {
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
        <h1 className="text-2xl font-bold text-slate-900">All System Tickets</h1>
        <button
          onClick={handlePrintPDF}
          className="btn btn-primary gap-2 text-sm shrink-0 shadow-lg shadow-gov-primary/20"
        >
          <Download size={15} /> Export PDF/Print
        </button>
      </div>

      {/* Print Only Header */}
      <div className="hidden print:block border-b-2 border-gov-primary pb-6 mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">University FYP Student Complaint Portal</h1>
        <h2 className="text-xl text-slate-600 mt-2">Official Tickets Report</h2>
        <p className="text-slate-500 mt-1">
          Filters: {filters.time.toUpperCase()} | Status: {filters.status} | Dept: {filters.department}
        </p>
        <p className="text-slate-400 mt-1 text-sm">Generated on: {new Date().toLocaleString()}</p>
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
        <select className="input h-10 text-sm w-auto font-bold text-gov-primary bg-white" value={filters.time} onChange={set('time')}>
          <option value="all">All Time</option>
          <option value="daily">Last 24 Hours</option>
          <option value="weekly">Last 7 Days</option>
          <option value="monthly">Last Month</option>
          <option value="yearly">Last Year</option>
        </select>
        <select className="input h-10 text-sm w-auto" value={filters.status} onChange={set('status')}>
          <option value="All">All Statuses</option>
          {(activeTab === 'resolved' ? ['Resolved', 'Closed'] : ['Open', 'In Progress', 'Pending', 'Snoozed']).map(s => (
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

      {/* Tab Controls */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200 print:hidden">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
            activeTab === 'active'
              ? 'bg-white text-gov-primary shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Active ({tickets.filter(t => !['Resolved', 'Closed'].includes(t.status)).length})
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
            activeTab === 'resolved'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Resolved ({tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length})
        </button>
      </div>

      <div className="card overflow-hidden print:shadow-none print:border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left print:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 print:bg-slate-100">
              <tr>
                {['Ticket ID', 'Subject', 'Student', 'Department', 'Sub Department', 'Date', 'Status', 'View'].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${i === 7 ? 'print:hidden text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-200">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-slate-400">Loading…</td></tr>
              ) : paginatedTickets.length > 0 ? paginatedTickets.map(t => (
                <tr key={t._id} className="hover:bg-slate-50 transition-colors print:break-inside-avoid">
                  <td className="px-6 py-4 text-sm font-mono font-bold text-gov-primary">{t.complaintId}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 max-w-[180px] truncate print:whitespace-normal">{t.subject}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{t.user?.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{t.department}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{t.subDepartment}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`badge badge-${t.status.toLowerCase().replace(' ', '-')} print:border print:border-slate-300 print:bg-transparent print:text-slate-800`}>{t.status}</span>
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
                      onClick={() => navigate(`/admin/tickets/${t._id}`)}
                      className="p-1.5 text-gov-primary hover:bg-gov-primary/10 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(t._id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cut (Delete) Ticket"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">No tickets match filters.</td></tr>
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

      {/* Print Footer */}
      <div className="hidden print:block mt-12 pt-8 border-t border-slate-200 text-center text-slate-500 text-xs break-inside-avoid">
        <p>This document contains confidential information regarding official complaints.</p>
        <p className="mt-1 font-bold">© {new Date().getFullYear()} University FYP Student Complaint Portal</p>
      </div>
    </div>
  );
};

export default AllTickets;
