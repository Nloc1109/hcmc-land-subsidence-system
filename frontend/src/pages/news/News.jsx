import { useEffect, useState, useRef } from 'react';
import { Typography, Card, List, Tag, Spin, Alert, Button } from 'antd';
import { NotificationOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { getNewsCache, setNewsCache, mergeNewsItems } from '../../utils/helpers/newsCache';
import './News.css';

const { Title, Paragraph, Text } = Typography;

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20];
const DEFAULT_PAGE_SIZE = 10;

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
  const [reloading, setReloading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const mounted = useRef(true);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

  const loadFromCacheOnly = () => {
    const cache = getNewsCache();
    if (cache?.items?.length) {
      setItems(cache.items);
      setError(null);
      return true;
    }
    return false;
  };

  const fetchNews = async (incremental = false) => {
    const cache = getNewsCache();
    if (incremental && cache?.items?.length) {
      try {
        const res = await axios.get(`${baseUrl}/news/subsidence`, {
          params: { since: cache.fetchedAt },
          timeout: 60000,
        });
        const newItems = res.data?.items || [];
        const generatedAt = res.data?.generatedAt || new Date().toISOString();
        let result = cache.items;
        if (newItems.length > 0) {
          const merged = mergeNewsItems(newItems, cache.items);
          setNewsCache(generatedAt, merged);
          setItems(merged);
          result = merged;
        } else {
          setNewsCache(generatedAt, cache.items);
        }
        return result;
      } catch {
        setError('Không cập nhật được tin mới. Thử lại sau.');
        return undefined;
      }
    }
    try {
      const res = await axios.get(`${baseUrl}/news/subsidence`, { timeout: 90000 });
      const list = res.data?.items || [];
      const generatedAt = res.data?.generatedAt || new Date().toISOString();
      setNewsCache(generatedAt, list);
      setItems(list);
      setError(null);
      return list;
    } catch (err) {
      setError('Không tải được tin tức từ server. Vui lòng thử lại sau.');
      console.error('Failed to load subsidence news:', err);
      return undefined;
    }
  };

  useEffect(() => {
    mounted.current = true;
    const cache = getNewsCache();
    if (cache?.items?.length) {
      setItems(cache.items);
      setLoading(false);
      setError(null);
      setPage(1);
      return;
    }
    setLoading(true);
    setError(null);
    fetchNews(false).then((list) => {
      if (mounted.current && list?.length) setPage(Math.ceil(list.length / DEFAULT_PAGE_SIZE) || 1);
    }).finally(() => {
      if (mounted.current) setLoading(false);
    });
    return () => { mounted.current = false; };
  }, []);

  const handleReload = () => {
    const cache = getNewsCache();
    const hasCache = !!(cache?.items?.length);
    setReloading(true);
    setError(null);
    fetchNews(hasCache).then(() => setPage(1)).finally(() => setReloading(false));
  };

  const total = items.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const pageClamped = Math.min(Math.max(1, page), totalPages);
  const sliceStart = (pageClamped - 1) * pageSize;
  const paginatedItems = items.slice(sliceStart, sliceStart + pageSize);
  const rangeStart = total ? sliceStart + 1 : 0;
  const rangeEnd = Math.min(sliceStart + pageSize, total);

  return (
    <div className="page-container">
      <div className="page-header news-page-header">
        <div>
          <Title level={2}>
            <NotificationOutlined /> Tin tức & thông báo
          </Title>
          <Paragraph type="secondary">
            Cập nhật các bản tin, khuyến nghị kỹ thuật và thông báo quan trọng liên quan đến tình hình sụt lún đất.
          </Paragraph>
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          loading={reloading}
          onClick={handleReload}
          className="news-reload-btn"
        >
          Cập nhật tin tức
        </Button>
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
          <>
            <List
              itemLayout="horizontal"
              dataSource={paginatedItems}
              pagination={{
                current: pageClamped,
                pageSize,
                total,
                pageSizeOptions: PAGE_SIZE_OPTIONS,
                showSizeChanger: true,
                showTotal: () => (total ? `${rangeStart} - ${rangeEnd} / ${total} tin` : ''),
                onChange: (p, size) => {
                  setPageSize(size ?? pageSize);
                  setPage(p);
                },
              }}
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
          </>
        )}
      </Card>
    </div>
  );
};

export default NewsPage;

