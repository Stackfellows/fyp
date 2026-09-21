import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Reset link sent to your email!');
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">Reset Password</h2>
        <p className="text-slate-500 text-sm mt-1">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="email" required
              className="input pl-10"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full h-11">
          Send Reset Link
        </button>
      </form>

      <Link
        to="/login"
        className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-gov-primary transition-colors pt-2 border-t border-slate-100"
      >
        <ArrowLeft size={16} /> Back to Login
      </Link>
    </div>
  );
};

export default ForgotPasswordPage;
