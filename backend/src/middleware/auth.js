import jwt from 'jsonwebtoken';
import { getPool } from '../db/mssql.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Middleware xác thực JWT
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Thiếu token xác thực' });
    }

    const token = authHeader.substring(7);
    const payload = jwt.verify(token, JWT_SECRET);

    const queryUser = async () => {
      const pool = await getPool();
      return pool
        .request()
        .input('UserId', payload.sub)
        .query(
          `SELECT u.*, r.RoleName
           FROM Users u
           LEFT JOIN Roles r ON r.RoleId = u.RoleId
           WHERE u.UserId = @UserId AND u.IsActive = 1`
        );
    };

    let result;
    try {
      result = await queryUser();
    } catch (firstErr) {
      const msg = String(firstErr?.message || '');
      const isConnection = /ECONNREFUSED|ETIMEDOUT|ConnectionError|Failed to connect/i.test(msg);
      if (isConnection) {
        await new Promise((r) => setTimeout(r, 400));
        result = await queryUser();
      } else {
        throw firstErr;
      }
    }

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc người dùng đã bị vô hiệu' });
    }

    req.user = {
      userId: result.recordset[0].UserId,
      username: result.recordset[0].Username,
      role: result.recordset[0].RoleName,
      roleId: result.recordset[0].RoleId,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token đã hết hạn' });
    }
    console.error('Auth middleware error:', error);
    const isDbError = /ECONNREFUSED|ETIMEDOUT|ConnectionError|Failed to connect|Invalid object name/i.test(String(error.message || ''));
    if (isDbError) {
      return res.status(503).json({ message: 'Tạm thời không kết nối được. Vui lòng thử lại sau.' });
    }
    return res.status(500).json({ message: 'Lỗi xác thực' });
  }
};

// Middleware kiểm tra quyền Admin
export const requireAdmin = async (req, res, next) => {
  try {
    // Đảm bảo authenticate đã chạy trước
    if (!req.user) {
      return res.status(401).json({ message: 'Chưa xác thực' });
    }

    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Chỉ Admin mới có quyền truy cập' });
    }

    next();
  } catch (error) {
    console.error('RequireAdmin middleware error:', error);
    return res.status(500).json({ message: 'Lỗi kiểm tra quyền' });
  }
};

