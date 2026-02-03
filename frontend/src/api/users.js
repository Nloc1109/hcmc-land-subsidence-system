import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// Helper để lấy token và tạo headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const usersApi = {
  // Lấy danh sách người dùng
  getUsers: async (params = {}) => {
    const response = await axios.get(`${API_BASE_URL}/v1/users`, {
      params,
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Lấy chi tiết người dùng
  getUser: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/v1/users/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Tạo người dùng mới
  createUser: async (userData) => {
    const response = await axios.post(`${API_BASE_URL}/v1/users`, userData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Cập nhật người dùng
  updateUser: async (id, userData) => {
    const response = await axios.put(`${API_BASE_URL}/v1/users/${id}`, userData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Xóa người dùng
  deleteUser: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/v1/users/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Reset mật khẩu
  resetPassword: async (id, newPassword) => {
    const response = await axios.post(
      `${API_BASE_URL}/v1/users/${id}/reset-password`,
      { newPassword },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },
};

export default usersApi;

