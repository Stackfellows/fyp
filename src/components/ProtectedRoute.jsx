import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff') || location.pathname.startsWith('/manager')) {
      return <Navigate to="/staff-login" state={{ from: location }} replace />;
    }
    
    // Default fallback to student login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to their respective dashboard if they don't have access
    const defaultPath = role === 'admin' ? '/admin/dashboard' : role === 'staff' ? '/staff/dashboard' : role === 'manager' ? '/manager/dashboard' : '/student/dashboard';
    
    // Prevent infinite redirect loops if somehow the role doesn't match its own default path
    if (location.pathname === defaultPath) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      return <Navigate to="/login" replace />;
    }
    
    return <Navigate to={defaultPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
