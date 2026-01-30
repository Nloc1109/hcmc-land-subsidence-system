import dotenv from 'dotenv';
import { getPool } from './db/mssql.js';
import { sequelize } from './db/sequelize.js';

dotenv.config();

async function testMssqlConnection() {
  console.log('🔍 Testing mssql connection (getPool)...');
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT DB_NAME() AS dbName, GETDATE() AS serverTime, SYSTEM_USER AS currentUser;');
    console.log('✅ mssql connection successful!');
    console.log('📊 Result:', result.recordset);
    return true;
  } catch (error) {
    console.error('❌ mssql connection failed:', error.message);
    console.error('   Error details:', error.code || 'N/A');
    if (error.message.includes('Failed to connect')) {
      console.error('   💡 Troubleshooting:');
      console.error('      - Kiểm tra SQL Server có đang chạy không');
      console.error('      - Kiểm tra tên server/instance có đúng không');
      console.error('      - Kiểm tra firewall có chặn port 1433 không');
      console.error('      - Thử kết nối bằng SQL Server Management Studio');
    }
    return false;
  }
}

async function testSequelizeConnection() {
  console.log('\n🔍 Testing Sequelize connection...');
  try {
    await sequelize.authenticate();
    console.log('✅ Sequelize connection successful!');
    
    // Test query
    const [results] = await sequelize.query('SELECT DB_NAME() AS dbName, GETDATE() AS serverTime, SYSTEM_USER AS currentUser;');
    console.log('📊 Result:', results);
    return true;
  } catch (error) {
    console.error('❌ Sequelize connection failed:', error.message);
    console.error('   Error details:', error.original?.message || error.parent?.message || 'N/A');
    if (error.message.includes('Login failed')) {
      console.error('   💡 Troubleshooting:');
      console.error('      - Kiểm tra DB_USER và DB_PASSWORD trong .env có đúng không');
      console.error('      - Kiểm tra SQL Server có cho phép SQL Authentication không');
      console.error('      - Thử kết nối bằng SQL Server Management Studio với cùng user/password');
    }
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database connection tests...\n');
  console.log('📋 Configuration:');
  console.log(`   DB_HOST: ${process.env.DB_HOST || 'not set'}`);
  console.log(`   DB_NAME: ${process.env.DB_NAME || 'not set'}`);
  console.log(`   DB_USER: ${process.env.DB_USER || 'not set'}`);
  console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : 'not set'}`);
  console.log(`   DB_INSTANCE: ${process.env.DB_INSTANCE || 'not set'}`);
  console.log(`   DB_PORT: ${process.env.DB_PORT || 'not set'}`);
  
  // Tính toán server string cho mssql (khác với Sequelize)
  let serverString;
  if (process.env.DB_PORT) {
    serverString = `${process.env.DB_HOST},${process.env.DB_PORT}`;
  } else if (process.env.DB_INSTANCE) {
    serverString = `${process.env.DB_HOST}\\${process.env.DB_INSTANCE}`;
  } else {
    serverString = process.env.DB_HOST || 'not set';
  }
  console.log(`   Server String (mssql): ${serverString}`);
  
  // Tính toán host string cho Sequelize
  let sequelizeHost;
  if (process.env.DB_PORT) {
    sequelizeHost = `${process.env.DB_HOST},${process.env.DB_PORT}`;
  } else {
    sequelizeHost = process.env.DB_HOST || 'not set';
  }
  console.log(`   Host String (Sequelize): ${sequelizeHost}${process.env.DB_INSTANCE && !process.env.DB_PORT ? ` (instanceName: ${process.env.DB_INSTANCE})` : ''}\n`);

  // Test Sequelize trước, đóng pool, rồi test mssql (chỉ 1 kết nối tại một thời điểm)
  const sequelizeOk = await testSequelizeConnection();
  try {
    await sequelize.close();
  } catch (_) {
    // ignore
  }

  const mssqlOk = await testMssqlConnection();

  console.log('\n📊 Summary:');
  console.log(`   Sequelize: ${sequelizeOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`   mssql (getPool): ${mssqlOk ? '✅ OK' : '❌ FAILED'}`);

  if (mssqlOk && sequelizeOk) {
    console.log('\n🎉 All database connections are working!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some connections failed. Please check your configuration.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
