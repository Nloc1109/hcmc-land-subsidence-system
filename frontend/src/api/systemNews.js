import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/** URL tải file đính kèm (mở trong tab mới hoặc download) */
export function getAttachmentUrl(systemNewsId, attachmentId) {
  const base = (API_BASE_URL || '').replace(/\/+$/, '');
  return `${base}/v1/system-news/${systemNewsId}/attachments/${attachmentId}`;
}

/** Headers có token để request tải file đính kèm */
export function getAttachmentHeaders() {
  return getAuthHeaders();
}

const systemNewsApi = {
  getList: async (params = {}) => {
    const res = await axios.get(`${API_BASE_URL}/v1/system-news`, {
      params: { page: 1, limit: 50, ...params },
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  getById: async (id) => {
    const res = await axios.get(`${API_BASE_URL}/v1/system-news/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  /**
   * Tạo tin hệ thống. data: { title, content } (văn bản).
   * files: File[] (optional) — file đính kèm.
   */
  create: async (data, files = []) => {
    const formData = new FormData();
    formData.append('title', data.title ?? '');
    formData.append('content', data.content ?? '');
    (files || []).forEach((file) => {
      if (file instanceof File) formData.append('attachments', file);
    });
    const res = await axios.post(`${API_BASE_URL}/v1/system-news`, formData, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /**
   * Cập nhật tin hệ thống. data: { title?, content? }. files: File[] (optional) — thêm file mới.
   */
  update: async (id, data, files = []) => {
    const formData = new FormData();
    if (data.title != null) formData.append('title', data.title);
    if (data.content != null) formData.append('content', data.content);
    (files || []).forEach((file) => {
      if (file instanceof File) formData.append('attachments', file);
    });
    const res = await axios.put(`${API_BASE_URL}/v1/system-news/${id}`, formData, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  delete: async (id) => {
    const res = await axios.delete(`${API_BASE_URL}/v1/system-news/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  /** Xóa một file đính kèm */
  deleteAttachment: async (systemNewsId, attachmentId) => {
    const res = await axios.delete(
      `${API_BASE_URL}/v1/system-news/${systemNewsId}/attachments/${attachmentId}`,
      { headers: getAuthHeaders() }
    );
    return res.data;
  },
};

export default systemNewsApi;
