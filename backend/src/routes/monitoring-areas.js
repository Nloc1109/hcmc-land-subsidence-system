import express from 'express';
import mssql from 'mssql';
import { getPool } from '../db/mssql.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/monitoring-areas - Lấy danh sách tất cả khu vực giám sát
router.get('/', authenticate, async (req, res) => {
  try {
    const pool = await getPool();
    const query = `
      SELECT 
        ma.AreaId,
        ma.AreaCode,
        ma.AreaName,
        d.DistrictName,
        w.WardName,
        ma.Latitude,
        ma.Longitude,
        ma.Elevation,
        ma.AreaType,
        ma.RiskLevel,
        ma.Description,
        (
          SELECT AVG(sr.SubsidenceRate)
          FROM SubsidenceRecords sr
          WHERE sr.AreaId = ma.AreaId
        ) AS AvgSubsidenceRate
      FROM MonitoringAreas ma
      INNER JOIN Districts d ON ma.DistrictId = d.DistrictId
      LEFT JOIN Wards w ON ma.WardId = w.WardId
      WHERE ma.IsActive = 1
      ORDER BY ma.RiskLevel DESC, ma.AreaName
    `;
    
    const result = await pool.request().query(query);
    
    const areas = result.recordset.map(row => ({
      areaId: row.AreaId,
      areaCode: row.AreaCode,
      areaName: row.AreaName,
      districtName: row.DistrictName,
      wardName: row.WardName,
      latitude: parseFloat(row.Latitude),
      longitude: parseFloat(row.Longitude),
      elevation: row.Elevation ? parseFloat(row.Elevation) : null,
      areaType: row.AreaType,
      riskLevel: row.RiskLevel,
      description: row.Description,
      avgSubsidenceRate: row.AvgSubsidenceRate ? parseFloat(row.AvgSubsidenceRate).toFixed(2) : null,
    }));
    
    res.json(areas);
  } catch (error) {
    console.error('Error fetching monitoring areas:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách khu vực giám sát' });
  }
});

// GET /api/v1/monitoring-areas/:areaId - Lấy chi tiết một khu vực
router.get('/:areaId', authenticate, async (req, res) => {
  try {
    const { areaId } = req.params;
    const pool = await getPool();
    
    // Lấy thông tin khu vực
    const areaQuery = `
      SELECT 
        ma.AreaId,
        ma.AreaCode,
        ma.AreaName,
        d.DistrictName,
        w.WardName,
        ma.Latitude,
        ma.Longitude,
        ma.Elevation,
        ma.AreaType,
        ma.RiskLevel,
        ma.Description
      FROM MonitoringAreas ma
      INNER JOIN Districts d ON ma.DistrictId = d.DistrictId
      LEFT JOIN Wards w ON ma.WardId = w.WardId
      WHERE ma.AreaId = @areaId AND ma.IsActive = 1
    `;
    
    const areaRequest = pool.request();
    areaRequest.input('areaId', mssql.Int, parseInt(areaId, 10));
    const areaResult = await areaRequest.query(areaQuery);
    
    if (areaResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy khu vực' });
    }
    
    const area = areaResult.recordset[0];
    
    // Lấy dữ liệu phân tích (nếu có)
    const analysisQuery = `
      SELECT TOP 1
        AnalysisType,
        AnalysisPeriodStart,
        AnalysisPeriodEnd,
        AnalysisResult,
        ConfidenceLevel
      FROM DataAnalysis
      WHERE AreaId = @areaId
      ORDER BY CreatedAt DESC
    `;
    
    const analysisRequest = pool.request();
    analysisRequest.input('areaId', mssql.Int, parseInt(areaId, 10));
    const analysisResult = await analysisRequest.query(analysisQuery);
    
    // Lấy chuỗi thời gian sụt lún (30 ngày gần nhất)
    const timeSeriesQuery = `
      SELECT TOP 30
        RecordDate,
        SubsidenceValue,
        CumulativeSubsidence,
        SubsidenceRate,
        QualityRating
      FROM SubsidenceRecords
      WHERE AreaId = @areaId
      ORDER BY RecordDate DESC
    `;
    
    const timeSeriesRequest = pool.request();
    timeSeriesRequest.input('areaId', mssql.Int, parseInt(areaId, 10));
    const timeSeriesResult = await timeSeriesRequest.query(timeSeriesQuery);
    
    res.json({
      area: {
        areaId: area.AreaId,
        areaCode: area.AreaCode,
        areaName: area.AreaName,
        districtName: area.DistrictName,
        wardName: area.WardName,
        latitude: parseFloat(area.Latitude),
        longitude: parseFloat(area.Longitude),
        elevation: area.Elevation ? parseFloat(area.Elevation) : null,
        areaType: area.AreaType,
        riskLevel: area.RiskLevel,
        description: area.Description,
      },
      analysis: analysisResult.recordset.length > 0 ? {
        analysisType: analysisResult.recordset[0].AnalysisType,
        periodStart: analysisResult.recordset[0].AnalysisPeriodStart,
        periodEnd: analysisResult.recordset[0].AnalysisPeriodEnd,
        result: analysisResult.recordset[0].AnalysisResult,
        confidenceLevel: analysisResult.recordset[0].ConfidenceLevel ? parseFloat(analysisResult.recordset[0].ConfidenceLevel) : null,
      } : null,
      timeSeries: timeSeriesResult.recordset.map(row => ({
        date: row.RecordDate,
        subsidenceValue: row.SubsidenceValue ? parseFloat(row.SubsidenceValue) : null,
        cumulativeSubsidence: row.CumulativeSubsidence ? parseFloat(row.CumulativeSubsidence) : null,
        subsidenceRate: row.SubsidenceRate ? parseFloat(row.SubsidenceRate) : null,
        qualityRating: row.QualityRating,
      })),
    });
  } catch (error) {
    console.error('Error fetching area details:', error);
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết khu vực' });
  }
});

export default router;

