import dotenv from 'dotenv';
import { getPool } from '../src/db/mssql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createRequestsTable() {
  try {
    console.log('🔌 Đang kết nối database...');
    const pool = await getPool();
    console.log('✅ Đã kết nối database thành công!\n');

    // Đọc file SQL schema
    const schemaPath = path.join(__dirname, '../../docs/database/requests_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📝 Đang tạo bảng Requests...');
    
    // Chạy từng câu lệnh SQL (tách bằng GO)
    const statements = schemaSQL
      .split('GO')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await pool.request().query(statement);
          console.log(`✅ Đã thực thi câu lệnh ${i + 1}/${statements.length}`);
        } catch (error) {
          // Bỏ qua lỗi nếu bảng/trigger đã tồn tại
          if (error.message.includes('already exists') || error.message.includes('There is already')) {
            console.log(`⚠️  Đã bỏ qua (đã tồn tại): ${i + 1}/${statements.length}`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log('\n✨ Hoàn thành! Bảng Requests đã được tạo thành công!\n');

    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi tạo bảng Requests:', error);
    process.exit(1);
  }
}

createRequestsTable();

