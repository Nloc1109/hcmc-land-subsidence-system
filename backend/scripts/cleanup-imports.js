/**
 * Script xóa bớt imports, chỉ giữ lại 10 imports mới nhất
 * Chạy: node backend/scripts/cleanup-imports.js
 */

import dotenv from 'dotenv';
import { getPool } from '../src/db/mssql.js';

dotenv.config();

async function cleanupImports() {
  try {
    const pool = await getPool();
    
    console.log('🧹 Đang dọn dẹp imports...\n');
    
    // 1. Đếm số imports hiện có
    const countResult = await pool.request()
      .query('SELECT COUNT(*) AS total FROM DataImports');
    const currentCount = countResult.recordset[0].total;
    console.log(`📊 Hiện có ${currentCount} imports`);
    
    if (currentCount <= 10) {
      console.log('✅ Số lượng imports đã đúng (≤ 10), không cần xóa.');
      return;
    }
    
    // 2. Lấy danh sách ImportId của 10 imports mới nhất (giữ lại)
    const keepResult = await pool.request()
      .query(`
        SELECT TOP 10 ImportId 
        FROM DataImports 
        ORDER BY CreatedAt DESC, ImportId DESC
      `);
    
    const keepIds = keepResult.recordset.map(row => row.ImportId);
    console.log(`📌 Giữ lại ${keepIds.length} imports mới nhất:`, keepIds);
    
    if (keepIds.length === 0) {
      console.log('⚠️ Không tìm thấy imports nào để giữ lại.');
      return;
    }
    
    // 3. Xóa DataImportDetails của các imports sẽ bị xóa
    // Sử dụng cách an toàn: xóa tất cả trừ những cái cần giữ
    // Vì ImportId là số nguyên, ta có thể sử dụng cách này an toàn
    const keepIdsStr = keepIds.join(',');
    
    await pool.request().query(`
      DELETE FROM DataImportDetails
      WHERE ImportId NOT IN (${keepIdsStr})
    `);
    console.log(`🗑️ Đã xóa chi tiết của các imports cũ`);
    
    // 4. Xóa các imports cũ (không nằm trong danh sách giữ lại)
    await pool.request().query(`
      DELETE FROM DataImports
      WHERE ImportId NOT IN (${keepIdsStr})
    `);
    console.log(`🗑️ Đã xóa các imports cũ`);
    
    // 5. Kiểm tra lại số lượng
    const finalCountResult = await pool.request()
      .query('SELECT COUNT(*) AS total FROM DataImports');
    const finalCount = finalCountResult.recordset[0].total;
    
    console.log(`\n✅ Hoàn thành! Còn lại ${finalCount} imports`);
    console.log(`📉 Đã xóa ${currentCount - finalCount} imports\n`);
    
  } catch (error) {
    console.error('❌ Lỗi khi dọn dẹp imports:', error);
    throw error;
  }
}

// Chạy script
cleanupImports()
  .then(() => {
    console.log('✨ Script hoàn thành!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script thất bại:', error);
    process.exit(1);
  });

