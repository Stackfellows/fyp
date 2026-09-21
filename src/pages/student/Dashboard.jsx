import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getComplaints } from '../../services/api';
import { FileText, Clock, CheckCircle, Plus, HelpCircle, ShieldCheck, AlertCircle, MessageSquare, Phone, Mail, Globe, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import Pagination from '../../components/Pagination';

const StudentDashboard = () => {
  const { user } = useSelector(state => state.auth);
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0 });
  const [recentTickets, setRecentTickets] = useState([]);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, refreshTrigger]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const tickets = await getComplaints(filter);
        setStats({
          total: tickets.length,
          active: tickets.filter(t => ['Open', 'In Progress', 'Pending'].includes(t.status)).length,
          resolved: tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length,
        });
        setRecentTickets(tickets);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user, filter, refreshTrigger]);

  const cards = [
    { label: 'Total Complaints', value: stats.total, icon: FileText, bg: 'bg-[#002147]', shadow: 'shadow-blue-900/30' },
    { label: 'Active Tickets', value: stats.active, icon: Clock, bg: 'bg-amber-500', shadow: 'shadow-amber-200' },
    { label: 'Resolved Tickets', value: stats.resolved, icon: CheckCircle, bg: 'bg-[#0c4a7e]', shadow: 'shadow-blue-200' },
  ];

  const totalPages = Math.ceil(recentTickets.length / itemsPerPage);
  const paginatedTickets = recentTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name} 👋</h1>
          <p className="text-slate-500 text-sm mt-1">Track and manage your academic grievances</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
            <span className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">Filter:</span>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-gov-primary focus:ring-0 cursor-pointer pr-8"
            >
              <option value="all">All Time</option>
              <option value="daily">Last 24 Hours</option>
              <option value="weekly">Last 7 Days</option>
              <option value="monthly">Last Month</option>
              <option value="yearly">Last Year</option>
            </select>
          </div>
          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <Link to="/student/create-complaint" className="btn btn-primary shrink-0 text-sm">
            <Plus size={16} /> Create Complaint
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {cards.map((card, i) => (
          <div key={i} className="card p-5 flex items-center gap-4">
            <div className={`${card.bg} p-3 rounded-xl text-white shadow-lg ${card.shadow} shrink-0`}>
              <card.icon size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{card.label}</p>
              <h3 className="text-3xl font-bold text-slate-900">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Tickets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Complaints</h2>
          <Link to="/student/tickets" className="text-sm text-gov-primary hover:underline font-semibold">
            View All →
          </Link>
        </div>

        <div className="card divide-y divide-slate-100">
          {paginatedTickets.length > 0 ? paginatedTickets.map((ticket) => (
            <Link
              key={ticket._id}
              to={`/student/tickets/${ticket._id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50 transition-colors group gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">{ticket.complaintId}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{ticket.department}</span>
                </div>
                <span className="font-bold text-slate-900 block truncate group-hover:text-gov-primary transition-colors text-sm">
                  {ticket.subject}
                </span>

                {/* Visual Status Timeline */}
                <div className="mt-3 flex items-center gap-1 w-full max-w-[200px]">
                  {[
                    { label: 'Open', color: 'bg-emerald-500' },
                    { label: 'In Progress', color: 'bg-amber-500' },
                    { label: 'Resolved', color: 'bg-indigo-500' }
                  ].map((step, idx) => {
                    const statusOrder = { 'Open': 0, 'Review': 1, 'In Progress': 2, 'Resolved': 3, 'Closed': 3 };
                    const currentOrder = statusOrder[ticket.status] || 0;
                    const isActive = idx <= currentOrder;
                    return (
                      <React.Fragment key={idx}>
                        <div className={`h-1.5 rounded-full flex-1 ${isActive ? step.color : 'bg-slate-200'}`} />
                        {idx < 2 && <div className={`w-1 h-1 rounded-full ${isActive && idx < currentOrder ? 'bg-slate-400' : 'bg-slate-200'}`} />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`badge badge-${ticket.status.toLowerCase().replace(' ', '-')} px-3 py-1 text-[10px] font-black uppercase tracking-tighter`}>
                  {ticket.status}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  Updated {new Date(ticket.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          )) : (
            <div className="p-10 text-center">
              <FileText size={36} className="mx-auto text-slate-200 mb-3" />
              <p className="text-slate-400 font-medium">No complaints yet</p>
              <Link to="/student/create-complaint" className="text-gov-primary text-sm font-semibold hover:underline mt-1 inline-block">
                Submit your first complaint →
              </Link>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Guidelines Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle size={20} className="text-gov-primary" />
            Portal Usage Guidelines (پورٹل استعمال کرنے کی ہدایات)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5 bg-gradient-to-br from-white to-slate-50 border-l-4 border-gov-primary">
              <div className="w-10 h-10 rounded-full bg-gov-light text-gov-primary flex items-center justify-center mb-4">
                <Plus size={20} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">How to Report? (شکایت کیسے درج کریں؟)</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Click on "Create Complaint", select your department, and explain your issue clearly. (شکایت درج کرنے کے لیے "Create Complaint" پر کلک کریں اور اپنا مسئلہ واضح بیان کریں۔)
              </p>
            </div>
            <div className="card p-5 bg-gradient-to-br from-white to-slate-50 border-l-4 border-emerald-500">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <ShieldCheck size={20} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Valid Complaints (درست شکایات)</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Only submit complaints related to academic, LMS, or technical issues. (صرف تعلیمی، LMS، یا تکنیکی مسائل سے متعلق شکایات ہی پورٹل پر درج کریں۔)
              </p>
            </div>
            <div className="card p-5 bg-gradient-to-br from-white to-slate-50 border-l-4 border-amber-500">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <AlertCircle size={20} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Attachment Policy (فائل منسلک کرنے کی پالیسی)</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Always attach relevant screenshots or documents to help staff understand. (مسئلے کو بہتر سمجھنے کے لیے متعلقہ تصاویر یا فائلز لازمی منسلک کریں۔)
              </p>
            </div>
            <div className="card p-5 bg-gradient-to-br from-white to-slate-50 border-l-4 border-indigo-500">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <MessageSquare size={20} />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Communication (رابطہ اور جواب)</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Respond promptly to staff messages to avoid ticket closure. (عملے کے پیغامات کا بروقت جواب دیں تاکہ آپ کی شکایت پر کام جاری رہ سکے۔)
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-[#002147] text-white flex flex-col justify-between overflow-hidden relative shadow-lg">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-400/20 text-amber-300 rounded-lg text-xs font-bold mb-3 border border-amber-400/30">
              <span>🎓 FYP Committee Helpdesk</span>
            </div>
            <h3 className="text-xl font-bold text-white">Need Assistance? (مدد درکار ہے؟)</h3>
            <p className="text-blue-100/80 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Facing FYP supervisor, lab hardware, or evaluation difficulties? Contact the FYP Student Support Cell.
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Mail size={18} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] text-blue-200/70 font-bold uppercase tracking-widest">Email Support</p>
                  <p className="text-xs font-bold text-white">support@fyp.edu.pk</p>
                </div>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Phone size={18} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] text-blue-200/70 font-bold uppercase tracking-widest">Helpdesk Hotline</p>
                  <p className="text-xs font-bold text-white">+92 (042) 111-FYP-HELP</p>
                </div>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Globe size={18} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] text-blue-200/70 font-bold uppercase tracking-widest">Official Portal</p>
                  <p className="text-xs font-bold text-white">fyp-portal.edu.pk</p>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative element */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
