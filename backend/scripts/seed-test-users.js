/**
 * Tạo 1 tài khoản test cho mỗi role (Admin, Manager, Analyst, Operator, Viewer).
 * Mật khẩu chung: 123456
 * Chạy: node backend/scripts/seed-test-users.js
 * (từ thư mục gốc dự án: node backend/scripts/seed-test-users.js)
 */
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { getPool } from '../src/db/mssql.js';

dotenv.config();

const TEST_PASSWORD = '123456';

const USERS_BY_ROLE = [
  { roleName: 'Admin', username: 'admin', fullName: 'Nguyễn Văn Admin', email: 'admin@test.local' },
  { roleName: 'Manager', username: 'manager', fullName: 'Trần Thị Quản Lý', email: 'manager@test.local' },
  { roleName: 'Analyst', username: 'analyst', fullName: 'Lê Văn Phân Tích', email: 'analyst@test.local' },
  { roleName: 'Operator', username: 'operator', fullName: 'Hoàng Văn Vận Hành', email: 'operator@test.local' },
  { roleName: 'Viewer', username: 'viewer', fullName: 'Phạm Thị Xem Chỉ Đọc', email: 'viewer@test.local' },
];

// Dùng chung 1 hash cho tất cả (cùng password 123456)
let sharedPasswordHash = null;

async function seedTestUsers() {
  try {
    const pool = await getPool();
    sharedPasswordHash = await bcrypt.hash(TEST_PASSWORD, 10);

    console.log('Đang tạo/cập nhật tài khoản test (mỗi role 1 tài khoản)...\n');

    for (const u of USERS_BY_ROLE) {
      const roleReq = pool.request();
      roleReq.input('RoleName', u.roleName);
      const roleResult = await roleReq.query(`
        SELECT TOP 1 RoleId, RoleName FROM Roles WHERE RoleName = @RoleName AND IsActive = 1
      `);
      const role = roleResult.recordset[0];
      if (!role) {
        console.log(`⚠️  Bỏ qua ${u.roleName}: không tìm thấy role trong DB. Chạy schema.sql trước.`);
        continue;
      }

      const checkReq = pool.request();
      checkReq.input('Username', u.username);
      const existing = await checkReq.query(`SELECT TOP 1 UserId, Username FROM Users WHERE Username = @Username`);
      if (existing.recordset.length > 0) {
        const upReq = pool.request();
        upReq.input('Username', u.username);
        upReq.input('PasswordHash', sharedPasswordHash);
        await upReq.query(`UPDATE Users SET PasswordHash = @PasswordHash, UpdatedAt = GETDATE() WHERE Username = @Username`);
        console.log(`🔄 ${u.username} (${u.roleName}): đã cập nhật mật khẩu → 123456.`);
        continue;
      }

      const insertReq = pool.request();
      insertReq.input('Username', u.username);
      insertReq.input('Email', u.email);
      insertReq.input('PasswordHash', sharedPasswordHash);
      insertReq.input('FullName', u.fullName);
      insertReq.input('RoleId', role.RoleId);
      await insertReq.query(`
        INSERT INTO Users (Username, Email, PasswordHash, FullName, RoleId, IsActive, CreatedAt)
        VALUES (@Username, @Email, @PasswordHash, @FullName, @RoleId, 1, GETDATE())
      `);
      console.log(`✅ ${u.username} (${u.roleName}): đã tạo.`);
    }

    console.log('\n--- Tài khoản test (mật khẩu chung: 123456) ---');
    USERS_BY_ROLE.forEach((u) => console.log(`  ${u.username} / ${u.roleName}`));
    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
}

seedTestUsers();
