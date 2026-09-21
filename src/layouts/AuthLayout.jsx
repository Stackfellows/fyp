import { Outlet } from 'react-router-dom';
import FYPLogo from '../components/FYPLogo';

const AuthLayout = () => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundColor: '#0f172a',
        backgroundImage: `
          radial-gradient(at 10% 10%, rgba(79, 70, 229, 0.3) 0px, transparent 50%),
          radial-gradient(at 90% 90%, rgba(6, 182, 212, 0.2) 0px, transparent 50%),
          radial-gradient(at 50% 50%, rgba(15, 23, 42, 0.95) 0px, transparent 100%)
        `
      }}
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md my-8">
        {/* University Header Brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl mb-3">
            <FYPLogo size="lg" showText={false} />
          </div>
          <h1 className="text-white text-2xl font-black tracking-tight text-center drop-shadow-md">
            FYP COMPLAINT PORTAL
          </h1>
          <p className="text-indigo-300 text-sm font-semibold tracking-wide text-center mt-0.5">
            University Final Year Project Grievance Cell
          </p>
          <p className="text-slate-300/80 text-xs text-center mt-1">
            Official Academic & Student Support System
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
          <div className="h-2 w-full bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400" />
          <div className="p-7 sm:p-8">
            <Outlet />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-400 text-xs mt-6 space-y-1">
          <p>© {new Date().getFullYear()} University FYP Portal. All rights reserved.</p>
          <p className="text-[11px] text-slate-500">Academic Grievance Resolution & Tracking System</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
