import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import AnnouncementBanner from '../components/AnnouncementBanner';
import { useSelector } from 'react-redux';
import { initSocket } from '../utils/socket';
import { toast } from 'react-hot-toast';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const { isAuthenticated, user } = useSelector(state => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Request OS Notification permission on load (works on Desktop)
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
      
      // Workaround for Mobile Browsers: Request on first tap/interaction
      const requestOnTouch = () => {
        Notification.requestPermission();
        document.removeEventListener('touchstart', requestOnTouch);
        document.removeEventListener('click', requestOnTouch);
      };
      document.addEventListener('touchstart', requestOnTouch, { once: true });
      document.addEventListener('click', requestOnTouch, { once: true });
    }

    if (isAuthenticated && user) {
      const socket = initSocket(user._id);

      const handleNotify = (data) => {
        console.log("🔔 Socket Notification Received:", data);

        // Filter out notifications not meant for this staff member
        if (data.data && data.data.department) {
            // If it's for a specific department, only show if user is admin, manager, or in that department
            if (user.role === 'staff' && user.department !== data.data.department) {
                console.log("🚫 Notification ignored (department mismatch)");
                return; // Ignore notification
            }
        }

        setUnreadCount(prev => prev + 1);
        window.dispatchEvent(new CustomEvent('refresh_data'));
        
        toast.custom((t) => (
            <div
                className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-sm w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 overflow-hidden border-l-4 border-[#002147]`}
            >
                <div className="flex-1 w-0 p-3">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 pt-0.5">
                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-[#002147] text-lg shadow-sm border border-blue-200">
                                🏛️
                            </div>
                        </div>
                        <div className="ml-3 flex-1">
                            <p className="text-sm font-bold text-slate-900">
                                FYP Complaint Portal
                            </p>
                            <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                                {data.message || 'You have received a new notification.'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex border-l border-slate-100">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        ), { duration: 6000, position: 'top-right' });

        // Show OS Desktop Notification
        try {
            if ('Notification' in window && Notification.permission === 'granted') {
                const notif = new Notification('FYP Complaint Portal', {
                    body: data.message || 'You have received a new notification.',
                    icon: '/vite.svg',
                    requireInteraction: true // Keeps notification on screen until clicked
                });
                notif.onclick = () => { window.focus(); };
                console.log("✅ Desktop Notification triggered");
            } else {
                console.log("⚠️ Desktop Notification skipped (Permission:", Notification.permission, ")");
            }
        } catch(err) {
            console.error("❌ Notification Error:", err);
        }
        
        // Ensure bell plays
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            // Volume up
            audio.volume = 1.0;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log("✅ Audio played successfully");
                }).catch(e => {
                    console.error('❌ Audio blocked by browser auto-play policy:', e);
                });
            }
        } catch(err) {
            console.error("❌ Audio Error:", err);
        }
      };

      socket.on('notification', handleNotify);
      socket.on('staff_notification', handleNotify);

      return () => {
        socket.off('notification', handleNotify);
        socket.off('staff_notification', handleNotify);
      };
    }
  }, [isAuthenticated, user]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AnnouncementBanner />
        <Navbar toggleSidebar={toggleSidebar} unreadCount={unreadCount} setUnreadCount={setUnreadCount} />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
