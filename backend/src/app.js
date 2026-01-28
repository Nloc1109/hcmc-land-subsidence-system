const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');
const OpenAI = require('openai');

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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

app.get('/api/news/subsidence', async (req, res) => {
  try {
    if (!openaiClient) {
      return res.status(500).json({
        message: 'OPENAI_API_KEY chưa cấu hình hoặc không hợp lệ. Không thể lấy dữ liệu từ OpenAI.',
      });
    }

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4.1',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Bạn là hệ thống tổng hợp tin tức về sụt lún đất, ngập và lún nền tại Việt Nam. Trả về JSON đúng cú pháp để frontend hiển thị.',
        },
        {
          role: 'user',
          content: `
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
`.trim(),
        },
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

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend server listening on http://localhost:${PORT}`);
});

