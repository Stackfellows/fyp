import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getComplaints } from '../../services/api';
import apiClient from '../../utils/axiosConfig';
import { Inbox, AlertCircle, CheckCircle, Clock, Star, RefreshCw, Trophy, Medal, Award } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Pagination from '../../components/Pagination';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';

const StaffDashboard = () => {
  const { user } = useSelector(state => state.auth);
  const [stats, setStats] = useState({ total: 0, pending: 0, review: 0, inProgress: 0, resolved: 0, rating: 0, urgent: 0 });
  const [assignedTickets, setAssignedTickets] = useState([]);
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'active';
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const setActiveTab = (newTab) => {
    setSearchParams({ tab: newTab, page: 1 });
  };
  const setCurrentPage = (newPage) => {
    setSearchParams({ tab: activeTab, page: newPage });
  };
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const itemsPerPage = 10;
  const isFirstMount = useRef(true);

  // Reset page when filter or refreshTrigger changes
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (searchParams.get('page') !== '1' && searchParams.get('page') !== null) {
      setSearchParams({ tab: activeTab, page: 1 });
    }
  }, [filter, refreshTrigger]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const tickets = await getComplaints(filter);
        setStats({
          total: tickets.length,
          pending: tickets.filter(t => t.status === 'Open').length,
          review: tickets.filter(t => t.status === 'Review').length,
          inProgress: tickets.filter(t => t.status === 'In Progress').length,
          resolved: tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length,
          urgent: tickets.filter(t => t.priority === 'Urgent' && t.status !== 'Resolved').length,
          rating: tickets.filter(t => t.rating).length > 0 
            ? (tickets.filter(t => t.rating).reduce((acc, t) => acc + t.rating, 0) / tickets.filter(t => t.rating).length).toFixed(1)
            : 'N/A'
        });
        setAssignedTickets(tickets);

        // Try to fetch team performance to determine rank
        try {
          const teamRes = await apiClient.get(`/api/manager/team-performance?filter=${filter}`);
          if (teamRes.data && teamRes.data.team) {
            const topPerformers = [...teamRes.data.team]
              .filter(m => m.stats?.resolved > 0)
              .sort((a, b) => (b.stats?.resolved || 0) - (a.stats?.resolved || 0));
            
            const myIndex = topPerformers.findIndex(m => m._id === user._id);
            if (myIndex >= 0 && myIndex < 3) {
              setRank(myIndex + 1);
            } else {
              setRank(null);
            }
          }
        } catch (e) {
          // If 403 or error, just ignore silently as user might not have manager role
          console.warn('Could not fetch rank data');
        }
        
      } catch (err) {
        console.error('Error fetching staff stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user, filter, refreshTrigger]);

  const cards = [
    { label: 'Total Assigned', value: stats.total, icon: Inbox, bg: 'bg-gov-primary', color: 'text-white' },
    { label: 'Urgent Tickets', value: stats.urgent, icon: AlertCircle, bg: 'bg-red-600', color: 'text-white' },
    { label: 'New / Open', value: stats.pending, icon: AlertCircle, bg: 'bg-red-400', color: 'text-white' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, bg: 'bg-amber-500', color: 'text-white' },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircle, bg: 'bg-emerald-500', color: 'text-white' },
    { 
      label: 'Avg. Rating', 
      value: stats.rating === 'N/A' ? '—' : `${stats.rating}/5`, 
      icon: Star, 
      bg: 'bg-indigo-600', 
      color: 'text-white' 
    },
  ];

  const filteredTickets = assignedTickets.filter(t => {
    const isResolved = ['Resolved', 'Closed'].includes(t.status);
    return activeTab === 'resolved' ? isResolved : !isResolved;
  });

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Staff Impact Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-gov-light text-gov-primary rounded text-xs font-bold border border-gov-mid/20 uppercase tracking-tighter">
              {user?.department || 'General'}
            </span>
            <span className="text-slate-400 text-xs font-medium italic">Empowering student success through efficient support</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
            <span className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Analytics Scope:</span>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-gov-primary focus:ring-0 cursor-pointer pr-8"
            >
              <option value="all">All Time History</option>
              <option value="daily">Today's Activity</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
            </select>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Online</p>
              <p className="text-xs font-black text-slate-700">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gov-primary text-white rounded-lg text-xs font-bold hover:bg-gov-dark transition shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {rank && (
        <div className={`relative overflow-hidden rounded-2xl p-6 shadow-xl border animate-fade-in ${
          rank === 1 ? 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300 shadow-amber-500/20' :
          rank === 2 ? 'bg-gradient-to-r from-slate-50 to-slate-200 border-slate-300 shadow-slate-500/20' :
          'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300 shadow-orange-500/20'
        }`}>
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/40 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-6 relative z-10">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 ${
              rank === 1 ? 'bg-amber-100 border-amber-400 text-amber-600' :
              rank === 2 ? 'bg-slate-100 border-slate-400 text-slate-600' :
              'bg-orange-100 border-orange-400 text-orange-600'
            }`}>
              {rank === 1 ? <Trophy size={32} /> : rank === 2 ? <Medal size={32} /> : <Award size={32} />}
            </div>
            <div>
              <h2 className={`text-2xl font-black mb-1 ${
                rank === 1 ? 'text-amber-900' : rank === 2 ? 'text-slate-800' : 'text-orange-900'
              }`}>
                Congratulations, {user?.name}! 🎉
              </h2>
              <p className={`text-sm font-medium ${
                rank === 1 ? 'text-amber-700' : rank === 2 ? 'text-slate-600' : 'text-orange-700'
              }`}>
                You are currently ranked <strong>#{rank}</strong> out of all staff members in resolving tickets. Keep up the amazing work!
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'resolved' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
            {cards.map((card, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 group hover:shadow-xl hover:border-gov-mid transition-all cursor-default">
                <div className={`${card.bg} w-10 h-10 rounded-xl ${card.color} flex items-center justify-center shadow-lg shrink-0 group-hover:scale-110 transition-transform`}>
                  <card.icon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{card.label}</p>
                  <h3 className="text-2xl font-black text-slate-900">{card.value}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Graphs Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-2 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-gov-primary rounded-full"></div>
                Load Distribution
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Open', value: stats.pending },
                    { name: 'Review', value: stats.review },
                    { name: 'Active', value: stats.inProgress },
                    { name: 'Resolved', value: stats.resolved }
                  ]} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      <Cell fill="#ef4444" />
                      <Cell fill="#6366f1" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#10b981" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                Ticket Status Share
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'New', value: stats.pending },
                        { name: 'Review', value: stats.review },
                        { name: 'Active', value: stats.inProgress },
                        { name: 'Done', value: stats.resolved }
                      ]}
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#ef4444" />
                      <Cell fill="#6366f1" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {[
                  { label: 'Open', color: 'bg-red-500', val: stats.pending },
                  { label: 'Under Review', color: 'bg-indigo-500', val: stats.review },
                  { label: 'In Progress', color: 'bg-amber-500', val: stats.inProgress },
                  { label: 'Resolved', color: 'bg-emerald-500', val: stats.resolved }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                      <span className="text-slate-500 font-medium">{item.label}</span>
                    </div>
                    <span className="font-bold text-slate-700">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Action Queue</h2>
            <p className="text-xs text-slate-500 mt-0.5 italic">Tickets prioritized by urgency and submission date</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/staff/tickets" className="flex items-center gap-2 px-4 py-2 bg-gov-primary text-white rounded-xl text-xs font-bold hover:bg-gov-dark transition shadow-lg shadow-gov-mid/20">
              View All Tickets →
            </Link>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeTab === 'active'
                ? 'bg-white text-gov-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Active ({assignedTickets.filter(t => !['Resolved', 'Closed'].includes(t.status)).length})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeTab === 'resolved'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Resolved ({assignedTickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length})
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Reference</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400 italic">Syncing assignments...</td></tr>
              ) : filteredTickets.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-medium italic">{activeTab === 'resolved' ? 'No resolved tickets found.' : 'Great job! No pending or active tickets in your queue.'}</td></tr>
              ) : paginatedTickets.map((ticket) => (
                <tr key={ticket._id} className={`hover:bg-slate-50 transition-colors group ${ticket.priority === 'Urgent' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-900 font-mono group-hover:text-gov-primary transition-colors">{ticket.complaintId}</p>
                    <p className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">{ticket.subject}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                      ticket.priority === 'Urgent' ? 'bg-red-600 text-white animate-pulse' :
                      ticket.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                      ticket.priority === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-700">{ticket.user?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-slate-400">ID: {ticket.user?.rollNo || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
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
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/staff/tickets/${ticket._id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-700 hover:bg-gov-primary hover:text-white hover:border-gov-primary transition-all shadow-sm"
                    >
                      Process →
                    </Link>
                  </td>
                </tr>
              ))}
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

export default StaffDashboard;
