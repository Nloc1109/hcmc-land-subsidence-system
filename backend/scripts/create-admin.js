import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { getPool } from '../src/db/mssql.js';

dotenv.config();

async function createAdmin() {
  try {
    const username = 'thongtran';
    const password = '123456';
    const email = 'thongtran@hcmc-subsidence.gov.vn';
    const fullName = 'Trần Văn Thông';
    
    console.log('Đang tạo tài khoản admin...');
    console.log('Username:', username);
    console.log('Password:', password);
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('Password đã được hash');
    
    const pool = await getPool();
    
    // Kiểm tra xem user đã tồn tại chưa
    const checkRequest = pool.request();
    checkRequest.input('Username', username);
    checkRequest.input('Email', email);
    
    const checkResult = await checkRequest.query(`
      SELECT * FROM Users WHERE Username = @Username OR Email = @Email
    `);
    
    if (checkResult.recordset.length > 0) {
      console.log('⚠️  Tài khoản đã tồn tại!');
      console.log('Thông tin tài khoản:', checkResult.recordset[0]);
      process.exit(0);
    }
    
    // Tìm role Admin
    const roleRequest = pool.request();
    roleRequest.input('RoleName', 'Admin');
    const roleResult = await roleRequest.query(`
      SELECT TOP 1 * FROM Roles WHERE RoleName = @RoleName AND IsActive = 1
    `);
    
    if (!roleResult.recordset[0]) {
      console.log('❌ Không tìm thấy role Admin trong database!');
      process.exit(1);
    }
    
    const adminRole = roleResult.recordset[0];
    console.log('Tìm thấy role Admin:', adminRole.RoleName);
    
    // Tạo user mới
    const insertRequest = pool.request();
    insertRequest.input('Username', username);
    insertRequest.input('Email', email);
    insertRequest.input('PasswordHash', passwordHash);
    insertRequest.input('FullName', fullName);
    insertRequest.input('RoleId', adminRole.RoleId);
    
    const insertResult = await insertRequest.query(`
      INSERT INTO Users (Username, Email, PasswordHash, FullName, RoleId, IsActive, CreatedAt)
      OUTPUT INSERTED.*
      VALUES (@Username, @Email, @PasswordHash, @FullName, @RoleId, 1, GETDATE())
    `);
    
    if (insertResult.recordset.length > 0) {
      const newUser = insertResult.recordset[0];
      console.log('✅ Tài khoản admin đã được tạo thành công!');
      console.log('User ID:', newUser.UserId);
      console.log('Username:', newUser.Username);
      console.log('Email:', newUser.Email);
      console.log('Full Name:', newUser.FullName);
      console.log('Role ID:', newUser.RoleId);
      console.log('\nThông tin đăng nhập:');
      console.log('Username: thongtran');
      console.log('Password: 123456');
    } else {
      console.log('❌ Không thể tạo tài khoản');
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi tạo tài khoản admin:', error);
    process.exit(1);
  }
}

createAdmin();

