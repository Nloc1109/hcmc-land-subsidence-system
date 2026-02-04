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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const notificationsApi = {
  getList: async (params = {}) => {
    const doGet = () =>
      axios.get(`${API_BASE_URL}/v1/notifications`, {
        params: { page: 1, limit: 50, ...params },
        headers: getAuthHeaders(),
      });
    try {
      const res = await doGet();
      return res.data;
    } catch (first) {
      try {
        await sleep(600);
        const res = await doGet();
        return res.data;
      } catch (_) {
        return { items: [], total: 0, page: 1, limit: 50 };
      }
    }
  },

  getSentList: async (params = {}) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/v1/notifications/sent`, {
        params: { page: 1, limit: 50, ...params },
        headers: getAuthHeaders(),
      });
      return res.data;
    } catch (_) {
      return { items: [], total: 0, page: 1, limit: 50 };
    }
  },

  getUnreadCount: async () => {
    const doGet = () =>
      axios.get(`${API_BASE_URL}/v1/notifications/unread-count`, {
        headers: getAuthHeaders(),
      });
    try {
      const res = await doGet();
      return res.data;
    } catch (first) {
      try {
        await sleep(400);
        const res = await doGet();
        return res.data;
      } catch (_) {
        return { unreadCount: 0 };
      }
    }
  },

  markAsRead: async (id) => {
    const res = await axios.patch(`${API_BASE_URL}/v1/notifications/${id}/read`, {}, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  delete: async (id) => {
    const res = await axios.delete(`${API_BASE_URL}/v1/notifications/${id}`, {
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

  /** Tải file đính kèm dưới dạng blob (có auth) để xem trong iframe hoặc tải xuống. Có retry 1 lần khi lỗi kết nối/503. */
  getAttachmentBlob: async (notificationId) => {
    const doGet = () =>
      axios.get(
        `${API_BASE_URL}/v1/notifications/${notificationId}/attachment`,
        { responseType: 'blob', headers: getAuthHeadersForBlob() }
      );
    try {
      const res = await doGet();
      if (res.status !== 200) throw new Error('Attachment not available');
      return res.data;
    } catch (first) {
      const isRetryable =
        first?.code === 'ERR_NETWORK' ||
        first?.response?.status === 503 ||
        (first?.response?.status >= 500 && first?.response?.status < 600);
      if (isRetryable) {
        await sleep(500);
        const res = await doGet();
        if (res.status !== 200) throw new Error('Attachment not available');
        return res.data;
      }
      throw first;
    }
  },
};

export default notificationsApi;
