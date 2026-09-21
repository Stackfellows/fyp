import React from 'react';
import { Menu, Bell, Search, GraduationCap } from 'lucide-react';
import { useSelector } from 'react-redux';

const Navbar = ({ toggleSidebar, unreadCount = 0, setUnreadCount }) => {
  const { user } = useSelector(state => state.auth);

  const roleBadge = {
    admin:   'bg-red-50 text-red-700 border-red-200',
    manager: 'bg-purple-50 text-purple-700 border-purple-200',
    staff:   'bg-blue-50 text-blue-700 border-blue-200',
    student: 'bg-amber-50 text-amber-800 border-amber-200',
  }[user?.role] || 'bg-slate-50 text-slate-700 border-slate-200';

  const clearNotifications = () => {
    if (setUnreadCount) setUnreadCount(0);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 flex items-center px-4 lg:px-6 gap-4 shadow-xs">
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="p-2 -ml-1 text-slate-600 hover:bg-slate-100 rounded-xl lg:hidden transition-colors"
      >
        <Menu size={22} />
      </button>

      {/* University Title & Search */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-100">
          <GraduationCap size={16} className="text-indigo-600" />
          <span className="text-xs font-bold text-indigo-900 tracking-wide">
            UNIVERSITY FYP COMPLAINT PORTAL
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 hidden sm:flex items-center gap-2 px-3.5 py-2 bg-slate-100/80 rounded-xl max-w-sm border border-slate-200/60
                      focus-within:border-gov-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-gov-primary/10 transition-all">
        <Search size={16} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search ticket number, topic, or department…"
          className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-slate-700 placeholder-slate-400"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Notification Bell */}
        <button 
          onClick={clearNotifications}
          className="relative p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
          title="Notifications"
        >
          <Bell size={19} />
          {unreadCount > 0 ? (
            <span className="absolute top-1 right-1 min-w-5 h-5 px-1 bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-sm">
              {unreadCount}
            </span>
          ) : (
            <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />
          )}
        </button>

        <div className="h-7 w-px bg-slate-200 hidden sm:block" />

        {/* User Info & Avatar */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate max-w-[160px]">
              {user?.name || 'User'}
            </p>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${roleBadge}`}>
                {user?.role}
              </span>
              {user?.rollNo && (
                <span className="text-[11px] font-mono text-slate-400 font-semibold">
                  {user.rollNo}
                </span>
              )}
            </div>
          </div>
          <div 
            className="h-10 w-10 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-md border-2 border-amber-400/40"
            style={{ background: 'linear-gradient(135deg, #002147 0%, #0c4a7e 100%)' }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
