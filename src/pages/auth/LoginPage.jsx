import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { studentLogin } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Lock, Loader2, Mail, Hash, UserCircle, ArrowRight, Sparkles } from 'lucide-react';

const LoginPage = () => {
  const [studentName, setStudentName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [rollNo, setRollNo]     = useState('');
  
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { loading } = useSelector(state => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    try {
      const data = await studentLogin({ name: studentName, email, password, rollNo });

      dispatch(loginSuccess(data));
      toast.success('Welcome to FYP Complaint Portal!');
      
      const userRole = data.user?.role || 'student';
      if (userRole === 'admin')        navigate('/admin/dashboard');
      else if (userRole === 'staff')   navigate('/staff/dashboard');
      else if (userRole === 'manager') navigate('/manager/dashboard');
      else                             navigate('/student/dashboard');
    } catch (err) {
      dispatch(loginFailure(err.message));
      toast.error(err.response?.data?.message || err.message || 'Invalid credentials');
    }
  };

  const autofillStudent = () => {
    setEmail('student@fyp.edu.pk');
    setPassword('student123');
    setStudentName('Ali Raza');
    setRollNo('FYP-BSCS-001');
  };

  const autofillAdmin = () => {
    setEmail('admin@fyp.edu.pk');
    setPassword('admin123');
    setStudentName('FYP Portal Admin');
    setRollNo('ADMIN-01');
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-5">
        <h2 className="text-xl font-bold text-slate-900">Student Portal Login</h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Enter your university credentials to access the FYP portal
        </p>
      </div>

      {/* Direct Open Complaint Button */}
      <div className="text-center">
        <Link
          to="/create-complaint"
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition shadow-xs"
        >
          📝 Lodge Complaint Directly (No Login Required) &rarr;
        </Link>
      </div>

      {/* 1-Click Demo Buttons */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-center">
        <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-2">
          <Sparkles size={13} /> Quick Demo Autofill
        </div>
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={autofillStudent}
            className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-50 transition shadow-sm"
          >
            Demo Student
          </button>
          <button
            type="button"
            onClick={autofillAdmin}
            className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-50 transition shadow-sm"
          >
            Demo Admin
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">
            Student Full Name
          </label>
          <div className="relative">
            <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text" 
              className="input pl-10"
              placeholder="e.g. Ali Raza"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">University Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="email" required
              className="input pl-10"
              placeholder="student@fyp.edu.pk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">
            Student Roll Number
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text" 
              className="input pl-10"
              placeholder="e.g. FYP-BSCS-001"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <Link to="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="password" required
              className="input pl-10"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full h-11 mt-2 text-sm font-bold tracking-wide shadow-md hover:shadow-lg transition-all"
        >
          {loading
            ? <><Loader2 className="animate-spin" size={18} /> Authenticating…</>
            : 'Sign In to Student Portal'
          }
        </button>
      </form>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500">University Faculty or Admin?</span>
        <Link 
          to="/staff-login" 
          className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
        >
          Faculty / Admin Login <ArrowRight size={13} />
        </Link>
      </div>

      <div className="text-center text-xs text-slate-500">
        Don't have an account?{' '}
        <Link to="/signup" className="text-indigo-600 font-semibold hover:underline">
          Register here
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
