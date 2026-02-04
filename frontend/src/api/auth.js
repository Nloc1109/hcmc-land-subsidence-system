import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const authApi = {
  // Đăng nhập bằng username + password
  login: async ({ username, password }) => {
    const res = await axios.post(`${API_BASE_URL}/v1/auth/login`, {
      username,
      password,
    });
    return res.data;
  },

  // Lấy danh sách role cho màn hình đăng ký (loại trừ Admin)
  getRoles: async () => {
    const res = await axios.get(`${API_BASE_URL}/v1/auth/roles`);
    return res.data;
  },

  // Đăng ký tài khoản mới (lưu vào DB, có chọn roleId nếu gửi lên)
  register: async ({ fullName, username, email, phoneNumber, password, roleId }) => {
    const res = await axios.post(`${API_BASE_URL}/v1/auth/register`, {
      fullName,
      username,
      email,
      phoneNumber,
      password,
      roleId,
    });
    return res.data;
  },

  // Lấy thông tin người dùng từ token nếu cần
  me: async (token) => {
    const res = await axios.get(`${API_BASE_URL}/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  },
};

export default authApi;

