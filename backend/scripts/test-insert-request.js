import dotenv from 'dotenv';
import { getPool } from '../src/db/mssql.js';

dotenv.config();

async function testInsertRequest() {
  try {
    console.log('🔌 Đang kết nối database...');
    const pool = await getPool();
    console.log('✅ Đã kết nối database thành công!\n');

    // Lấy một user không phải Viewer hoặc Admin
    const userResult = await pool.request().query(`
      SELECT TOP 1 u.UserId, u.Username, r.RoleName
      FROM Users u
      INNER JOIN Roles r ON u.RoleId = r.RoleId
      WHERE u.IsActive = 1 AND r.RoleName NOT IN ('Viewer', 'Admin')
    `);

    if (userResult.recordset.length === 0) {
      console.log('❌ Không tìm thấy user nào để test (cần user không phải Viewer/Admin)');
      await pool.close();
      process.exit(1);
    }

    const testUser = userResult.recordset[0];
    console.log(`📝 Sử dụng user test: ${testUser.Username} (${testUser.RoleName})`);

    // Lấy một Admin user
    const adminResult = await pool.request().query(`
      SELECT TOP 1 u.UserId, u.Username
      FROM Users u
      INNER JOIN Roles r ON u.RoleId = r.RoleId
      WHERE u.IsActive = 1 AND r.RoleName = 'Admin'
    `);

    if (adminResult.recordset.length === 0) {
      console.log('❌ Không tìm thấy Admin user');
      await pool.close();
      process.exit(1);
    }

    const adminUser = adminResult.recordset[0];
    console.log(`👤 Admin user: ${adminUser.Username}\n`);

    // Test INSERT
    console.log('🧪 Đang test INSERT...');
    const insertRequest = pool.request();
    insertRequest.input('Title', 'Test Request');
    insertRequest.input('Description', 'This is a test request');
    insertRequest.input('Priority', 'Green');
    insertRequest.input('AssignedTo', testUser.UserId);
    insertRequest.input('CreatedBy', adminUser.UserId);
    insertRequest.input('DueDate', null);

    try {
      const result = await insertRequest.query(`
        INSERT INTO Requests (Title, Description, Priority, AssignedTo, CreatedBy, DueDate, Status)
        OUTPUT INSERTED.*
        VALUES (@Title, @Description, @Priority, @AssignedTo, @CreatedBy, @DueDate, 'Pending')
      `);

      console.log('✅ INSERT thành công!');
      console.log('📊 Kết quả:', result.recordset[0]);

      // Đợi trigger chạy
      await new Promise(resolve => setTimeout(resolve, 200));

      // Kiểm tra RequestCode
      const checkResult = await pool.request()
        .input('RequestId', result.recordset[0].RequestId)
        .query('SELECT RequestCode FROM Requests WHERE RequestId = @RequestId');

      console.log('📝 RequestCode:', checkResult.recordset[0].RequestCode);

      // Xóa test data
      await pool.request()
        .input('RequestId', result.recordset[0].RequestId)
        .query('DELETE FROM Requests WHERE RequestId = @RequestId');

      console.log('🗑️  Đã xóa test data');

    } catch (insertError) {
      console.error('❌ INSERT thất bại!');
      console.error('Error message:', insertError.message);
      console.error('Error code:', insertError.code);
      console.error('Error number:', insertError.number);
      if (insertError.originalError) {
        console.error('Original error:', insertError.originalError);
      }
      throw insertError;
    }

    await pool.close();
    console.log('\n✨ Test hoàn thành!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

testInsertRequest();

