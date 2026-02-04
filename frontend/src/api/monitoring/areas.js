import axios from 'axios';

const API_BASE_URL_RAW = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

function getV1BaseUrl() {
  const base = String(API_BASE_URL_RAW || '').replace(/\/+$/, '');
  if (base.endsWith('/api/v1')) return base;
  if (base.endsWith('/api')) return `${base}/v1`;
  // nếu user set base là http://host:port (không có /api) thì tự thêm
  return `${base}/api/v1`;
}

const API_V1_BASE_URL = getV1BaseUrl();

// Lấy danh sách tất cả khu vực giám sát
export const getMonitoringAreas = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`${API_V1_BASE_URL}/monitoring-areas`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching monitoring areas:', error);
    throw error;
  }
};

// Lấy chi tiết một khu vực (bao gồm time series, analysis, etc.)
export const getAreaDetails = async (areaId) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`${API_V1_BASE_URL}/monitoring-areas/${areaId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching area details:', error);
    throw error;
  }
};

