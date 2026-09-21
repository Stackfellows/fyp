import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Settings,
  Users,
  BarChart2,
  LogOut,
  TrendingUp,
  Megaphone,
  CheckCircle,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import FYPLogo from './FYPLogo';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { role } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  const handleLogout = () => dispatch(logout());

  const menuItems = {
    student: [
      { path: '/student/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/student/create-complaint', icon: PlusCircle,       label: 'Lodge Complaint' },
      { path: '/student/tickets',          icon: FileText,          label: 'My Grievances' },
    ],
    staff: [
      { path: '/staff/dashboard', icon: LayoutDashboard, label: 'Faculty / Staff Hub' },
      { path: '/staff/dashboard?tab=resolved', icon: CheckCircle, label: 'Resolved Tickets' },
      { path: '/staff/tickets',   icon: FileText,          label: 'Ticket Queue' },
    ],
    admin: [
      { path: '/admin/dashboard',   icon: LayoutDashboard, label: 'Admin Overview' },
      { path: '/admin/tickets',     icon: FileText,          label: 'All Grievances' },
      { path: '/admin/tickets?tab=resolved', icon: CheckCircle, label: 'Resolved Tickets' },
      { path: '/admin/departments', icon: Settings,          label: 'Academic Depts' },
      { path: '/admin/staff',       icon: Users,             label: 'Staff & Faculty' },
      { path: '/admin/students',    icon: Users,             label: 'Enrolled Students' },
      { path: '/admin/reports',     icon: BarChart2,         label: 'Analytics & Reports' },
      { path: '/admin/announcements', icon: Megaphone,       label: 'Announcements' },
    ],
    manager: [
      { path: '/manager/dashboard', icon: LayoutDashboard, label: 'Manager Hub' },
      { path: '/manager/tickets',   icon: FileText,        label: 'All Complaints' },
      { path: '/manager/tickets?status=Resolved', icon: CheckCircle, label: 'Resolved Tickets' },
      { path: '/manager/team',      icon: Users,           label: 'Staff Performance' },
      { path: '/manager/reports',   icon: TrendingUp,      label: 'Campus Reports' },
    ],
  };

  const currentMenu = menuItems[role] || [];

  const roleLabel = {
    student: 'Student Portal',
    staff:   'Faculty / Staff',
    admin:   'System Administrator',
    manager: 'Operations Manager',
  }[role] || 'Portal';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 w-64 z-50
          flex flex-col
          transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:inset-auto
          border-r border-blue-900/40 shadow-2xl
        `}
        style={{
          background: 'linear-gradient(180deg, #001f3f 0%, #002b49 45%, #091e3a 100%)'
        }}
      >
        {/* ── Logo + Branding ── */}
        <div className="px-5 py-6 border-b border-white/10">
          <FYPLogo size="md" />

          {/* Role pill */}
          <div className="mt-4 px-3 py-1.5 bg-white/10 rounded-xl border border-white/10 flex items-center justify-between">
            <span className="text-amber-300 text-xs font-semibold tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {roleLabel}
            </span>
            <span className="text-[10px] text-indigo-200 uppercase font-mono tracking-wider">FYP</span>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {currentMenu.map((item) => {
            const isItemActive = item.path.includes('?')
              ? location.pathname + location.search === item.path
              : location.pathname === item.path && !location.search;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                   ${isItemActive
                     ? 'bg-white text-[#002147] shadow-lg shadow-black/30 font-bold translate-x-1'
                     : 'text-blue-100/90 hover:bg-white/10 hover:text-white'
                   }`}
              >
                <item.icon size={18} className={isItemActive ? "text-[#002147]" : "text-amber-400/80"} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* ── University Campus Tag & Logout ── */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <div className="px-3 py-2 bg-black/20 rounded-lg text-[11px] text-blue-200/70 text-center">
            University FYP Student Complaint Portal
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold
                       text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all border border-red-500/20"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
