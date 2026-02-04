import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const requestsApi = {
  // Lấy danh sách yêu cầu
  getRequests: async (params = {}) => {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`${API_BASE_URL}/v1/requests`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Lấy chi tiết yêu cầu
  getRequest: async (id) => {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`${API_BASE_URL}/v1/requests/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Admin: Tạo yêu cầu mới
  createRequest: async (data) => {
    const token = localStorage.getItem('auth_token');
    const response = await axios.post(`${API_BASE_URL}/v1/requests`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Chấp nhận yêu cầu
  acceptRequest: async (id) => {
    const token = localStorage.getItem('auth_token');
    const response = await axios.put(`${API_BASE_URL}/v1/requests/${id}/accept`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Từ chối yêu cầu (chỉ mức Green)
  rejectRequest: async (id, rejectionReason) => {
    const token = localStorage.getItem('auth_token');
    const response = await axios.put(`${API_BASE_URL}/v1/requests/${id}/reject`, {
      rejectionReason,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Thương lượng thời gian (chỉ mức Yellow)
  negotiateRequest: async (id, negotiatedDueDate, negotiationMessage) => {
    const token = localStorage.getItem('auth_token');
    const response = await axios.put(`${API_BASE_URL}/v1/requests/${id}/negotiate`, {
      negotiatedDueDate,
      negotiationMessage,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Bắt đầu làm việc
  startRequest: async (id) => {
    const token = localStorage.getItem('auth_token');
    const response = await axios.put(`${API_BASE_URL}/v1/requests/${id}/start`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Hoàn thành yêu cầu
  completeRequest: async (id) => {
    const token = localStorage.getItem('auth_token');
    const response = await axios.put(`${API_BASE_URL}/v1/requests/${id}/complete`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Admin: Lấy danh sách users có thể giao yêu cầu
  getAssignableUsers: async () => {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`${API_BASE_URL}/v1/requests/assignable-users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

export default requestsApi;

