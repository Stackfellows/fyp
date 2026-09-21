import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { loginUser } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Lock, Loader2, Mail, Users } from 'lucide-react';

const StaffLoginPage = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const location  = useLocation();
  const { loading } = useSelector(state => state.auth);

  // Use a unified title for all internal team members (Admin, Manager, Staff)
  const portalType = 'Team/Admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    try {
      const data = await loginUser({ email, password });
      dispatch(loginSuccess(data));
      toast.success('Welcome back!');
      const userRole = data.user.role;
      if (userRole === 'admin')        navigate('/admin/dashboard');
      else if (userRole === 'staff')   navigate('/staff/dashboard');
      else if (userRole === 'manager') navigate('/manager/dashboard');
      else                             navigate('/student/dashboard');
    } catch (err) {
      dispatch(loginFailure(err.message));
      toast.error(err.response?.data?.message || err.message || 'Invalid credentials');
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-gov-primary/10 rounded-full flex items-center justify-center mb-3">
            <Users className="text-gov-primary" size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{portalType} Portal Login</h2>
        <p className="text-slate-500 text-sm mt-1">Enter your credentials to access the system</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="email" required
              className="input pl-10"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-medium text-slate-700">Password</label>
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
          className="btn btn-primary w-full h-11 mt-2"
        >
          {loading
            ? <><Loader2 className="animate-spin" size={18} /> Signing in…</>
            : 'Sign In'
          }
        </button>
      </form>

      <p className="text-center text-sm text-slate-600 pt-2 border-t border-slate-100">
        Are you a student?{' '}
        <Link to="/login" className="text-gov-primary font-semibold hover:underline">
          Student Login
        </Link>
      </p>
    </div>
  );
};

export default StaffLoginPage;
