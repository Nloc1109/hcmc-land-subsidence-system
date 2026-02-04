import dotenv from 'dotenv';
import { getPool } from '../src/db/mssql.js';

dotenv.config();

async function fixRequestsTable() {
  try {
    console.log('🔌 Đang kết nối database...');
    const pool = await getPool();
    console.log('✅ Đã kết nối database thành công!\n');

    console.log('🔧 Đang sửa bảng Requests...');
    
    // Kiểm tra xem RequestCode có NOT NULL không
    const checkResult = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        IS_NULLABLE,
        DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Requests' AND COLUMN_NAME = 'RequestCode'
    `);

    if (checkResult.recordset.length > 0) {
      const isNullable = checkResult.recordset[0].IS_NULLABLE === 'YES';
      
      if (!isNullable) {
        console.log('📝 Đang bỏ NOT NULL constraint cho RequestCode...');
        await pool.request().query(`
          ALTER TABLE Requests
          ALTER COLUMN RequestCode NVARCHAR(50) NULL
        `);
        console.log('✅ Đã bỏ NOT NULL constraint cho RequestCode');
      } else {
        console.log('✅ RequestCode đã cho phép NULL');
      }
    } else {
      console.log('⚠️  Không tìm thấy cột RequestCode');
    }

    await pool.close();
    console.log('\n✨ Hoàn thành!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

fixRequestsTable();

