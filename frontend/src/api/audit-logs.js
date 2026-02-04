import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Helper để lấy token và tạo headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const auditLogsApi = {
  // Lấy danh sách log
  getLogs: async (params = {}) => {
    const response = await axios.get(`${API_BASE_URL}/v1/audit-logs`, {
      params,
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Lấy log đăng nhập
  getLoginLogs: async (params = {}) => {
    const response = await axios.get(`${API_BASE_URL}/v1/audit-logs/login`, {
      params,
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Lấy thống kê log
  getStatistics: async (params = {}) => {
    const response = await axios.get(`${API_BASE_URL}/v1/audit-logs/statistics`, {
      params,
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

export default auditLogsApi;

