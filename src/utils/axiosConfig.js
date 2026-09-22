import axios from 'axios';
import { toast } from 'react-hot-toast';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'https://fypbackend-y43f.onrender.com';
const cleanBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

// Create a robust Axios instance
const apiClient = axios.create({
  baseURL: cleanBaseUrl,
  timeout: 45000, // 45 seconds max wait time for DB connections
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Simplified Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 Unauthorized (Invalid or expired token)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
