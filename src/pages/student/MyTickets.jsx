import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getComplaints } from '../../services/api';
import { Search, Eye, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import Pagination from '../../components/Pagination';

const MyTickets = () => {
  const { user } = useSelector(state => state.auth);
  const [tickets, setTickets]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filterStatus, setFilter]   = useState('All');
  const [searchQuery, setSearch]    = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  useEffect(() => {
    (async () => {
      try {
        const all = await getComplaints();
        setTickets(all);
      } catch (err) {
        console.error('Error fetching tickets:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const filtered = tickets.filter(t => {
    const s = filterStatus === 'All' || t.status === filterStatus;
    const q = t.subject.toLowerCase().includes(searchQuery.toLowerCase())
           || t.complaintId.toLowerCase().includes(searchQuery.toLowerCase());
    return s && q;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedTickets = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">My Tickets</h1>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text" placeholder="Search by ID or subject…"
              className="input pl-9 h-10 text-sm"
              value={searchQuery} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input h-10 text-sm w-auto"
            value={filterStatus} onChange={e => setFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option>Open</option>
            <option>In Progress</option>
            <option>Pending</option>
            <option>Resolved</option>
            <option>Closed</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Ticket ID', 'Subject', 'Department', 'Sub Department', 'Date', 'Status', 'View'].map(h => (
                  <th key={h} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider last:text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400">Loading…</td></tr>
              ) : paginatedTickets.length > 0 ? paginatedTickets.map(ticket => (
                <tr key={ticket._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono font-bold text-gov-primary">{ticket.complaintId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900 max-w-[220px] truncate">{ticket.subject}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{ticket.department}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{ticket.subDepartment}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`badge badge-${ticket.status.toLowerCase().replace(' ', '-')}`}>
                        {ticket.status}
                      </span>
                      {ticket.messages?.length > 1 && ticket.messages[ticket.messages.length - 1].sender !== user?._id && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 animate-pulse border border-emerald-200">
                          🚨 Team Replied
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/student/tickets/${ticket._id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-gov-primary hover:text-gov-dark"
                    >
                      <Eye size={14} /> View
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <FileText size={36} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 font-medium">No tickets match your criteria</p>
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

export default MyTickets;
