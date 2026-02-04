import { useEffect, useState, useRef } from 'react';
import {
  Typography,
  Card,
  List,
  Tag,
  Spin,
  Alert,
  Button,
  Tabs,
  Modal,
  Form,
  Input,
  App,
  Popconfirm,
  Space,
} from 'antd';
import { NotificationOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, PaperClipOutlined, DownloadOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getNewsCache, setNewsCache, mergeNewsItems } from '../../utils/helpers/newsCache';
import { useAuthStore } from '../../store/auth/useAuthStore';
import systemNewsApi, { getAttachmentUrl } from '../../api/systemNews';
import './News.css';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

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

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
/** Tải file đính kèm tin hệ thống (cần token) */
const downloadAttachment = async (systemNewsId, attachmentId, fileName) => {
  const url = getAttachmentUrl(systemNewsId, attachmentId);
  const token = localStorage.getItem('auth_token');
  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error('Không tải được file');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName || 'file';
  a.click();
  URL.revokeObjectURL(a.href);
};

export default function NewsPage() {
  const { message } = App.useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userRole = user?.role || user?.roleName || user?.RoleName;
  const canManageSystemNews = userRole === 'Operator' || userRole === 'Admin';

  const [activeTab, setActiveTab] = useState('online');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloading, setReloading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const mounted = useRef(true);

  const [systemNewsList, setSystemNewsList] = useState([]);
  const [systemNewsTotal, setSystemNewsTotal] = useState(0);
  const [systemNewsLoading, setSystemNewsLoading] = useState(false);
  const [systemNewsPage, setSystemNewsPage] = useState(1);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formEditingId, setFormEditingId] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formFiles, setFormFiles] = useState([]);
  const [formExistingAttachments, setFormExistingAttachments] = useState([]);
  const [form] = Form.useForm();
  const fileInputRef = useRef(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

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

  const loadSystemNews = async (p = 1) => {
    setSystemNewsLoading(true);
    try {
      const data = await systemNewsApi.getList({ page: p, limit: 10 });
      setSystemNewsList(data.items || []);
      setSystemNewsTotal(data.total || 0);
      setSystemNewsPage(p);
    } catch (err) {
      message.error('Không tải được tin hệ thống');
      setSystemNewsList([]);
      setSystemNewsTotal(0);
    } finally {
      setSystemNewsLoading(false);
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
    } else {
      setLoading(true);
      setError(null);
      fetchNews(false)
        .then((list) => {
          if (mounted.current && list?.length) setPage(Math.ceil(list.length / DEFAULT_PAGE_SIZE) || 1);
        })
        .finally(() => {
          if (mounted.current) setLoading(false);
        });
    }
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (activeTab === 'system') {
      loadSystemNews(systemNewsPage);
    }
  }, [activeTab]);

  useEffect(() => {
    if (location.state?.openSystemNewsCreate && canManageSystemNews) {
      setActiveTab('system');
      setFormEditingId(null);
      setFormFiles([]);
      setFormExistingAttachments([]);
      form.setFieldsValue({ title: '', content: '' });
      setFormModalOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const handleReload = () => {
    const cache = getNewsCache();
    const hasCache = !!(cache?.items?.length);
    setReloading(true);
    setError(null);
    fetchNews(hasCache).then(() => setPage(1)).finally(() => setReloading(false));
  };

  const openDetail = async (sn) => {
    setDetailItem(sn);
    setDetailModalOpen(true);
    if (sn.systemNewsId) {
      try {
        const full = await systemNewsApi.getById(sn.systemNewsId);
        setDetailItem(full);
      } catch {
        message.error('Không tải được nội dung tin');
      }
    }
  };

  const openCreateForm = () => {
    setFormEditingId(null);
    setFormFiles([]);
    setFormExistingAttachments([]);
    form.setFieldsValue({ title: '', content: '' });
    setFormModalOpen(true);
  };

  const openEditForm = async (sn) => {
    setFormEditingId(sn.systemNewsId);
    setFormFiles([]);
    form.setFieldsValue({ title: sn.title || '', content: sn.content ?? '' });
    setFormModalOpen(true);
    if (sn.attachments && sn.attachments.length > 0) {
      setFormExistingAttachments(sn.attachments);
    }
    try {
      const full = await systemNewsApi.getById(sn.systemNewsId);
      setFormExistingAttachments(full.attachments || []);
    } catch {
      if (!(sn.attachments && sn.attachments.length > 0)) setFormExistingAttachments([]);
    }
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      setFormSubmitting(true);
      if (formEditingId) {
        await systemNewsApi.update(formEditingId, { title: values.title, content: values.content ?? '' }, formFiles);
        message.success('Đã cập nhật tin hệ thống');
      } else {
        await systemNewsApi.create({ title: values.title, content: values.content ?? '' }, formFiles);
        message.success('Đã đăng tin hệ thống');
      }
      setFormModalOpen(false);
      setFormFiles([]);
      loadSystemNews(systemNewsPage);
    } catch (err) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setFormSubmitting(false);
    }
  };

  const removeFormFile = (index) => {
    setFormFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = async (attachmentId) => {
    if (!formEditingId) return;
    try {
      await systemNewsApi.deleteAttachment(formEditingId, attachmentId);
      setFormExistingAttachments((prev) => prev.filter((a) => a.attachmentId !== attachmentId));
      message.success('Đã xóa file đính kèm');
    } catch (err) {
      message.error(err?.response?.data?.message || 'Xóa file thất bại');
    }
  };

  const handleDeleteSystemNews = async (id) => {
    try {
      await systemNewsApi.delete(id);
      message.success('Đã xóa tin hệ thống');
      setDetailModalOpen(false);
      setDetailItem(null);
      loadSystemNews(systemNewsPage);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Xóa thất bại');
    }
  };

  const total = items.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const pageClamped = Math.min(Math.max(1, page), totalPages);
  const sliceStart = (pageClamped - 1) * pageSize;
  const paginatedItems = items.slice(sliceStart, sliceStart + pageSize);
  const rangeStart = total ? sliceStart + 1 : 0;
  const rangeEnd = Math.min(sliceStart + pageSize, total);

  const onlineTab = (
    <>
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" tip="Đang tải tin tức..."><div style={{ minHeight: 120 }} /></Spin>
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
                      <Tag key={t} color="geekblue" style={{ marginLeft: 4 }}>{t}</Tag>
                    ))}
                  </Text>
                }
                description={
                  <>
                    <Text type="secondary">{item.source} • {item.publishedAt}</Text>
                    <br />
                    <Text>{item.summary}</Text>
                    {isValidNewsUrl(item.url) && (
                      <>
                        <br />
                        <a href={item.url.trim()} target="_blank" rel="noopener noreferrer" style={{ marginTop: 8, display: 'inline-block', color: '#1890ff', fontWeight: 500 }}>
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
    </>
  );

  const systemTab = (
    <>
      <div className="news-system-toolbar">
        {canManageSystemNews && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateForm}>
            Đăng tin hệ thống
          </Button>
        )}
      </div>
      {systemNewsLoading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin tip="Đang tải tin hệ thống..."><div style={{ minHeight: 80 }} /></Spin>
        </div>
      )}
      {!systemNewsLoading && systemNewsList.length === 0 && (
        <Alert message="Chưa có tin hệ thống nào" type="info" showIcon />
      )}
      {!systemNewsLoading && systemNewsList.length > 0 && (
        <List
          itemLayout="horizontal"
          dataSource={systemNewsList}
          pagination={{
            current: systemNewsPage,
            pageSize: 10,
            total: systemNewsTotal,
            showSizeChanger: false,
            showTotal: (t) => `Tổng ${t} tin`,
            onChange: (p) => loadSystemNews(p),
          }}
          renderItem={(sn) => (
            <List.Item
              className="news-system-item"
              actions={
                canManageSystemNews
                  ? [
                      <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); openEditForm(sn); }}>
                        Chỉnh sửa
                      </Button>,
                      <Popconfirm
                        key="del"
                        title="Xóa tin hệ thống?"
                        onConfirm={(e) => { e?.stopPropagation?.(); handleDeleteSystemNews(sn.systemNewsId); }}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()}>
                          Xóa
                        </Button>
                      </Popconfirm>,
                    ]
                  : undefined
              }
              onClick={() => openDetail(sn)}
            >
              <List.Item.Meta
                title={<Text strong>{sn.title}</Text>}
                description={
                  <Text type="secondary">
                    {sn.authorFullName || sn.authorUsername || 'Hệ thống'} • {sn.createdAt ? new Date(sn.createdAt).toLocaleString('vi-VN') : ''}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      )}
    </>
  );

  return (
    <div className="page-container">
      <div className="page-header news-page-header">
        <div>
          <Title level={2}>
            <NotificationOutlined /> Tin tức & thông báo
          </Title>
          <Paragraph type="secondary">
            Tin tham khảo trực tuyến và tin hệ thống do Operator đăng.
          </Paragraph>
        </div>
        <Space>
          {activeTab === 'online' && (
            <Button type="primary" icon={<ReloadOutlined />} loading={reloading} onClick={handleReload} className="news-reload-btn">
              Cập nhật tin tức
            </Button>
          )}
        </Space>
      </div>

      <Card className="page-card">
<Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'online', label: 'Tin tham khảo trực tuyến', children: onlineTab },
            { key: 'system', label: 'Tin hệ thống', children: systemTab },
          ]}
        />
      </Card>

      <Modal
        title={detailItem?.title || 'Chi tiết tin hệ thống'}
        open={detailModalOpen}
        onCancel={() => { setDetailModalOpen(false); setDetailItem(null); }}
        footer={
          canManageSystemNews && detailItem ? (
            <Space>
              <Button icon={<EditOutlined />} onClick={() => { setDetailModalOpen(false); openEditForm(detailItem); }}>
                Chỉnh sửa
              </Button>
              <Popconfirm
                title="Xóa tin hệ thống?"
                onConfirm={() => handleDeleteSystemNews(detailItem.systemNewsId)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />}>Xóa</Button>
              </Popconfirm>
            </Space>
          ) : null
        }
        width={640}
      >
        {detailItem && (
          <>
            <div className="news-detail-meta" style={{ marginBottom: 16, color: '#666', fontSize: 13 }}>
              {detailItem.authorFullName || detailItem.authorUsername} • {detailItem.createdAt ? new Date(detailItem.createdAt).toLocaleString('vi-VN') : ''}
            </div>
            <div className="news-detail-content news-plain-content" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {detailItem.content || ''}
            </div>
            {(detailItem.attachments && detailItem.attachments.length > 0) && (
              <div className="news-detail-attachments" style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  <PaperClipOutlined /> File đính kèm
                </Text>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  {detailItem.attachments.map((att) => (
                    <div key={att.attachmentId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Button
                        type="link"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => downloadAttachment(detailItem.systemNewsId, att.attachmentId, att.fileName)}
                      >
                        {att.fileName || 'Tải file'}
                      </Button>
                    </div>
                  ))}
                </Space>
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal
        title={formEditingId ? 'Chỉnh sửa tin hệ thống' : 'Đăng tin hệ thống'}
        open={formModalOpen}
        onCancel={() => setFormModalOpen(false)}
        onOk={handleFormSubmit}
        confirmLoading={formSubmitting}
        okText={formEditingId ? 'Cập nhật' : 'Đăng tin'}
        width={560}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
            <Input placeholder="Tiêu đề tin hệ thống" />
          </Form.Item>
          <Form.Item name="content" label="Nội dung (văn bản)">
            <TextArea rows={8} placeholder="Nhập nội dung tin hệ thống (văn bản thuần)..." />
          </Form.Item>
          {formEditingId && formExistingAttachments.length > 0 && (
            <Form.Item label="File đính kèm hiện có">
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                {formExistingAttachments.map((att) => (
                  <div key={att.attachmentId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text type="secondary" style={{ flex: 1 }} ellipsis>{att.fileName}</Text>
                    <Popconfirm
                      title="Xóa file đính kèm này?"
                      onConfirm={() => removeExistingAttachment(att.attachmentId)}
                      okText="Xóa"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Button type="text" size="small" danger>Xóa</Button>
                    </Popconfirm>
                  </div>
                ))}
              </Space>
            </Form.Item>
          )}
          <Form.Item label={formEditingId ? 'Thêm file đính kèm' : 'File đính kèm'} extra="Có thể chọn nhiều file, tối đa 10 file, mỗi file tối đa 20MB.">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'block', marginBottom: 8 }}
              onChange={(e) => {
                const added = e.target.files ? Array.from(e.target.files) : [];
                setFormFiles((prev) => [...prev, ...added].slice(0, 10));
                e.target.value = '';
              }}
            />
            {formFiles.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {formFiles.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text type="secondary" style={{ flex: 1 }} ellipsis>{f.name}</Text>
                    <Button type="text" size="small" danger onClick={() => removeFormFile(i)}>Bỏ</Button>
                  </div>
                ))}
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
