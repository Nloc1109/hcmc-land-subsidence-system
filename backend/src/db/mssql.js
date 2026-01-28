import dotenv from 'dotenv';
import mssql from 'mssql';

dotenv.config();

const DB_HOST = process.env.DB_HOST || '21AK22-COM';
const DB_NAME = process.env.DB_NAME || 'HCMC_LandSubsidence';
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

export const sqlConfig = {
  server: DB_HOST,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let poolPromise;

export function getPool() {
  if (!poolPromise) {
    poolPromise = mssql.connect(sqlConfig);
  }
  return poolPromise;
}