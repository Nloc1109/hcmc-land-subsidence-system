import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import OpenAI from 'openai';

import { getPool } from './db/mssql.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT || 3000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Auth routes
app.use('/api/v1/auth', authRouter);

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
const openaiApiKey = process.env.OPENAI_API_KEY?.trim();
if (openaiApiKey) {
  openaiClient = new OpenAI({
    apiKey: openaiApiKey,
  });
  console.log('✅ OpenAI client initialized');
} else {
  console.warn('⚠️  OPENAI_API_KEY not found in environment variables');
}

app.get('/api/news/subsidence', async (req, res) => {
  try {
    if (!openaiClient) {
      return res.status(500).json({
        message: 'OPENAI_API_KEY chưa cấu hình hoặc không hợp lệ. Không thể lấy dữ liệu từ OpenAI.',
      });
    }

    console.log('🔄 Đang tải tin tức...');
    const startTime = Date.now();

    // Tạo timeout promise để tránh chờ quá lâu
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 60 seconds')), 60000);
    });

    const completionPromise = openaiClient.chat.completions.create({
      model: 'gpt-4o', // Model mới nhất, nhanh nhất và mạnh nhất của OpenAI (tháng 5/2024)
      response_format: { type: 'json_object' },
      temperature: 0.7, // Độ sáng tạo vừa phải
      max_tokens: 3000, // Giới hạn token để tăng tốc độ xử lý (giảm vì chỉ cần 7-8 tin)
      messages: [
        {
          role: 'system',
          content:
            'Bạn là hệ thống tổng hợp tin tức về sụt lún đất, ngập và lún nền tại Việt Nam. Trả về JSON đúng cú pháp để frontend hiển thị.',
        },
        {
          role: 'user',
          content: `
Hãy tạo danh sách 7-8 tin tức gần đây (mô phỏng nhưng sát thực tế) về:
- Sụt lún đất, lún nền, ngập do lún tại TP.HCM (ưu tiên ít nhất 4 tin).
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
      "url": "https://vnexpress.net/...",
      "tags": ["sụt lún", "HCM", "..."]
    }
  ]
}
QUAN TRỌNG: 
- Trường "url" phải là URL THẬT từ các trang báo Việt Nam về sụt lún đất, ngập lụt, lún nền.
- Các nguồn hợp lệ: vnexpress.net, tuoitre.vn, thanhnien.vn, nld.com.vn, dantri.com.vn, vietnamnet.vn
- Tìm và sử dụng URL thật từ các bài báo đã xuất bản về chủ đề này (có thể tìm trong lịch sử tin tức).
- URL phải bắt đầu bằng https:// và có thể truy cập được.
- Nếu không tìm được URL thật, có thể dùng URL trang chủ của nguồn báo (ví dụ: https://vnexpress.net/tim-kiem?q=sut+lun+dat)
`.trim(),
        },
      ],
    });

    // Race giữa completion và timeout
    const completion = await Promise.race([completionPromise, timeoutPromise]);
    
    const raw = completion.choices[0]?.message?.content;
    const elapsedTime = Date.now() - startTime;
    console.log(`✅ Đã tải tin tức trong ${elapsedTime}ms`);

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.items)) {
      return res.status(500).json({
        message: 'Định dạng JSON từ OpenAI không hợp lệ (thiếu "items").',
      });
    }

    console.log(`📰 Đã tải ${parsed.items.length} tin tức`);
    res.json({
      items: parsed.items,
      generatedAt: new Date().toISOString(),
      processingTime: `${elapsedTime}ms`,
    });
  } catch (error) {
    console.error('Error in /api/news/subsidence:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
    });
    res.status(500).json({
      message: 'Không lấy được tin tức từ OpenAI.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /api/ai/predict
 * Dự đoán thiên tai cho một khu vực cụ thể trong 1, 2, 5 năm tới
 */
app.post('/api/ai/predict', async (req, res) => {
  try {
    if (!openaiClient) {
      return res.status(500).json({
        message: 'OPENAI_API_KEY chưa cấu hình. Không thể thực hiện dự đoán.',
      });
    }

    const { area } = req.body;
    if (!area) {
      return res.status(400).json({
        message: 'Vui lòng chọn khu vực cần dự đoán.',
      });
    }

    console.log(`🔄 Đang phân tích và dự đoán thiên tai cho khu vực: ${area}`);
    const startTime = Date.now();

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 90 seconds')), 90000);
    });

    const completionPromise = openaiClient.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 4000,
      messages: [
        {
          role: 'system',
          content:
            'Bạn là chuyên gia dự báo thiên tai và phân tích rủi ro môi trường cho khu vực Thành phố Hồ Chí Minh, Việt Nam. Bạn có kiến thức sâu về địa chất, khí hậu, địa hình và các yếu tố ảnh hưởng đến thiên tai.',
        },
        {
          role: 'user',
          content: `
Hãy phân tích và dự đoán các khả năng thiên tai cho khu vực "${area}" (thuộc Thành phố Hồ Chí Minh, Việt Nam) trong các khoảng thời gian: 1 năm, 2 năm, và 5 năm tới.

Các loại thiên tai cần phân tích bao gồm:
- Sụt lún đất (land subsidence)
- Ngập lụt (flooding)
- Lũ quét (flash flood)
- Sạt lở đất (landslide)
- Triều cường (storm surge)
- Mưa lớn kéo dài (prolonged heavy rain)
- Hạn hán (drought)
- Xâm nhập mặn (saltwater intrusion)
- Các thiên tai khác có thể xảy ra

TRẢ VỀ DUY NHẤT MỘT JSON OBJECT có dạng:
{
  "area": "${area}",
  "analysisDate": "YYYY-MM-DD",
  "predictions": {
    "oneYear": {
      "overallRisk": "Thấp | Trung bình | Cao | Rất cao",
      "disasters": [
        {
          "type": "Tên loại thiên tai (tiếng Việt)",
          "probability": "Thấp | Trung bình | Cao",
          "severity": "Nhẹ | Trung bình | Nghiêm trọng | Rất nghiêm trọng",
          "description": "Mô tả chi tiết khả năng xảy ra, nguyên nhân, và tác động dự kiến (2-3 câu)",
          "affectedAreas": "Các khu vực cụ thể có thể bị ảnh hưởng",
          "preventionMeasures": "Các biện pháp phòng ngừa và ứng phó đề xuất"
        }
      ],
      "summary": "Tóm tắt tổng quan về rủi ro thiên tai trong 1 năm tới (3-4 câu)"
    },
    "twoYears": {
      "overallRisk": "Thấp | Trung bình | Cao | Rất cao",
      "disasters": [...],
      "summary": "Tóm tắt tổng quan về rủi ro thiên tai trong 2 năm tới"
    },
    "fiveYears": {
      "overallRisk": "Thấp | Trung bình | Cao | Rất cao",
      "disasters": [...],
      "summary": "Tóm tắt tổng quan về rủi ro thiên tai trong 5 năm tới"
    }
  },
  "recommendations": [
    "Khuyến nghị 1 về phòng ngừa và ứng phó",
    "Khuyến nghị 2",
    "Khuyến nghị 3"
  ]
}

Lưu ý: Phân tích dựa trên đặc điểm địa lý, địa chất, khí hậu thực tế của khu vực ${area} và xu hướng biến đổi khí hậu. Đưa ra dự đoán hợp lý và có cơ sở khoa học.
`.trim(),
        },
      ],
    });

    const completion = await Promise.race([completionPromise, timeoutPromise]);
    const raw = completion.choices[0]?.message?.content;
    const elapsedTime = Date.now() - startTime;
    console.log(`✅ Đã hoàn thành phân tích trong ${elapsedTime}ms`);

    const parsed = JSON.parse(raw);
    
    // Validate structure
    if (!parsed.predictions || !parsed.predictions.oneYear || !parsed.predictions.twoYears || !parsed.predictions.fiveYears) {
      return res.status(500).json({
        message: 'Định dạng JSON từ OpenAI không hợp lệ.',
      });
    }

    res.json({
      ...parsed,
      processingTime: `${elapsedTime}ms`,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in /api/ai/predict:', error);
    res.status(500).json({
      message: 'Không thể thực hiện dự đoán. Vui lòng thử lại sau.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`);
});

