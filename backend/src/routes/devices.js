import express from 'express';

const router = express.Router();

// GET /api/v1/devices/status - Trạng thái thiết bị
router.get('/status', async (req, res) => {
  try {
    res.json({
      active: 27,
      inactive: 3,
      maintenance: 2,
      faulty: 1,
    });
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.status(500).json({ message: 'Lỗi khi lấy trạng thái thiết bị' });
  }
});

export default router;

