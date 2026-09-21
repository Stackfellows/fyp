import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Chatbot from './components/Chatbot';

// Pages - Direct Imports (Fixes DOM removeChild errors with PageSpeed)
import LoginPage from './pages/auth/LoginPage';
import StaffLoginPage from './pages/auth/StaffLoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import CreateComplaint from './pages/student/CreateComplaint';
import MyTickets from './pages/student/MyTickets';
import StudentTicketDetail from './pages/student/TicketDetail';

// Staff Pages
import StaffDashboard from './pages/staff/Dashboard';
import TicketManagement from './pages/staff/TicketManagement';
import StaffTicketDetail from './pages/staff/TicketDetail';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AllTickets from './pages/admin/AllTickets';
import Departments from './pages/admin/Departments';
import ManageStaff from './pages/admin/ManageStaff';
import ManageStudents from './pages/admin/ManageStudents';
import Reports from './pages/admin/Reports';
import AdminTicketDetail from './pages/admin/TicketDetail';
import ManageAnnouncements from './pages/admin/ManageAnnouncements';

// Manager Pages
import ManagerDashboard from './pages/manager/Dashboard';
import ManagerAllTickets from './pages/manager/AllTickets';
import ManagerTicketDetail from './pages/manager/TicketDetail';
import ManagerReports from './pages/manager/Reports';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Chatbot />
      <Routes>
        {/* Public / Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/staff-login" element={<StaffLoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Public Direct Complaint Submission (Open to Any Student - No Barriers) */}
        <Route path="/create-complaint" element={<CreateComplaint />} />
        <Route path="/lodge-complaint" element={<CreateComplaint />} />

        {/* ─── Student Routes ─── */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="create-complaint" element={<CreateComplaint />} />
          <Route path="tickets" element={<MyTickets />} />
          <Route path="tickets/:id" element={<StudentTicketDetail />} />
        </Route>

        {/* ─── Staff Routes ─── */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['staff']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="tickets" element={<TicketManagement />} />
          <Route path="tickets/:id" element={<StaffTicketDetail />} />
        </Route>

        {/* ─── Admin Routes ─── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="tickets" element={<AllTickets />} />
          <Route path="tickets/:id" element={<AdminTicketDetail />} />
          <Route path="departments" element={<Departments />} />
          <Route path="staff" element={<ManageStaff />} />
          <Route path="students" element={<ManageStudents />} />
          <Route path="reports" element={<Reports />} />
          <Route path="announcements" element={<ManageAnnouncements />} />
        </Route>

        {/* ─── Manager Routes ─── */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="tickets"   element={<ManagerAllTickets />} />
          <Route path="tickets/:id" element={<ManagerTicketDetail />} />
          <Route path="team"      element={<ManagerDashboard />} />
          <Route path="reports"   element={<ManagerReports />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
              <h1 className="text-9xl font-black text-slate-200">404</h1>
              <p className="text-2xl font-bold text-slate-800 mt-4">Page Not Found</p>
              <p className="text-slate-500 mt-2 max-w-md">
                The page you are looking for doesn&apos;t exist or has been moved.
              </p>
              <button
                onClick={() => window.history.back()}
                className="btn btn-primary mt-8 px-8"
              >
                Go Back
              </button>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
