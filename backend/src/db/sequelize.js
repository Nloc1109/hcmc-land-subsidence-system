import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const DB_HOST = process.env.DB_HOST || '21AK22-COM';
const DB_NAME = process.env.DB_NAME || 'HCMC_LandSubsidence';
const DB_USER = process.env.DB_USER || 'sa';
const DB_PASSWORD = process.env.DB_PASSWORD || '';

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: 'mssql',
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  },
  logging: false,
});

