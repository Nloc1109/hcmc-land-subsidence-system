import { useEffect, useState } from 'react';
import { Typography, Card, List, Tag, Spin, Alert } from 'antd';
import { NotificationOutlined } from '@ant-design/icons';
import axios from 'axios';
import './News.css';

const { Title, Paragraph, Text } = Typography;

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
        const res = await axios.get(`${baseUrl}/news/subsidence`);
        setItems(res.data.items || []);
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
    <div className="news-page">
      <div className="news-header">
        <Title level={2}>
          <NotificationOutlined /> Tin tức & thông báo
        </Title>
        <Paragraph type="secondary">
          Cập nhật các bản tin, khuyến nghị kỹ thuật và thông báo quan trọng liên quan đến tình hình sụt lún đất.
        </Paragraph>
      </div>

      <Card className="news-card">
        {loading && <Spin tip="Đang tải tin tức sụt lún..." />}
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
                      {item.url && (
                        <>
                          <br />
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ marginTop: 4, display: 'inline-block' }}
                          >
                            Xem bài báo gốc
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

