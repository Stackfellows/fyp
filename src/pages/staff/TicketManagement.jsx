import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getComplaints, updateComplaintStatus } from '../../services/api';
import { Filter, MessageSquare, CheckCircle, Eye } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getSocket, requestActiveViews } from '../../utils/socket';
import Pagination from '../../components/Pagination';

const TicketManagement = () => {
  const { user }    = useSelector(state => state.auth);
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setFilter] = useState('All');
  const [activeViews, setActiveViews] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const setCurrentPage = (newPage) => {
    setSearchParams({ ...Object.fromEntries(searchParams.entries()), page: newPage });
  };
  const itemsPerPage = 10;
  const isFirstMount = useRef(true);

  // Reset to first page when filter changes (preventing infinite loops and mount reset)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const currentPageStr = searchParams.get('page');
    if (currentPageStr !== '1' && currentPageStr !== null) {
      setSearchParams({ ...Object.fromEntries(searchParams.entries()), page: 1 });
    }
  }, [statusFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const all = await getComplaints();
      setTickets(all);
    } catch (err) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchTickets(); 
    
    const handleRefresh = () => fetchTickets();
    window.addEventListener('refresh_data', handleRefresh);
    return () => window.removeEventListener('refresh_data', handleRefresh);
  }, [user]);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      requestActiveViews();

      const handleSync = (views) => {
        setActiveViews(views);
      };

      const handleUpdate = (data) => {
        setActiveViews(prev => {
          const next = { ...prev };
          if (data.viewers.length > 0) {
            next[data.ticketId] = data.viewers;
          } else {
            delete next[data.ticketId];
          }
          return next;
        });
      };

      socket.on('active_views_sync', handleSync);
      socket.on('ticket_viewers_update', handleUpdate);

      return () => {
        socket.off('active_views_sync', handleSync);
        socket.off('ticket_viewers_update', handleUpdate);
      };
    }
  }, []);

  const handleAction = async (id, status) => {
    try {
      await updateComplaintStatus(id, status);
      toast.success(`Ticket marked as ${status}`);
      fetchTickets();
    } catch { toast.error('Action failed'); }
  };

  const filtered = tickets.filter(t => {
    const isSnoozed = t.snoozeUntil && new Date(t.snoozeUntil) > new Date();
    if (statusFilter === 'Snoozed') return isSnoozed;
    if (isSnoozed) return false; // Hide snoozed tickets from all other active views
    return statusFilter === 'All' ? true : t.status === statusFilter;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedTickets = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Ticket Management</h1>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select className="input h-10 text-sm w-auto" value={statusFilter} onChange={e => setFilter(e.target.value)}>
            <option value="All">All Status</option>
            {['Open', 'In Progress', 'Pending', 'Resolved', 'Snoozed'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="card p-12 text-center text-slate-400">Loading…</div>
        ) : paginatedTickets.length > 0 ? paginatedTickets.map(ticket => (
          <div key={ticket._id} className="card p-5 hover:border-gov-mid/40 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-mono font-bold text-gov-primary">{ticket.complaintId}</span>
                  <span className={`badge badge-${ticket.status.toLowerCase().replace(' ', '-')}`}>
                    {ticket.status}
                  </span>

                  {!['Resolved', 'Closed'].includes(ticket.status) && (
                    ticket.messages?.length <= 1 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                        ✨ New
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ticket.messages[ticket.messages.length - 1].sender === ticket.user?._id ? 'bg-rose-100 text-rose-700 animate-pulse border-rose-200' : 'bg-purple-100 text-purple-700 border-purple-200'}`}>
                        {ticket.messages[ticket.messages.length - 1].sender === ticket.user?._id ? '🚨 Reply (Student)' : '💬 Reply'}
                      </span>
                    )
                  )}

                  <span className="text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  
                  {activeViews[ticket._id] && activeViews[ticket._id].filter(v => v._id !== user?._id).length > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      👀 {activeViews[ticket._id].filter(v => v._id !== user?._id).map(v => v.name).join(', ')} viewing
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 truncate">{ticket.subject}</h3>
                <p className="text-sm text-slate-500 truncate mt-0.5">{ticket.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <div className="h-5 w-5 rounded-full bg-gov-light text-gov-primary flex items-center justify-center text-[9px] font-bold">
                      {ticket.user?.name?.charAt(0) || 'U'}
                    </div>
                    {ticket.user?.name} · {ticket.user?.rollNo}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <MessageSquare size={13} /> {ticket.messages?.length || 0} replies
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-end gap-2 border-t md:border-t-0 pt-3 md:pt-0 shrink-0">
                <Link to={`/staff/tickets/${ticket._id}`} className="btn btn-secondary py-1 px-2.5 text-xs">
                  <Eye size={14} /> View
                </Link>
                {ticket.status === 'Open' && (
                  <button
                    onClick={() => handleAction(ticket._id, 'In Progress')}
                    className="btn btn-primary py-1 px-2.5 text-xs"
                  >
                    Accept
                  </button>
                )}
                {ticket.status === 'In Progress' && (
                  <button
                    onClick={() => handleAction(ticket._id, 'Resolved')}
                    className="btn bg-emerald-600 text-white hover:bg-emerald-700 py-1 px-2.5 text-xs"
                  >
                    <CheckCircle size={14} /> Resolve
                  </button>
                )}
              </div>
            </div>
          </div>
        )) : (
          <div className="card p-14 text-center border-dashed bg-slate-50">
            <p className="text-slate-400 font-medium">No tickets for this filter.</p>
          </div>
        )}
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

export default TicketManagement;
