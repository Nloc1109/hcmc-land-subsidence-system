import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { getPool } from './db/mssql.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/v1/auth', authRouter);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'hcmc-land-subsidence-backend' });
});

// DB connectivity test (Windows Authentication)
app.get('/api/db-test', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT DB_NAME() AS dbName, GETDATE() AS serverTime;');
    res.json({ ok: true, rows: result.recordset });
  } catch (err) {
    res.status(500).json({
      ok: false,
      message: 'DB connection failed',
      error: String(err?.message || err),
    });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});


