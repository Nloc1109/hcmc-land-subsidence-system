import express from 'express';
import bcrypt from 'bcryptjs';
import { getPool } from '../db/mssql.js';
import { authenticate, requireAdmin as checkAdmin } from '../middleware/auth.js';

const router = express.Router();

// Tất cả routes đều cần authenticate và requireAdmin
router.use(authenticate);
router.use(checkAdmin);

// GET /api/v1/users - Danh sách người dùng
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, roleId, isActive } = req.query;
    const pool = await getPool();
    const request = pool.request();
    
    let whereClause = '1=1';
    if (search) {
      request.input('Search', `%${search}%`);
      whereClause += ` AND (Username LIKE @Search OR Email LIKE @Search OR FullName LIKE @Search)`;
    }
    if (roleId) {
      request.input('RoleId', parseInt(roleId));
      whereClause += ` AND u.RoleId = @RoleId`;
    }
    if (isActive !== undefined) {
      request.input('IsActive', isActive === 'true' ? 1 : 0);
      whereClause += ` AND u.IsActive = @IsActive`;
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    request.input('Offset', offset);
    request.input('Limit', parseInt(limit));
    
    const result = await request.query(`
      SELECT 
        u.UserId,
        u.Username,
        u.Email,
        u.FullName,
        u.PhoneNumber,
        u.RoleId,
        r.RoleName,
        u.IsActive,
        u.LastLoginAt,
        u.CreatedAt,
        u.UpdatedAt
      FROM Users u
      LEFT JOIN Roles r ON u.RoleId = r.RoleId
      WHERE ${whereClause}
      ORDER BY u.CreatedAt DESC
      OFFSET @Offset ROWS
      FETCH NEXT @Limit ROWS ONLY
    `);
    
    // Đếm tổng số
    const countRequest = pool.request();
    if (search) countRequest.input('Search', `%${search}%`);
    if (roleId) countRequest.input('RoleId', parseInt(roleId));
    if (isActive !== undefined) countRequest.input('IsActive', isActive === 'true' ? 1 : 0);
    
    const countResult = await countRequest.query(`
      SELECT COUNT(*) AS Total
      FROM Users u
      WHERE ${whereClause}
    `);
    
    res.json({
      users: result.recordset,
      total: countResult.recordset[0].Total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng' });
  }
});

// POST /api/v1/users/:id/reset-password - Reset mật khẩu (phải đặt trước route /:id)
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    console.log('Reset password request:', { id, hasPassword: !!newPassword });
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }
    
    const pool = await getPool();
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    const request = pool.request();
    request.input('UserId', parseInt(id));
    request.input('PasswordHash', passwordHash);
    
    // Kiểm tra user tồn tại trước
    const checkResult = await request.query(`
      SELECT UserId, Username FROM Users WHERE UserId = @UserId
    `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Update password
    const updateRequest = pool.request();
    updateRequest.input('UserId', parseInt(id));
    updateRequest.input('PasswordHash', passwordHash);
    
    const updateResult = await updateRequest.query(`
      UPDATE Users 
      SET PasswordHash = @PasswordHash, UpdatedAt = GETDATE()
      WHERE UserId = @UserId
    `);
    
    console.log('Password reset successful for user:', checkResult.recordset[0].Username);
    
    res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    console.error('Error resetting password:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Lỗi khi đặt lại mật khẩu', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// GET /api/v1/users/:id - Chi tiết người dùng
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    if (Number.isNaN(userId) || userId < 1) {
      return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
    }
    const pool = await getPool();
    const request = pool.request();
    request.input('UserId', userId);

    const result = await request.query(`
      SELECT 
        u.UserId,
        u.Username,
        u.Email,
        u.FullName,
        u.PhoneNumber,
        u.RoleId,
        r.RoleName,
        u.IsActive,
        u.LastLoginAt,
        u.CreatedAt,
        u.UpdatedAt
      FROM Users u
      LEFT JOIN Roles r ON u.RoleId = r.RoleId
      WHERE u.UserId = @UserId
    `);

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.json({ user: result.recordset[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      message: 'Lỗi khi lấy thông tin người dùng',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// POST /api/v1/users - Tạo người dùng mới
router.post('/', async (req, res) => {
  try {
    const { username, email, password, fullName, phoneNumber, roleId } = req.body;
    
    if (!username || !email || !password || !fullName || !roleId) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    
    const pool = await getPool();
    const request = pool.request();
    
    // Kiểm tra trùng username/email
    request.input('Username', username);
    request.input('Email', email);
    const checkResult = await request.query(`
      SELECT TOP 1 * FROM Users WHERE Username = @Username OR Email = @Email
    `);
    
    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ message: 'Tên đăng nhập hoặc email đã được sử dụng' });
    }
    
    // Kiểm tra role tồn tại
    const roleRequest = pool.request();
    roleRequest.input('RoleId', parseInt(roleId));
    const roleResult = await roleRequest.query(`
      SELECT TOP 1 * FROM Roles WHERE RoleId = @RoleId AND IsActive = 1
    `);
    
    if (roleResult.recordset.length === 0) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Tạo user mới
    const insertRequest = pool.request();
    insertRequest.input('Username', username);
    insertRequest.input('Email', email);
    insertRequest.input('PasswordHash', passwordHash);
    insertRequest.input('FullName', fullName);
    insertRequest.input('PhoneNumber', phoneNumber || null);
    insertRequest.input('RoleId', parseInt(roleId));
    
    const insertResult = await insertRequest.query(`
      INSERT INTO Users (Username, Email, PasswordHash, FullName, PhoneNumber, RoleId, IsActive, CreatedAt)
      OUTPUT INSERTED.*
      VALUES (@Username, @Email, @PasswordHash, @FullName, @PhoneNumber, @RoleId, 1, GETDATE())
    `);
    
    const newUser = insertResult.recordset[0];
    delete newUser.PasswordHash;
    
    res.status(201).json({
      message: 'Tạo người dùng thành công',
      user: newUser,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Lỗi khi tạo người dùng' });
  }
});

// PUT /api/v1/users/:id - Cập nhật người dùng
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phoneNumber, roleId, isActive, password } = req.body;
    
    const pool = await getPool();
    const request = pool.request();
    request.input('UserId', parseInt(id));
    
    // Kiểm tra user tồn tại
    const checkResult = await request.query(`
      SELECT TOP 1 * FROM Users WHERE UserId = @UserId
    `);
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    // Kiểm tra email trùng (nếu có thay đổi)
    if (email) {
      const emailRequest = pool.request();
      emailRequest.input('Email', email);
      emailRequest.input('UserId', parseInt(id));
      const emailResult = await emailRequest.query(`
        SELECT TOP 1 * FROM Users WHERE Email = @Email AND UserId <> @UserId
      `);
      if (emailResult.recordset.length > 0) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
    }
    
    // Kiểm tra role (nếu có thay đổi)
    if (roleId) {
      const roleRequest = pool.request();
      roleRequest.input('RoleId', parseInt(roleId));
      const roleResult = await roleRequest.query(`
        SELECT TOP 1 * FROM Roles WHERE RoleId = @RoleId AND IsActive = 1
      `);
      if (roleResult.recordset.length === 0) {
        return res.status(400).json({ message: 'Vai trò không hợp lệ' });
      }
    }
    
    // Build update query
    const updateFields = [];
    const updateRequest = pool.request();
    updateRequest.input('UserId', parseInt(id));
    
    if (fullName) {
      updateRequest.input('FullName', fullName);
      updateFields.push('FullName = @FullName');
    }
    if (email) {
      updateRequest.input('Email', email);
      updateFields.push('Email = @Email');
    }
    if (phoneNumber !== undefined) {
      updateRequest.input('PhoneNumber', phoneNumber || null);
      updateFields.push('PhoneNumber = @PhoneNumber');
    }
    if (roleId) {
      updateRequest.input('RoleId', parseInt(roleId));
      updateFields.push('RoleId = @RoleId');
    }
    if (isActive !== undefined) {
      updateRequest.input('IsActive', isActive ? 1 : 0);
      updateFields.push('IsActive = @IsActive');
    }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updateRequest.input('PasswordHash', passwordHash);
      updateFields.push('PasswordHash = @PasswordHash');
    }
    
    updateFields.push('UpdatedAt = GETDATE()');
    
    const updateQuery = `
      UPDATE Users 
      SET ${updateFields.join(', ')}
      OUTPUT INSERTED.*
      WHERE UserId = @UserId
    `;
    
    const updateResult = await updateRequest.query(updateQuery);
    const updatedUser = updateResult.recordset[0];
    delete updatedUser.PasswordHash;
    
    res.json({
      message: 'Cập nhật người dùng thành công',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật người dùng' });
  }
});

// DELETE /api/v1/users/:id - Xóa người dùng (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const request = pool.request();
    request.input('UserId', parseInt(id));
    
    const result = await request.query(`
      UPDATE Users 
      SET IsActive = 0, UpdatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE UserId = @UserId
    `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    res.json({ message: 'Xóa người dùng thành công' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Lỗi khi xóa người dùng' });
  }
});

export default router;

