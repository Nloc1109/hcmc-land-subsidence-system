import express from 'express';
import { getPool } from '../db/mssql.js';

const router = express.Router();

/**
 * GET /api/v1/areas/top-risk
 * Query: limit (default 5)
 * Trả về top khu vực rủi ro cao (ưu tiên Critical/High) + một vài chỉ số tổng hợp.
 */
router.get('/top-risk', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || '5', 10), 1), 50);
    const pool = await getPool();

    // Ưu tiên dùng view nếu tồn tại (schema.sql có vw_SubsidenceSummary)
    const query = `
      SELECT TOP (${limit})
        AreaId,
        AreaCode,
        AreaName,
        DistrictName,
        WardName,
        AvgSubsidenceRate,
        MaxCumulativeSubsidence,
        LastRecordDate,
        RiskLevel
      FROM vw_SubsidenceSummary
      ORDER BY
        CASE RiskLevel
          WHEN 'Critical' THEN 4
          WHEN 'High' THEN 3
          WHEN 'Medium' THEN 2
          WHEN 'Low' THEN 1
          ELSE 0
        END DESC,
        ISNULL(AvgSubsidenceRate, 0) DESC,
        ISNULL(MaxCumulativeSubsidence, 0) DESC;
    `;

    const result = await pool.request().query(query);
    const rows = result.recordset || [];

    res.json(
      rows.map((r) => ({
        areaId: r.AreaId,
        areaCode: r.AreaCode,
        areaName: r.AreaName,
        districtName: r.DistrictName,
        wardName: r.WardName,
        riskLevel: r.RiskLevel,
        avgSubsidenceRate: r.AvgSubsidenceRate != null ? Number(r.AvgSubsidenceRate) : null,
        cumulativeSubsidence: r.MaxCumulativeSubsidence != null ? Number(r.MaxCumulativeSubsidence) : null,
        lastRecordDate: r.LastRecordDate,
        alertCount: 0,
      }))
    );
  } catch (error) {
    console.error('Error fetching top risk areas:', error);
    res.status(500).json({ message: 'Lỗi khi lấy top khu vực rủi ro cao' });
  }
});

export default router;


