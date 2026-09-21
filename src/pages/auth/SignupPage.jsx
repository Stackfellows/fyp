import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, BookOpen, CreditCard, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { registerUser } from '../../services/api';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    cnicNo: '',
    rollNo: '',
    phoneNo: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerUser({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        cnic: formData.cnicNo,
        rollNo: formData.rollNo,
        phone: formData.phoneNo
      });
      toast.success('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register account');
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">Create Your Account</h2>
        <p className="text-slate-500 text-sm mt-1">Fill in the details below to register</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="label">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input type="text" required className="input pl-10" placeholder="John Doe"
              value={formData.fullName} onChange={update('fullName')} />
          </div>
        </div>

        {/* CNIC No */}
        <div>
          <label className="label">CNIC No</label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input type="text" required className="input pl-10" placeholder="35202-1234567-8"
              value={formData.cnicNo} onChange={update('cnicNo')} />
          </div>
        </div>

        {/* Student Roll / Enrollment No */}
        <div>
          <label className="label">Student Roll / Enrollment No</label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input type="text" required className="input pl-10" placeholder="e.g. FYP-BSCS-001"
              value={formData.rollNo} onChange={update('rollNo')} />
          </div>
        </div>

        {/* Reg Phone No */}
        <div>
          <label className="label">Registered Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input type="tel" required className="input pl-10" placeholder="0300-1234567"
              value={formData.phoneNo} onChange={update('phoneNo')} />
          </div>
        </div>

        {/* Reg Email */}
        <div>
          <label className="label">University Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input type="email" required className="input pl-10" placeholder="student@fyp.edu.pk"
              value={formData.email} onChange={update('email')} />
          </div>
        </div>

        {/* Set Password */}
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input type="password" required className="input pl-10" placeholder="••••••••"
              value={formData.password} onChange={update('password')} />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full h-11 mt-2">
          {loading ? 'Processing...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600 pt-2 border-t border-slate-100">
        Already have an account?{' '}
        <Link to="/login" className="text-gov-primary font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
};

export default SignupPage;
