import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Download, Calendar } from 'lucide-react';
import { getManagerReports } from '../../services/api';

const Reports = () => {
  const [reportData, setReportData] = useState({ trends: [], metrics: {} });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('weekly');

  const fetchReports = async (activeFilter) => {
    setLoading(true);
    try {
      const data = await getManagerReports(activeFilter);
      setReportData(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(filter);
  }, [filter]);

  const handleExportPrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData.trends || reportData.trends.length === 0) return;

    // Create CSV headers
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date/Period,Total Tickets,Resolved Tickets\n";

    // Add rows
    reportData.trends.forEach(row => {
      csvContent += `"${row.date}",${row.tickets},${row.resolved}\n`;
    });

    // Add Metrics summary at the bottom
    csvContent += "\nMetrics Summary\n";
    csvContent += `Efficiency Rate,${reportData.metrics.efficiency || 'N/A'}\n`;
    csvContent += `Avg. First Response,${reportData.metrics.avgResponse || 'N/A'}\n`;
    csvContent += `Satisfaction Score,${reportData.metrics.satisfaction || 'N/A'}\n`;

    // Trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Complaint_Report_${filter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const trendData = reportData.trends;
  const metrics = [
    { label: 'Efficiency Rate',     value: reportData.metrics.efficiency || '...',  delta: '↑ 5.2%', up: true,  border: 'border-l-gov-primary' },
    { label: 'Avg. First Response', value: reportData.metrics.avgResponse || '...', delta: '↓ 0.8 Hrs', up: false, border: 'border-l-amber-500' },
    { label: 'Satisfaction Score',  value: reportData.metrics.satisfaction || '...', delta: 'Steady',   up: true,  border: 'border-l-emerald-500' },
  ];

  return (
  <div className="space-y-6 animate-fade-in print:p-0">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
        <p className="text-slate-500 text-sm mt-1 capitalize">{filter} performance overview</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {['daily', 'weekly', 'monthly', 'yearly'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                filter === f ? 'bg-white text-gov-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button 
          onClick={handleExportCSV}
          className="btn bg-slate-800 text-white hover:bg-slate-900 text-sm shadow-md"
        >
          <Download size={15} /> Export CSV
        </button>
        <button 
          onClick={handleExportPrint}
          className="btn btn-primary text-sm shadow-lg shadow-gov-primary/20"
        >
          <Download size={15} /> Print/PDF
        </button>
      </div>
    </div>

    {/* Print Only Header */}
    <div className="hidden print:block border-b-2 border-gov-primary pb-6 mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">University FYP Student Complaint Portal</h1>
        <h2 className="text-xl text-slate-600 mt-2">Analytical Performance Report - {filter.toUpperCase()}</h2>
        <p className="text-slate-400 mt-1">Generated on: {new Date().toLocaleString()}</p>
    </div>

    {/* Area Chart */}
    <div className="card p-6 print:shadow-none print:border-slate-200">
      <h3 className="text-base font-bold text-slate-900 mb-6">Ticket Volume vs Resolution Trends</h3>
      <div className="h-80 w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400 italic">Updating analytics...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="gTickets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#065f46" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#065f46" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="tickets"  name="Total Tickets" stroke="#065f46" strokeWidth={2.5} fill="url(#gTickets)" />
              <Area type="monotone" dataKey="resolved" name="Resolved"       stroke="#10b981" strokeWidth={2.5} fill="url(#gResolved)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 justify-center">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gov-primary" /><span className="text-xs text-slate-500">Total Tickets</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gov-accent" /><span className="text-xs text-slate-500">Resolved</span></div>
      </div>
    </div>

    {/* KPI Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {metrics.map((m, i) => (
        <div key={i} className={`card p-6 border-l-4 ${m.border} print:shadow-none print:border print:border-slate-200`}>
          <p className="text-sm text-slate-500 font-medium">{m.label}</p>
          <h4 className="text-3xl font-bold text-slate-900 mt-1">{m.value}</h4>
          <p className={`text-xs font-bold mt-2 ${m.up ? 'text-gov-mid' : 'text-red-500'}`}>
            {m.delta} from last {filter === 'daily' ? '24h' : filter}
          </p>
        </div>
      ))}
    </div>

    {/* Print Footer */}
    <div className="hidden print:block mt-12 pt-8 border-t border-slate-100 text-center text-slate-400 text-xs">
        <p>This is a computer generated report for official use only.</p>
        <p className="mt-1">© {new Date().getFullYear()} University FYP Portal</p>
    </div>
  </div>
  );
};

export default Reports;
