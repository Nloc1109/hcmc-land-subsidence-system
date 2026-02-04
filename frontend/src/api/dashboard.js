import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const dashboardApi = {
  // Lấy thống kê tổng quan
  getDashboardStats: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/dashboard/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return mock data nếu API chưa sẵn sàng
      return {
        totalAreas: 16,
        totalStations: 14,
        activeDevices: 27,
        inactiveDevices: 3,
        maintenanceDevices: 2,
        faultyDevices: 1,
        activeAlerts: 5,
        criticalAlerts: 2,
        warningAlerts: 3,
        totalDistricts: 11,
        totalRecords: 1248,
        totalMeasurements: 15620,
      };
    }
  },

  // Lấy dữ liệu sụt lún theo thời gian
  getSubsidenceTrend: async (days = 30) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/dashboard/subsidence-trend`, {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching subsidence trend:', error);
      // Mock data với dữ liệu thực tế hơn
      return generateMockTrendData(days);
    }
  },

  // Lấy thống kê theo quận
  getDistrictStats: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/dashboard/district-stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching district stats:', error);
      return generateMockDistrictStats();
    }
  },

  // Lấy cảnh báo mới nhất
  getRecentAlerts: async (limit = 10) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/alerts/recent`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent alerts:', error);
      return generateMockAlerts(limit);
    }
  },

  // Lấy trạng thái thiết bị
  getDeviceStatus: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/devices/status`);
      return response.data;
    } catch (error) {
      console.error('Error fetching device status:', error);
      return {
        active: 27,
        inactive: 3,
        maintenance: 2,
        faulty: 1,
      };
    }
  },

  // Lấy top khu vực có nguy cơ cao
  getTopRiskAreas: async (limit = 5) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/areas/top-risk`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching top risk areas:', error);
      return generateMockTopRiskAreas(limit);
    }
  },

  // Lấy bản ghi sụt lún mới nhất
  getRecentSubsidenceRecords: async (limit = 10) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/subsidence/recent`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent subsidence records:', error);
      return generateMockRecentRecords(limit);
    }
  },

  // Lấy dữ liệu cho biểu đồ phân bố theo quận
  getDistrictDistribution: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/dashboard/district-distribution`);
      return response.data;
    } catch (error) {
      console.error('Error fetching district distribution:', error);
      return generateMockDistrictDistribution();
    }
  },

  // Lấy thống kê thiết bị theo loại
  getDeviceTypeStats: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/v1/devices/type-stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching device type stats:', error);
      return generateMockDeviceTypeStats();
    }
  },
};

// Helper functions để generate mock data
function generateMockTrendData(days) {
  const data = [];
  const today = new Date();
  let cumulative = 20;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Tạo dữ liệu thực tế hơn với xu hướng
    const baseRate = 3.5 + Math.sin(i / 10) * 1.5;
    const value = (baseRate + (Math.random() - 0.5) * 0.8).toFixed(2);
    cumulative += parseFloat(value) * 0.1;
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: parseFloat(value),
      cumulative: parseFloat(cumulative.toFixed(2)),
    });
  }
  return data;
}

function generateMockDistrictStats() {
  return [
    { districtName: 'Quận 1', areas: 3, alerts: 2, avgRate: 3.2, riskLevel: 'High', totalRecords: 156 },
    { districtName: 'Quận 2', areas: 2, alerts: 0, avgRate: 2.1, riskLevel: 'Medium', totalRecords: 98 },
    { districtName: 'Quận 7', areas: 4, alerts: 1, avgRate: 4.5, riskLevel: 'High', totalRecords: 203 },
    { districtName: 'Quận 12', areas: 3, alerts: 2, avgRate: 7.8, riskLevel: 'Critical', totalRecords: 187 },
    { districtName: 'Bình Thạnh', areas: 2, alerts: 0, avgRate: 2.8, riskLevel: 'Medium', totalRecords: 112 },
    { districtName: 'Tân Phú', areas: 2, alerts: 0, avgRate: 3.1, riskLevel: 'Medium', totalRecords: 95 },
  ];
}

function generateMockAlerts(limit) {
  const alerts = [
    {
      alertId: 1,
      alertCode: 'SUB-CRIT-001',
      title: 'Cảnh báo sụt lún nghiêm trọng',
      message: 'Tốc độ sụt lún tại Quận 12 đã vượt ngưỡng nghiêm trọng: 8.5 mm/year',
      severity: 'Critical',
      areaName: 'Khu vực Quận 12 - Tân Chánh Hiệp',
      districtName: 'Quận 12',
      alertTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
    },
    {
      alertId: 2,
      alertCode: 'SUB-WARN-002',
      title: 'Cảnh báo sụt lún',
      message: 'Tốc độ sụt lún tại Quận 1 đã vượt ngưỡng cảnh báo: 4.1 mm/year',
      severity: 'Warning',
      areaName: 'Khu vực Quận 1 - Trung tâm',
      districtName: 'Quận 1',
      alertTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
    },
    {
      alertId: 3,
      alertCode: 'DEV-FAULT-003',
      title: 'Thiết bị lỗi',
      message: 'Thiết bị DEV-004 tại Quận 12 cần bảo trì',
      severity: 'Warning',
      areaName: 'Khu vực Quận 12',
      districtName: 'Quận 12',
      alertTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      status: 'Acknowledged',
    },
    {
      alertId: 4,
      alertCode: 'SUB-WARN-004',
      title: 'Cảnh báo sụt lún',
      message: 'Tốc độ sụt lún tại Quận 7 đã vượt ngưỡng: 4.8 mm/year',
      severity: 'Warning',
      areaName: 'Khu vực Quận 7 - Tân Phong',
      districtName: 'Quận 7',
      alertTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
    },
    {
      alertId: 5,
      alertCode: 'SUB-CRIT-005',
      title: 'Cảnh báo sụt lún nghiêm trọng',
      message: 'Sụt lún tích lũy tại Quận 12 đã vượt 100mm',
      severity: 'Critical',
      areaName: 'Khu vực Quận 12 - Tân Chánh Hiệp',
      districtName: 'Quận 12',
      alertTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
    },
  ];
  return alerts.slice(0, limit);
}

function generateMockTopRiskAreas(limit) {
  return [
    {
      areaId: 4,
      areaCode: 'AREA-004',
      areaName: 'Khu vực Quận 12 - Tân Chánh Hiệp',
      districtName: 'Quận 12',
      riskLevel: 'Critical',
      avgSubsidenceRate: 7.8,
      cumulativeSubsidence: 125.5,
      alertCount: 2,
      lastRecordDate: new Date().toISOString().split('T')[0],
    },
    {
      areaId: 3,
      areaCode: 'AREA-003',
      areaName: 'Khu vực Quận 7 - Tân Phong',
      districtName: 'Quận 7',
      riskLevel: 'High',
      avgSubsidenceRate: 4.5,
      cumulativeSubsidence: 68.2,
      alertCount: 1,
      lastRecordDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      areaId: 1,
      areaCode: 'AREA-001',
      areaName: 'Khu vực Quận 1 - Trung tâm',
      districtName: 'Quận 1',
      riskLevel: 'High',
      avgSubsidenceRate: 3.2,
      cumulativeSubsidence: 45.8,
      alertCount: 2,
      lastRecordDate: new Date().toISOString().split('T')[0],
    },
    {
      areaId: 5,
      areaCode: 'AREA-005',
      areaName: 'Khu vực Bình Thạnh - Trung tâm',
      districtName: 'Bình Thạnh',
      riskLevel: 'Medium',
      avgSubsidenceRate: 2.8,
      cumulativeSubsidence: 38.5,
      alertCount: 0,
      lastRecordDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    {
      areaId: 6,
      areaCode: 'AREA-006',
      areaName: 'Khu vực Tân Phú - Trung tâm',
      districtName: 'Tân Phú',
      riskLevel: 'Medium',
      avgSubsidenceRate: 3.1,
      cumulativeSubsidence: 42.3,
      alertCount: 0,
      lastRecordDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  ].slice(0, limit);
}

function generateMockRecentRecords(limit) {
  const records = [];
  const districts = ['Quận 1', 'Quận 2', 'Quận 7', 'Quận 12', 'Bình Thạnh', 'Tân Phú'];
  const areas = ['Trung tâm', 'Tân Phong', 'Tân Chánh Hiệp', 'Thảo Điền'];
  
  for (let i = 0; i < limit; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const district = districts[Math.floor(Math.random() * districts.length)];
    const area = areas[Math.floor(Math.random() * areas.length)];
    
    records.push({
      recordId: i + 1,
      areaName: `Khu vực ${district} - ${area}`,
      districtName: district,
      recordDate: date.toISOString().split('T')[0],
      subsidenceValue: (Math.random() * 5 + 1).toFixed(2),
      cumulativeSubsidence: (Math.random() * 100 + 20).toFixed(2),
      subsidenceRate: (Math.random() * 6 + 2).toFixed(2),
      measurementMethod: ['GPS', 'InSAR', 'Leveling', 'Sensor'][Math.floor(Math.random() * 4)],
      qualityRating: ['Excellent', 'Good', 'Fair'][Math.floor(Math.random() * 3)],
    });
  }
  return records;
}

function generateMockDistrictDistribution() {
  return [
    { districtName: 'Quận 12', count: 187, percentage: 15.0 },
    { districtName: 'Quận 7', count: 203, percentage: 16.3 },
    { districtName: 'Quận 1', count: 156, percentage: 12.5 },
    { districtName: 'Bình Thạnh', count: 112, percentage: 9.0 },
    { districtName: 'Tân Phú', count: 95, percentage: 7.6 },
    { districtName: 'Quận 2', count: 98, percentage: 7.9 },
    { districtName: 'Khác', count: 397, percentage: 31.7 },
  ];
}

function generateMockDeviceTypeStats() {
  return [
    { typeName: 'GPS Receiver', count: 12, active: 11, inactive: 1 },
    { typeName: 'Inclinometer', count: 8, active: 7, inactive: 1 },
    { typeName: 'Piezometer', count: 6, active: 5, inactive: 1 },
    { typeName: 'Strain Gauge', count: 4, active: 3, inactive: 1 },
    { typeName: 'Leveling Equipment', count: 3, active: 1, inactive: 2 },
  ];
}

export default dashboardApi;
