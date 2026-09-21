import React, { useEffect, useState } from 'react';
import { getAdminStats, getComplaints } from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { FileText, CheckCircle, Clock, TrendingUp, RefreshCw } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats]       = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData]   = useState([]);
  const [filter, setFilter]     = useState('all');
  const [loading, setLoading]   = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, tickets] = await Promise.all([getAdminStats(filter), getComplaints()]);
      
      setStats({
        total:      statsData.complaints.total,
        open:       statsData.complaints.open,
        inProgress: statsData.complaints.inProgress,
        resolved:   statsData.complaints.resolved,
      });

      // Filter tickets for chart if filter is not 'all'
      let filteredTickets = tickets;
      if (filter !== 'all') {
        const now = new Date();
        let startDate = new Date();
        if (filter === 'daily') startDate.setHours(now.getHours() - 24);
        else if (filter === 'weekly') startDate.setDate(now.getDate() - 7);
        else if (filter === 'monthly') startDate.setMonth(now.getMonth() - 1);
        else if (filter === 'yearly') startDate.setFullYear(now.getFullYear() - 1);
        filteredTickets = tickets.filter(t => new Date(t.createdAt) >= startDate);
      }

      const catCounts = filteredTickets.reduce((acc, t) => {
        const key = t.subDepartment || t.department || 'Uncategorized';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      setChartData(Object.entries(catCounts).map(([name, value]) => ({ name, value })));

      setPieData([
        { name: 'Open',        value: statsData.complaints.open,       color: '#ef4444' },
        { name: 'In Progress', value: statsData.complaints.inProgress, color: '#f59e0b' },
        { name: 'Resolved',    value: statsData.complaints.resolved,    color: '#10b981' },
        { name: 'Total',       value: statsData.complaints.total,       color: '#64748b' },
      ]);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const statCards = [
    { label: 'Total Tickets',  value: stats.total,      icon: FileText,    color: 'text-gov-primary', bg: 'bg-green-50',  border: 'border-l-gov-primary' },
    { label: 'Pending / Open', value: stats.open,       icon: Clock,       color: 'text-red-600',     bg: 'bg-red-50',    border: 'border-l-red-500' },
    { label: 'Resolved',       value: stats.resolved,   icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50',border: 'border-l-emerald-500' },
    { label: 'Avg Resolution', value: stats.total > 0 ? 'Processing...' : 'N/A', icon: TrendingUp,  color: 'text-purple-600',  bg: 'bg-purple-50', border: 'border-l-purple-500' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Command Centre</h1>
          <p className="text-slate-500 text-sm mt-1">System-wide performance overview</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
            <span className="text-xs font-bold text-slate-400 ml-2 uppercase tracking-widest">Filter:</span>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-gov-primary focus:ring-0 cursor-pointer pr-8"
            >
              <option value="all">All Time</option>
              <option value="daily">Last 24 Hours</option>
              <option value="weekly">Last 7 Days</option>
              <option value="monthly">Last Month</option>
              <option value="yearly">Last Year</option>
            </select>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-1.5 bg-gov-primary text-white rounded-lg text-xs font-bold hover:bg-gov-dark transition shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <div key={i} className={`card p-5 flex items-center gap-4 border-l-4 ${card.border}`}>
            <div className={`${card.bg} p-3 rounded-xl ${card.color} shrink-0`}>
              <card.icon size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{card.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Bar Chart – 3/5 */}
        <div className="card p-6 lg:col-span-3">
          <h3 className="text-base font-bold text-slate-900 mb-6">Tickets by Sub Department</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={chartData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f0fdf4' }}
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="#065f46" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart – 2/5 */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-base font-bold text-slate-900 mb-6">Status Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-600 truncate">{item.name}: <strong>{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
