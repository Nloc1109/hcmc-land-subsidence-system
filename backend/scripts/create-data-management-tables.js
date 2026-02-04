import dotenv from 'dotenv';
import { getPool } from '../src/db/mssql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createDataManagementTables() {
  try {
    console.log('🔌 Đang kết nối database...');
    const pool = await getPool();
    console.log('✅ Đã kết nối database thành công!');

    // Đọc file SQL schema
    const sqlFilePath = path.join(__dirname, '../../docs/database/data-management-schema.sql');
    console.log(`📖 Đang đọc file SQL: ${sqlFilePath}`);
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`File SQL không tồn tại: ${sqlFilePath}`);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Tách các câu lệnh SQL (tách theo GO hoặc dòng trống)
    // Xử lý cả GO trên dòng riêng và GO sau câu lệnh
    let statements = sqlContent
      .split(/\n\s*GO\s*\n/i)  // Tách theo GO trên dòng riêng
      .map(s => s.trim())
      .filter(s => {
        // Bỏ qua comment thuần túy và dòng trống
        const trimmed = s.trim();
        return trimmed.length > 0 && 
               !trimmed.startsWith('--') && 
               !trimmed.match(/^--.*$/m); // Không phải toàn bộ là comment
      });

    // Nếu không tách được, thử cách khác
    if (statements.length === 0 || statements.every(s => s.startsWith('--'))) {
      // Tách theo dòng và nhóm lại
      const lines = sqlContent.split('\n');
      let currentStatement = '';
      statements = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        // Bỏ qua comment và dòng trống
        if (trimmed === '' || trimmed.startsWith('--') || trimmed.toUpperCase() === 'GO') {
          if (currentStatement.trim().length > 0) {
            statements.push(currentStatement.trim());
            currentStatement = '';
          }
          continue;
        }
        currentStatement += line + '\n';
      }
      
      // Thêm statement cuối cùng
      if (currentStatement.trim().length > 0) {
        statements.push(currentStatement.trim());
      }
    }

    // Lọc lại để loại bỏ các statement chỉ có comment
    statements = statements
      .map(s => s.trim())
      .filter(s => {
        const withoutComments = s.replace(/--.*$/gm, '').trim();
        return withoutComments.length > 0;
      });

    console.log(`📝 Tìm thấy ${statements.length} câu lệnh SQL để thực thi...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Bỏ qua các comment và dòng trống
      if (statement.trim().length === 0 || statement.trim().startsWith('--')) {
        continue;
      }

      try {
        console.log(`⏳ Đang thực thi câu lệnh ${i + 1}/${statements.length}...`);
        await pool.request().query(statement);
        successCount++;
        console.log(`✅ Câu lệnh ${i + 1} thành công\n`);
      } catch (error) {
        // Nếu lỗi là "table already exists", bỏ qua
        if (error.message.includes('already exists') || 
            error.message.includes('already an object') ||
            error.message.includes('There is already an object')) {
          console.log(`⚠️  Câu lệnh ${i + 1} đã tồn tại (bỏ qua)\n`);
          successCount++;
        } else {
          errorCount++;
          console.error(`❌ Lỗi ở câu lệnh ${i + 1}:`, error.message);
          console.error(`📄 Nội dung câu lệnh:\n${statement.substring(0, 200)}...\n`);
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📊 Kết quả:`);
    console.log(`   ✅ Thành công: ${successCount}`);
    console.log(`   ❌ Lỗi: ${errorCount}`);
    console.log('='.repeat(50));

    if (errorCount === 0) {
      console.log('\n🎉 Đã tạo các bảng data-management thành công!');
    } else {
      console.log('\n⚠️  Có một số lỗi xảy ra, vui lòng kiểm tra lại.');
    }

    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi tạo bảng:', error);
    process.exit(1);
  }
}

createDataManagementTables();

