import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const getAuthHeadersForBlob = () => {
  const token = localStorage.getItem('auth_token');
  return {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const notificationsApi = {
  getList: async (params = {}) => {
    const res = await axios.get(`${API_BASE_URL}/v1/notifications`, {
      params: { page: 1, limit: 50, ...params },
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  getSentList: async (params = {}) => {
    const res = await axios.get(`${API_BASE_URL}/v1/notifications/sent`, {
      params: { page: 1, limit: 50, ...params },
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  getUnreadCount: async () => {
    const res = await axios.get(`${API_BASE_URL}/v1/notifications/unread-count`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  markAsRead: async (id) => {
    const res = await axios.patch(`${API_BASE_URL}/v1/notifications/${id}/read`, {}, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  send: async (payload) => {
    const res = await axios.post(`${API_BASE_URL}/v1/notifications`, payload, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  getRecipients: async () => {
    const res = await axios.get(`${API_BASE_URL}/v1/notifications/recipients`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  /** URL file đính kèm (cần gọi với auth khi fetch) */
  getAttachmentUrl: (notificationId) =>
    `${API_BASE_URL}/v1/notifications/${notificationId}/attachment`,

  /** Tải file đính kèm dưới dạng blob (có auth) để xem trong iframe hoặc tải xuống */
  getAttachmentBlob: async (notificationId) => {
    const res = await axios.get(
      `${API_BASE_URL}/v1/notifications/${notificationId}/attachment`,
      { responseType: 'blob', headers: getAuthHeadersForBlob() }
    );
    return res.data;
  },
};

export default notificationsApi;
