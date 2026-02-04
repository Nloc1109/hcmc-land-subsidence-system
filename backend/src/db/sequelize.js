import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'DESKTOP-QH7JC2G';

const DB_NAME = process.env.DB_NAME || 'HCMC_LandSubsidence';
const DB_USER = process.env.DB_USER || 'sa';
const DB_PASSWORD = process.env.DB_PASSWORD || '11092005';
const DB_INSTANCE = process.env.DB_INSTANCE; // Named instance như SQLEXPRESS, LOC1109
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined;

// Xây dựng host và options cho Sequelize (đồng bộ với mssql.js để tránh ECONNRESET)
const dialectOptions = {
  options: {
    encrypt: false,
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true' || true,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
};

// Nếu dùng named instance (không có port), thêm instanceName
if (DB_INSTANCE && !DB_PORT) {
  dialectOptions.options.instanceName = DB_INSTANCE;
}

// SQL Server Authentication - đơn giản và ổn định
export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  ...(DB_PORT ? { port: DB_PORT } : {}),
  dialect: 'mssql',
  dialectOptions,
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

