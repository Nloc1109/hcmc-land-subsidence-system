import { useEffect, useState } from 'react';
import { Typography, Card, List, Tag, Spin, Alert } from 'antd';
import { NotificationOutlined } from '@ant-design/icons';
import axios from 'axios';
import './News.css';

const { Title, Paragraph, Text } = Typography;

// Chỉ hiển thị link khi URL hợp lệ (http/https và không phải placeholder)
const isValidNewsUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

const NewsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
        const res = await axios.get(`${baseUrl}/news/subsidence`, {
          timeout: 90000, // 90 giây timeout cho AI generation
        });
        setItems(res.data.items || []);
        if (res.data.processingTime) {
          console.log(`⏱️ Thời gian xử lý: ${res.data.processingTime}`);
        }
      } catch (err) {
        console.error('Failed to load subsidence news:', err);
        setError('Không tải được tin tức từ server. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2}>
          <NotificationOutlined /> Tin tức & thông báo
        </Title>
        <Paragraph type="secondary">
          Cập nhật các bản tin, khuyến nghị kỹ thuật và thông báo quan trọng liên quan đến tình hình sụt lún đất.
        </Paragraph>
      </div>

      <Card className="page-card">
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" tip="Đang tải tin tức..." />
            <Paragraph type="secondary" style={{ marginTop: 16 }}>
              Đang tải các bản tin mới nhất về sụt lún đất
            </Paragraph>
          </div>
        )}
        {!loading && error && (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
        )}
        {!loading && !error && (
          <List
            itemLayout="horizontal"
            dataSource={items}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Text strong>
                      {item.title}{' '}
                      <Tag color="blue">{item.location}</Tag>
                      {item.tags?.map((t) => (
                        <Tag key={t} color="geekblue" style={{ marginLeft: 4 }}>
                          {t}
                        </Tag>
                      ))}
                    </Text>
                  }
                  description={
                    <>
                      <Text type="secondary">
                        {item.source} • {item.publishedAt}
                      </Text>
                      <br />
                      <Text>{item.summary}</Text>
                      {isValidNewsUrl(item.url) && (
                        <>
                          <br />
                          <a
                            href={item.url.trim()}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              marginTop: 8,
                              display: 'inline-block',
                              color: '#1890ff',
                              fontWeight: 500,
                              textDecoration: 'none',
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.textDecoration = 'none';
                            }}
                          >
                            🔗 Xem bài báo gốc
                          </a>
                        </>
                      )}
                    </>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default NewsPage;

