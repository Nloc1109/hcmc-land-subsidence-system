import express from 'express';

const router = express.Router();

// GET /api/v1/alerts/recent - Cảnh báo mới nhất
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
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
    
    res.json(alerts.slice(0, limit));
  } catch (error) {
    console.error('Error fetching recent alerts:', error);
    res.status(500).json({ message: 'Lỗi khi lấy cảnh báo' });
  }
});

export default router;

