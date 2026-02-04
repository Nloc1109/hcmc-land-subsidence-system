import express from 'express';
import { getPool } from '../db/mssql.js';
import { authenticate, requireAdmin as checkAdmin } from '../middleware/auth.js';

const router = express.Router();

// Tất cả routes đều cần authenticate và requireAdmin
router.use(authenticate);
router.use(checkAdmin);

// GET /api/v1/audit-logs - Danh sách log đăng nhập và hoạt động
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      userId, 
      actionType, 
      entityType,
      startDate,
      endDate 
    } = req.query;
    
    const pool = await getPool();
    const request = pool.request();
    
    let whereClause = '1=1';
    
    if (userId) {
      request.input('UserId', parseInt(userId));
      whereClause += ' AND al.UserId = @UserId';
    }
    
    if (actionType) {
      request.input('ActionType', actionType);
      whereClause += ' AND al.ActionType = @ActionType';
    }
    
    if (entityType) {
      request.input('EntityType', entityType);
      whereClause += ' AND al.EntityType = @EntityType';
    }
    
    if (startDate) {
      request.input('StartDate', startDate);
      whereClause += ' AND al.CreatedAt >= @StartDate';
    }
    
    if (endDate) {
      request.input('EndDate', endDate);
      whereClause += ' AND al.CreatedAt <= @EndDate';
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    request.input('Offset', offset);
    request.input('Limit', parseInt(limit));
    
    const result = await request.query(`
      SELECT 
        al.LogId,
        al.UserId,
        u.Username,
        u.FullName,
        u.Email,
        r.RoleName,
        al.ActionType,
        al.EntityType,
        al.EntityId,
        al.OldValues,
        al.NewValues,
        al.IpAddress,
        al.UserAgent,
        al.CreatedAt
      FROM AuditLogs al
      LEFT JOIN Users u ON al.UserId = u.UserId
      LEFT JOIN Roles r ON u.RoleId = r.RoleId
      WHERE ${whereClause}
      ORDER BY al.CreatedAt DESC
      OFFSET @Offset ROWS
      FETCH NEXT @Limit ROWS ONLY
    `);
    
    // Đếm tổng số
    const countRequest = pool.request();
    if (userId) countRequest.input('UserId', parseInt(userId));
    if (actionType) countRequest.input('ActionType', actionType);
    if (entityType) countRequest.input('EntityType', entityType);
    if (startDate) countRequest.input('StartDate', startDate);
    if (endDate) countRequest.input('EndDate', endDate);
    
    const countResult = await countRequest.query(`
      SELECT COUNT(*) AS Total
      FROM AuditLogs al
      WHERE ${whereClause}
    `);
    
    res.json({
      logs: result.recordset,
      total: countResult.recordset[0].Total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Lỗi khi lấy log đăng nhập' });
  }
});

// GET /api/v1/audit-logs/login - Chỉ lấy log đăng nhập
router.get('/login', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      userId,
      startDate,
      endDate 
    } = req.query;
    
    const pool = await getPool();
    const request = pool.request();
    
    let whereClause = "al.ActionType IN ('Login', 'Logout')";
    
    if (userId) {
      request.input('UserId', parseInt(userId));
      whereClause += ' AND al.UserId = @UserId';
    }
    
    if (startDate) {
      request.input('StartDate', startDate);
      whereClause += ' AND al.CreatedAt >= @StartDate';
    }
    
    if (endDate) {
      request.input('EndDate', endDate);
      whereClause += ' AND al.CreatedAt <= @EndDate';
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    request.input('Offset', offset);
    request.input('Limit', parseInt(limit));
    
    const result = await request.query(`
      SELECT 
        al.LogId,
        al.UserId,
        u.Username,
        u.FullName,
        u.Email,
        r.RoleName,
        al.ActionType,
        al.IpAddress,
        al.UserAgent,
        al.CreatedAt
      FROM AuditLogs al
      LEFT JOIN Users u ON al.UserId = u.UserId
      LEFT JOIN Roles r ON u.RoleId = r.RoleId
      WHERE ${whereClause}
      ORDER BY al.CreatedAt DESC
      OFFSET @Offset ROWS
      FETCH NEXT @Limit ROWS ONLY
    `);
    
    // Đếm tổng số
    const countRequest = pool.request();
    if (userId) countRequest.input('UserId', parseInt(userId));
    if (startDate) countRequest.input('StartDate', startDate);
    if (endDate) countRequest.input('EndDate', endDate);
    
    const countResult = await countRequest.query(`
      SELECT COUNT(*) AS Total
      FROM AuditLogs al
      WHERE ${whereClause}
    `);
    
    res.json({
      logs: result.recordset,
      total: countResult.recordset[0].Total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching login logs:', error);
    res.status(500).json({ message: 'Lỗi khi lấy log đăng nhập' });
  }
});

// GET /api/v1/audit-logs/statistics - Thống kê log
router.get('/statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const pool = await getPool();
    const request = pool.request();
    
    let whereClause = '1=1';
    if (startDate) {
      request.input('StartDate', startDate);
      whereClause += ' AND CreatedAt >= @StartDate';
    }
    if (endDate) {
      request.input('EndDate', endDate);
      whereClause += ' AND CreatedAt <= @EndDate';
    }
    
    // Thống kê theo action type
    const actionStats = await request.query(`
      SELECT 
        ActionType,
        COUNT(*) AS Count
      FROM AuditLogs
      WHERE ${whereClause}
      GROUP BY ActionType
      ORDER BY Count DESC
    `);
    
    // Thống kê theo role
    const roleStats = await request.query(`
      SELECT 
        r.RoleName,
        COUNT(*) AS Count
      FROM AuditLogs al
      LEFT JOIN Users u ON al.UserId = u.UserId
      LEFT JOIN Roles r ON u.RoleId = r.RoleId
      WHERE ${whereClause}
      GROUP BY r.RoleName
      ORDER BY Count DESC
    `);
    
    // Top users hoạt động nhiều nhất
    const topUsers = await request.query(`
      SELECT TOP 10
        u.Username,
        u.FullName,
        r.RoleName,
        COUNT(*) AS ActivityCount
      FROM AuditLogs al
      LEFT JOIN Users u ON al.UserId = u.UserId
      LEFT JOIN Roles r ON u.RoleId = r.RoleId
      WHERE ${whereClause}
      GROUP BY u.UserId, u.Username, u.FullName, r.RoleName
      ORDER BY ActivityCount DESC
    `);
    
    res.json({
      actionStats: actionStats.recordset,
      roleStats: roleStats.recordset,
      topUsers: topUsers.recordset,
    });
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê log' });
  }
});

export default router;

