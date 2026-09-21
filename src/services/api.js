import apiClient from '../utils/axiosConfig';

const api = apiClient;

// ── Auth APIs ──────────────────────────────────────────────
export const registerUser = async (userData) => {
  const response = await api.post('/api/auth.php?action=register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/api/auth.php?action=login', credentials);
  return response.data;
};

export const studentLogin = async (credentials) => {
  const response = await api.post('/api/auth.php?action=login', credentials);
  return response.data;
};

// ── Complaints APIs ────────────────────────────────────────
export const getComplaints = async (filter = 'all') => {
  const url = filter && filter !== 'all' ? `/api/complaints.php?status=${filter}` : '/api/complaints.php';
  const response = await api.get(url);
  return response.data.complaints || [];
};

export const createComplaint = async (complaintData) => {
  const response = await api.post('/api/complaints.php', complaintData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.complaint || response.data;
};

export const getPublicDepartments = async () => {
  const response = await api.get('/api/complaints.php?action=departments');
  return response.data.departments || [];
};

export const getComplaintById = async (id) => {
  const response = await api.get(`/api/complaints.php?id=${id}`);
  return response.data.complaint || response.data;
};

export const updateComplaintStatus = async (id, status) => {
  const response = await api.post(`/api/complaints.php?action=update_status&id=${id}`, { id, status });
  return response.data.complaint || response.data;
};

export const updateComplaintPriority = async (id, priority) => {
  const response = await api.post(`/api/complaints.php?action=update_status&id=${id}`, { id, priority });
  return response.data.complaint || response.data;
};

export const reassignComplaint = async (id, data) => {
  const response = await api.post(`/api/complaints.php?action=update_status&id=${id}`, { id, ...data });
  return response.data;
};

export const snoozeComplaint = async (id, hours) => {
  return { status: 'success', message: 'Complaint snoozed' };
};

export const addMessage = async (id, messageData) => {
  let content = '';
  if (messageData instanceof FormData) {
    content = messageData.get('content') || messageData.get('message') || '';
  } else if (typeof messageData === 'object') {
    content = messageData.content || messageData.message || '';
  } else {
    content = String(messageData);
  }

  const response = await api.post('/api/comments.php', {
    complaint_id: id,
    message: content
  });
  return response.data.comment || response.data;
};

export const editMessage = async (id, msgId, content) => {
  return { id: msgId, content };
};

export const deleteMessage = async (id, msgId) => {
  return { id: msgId };
};

export const markMessagesAsRead = async (id) => {
  return { status: 'success' };
};

// ── Admin APIs ─────────────────────────────────────────────
export const getAdminStats = async (filter = 'all') => {
  const response = await api.get('/api/stats.php');
  return response.data;
};

export const getStaff = async () => {
  const response = await api.get('/api/auth.php?action=staff');
  return response.data.staff || [];
};

export const addStaff = async (staffData) => {
  const response = await api.post('/api/auth.php?action=register', staffData);
  return response.data.user || response.data;
};

export const updateStaff = async (id, staffData) => {
  return { status: 'success' };
};

export const deleteStaff = async (id) => {
  return { status: 'success' };
};

export const getAdminReports = async (filter = 'weekly') => {
  const response = await api.get('/api/stats.php');
  return response.data;
};

// ── Manager APIs ───────────────────────────────────────────
export const getManagerReports = async (filter = 'weekly') => {
  const response = await api.get('/api/stats.php');
  return response.data;
};

export const getManagerStats = async () => {
  const response = await api.get('/api/stats.php');
  return response.data.stats || {};
};

export const getManagerTeamPerformance = async () => {
  return [];
};

export const getManagerTrend = async () => {
  return [];
};

export const getManagerDepartmentStats = async () => {
  const response = await api.get('/api/stats.php');
  return response.data.departments || [];
};

export const getManagerComplaints = async (params = {}) => {
  return getComplaints();
};

export const createManagerAccount = async (data) => {
  return addStaff(data);
};

export const deleteComplaint = async (id) => {
  return { status: 'success' };
};

export const getStudents = async () => {
  const response = await api.get('/api/auth.php?action=students');
  return response.data.students || [];
};

export const deleteStudent = async (id) => {
  return { status: 'success' };
};

// ── Department APIs ────────────────────────────────────────
export const getDepartments = async () => {
  const response = await api.get('/api/complaints.php?action=departments');
  return response.data.departments || [];
};

export const addDepartment = async (deptData) => {
  return { status: 'success' };
};

export const deleteDepartment = async (id) => {
  return { status: 'success' };
};

export const updateStaffStatus = async (id, status) => {
  return { status: 'success' };
};

// ── Announcement APIs ──────────────────────────────────────
export const getAnnouncements = async () => {
  const response = await api.get('/api/announcements.php');
  return response.data.announcements || [];
};

export const createAnnouncement = async (data) => {
  const response = await api.post('/api/announcements.php', data);
  return response.data;
};

export const toggleAnnouncement = async (id) => {
  return { status: 'success' };
};

export const deleteAnnouncement = async (id) => {
  return { status: 'success' };
};

export const rateComplaint = async (id, data) => {
  return { status: 'success' };
};

export const addInternalNote = async (id, content) => {
  return addMessage(id, content);
};

export default api;
