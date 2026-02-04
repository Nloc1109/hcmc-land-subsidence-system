import express from 'express';

const router = express.Router();

// GET /api/v1/dashboard/stats - Thống kê tổng quan
router.get('/stats', async (req, res) => {
  try {
    // Mock data - sau này sẽ thay bằng query database
    res.json({
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
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê dashboard' });
  }
});

// GET /api/v1/dashboard/subsidence-trend - Xu hướng sụt lún
router.get('/subsidence-trend', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = [];
    const today = new Date();
    let cumulative = 20;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const baseRate = 3.5 + Math.sin(i / 10) * 1.5;
      const value = (baseRate + (Math.random() - 0.5) * 0.8).toFixed(2);
      cumulative += parseFloat(value) * 0.1;
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: parseFloat(value),
        cumulative: parseFloat(cumulative.toFixed(2)),
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching subsidence trend:', error);
    res.status(500).json({ message: 'Lỗi khi lấy xu hướng sụt lún' });
  }
});

// GET /api/v1/dashboard/district-stats - Thống kê theo quận
router.get('/district-stats', async (req, res) => {
  try {
    const stats = [
      { districtName: 'Quận 1', areas: 3, alerts: 2, avgRate: 3.2, riskLevel: 'High', totalRecords: 156 },
      { districtName: 'Quận 2', areas: 2, alerts: 0, avgRate: 2.1, riskLevel: 'Medium', totalRecords: 98 },
      { districtName: 'Quận 7', areas: 4, alerts: 1, avgRate: 4.5, riskLevel: 'High', totalRecords: 203 },
      { districtName: 'Quận 12', areas: 3, alerts: 2, avgRate: 7.8, riskLevel: 'Critical', totalRecords: 187 },
      { districtName: 'Bình Thạnh', areas: 2, alerts: 0, avgRate: 2.8, riskLevel: 'Medium', totalRecords: 112 },
      { districtName: 'Tân Phú', areas: 2, alerts: 0, avgRate: 3.1, riskLevel: 'Medium', totalRecords: 95 },
    ];
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching district stats:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê quận' });
  }
});

export default router;

