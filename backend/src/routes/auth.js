import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';

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

// Lấy danh sách role cho màn hình đăng ký (ẩn Admin)
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.findAll({
      where: {
        IsActive: true,
        RoleName: { [Op.ne]: 'Admin' },
      },
      attributes: ['RoleId', 'RoleName', 'Description'],
      order: [['RoleId', 'ASC']],
    });
    return res.json({ roles });
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

    const existing = await User.findOne({
      where: {
        [Op.or]: [{ Username: username }, { Email: email }],
      },
    });
    if (existing) {
      return res.status(400).json({ message: 'Tên đăng nhập hoặc email đã được sử dụng' });
    }

    // Xác định role theo lựa chọn, nhưng không cho phép Admin
    let roleWhere = {
      IsActive: true,
      RoleName: { [Op.ne]: 'Admin' },
    };

    if (roleId) {
      roleWhere = { ...roleWhere, RoleId: roleId };
    } else if (roleName) {
      roleWhere = { ...roleWhere, RoleName: roleName };
    }

    let role = await Role.findOne({ where: roleWhere });

    // Nếu không tìm thấy (ví dụ user cố tình gửi Admin hoặc role sai) → fallback Viewer/User
    if (!role) {
      role = await Role.findOne({ where: { RoleName: 'Viewer', IsActive: true } });
      if (!role) {
        role =
          (await Role.findOne({ where: { RoleName: 'User', IsActive: true } })) ||
          (await Role.findOne({
            // Chỉ dùng Admin làm fallback cuối cùng nếu bắt buộc
            where: { RoleName: 'Admin', IsActive: true },
          }));
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      Username: username,
      Email: email,
      PasswordHash: passwordHash,
      FullName: fullName,
      PhoneNumber: phoneNumber || null,
      RoleId: role ? role.RoleId : 1,
      IsActive: true,
    });

    const token = generateToken({ ...user.get(), roleName: role?.RoleName || 'User' });
    const safeUser = {
      id: user.UserId,
      username: user.Username,
      fullName: user.FullName,
      email: user.Email,
      phoneNumber: user.PhoneNumber,
      role: role?.RoleName || 'User',
    };

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

    const where = { [Op.or]: [] };
    if (username) where[Op.or].push({ Username: username });
    if (email) where[Op.or].push({ Email: email });

    const user = await User.findOne({ where });
    if (!user) {
      return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
    }

    const ok = await bcrypt.compare(String(password), user.PasswordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
    }

    const role = await Role.findOne({ where: { RoleId: user.RoleId } });
    const token = generateToken({ ...user.get(), roleName: role?.RoleName || 'User' });
    const safeUser = {
      id: user.UserId,
      username: user.Username,
      fullName: user.FullName,
      email: user.Email,
      phoneNumber: user.PhoneNumber,
      role: role?.RoleName || 'User',
    };

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
    const user = await User.findByPk(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }
    const role = await Role.findOne({ where: { RoleId: user.RoleId } });
    const safeUser = {
      id: user.UserId,
      username: user.Username,
      fullName: user.FullName,
      email: user.Email,
      phoneNumber: user.PhoneNumber,
      role: role?.RoleName || 'User',
    };
    return res.json({ user: safeUser });
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
});

export default router;


