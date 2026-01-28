import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../db/mssql.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = '7d';

function generateToken(user) {
  return jwt.sign(
    {
      sub: user.UserId,
      username: user.Username,
      role: user.roleName || 'User',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Helper: map bản ghi User + Role thành object an toàn cho frontend
function mapUserRow(row) {
  return {
    id: row.UserId,
    username: row.Username,
    fullName: row.FullName,
    email: row.Email,
    phoneNumber: row.PhoneNumber,
    role: row.RoleName || row.roleName || 'User',
  };
}

// Lấy danh sách role cho màn hình đăng ký (ẩn Admin)
router.get('/roles', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query(
        "SELECT RoleId, RoleName, Description FROM Roles WHERE IsActive = 1 AND RoleName <> 'Admin' ORDER BY RoleId ASC"
      );

    return res.json({ roles: result.recordset });
  } catch (err) {
    console.error('Get roles error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách vai trò' });
  }
});

// Đăng ký (lưu vào DB: bảng Users) với chọn vai trò (trừ Admin)
router.post('/register', async (req, res) => {
  try {
    const { fullName, username, email, phoneNumber, password, roleId, roleName } = req.body || {};

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    const pool = await getPool();
    const request = pool.request();

    // Kiểm tra trùng username/email
    request.input('Username', username);
    request.input('Email', email);
    let result = await request.query(
      'SELECT TOP 1 * FROM Users WHERE Username = @Username OR Email = @Email'
    );
    if (result.recordset.length > 0) {
      return res.status(400).json({ message: 'Tên đăng nhập hoặc email đã được sử dụng' });
    }

    // Xác định role theo lựa chọn, nhưng không cho phép Admin
    let roleWhere = "IsActive = 1 AND RoleName <> 'Admin'";
    const roleReq = pool.request();
    if (roleId) {
      roleReq.input('RoleId', roleId);
      roleWhere += ' AND RoleId = @RoleId';
    } else if (roleName) {
      roleReq.input('RoleName', roleName);
      roleWhere += ' AND RoleName = @RoleName';
    }

    result = await roleReq.query(`SELECT TOP 1 * FROM Roles WHERE ${roleWhere}`);
    let roleRow = result.recordset[0];

    // Nếu không tìm thấy → fallback Viewer/User/Admin như logic cũ
    if (!roleRow) {
      const fallbackNames = ['Viewer', 'User', 'Admin'];
      for (const name of fallbackNames) {
        // eslint-disable-next-line no-await-in-loop
        const fb = await pool
          .request()
          .input('Name', name)
          .query('SELECT TOP 1 * FROM Roles WHERE RoleName = @Name AND IsActive = 1');
        if (fb.recordset[0]) {
          roleRow = fb.recordset[0];
          break;
        }
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Chèn user mới
    const insertReq = pool.request();
    insertReq.input('Username', username);
    insertReq.input('Email', email);
    insertReq.input('PasswordHash', passwordHash);
    insertReq.input('FullName', fullName);
    insertReq.input('PhoneNumber', phoneNumber || null);
    insertReq.input('RoleId', roleRow ? roleRow.RoleId : 1);

    const insertResult = await insertReq.query(
      `INSERT INTO Users (Username, Email, PasswordHash, FullName, PhoneNumber, RoleId, IsActive)
       OUTPUT INSERTED.*
       VALUES (@Username, @Email, @PasswordHash, @FullName, @PhoneNumber, @RoleId, 1);`
    );

    const userRow = insertResult.recordset[0];
    const userWithRole = { ...userRow, roleName: roleRow?.RoleName || 'User' };

    const token = generateToken(userWithRole);
    const safeUser = mapUserRow({ ...userRow, RoleName: roleRow?.RoleName || 'User' });

    return res.status(201).json({
      message: 'Đăng ký thành công',
      user: safeUser,
      token,
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ khi đăng ký' });
  }
});

// Đăng nhập (kiểm tra từ DB: bảng Users)
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username && !email) {
      return res.status(400).json({ message: 'Vui lòng nhập tên đăng nhập hoặc email' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Vui lòng nhập mật khẩu!' });
    }

    const pool = await getPool();
    const request = pool.request();
    if (username) request.input('Username', username);
    if (email) request.input('Email', email);

    const whereParts = [];
    if (username) whereParts.push('Username = @Username');
    if (email) whereParts.push('Email = @Email');
    const whereClause = whereParts.join(' OR ');

    let result = await request.query(`SELECT TOP 1 * FROM Users WHERE ${whereClause}`);
    const userRow = result.recordset[0];
    if (!userRow) {
      return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
    }

    const ok = await bcrypt.compare(String(password), userRow.PasswordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
    }

    // Lấy role
    result = await pool
      .request()
      .input('RoleId', userRow.RoleId)
      .query('SELECT TOP 1 * FROM Roles WHERE RoleId = @RoleId');
    const roleRow = result.recordset[0];

    const userWithRole = { ...userRow, roleName: roleRow?.RoleName || 'User' };
    const token = generateToken(userWithRole);
    const safeUser = mapUserRow({ ...userRow, RoleName: roleRow?.RoleName || 'User' });

    return res.json({
      message: 'Đăng nhập thành công',
      user: safeUser,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Lỗi máy chủ khi đăng nhập' });
  }
});

// Lấy thông tin người dùng từ token (đọc từ DB)
router.get('/me', async (req, res) => {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (!token) {
    return res.status(401).json({ message: 'Thiếu token' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const pool = await getPool();
    const result = await pool
      .request()
      .input('UserId', payload.sub)
      .query(
        `SELECT u.*, r.RoleName
         FROM Users u
         LEFT JOIN Roles r ON r.RoleId = u.RoleId
         WHERE u.UserId = @UserId`
      );

    const row = result.recordset[0];
    if (!row) {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }

    const safeUser = mapUserRow(row);
    return res.json({ user: safeUser });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
});

export default router;

