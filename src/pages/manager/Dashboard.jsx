import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import apiClient from '../../utils/axiosConfig';
import {
  Users, CheckCircle, Clock, AlertCircle, TrendingUp,
  Award, Activity, Inbox, BarChart2, RefreshCw, ChevronRight,
  Star, Zap, Target, Sparkles, Bell, Medal
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

/* ─── Colour palette ─────────────────────────────────── */
const STATUS_COLORS = {
  Open: '#ef4444',
  'In Progress': '#f59e0b',
  Review: '#6366f1',
  Resolved: '#10b981',
  Closed: '#64748b',
};

const PIE_COLORS = ['#ef4444', '#f59e0b', '#6366f1', '#10b981', '#64748b'];

/* ─── Small helpers ───────────────────────────────────── */
const Pill = ({ children, className = '' }) => (
  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${className}`}>
    {children}
  </span>
);

const KpiCard = ({ icon: Icon, label, value, sub, accent, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 ${onClick ? 'cursor-pointer hover:border-emerald-200' : ''}`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg`} style={{ background: accent }}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      <h3 className="text-3xl font-black text-slate-900 mt-0.5">{value}</h3>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ─── Main Component ──────────────────────────────────── */
const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);

  const [stats, setStats] = useState(null);
  const [team, setTeam] = useState([]);
  const [trend, setTrend] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [filter, setFilter] = useState('all');

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, teamRes, trendRes, deptRes] = await Promise.all([
        apiClient.get(`/api/manager/stats?filter=${filter}`),
        apiClient.get(`/api/manager/team-performance?filter=${filter}`),
        apiClient.get(`/api/manager/trend?filter=${filter}`),
        apiClient.get(`/api/manager/department-stats?filter=${filter}`)
      ]);
      setStats(statsRes.data.stats);
      setTeam(teamRes.data.team);
      setTrend(trendRes.data.trend);
      setDeptStats(deptRes.data.departments);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Manager dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Loading skeleton ── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      <p className="text-slate-500 font-medium animate-pulse">Loading manager dashboard…</p>
    </div>
  );

  /* ── KPI cards data ── */
  const kpiCards = stats ? [
    { 
      icon: Inbox, 
      label: 'Total Complaints', 
      value: stats.total, 
      sub: `${stats.newToday} received today`, 
      accent: '#1d4ed8',
      onClick: () => navigate('/manager/tickets')
    },
    { 
      icon: AlertCircle, 
      label: 'Open Tickets', 
      value: stats.open, 
      sub: 'Not processed yet', 
      accent: '#ef4444',
      onClick: () => navigate('/manager/tickets?status=Open')
    },
    { 
      icon: Clock, 
      label: 'In Progress', 
      value: stats.inProgress, 
      sub: 'Team is working', 
      accent: '#f59e0b',
      onClick: () => navigate('/manager/tickets?status=In Progress')
    },
    { 
      icon: CheckCircle, 
      label: 'Resolved Today', 
      value: stats.resolvedToday, 
      sub: `Total resolved: ${stats.resolved}`, 
      accent: '#10b981',
      onClick: () => navigate('/manager/tickets?status=Resolved&time=daily')
    },
    { icon: Users, label: 'Active Staff', value: `${stats.activeStaff}/${stats.totalStaff}`, sub: 'Online team members', accent: '#8b5cf6' },
    { icon: Target, label: 'Efficiency Rate', value: `${stats.efficiencyRate}%`, sub: 'Overall team performance', accent: '#059669' },
  ] : [];

  /* ── Pie data ── */
  const pieData = stats ? [
    { name: 'Open', value: stats.open },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Review', value: stats.underReview },
    { name: 'Resolved', value: stats.resolved },
  ].filter(d => d.value > 0) : [];

  const selectedMember = team.find(m => m._id === selectedStaff);

  /* ── Critical Alerts & Podium Data ── */
  const criticalTickets = team.flatMap(m => m.recentTickets || [])
    .filter(t => t.status === 'Open' || t.status === 'In Progress' || t.priority === 'Urgent')
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  const topPerformers = [...team]
    .filter(m => m.stats?.resolved > 0)
    .sort((a, b) => (b.stats?.resolved || 0) - (a.stats?.resolved || 0))
    .slice(0, 3);

  /* ── Heatmap Data ── */
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const timeBlocks = ['Morning (8-12)', 'Afternoon (12-16)', 'Evening (16-20)', 'Night (20-8)'];
  const heatmapGrid = Array(4).fill(0).map(() => Array(7).fill(0));
  let maxHeat = 0;

  team.forEach(m => {
    (m.recentTickets || []).forEach(t => {
      const d = new Date(t.createdAt);
      const day = d.getDay();
      const hour = d.getHours();
      let block = 3;
      if (hour >= 8 && hour < 12) block = 0;
      else if (hour >= 12 && hour < 16) block = 1;
      else if (hour >= 16 && hour < 20) block = 2;
      
      heatmapGrid[block][day]++;
      if (heatmapGrid[block][day] > maxHeat) maxHeat = heatmapGrid[block][day];
    });
  });

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <BarChart2 className="text-emerald-600" size={26} />
            Manager Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View complete team performance and progress here
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
            <span className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Filter:</span>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-emerald-700 focus:ring-0 cursor-pointer pr-8"
            >
              <option value="all">All Time</option>
              <option value="daily">Last 24 Hours</option>
              <option value="weekly">Last 7 Days</option>
              <option value="monthly">Last Month</option>
              <option value="yearly">Last Year</option>
            </select>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-[10px] text-slate-500 font-bold uppercase tracking-tight">
            Refreshed: {lastRefresh.toLocaleTimeString()}
          </div>
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Critical Alert Center ── */}
      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-red-950 rounded-2xl p-6 text-white shadow-xl shadow-red-900/20 border border-red-500/30 relative overflow-hidden backdrop-blur-md">
        <div className="absolute right-0 top-0 w-64 h-64 bg-red-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/30 text-red-300 flex items-center justify-center border border-red-400/30 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              <Bell size={18} className="animate-bounce" />
            </div>
            <h3 className="font-bold text-sm text-white tracking-wide flex items-center gap-2">
              Critical Alert Center
              <span className="bg-red-500/20 text-red-200 text-[10px] px-2 py-0.5 rounded-full border border-red-500/30 uppercase tracking-widest font-black">
                Requires Attention
              </span>
            </h3>
          </div>
          <span className="text-[10px] text-red-300/70 font-mono tracking-widest uppercase">Live Pulse</span>
        </div>

        {criticalTickets.length === 0 ? (
          <div className="py-4 text-xs text-red-200/70 flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-400" />
            <span>No critical alerts at the moment. All systems nominal.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative z-10">
            {criticalTickets.map((t, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 p-3 rounded-xl hover:bg-white/10 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider">{t.complaintId}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-200 border border-red-500/30">{t.priority || 'Urgent'}</span>
                </div>
                <p className="text-xs text-white/90 font-medium truncate mb-2">{t.subject}</p>
                <div className="flex items-center justify-between text-[10px] text-white/50">
                  <span>Assignee: <span className="text-white/80 font-bold">{t.assignedTo?.name || 'Unassigned'}</span></span>
                  <span>{new Date(t.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((c, i) => <KpiCard key={i} {...c} />)}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 7-day trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2 capitalize">
            <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
            {filter === 'all' ? 'All-Time' : filter} Complaint Trend
          </h3>
          <div className="h-64 flex items-center justify-center">
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.12)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="submitted" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} name="New Complaints" />
                  <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} name="Resolved" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 font-medium text-sm">No trend data available for this period.</p>
            )}
          </div>
        </div>

        {/* Status pie */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
            Status Breakdown
          </h3>
          <div className="h-48 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 font-medium text-sm">No tickets found.</p>
            )}
          </div>
          {pieData.length > 0 && (
            <div className="space-y-2 mt-2">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-slate-600 font-medium">{d.name}</span>
                  </div>
                  <span className="font-black text-slate-800">{d.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Complaint Heatmap (Activity Pulse) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-hidden animate-fade-in">
        <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-rose-500 rounded-full" />
          Complaint Heatmap (Activity Pulse)
        </h3>
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[500px]">
            <div className="grid grid-cols-8 gap-1 mb-1">
              <div className="text-xs text-slate-400 font-medium"></div>
              {days.map(d => <div key={d} className="text-xs text-slate-400 font-medium text-center">{d}</div>)}
            </div>
            {timeBlocks.map((block, i) => (
              <div key={i} className="grid grid-cols-8 gap-2 mb-2 items-center">
                <div className="text-[10px] text-slate-500 font-bold whitespace-nowrap text-right pr-2">{block}</div>
                {heatmapGrid[i].map((val, j) => {
                  const intensity = maxHeat > 0 ? val / maxHeat : 0;
                  const bgOpacity = intensity === 0 ? 0.05 : 0.2 + (intensity * 0.8);
                  return (
                    <div 
                      key={j} 
                      className="h-8 rounded-md transition-all hover:ring-2 hover:ring-emerald-400 cursor-pointer relative group flex items-center justify-center"
                      style={{ 
                        backgroundColor: intensity === 0 ? '#f1f5f9' : `rgba(16, 185, 129, ${bgOpacity})` 
                      }}
                    >
                      {val > 0 && <span className="text-[10px] font-bold text-emerald-900 opacity-0 group-hover:opacity-100 transition-opacity">{val}</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Staff Performance Podium ── */}
      {topPerformers.length > 0 && (
        <div className="bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2 justify-center">
            <Medal size={20} className="text-amber-500" />
            Top Performers Podium
          </h3>
          <div className="flex flex-col sm:flex-row items-end justify-center gap-4 sm:gap-6 h-auto sm:h-48 pt-4">
            
            {/* Silver - 2nd Place */}
            {topPerformers[1] && (
              <div className="flex flex-col items-center w-full sm:w-32 animate-fade-in" style={{ animationDelay: '150ms' }}>
                <div className="w-12 h-12 rounded-full bg-slate-200 border-4 border-slate-300 flex items-center justify-center text-slate-600 font-black shadow-md z-10 relative mb-[-12px]">
                  2
                </div>
                <div className="bg-gradient-to-b from-slate-100 to-slate-200 w-full rounded-t-xl border border-slate-300 border-b-0 p-3 pt-6 flex flex-col items-center h-28 shadow-[inset_0_2px_10px_rgba(255,255,255,0.8)]">
                  <span className="text-xs font-bold text-slate-800 text-center truncate w-full">{topPerformers[1].name}</span>
                  <span className="text-[10px] text-slate-500 font-black mt-1">{topPerformers[1].stats?.resolved} Resolved</span>
                </div>
              </div>
            )}

            {/* Gold - 1st Place */}
            {topPerformers[0] && (
              <div className="flex flex-col items-center w-full sm:w-36 animate-fade-in" style={{ animationDelay: '0ms' }}>
                <div className="w-16 h-16 rounded-full bg-amber-100 border-4 border-amber-400 flex items-center justify-center text-amber-600 font-black shadow-lg z-10 relative mb-[-16px]">
                  <Award size={28} />
                </div>
                <div className="bg-gradient-to-b from-amber-50 to-amber-100 w-full rounded-t-xl border border-amber-200 border-b-0 p-3 pt-8 flex flex-col items-center h-36 shadow-[inset_0_2px_15px_rgba(255,255,255,1)]">
                  <span className="text-sm font-black text-amber-900 text-center truncate w-full">{topPerformers[0].name}</span>
                  <span className="text-xs text-amber-700 font-black mt-1">{topPerformers[0].stats?.resolved} Resolved</span>
                </div>
              </div>
            )}

            {/* Bronze - 3rd Place */}
            {topPerformers[2] && (
              <div className="flex flex-col items-center w-full sm:w-32 animate-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="w-12 h-12 rounded-full bg-orange-100 border-4 border-orange-300 flex items-center justify-center text-orange-700 font-black shadow-md z-10 relative mb-[-12px]">
                  3
                </div>
                <div className="bg-gradient-to-b from-orange-50 to-orange-100 w-full rounded-t-xl border border-orange-200 border-b-0 p-3 pt-6 flex flex-col items-center h-24 shadow-[inset_0_2px_10px_rgba(255,255,255,0.8)]">
                  <span className="text-xs font-bold text-orange-900 text-center truncate w-full">{topPerformers[2].name}</span>
                  <span className="text-[10px] text-orange-700 font-black mt-1">{topPerformers[2].stats?.resolved} Resolved</span>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Team Performance Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users size={18} className="text-emerald-600" />
            Team Performance — Progress of Each Member
          </h3>
          <Pill className="bg-emerald-50 text-emerald-700">{team.length} Staff Members</Pill>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Staff Member', 'Department', 'Assigned', 'In Progress', 'Resolved', 'Efficiency', 'Status', 'Detail'].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {team.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-400 italic">No staff members found</td></tr>
              ) : team.map((member, idx) => (
                <tr key={member._id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {/* Rank badge */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow-sm ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-slate-200'
                        }`}>
                        {idx === 0 ? <Star size={13} /> : idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{member.name}</p>
                        <p className="text-[10px] text-slate-400">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <Pill className="bg-blue-50 text-blue-700 w-fit">{member.department || '—'}</Pill>
                      {member.assignedSubDepartments && member.assignedSubDepartments.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {member.assignedSubDepartments.map((sub, i) => (
                            <span key={i} className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-black text-slate-800">{member.stats.assigned || 0}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-amber-600">{member.stats['In Progress'] || 0}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-emerald-600">{member.stats.resolved || 0}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-20">
                        <div
                          className={`h-full rounded-full transition-all ${member.stats.efficiency >= 70 ? 'bg-emerald-500' :
                              member.stats.efficiency >= 40 ? 'bg-amber-400' : 'bg-red-400'
                            }`}
                          style={{ width: `${member.stats.efficiency}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-slate-700 w-8">{member.stats.efficiency}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Pill className={member.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}>
                      {member.status}
                    </Pill>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelectedStaff(selectedStaff === member._id ? null : member._id)}
                      className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
                    >
                      Detail <ChevronRight size={13} className={`transition-transform ${selectedStaff === member._id ? 'rotate-90' : ''}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Expanded staff detail ── */}
        {selectedMember && (
          <div className="border-t border-slate-200 bg-slate-50 p-6 animate-fade-in">
            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Zap size={15} className="text-amber-500" />
              {selectedMember.name} — Recent Tickets
            </h4>
            {!selectedMember.recentTickets || selectedMember.recentTickets.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No recent tickets found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200">
                      {['Sr. No', 'Ticket ID', 'Subject', 'Status', 'Priority', 'Updated'].map(h => (
                        <th key={h} className="pb-2 pr-4 font-bold uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedMember.recentTickets || []).map((t, index) => (
                      <tr key={t._id} className="hover:bg-white transition-colors">
                        <td className="py-2 pr-4 font-bold text-slate-500">{index + 1}</td>
                        <td className="py-2 pr-4 font-mono font-bold text-slate-700">{t.complaintId}</td>
                        <td className="py-2 pr-4 text-slate-600 max-w-[220px] truncate">{t.subject}</td>
                        <td className="py-2 pr-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{
                            background: STATUS_COLORS[t.status] + '20',
                            color: STATUS_COLORS[t.status]
                          }}>{t.status}</span>
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`font-bold ${t.priority === 'Urgent' ? 'text-red-600' :
                              t.priority === 'High' ? 'text-orange-500' :
                                t.priority === 'Medium' ? 'text-amber-500' : 'text-slate-400'
                            }`}>{t.priority}</span>
                        </td>
                        <td className="py-2 text-slate-400">
                          {new Date(t.updatedAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Mini bar chart */}
            <div className="mt-5 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { label: 'Assigned', v: selectedMember.stats?.assigned || 0 },
                  { label: 'Open', v: selectedMember.stats?.['Open'] || 0 },
                  { label: 'In Prog', v: selectedMember.stats?.['In Progress'] || 0 },
                  { label: 'Review', v: selectedMember.stats?.['Review'] || 0 },
                  { label: 'Resolved', v: selectedMember.stats?.resolved || 0 },
                ]} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="v" radius={[5, 5, 0, 0]}>
                    {[0, 1, 2, 3, 4].map(i => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ── Department Stats ── */}
      {deptStats.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity size={18} className="text-indigo-600" />
              Department-wise Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Department', 'Staff', 'Total Complaints', 'Open', 'Resolved', 'Efficiency'].map(h => (
                    <th key={h} className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deptStats.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-800">{d.department}</td>
                    <td className="px-5 py-3 text-slate-600">{d.staff}</td>
                    <td className="px-5 py-3 font-black text-slate-900">{d.total}</td>
                    <td className="px-5 py-3 font-bold text-red-500">{d.open}</td>
                    <td className="px-5 py-3 font-bold text-emerald-600">{d.resolved}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-20">
                          <div
                            className={`h-full rounded-full ${d.efficiency >= 70 ? 'bg-emerald-500' : d.efficiency >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${d.efficiency}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-slate-700 w-8">{d.efficiency}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManagerDashboard;
