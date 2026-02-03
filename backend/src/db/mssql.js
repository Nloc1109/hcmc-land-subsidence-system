import dotenv from 'dotenv';
import mssql from 'mssql';

dotenv.config();

const DB_HOST = process.env.DB_HOST || '21AK22-COM';
const DB_NAME = process.env.DB_NAME || 'HCMC_LandSubsidence';
const DB_USER = process.env.DB_USER || 'sa';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_INSTANCE = process.env.DB_INSTANCE; // Named instance như LOC1109, SQLEXPRESS
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined;

// Xây dựng server string với instance nếu có
let serverString;
if (DB_INSTANCE && !DB_PORT) {
  // Dùng named instance (không có port)
  serverString = `${DB_HOST}\\${DB_INSTANCE}`;
} else {
  // Dùng host bình thường (có port hoặc default)
  serverString = DB_HOST;
}

// SQL Server Authentication (dùng user/password) - đơn giản và ổn định hơn
const sqlConfig = {
  server: serverString,
  ...(DB_PORT ? { port: DB_PORT } : {}), // Thêm port nếu có
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true' || true,
    enableArithAbort: true,
    // Nếu dùng named instance (không có port), thêm instanceName
    ...(DB_INSTANCE && !DB_PORT ? { instanceName: DB_INSTANCE } : {}),
  },
  // Timeout tăng lên 30s cho named instance
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

let poolPromise;

export function getPool() {
  if (!poolPromise) {
    poolPromise = mssql.connect(sqlConfig);
  }
  return poolPromise;
}