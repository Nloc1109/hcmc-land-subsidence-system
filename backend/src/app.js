import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import OpenAI from 'openai';

import { getPool } from './db/mssql.js';
import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';
import alertsRouter from './routes/alerts.js';
import devicesRouter from './routes/devices.js';
import usersRouter from './routes/users.js';
import auditLogsRouter from './routes/audit-logs.js';

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT || 3000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// CORS configuration - allow multiple origins in development
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Parse allowed origins from environment variable (comma-separated)
      const allowedOrigins = CORS_ORIGIN.split(',').map(o => o.trim());
      
      // In development, also allow any localhost port
      const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);
      
      if (allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && isLocalhost)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Auth routes
app.use('/api/v1/auth', authRouter);

// Dashboard routes
app.use('/api/v1/dashboard', dashboardRouter);

// Alerts routes
app.use('/api/v1/alerts', alertsRouter);

// Devices routes
app.use('/api/v1/devices', devicesRouter);

// Users management routes (Admin only)
app.use('/api/v1/users', usersRouter);

// Audit logs routes (Admin only)
app.use('/api/v1/audit-logs', auditLogsRouter);

// Health check (giữ lại cả endpoint cũ lẫn mới nếu cần về sau)
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

/**
 * GET /api/news/subsidence
 * Trả về danh sách tin tức được AI tóm tắt về sụt lún đất
 * ở TP.HCM và Việt Nam (mô phỏng, không gọi nguồn báo chí trực tiếp).
 */
// OpenAI client (chỉ khởi tạo nếu có API key)
let openaiClient = null;
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * GET /api/news/subsidence
 * Query: since (ISO date, optional) — nếu có thì chỉ trả tin từ ngày đó đến nay (fetch tăng dần).
 */
app.get('/api/news/subsidence', async (req, res) => {
  try {
    if (!openaiClient) {
      return res.status(500).json({
        message: 'OPENAI_API_KEY chưa cấu hình hoặc không hợp lệ. Không thể lấy dữ liệu từ OpenAI.',
      });
    }

    const since = req.query.since; // ISO string, e.g. 2025-01-28T10:00:00.000Z

    const userContent = since
      ? `
Chỉ tạo các tin tức MỚI từ ngày ${since.slice(0, 10)} đến nay (mô phỏng, tối đa 5–8 tin). Nếu không có tin mới, trả về items: [].
- Sụt lún đất, lún nền, ngập tại TP.HCM và Việt Nam.
TRẢ VỀ DUY NHẤT MỘT JSON OBJECT: { "items": [ { "id", "title", "source", "publishedAt", "location", "summary", "url", "tags" } ] }
`.trim()
      : `
Hãy tạo danh sách 10–15 tin tức gần đây (mô phỏng nhưng sát thực tế) về:
- Sụt lún đất, lún nền, ngập do lún tại TP.HCM (ưu tiên ít nhất 5 tin).
- Các khu vực còn lại tại Việt Nam (miền Tây, miền Trung, Hà Nội, ven biển, v.v.).

TRẢ VỀ DUY NHẤT MỘT JSON OBJECT có dạng:
{
  "items": [
    {
      "id": "một id ngắn gọn, duy nhất",
      "title": "Tiêu đề ngắn gọn, dễ hiểu",
      "source": "Tên báo hoặc cơ quan (ví dụ: VnExpress, Tuổi Trẻ, Báo Tài nguyên & Môi trường, ... hoặc 'Mô phỏng dữ liệu')",
      "publishedAt": "YYYY-MM-DD",
      "location": "TP.HCM | Hà Nội | Đồng bằng sông Cửu Long | Miền Trung | ...",
      "summary": "Đoạn tóm tắt 2–3 câu tiếng Việt, tập trung vào vấn đề sụt lún/ngập và nguyên nhân/chỉ số chính.",
      "url": "https://duong-dan-toi-bai-bao-hoac-nguon-tham-khao",
      "tags": ["sụt lún", "HCM", "..."]
    }
  ]
}
`.trim();

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4.1',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Bạn là hệ thống tổng hợp tin tức về sụt lún đất, ngập và lún nền tại Việt Nam. Trả về JSON đúng cú pháp để frontend hiển thị.',
        },
        { role: 'user', content: userContent },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.items)) {
      return res.status(500).json({
        message: 'Định dạng JSON từ OpenAI không hợp lệ (thiếu "items").',
      });
    }

    res.json({
      items: parsed.items,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in /api/news/subsidence:', error);
    res.status(500).json({
      message: 'Không lấy được tin tức từ OpenAI.',
    });
  }
});

/**
 * POST /api/ai/predict
 * Dự đoán thiên tai theo khu vực (quận/huyện TP.HCM) bằng OpenAI.
 * Body: { area: string }
 */
app.post('/api/ai/predict', async (req, res) => {
  try {
    if (!openaiClient) {
      return res.status(500).json({
        message: 'OPENAI_API_KEY chưa cấu hình. Không thể thực hiện dự đoán.',
      });
    }

    const { area } = req.body || {};
    if (!area || typeof area !== 'string') {
      return res.status(400).json({ message: 'Thiếu tham số area (tên khu vực).' });
    }

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4.1',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Bạn là hệ thống AI dự đoán thiên tai và rủi ro sụt lún cho các khu vực tại TP.HCM. Trả về DUY NHẤT một JSON object đúng cú pháp, không thêm text ngoài JSON.',
        },
        {
          role: 'user',
          content: `
Dự đoán thiên tai và rủi ro sụt lún cho khu vực: "${area}" (TP.HCM).

TRẢ VỀ DUY NHẤT MỘT JSON OBJECT có đúng cấu trúc sau (tiếng Việt):

{
  "area": "${area}",
  "analysisDate": "YYYY-MM-DD",
  "predictions": {
    "oneYear": {
      "overallRisk": "Thấp | Trung bình | Cao | Rất cao",
      "summary": "Đoạn tóm tắt 2-3 câu về rủi ro 1 năm tới.",
      "disasters": [
        {
          "type": "Tên loại thiên tai (vd: Sụt lún nền, Ngập úng, ...)",
          "probability": "Thấp | Trung bình | Cao",
          "severity": "Nhẹ | Trung bình | Nghiêm trọng | Rất nghiêm trọng",
          "description": "Mô tả ngắn.",
          "affectedAreas": "Khu vực ảnh hưởng.",
          "preventionMeasures": "Biện pháp phòng ngừa."
        }
      ]
    },
    "twoYears": {
      "overallRisk": "Thấp | Trung bình | Cao | Rất cao",
      "summary": "Đoạn tóm tắt 2-3 câu về rủi ro 2 năm tới.",
      "disasters": [ ... cùng cấu trúc như oneYear.disasters, ít nhất 2 phần tử ]
    },
    "fiveYears": {
      "overallRisk": "Thấp | Trung bình | Cao | Rất cao",
      "summary": "Đoạn tóm tắt 2-3 câu về rủi ro 5 năm tới.",
      "disasters": [ ... cùng cấu trúc, ít nhất 2 phần tử ]
    }
  },
  "recommendations": [
    "Khuyến nghị 1 (câu đầy đủ).",
    "Khuyến nghị 2.",
    "Khuyến nghị 3."
  ]
}

- Mỗi disasters có ít nhất 2 phần tử. overallRisk, probability, severity dùng đúng một trong các giá trị đã liệt kê.
- recommendations là mảng 3-5 câu tiếng Việt.
`.trim(),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return res.status(500).json({ message: 'OpenAI không trả về nội dung.' });
    }

    const parsed = JSON.parse(raw);
    if (!parsed.predictions || !parsed.predictions.oneYear || !parsed.predictions.twoYears || !parsed.predictions.fiveYears) {
      return res.status(500).json({
        message: 'Định dạng JSON từ OpenAI thiếu predictions.oneYear/twoYears/fiveYears.',
      });
    }

    res.json({
      area: parsed.area || area,
      analysisDate: parsed.analysisDate || new Date().toISOString().split('T')[0],
      predictions: parsed.predictions,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    });
  } catch (error) {
    console.error('Error in /api/ai/predict:', error);
    res.status(500).json({
      message: error?.message || 'Không thể thực hiện dự đoán. Vui lòng thử lại sau.',
    });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`);
});

