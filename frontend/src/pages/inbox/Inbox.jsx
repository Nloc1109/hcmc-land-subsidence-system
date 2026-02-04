import { useState, useEffect } from 'react';
import {
  Card,
  List,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Empty,
  Spin,
  message,
  Segmented,
} from 'antd';
import {
  MailOutlined,
  SendOutlined,
  UserOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  DownloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import notificationsApi from '../../api/notifications';
import { useAuthStore } from '../../store/auth/useAuthStore';
import SendReportButton from '../../components/SendReportButton';
import './Inbox.css';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Text } = Typography;

const TYPE_LABELS = {
  Report: { label: 'Báo cáo', color: 'blue' },
  Task: { label: 'Nhiệm vụ', color: 'orange' },
  Coordination: { label: 'Điều phối', color: 'green' },
  System: { label: 'Hệ thống', color: 'default' },
  Alert: { label: 'Cảnh báo', color: 'red' },
  Maintenance: { label: 'Bảo trì', color: 'purple' },
};

/** Hỗ trợ cả PascalCase (MSSQL) và camelCase khi hiển thị đính kèm */
const getAttachmentFileName = (n) => n?.AttachmentFileName ?? n?.attachmentFileName ?? null;
const getAttachmentMimeType = (n) => n?.AttachmentMimeType ?? n?.attachmentMimeType ?? null;
const hasAttachment = (n) => !!getAttachmentFileName(n);

const InboxPage = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inboxTab, setInboxTab] = useState('inbox'); // 'inbox' | 'sent'
  const [filter, setFilter] = useState('all'); // all | unread (chỉ cho thư đến)
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [attachmentBlobUrl, setAttachmentBlobUrl] = useState(null);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [sending, setSending] = useState(false);
  const [form] = Form.useForm();

  const loadNotifications = async () => {
    setLoading(true);
    try {
      if (inboxTab === 'sent') {
        const data = await notificationsApi.getSentList({ page: 1, limit: 50 });
        setItems(data.items || []);
        setTotal(data.total || 0);
      } else {
        const params = filter === 'unread' ? { unreadOnly: 'true' } : {};
        const data = await notificationsApi.getList(params);
        setItems(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      message.error(inboxTab === 'sent' ? 'Không tải được thư đã gửi' : 'Không tải được thông báo');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const data = await notificationsApi.getUnreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch (_) {}
  };

  useEffect(() => {
    loadNotifications();
    if (inboxTab === 'inbox') loadUnreadCount();
  }, [filter, inboxTab]);

  const handleMarkRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      setItems((prev) => prev.map((n) => (n.NotificationId === id ? { ...n, IsRead: true } : n)));
      loadUnreadCount();
    } catch (_) {}
  };

  const openDetail = (n) => {
    setDetailItem(n);
    setAttachmentBlobUrl(null);
    const isInbox = inboxTab === 'inbox';
    if (isInbox && !n.IsRead) handleMarkRead(n.NotificationId);
    if (hasAttachment(n)) {
      setAttachmentLoading(true);
      notificationsApi
        .getAttachmentBlob(n.NotificationId)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setAttachmentBlobUrl(url);
        })
        .catch(() => message.error('Không tải được file đính kèm'))
        .finally(() => setAttachmentLoading(false));
    }
  };

  const closeDetail = () => {
    if (attachmentBlobUrl) URL.revokeObjectURL(attachmentBlobUrl);
    setDetailItem(null);
    setAttachmentBlobUrl(null);
    setAttachmentLoading(false);
  };

  const downloadAttachment = () => {
    const name = detailItem && getAttachmentFileName(detailItem);
    if (!attachmentBlobUrl || !name) return;
    const a = document.createElement('a');
    a.href = attachmentBlobUrl;
    a.download = name;
    a.click();
  };

  const openSendModal = async () => {
    setSendModalOpen(true);
    form.resetFields();
    try {
      const data = await notificationsApi.getRecipients();
      setRecipients(data.recipients || []);
    } catch (err) {
      message.error('Không tải được danh sách người nhận');
      setRecipients([]);
    }
  };

  const handleSend = async () => {
    try {
      const values = await form.validateFields();
      setSending(true);
      const payload = {
        title: values.title,
        message: values.message || undefined,
        notificationType: values.notificationType || 'Report',
      };
      if (values.sendToType === 'role') {
        payload.toRoleName = values.toRoleName;
      } else {
        payload.toUserId = values.toUserId;
      }
      await notificationsApi.send(payload);
      message.success('Đã gửi thông báo');
      setSendModalOpen(false);
      form.resetFields();
      loadNotifications();
      loadUnreadCount();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Gửi thất bại');
    } finally {
      setSending(false);
    }
  };

  const recipientByRole = recipients.reduce((acc, r) => {
    const role = r.RoleName || r.roleName || 'Khác';
    if (!acc[role]) acc[role] = [];
    acc[role].push(r);
    return acc;
  }, {});

  return (
    <div className="page-container inbox-page">
      <div className="inbox-header">
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            <MailOutlined /> Hộp thư
          </Typography.Title>
          <Text type="secondary">
            Nhận và gửi thông báo giữa các vai trò (phân tích → điều phối, quản lý → chuyên viên, ...)
          </Text>
        </div>
        <Space>
          <SendReportButton sourcePageName="Hộp thư" type="default" />
          <Button type="primary" icon={<SendOutlined />} onClick={openSendModal}>
            Gửi thông báo
          </Button>
        </Space>
      </div>

      <Card className="inbox-card">
        <div className="inbox-toolbar">
          <Segmented
            value={inboxTab}
            onChange={setInboxTab}
            options={[
              { label: 'Thư đến', value: 'inbox' },
              { label: 'Thư đã gửi', value: 'sent' },
            ]}
            style={{ marginBottom: inboxTab === 'inbox' ? 12 : 0 }}
          />
          {inboxTab === 'inbox' && (
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { label: 'Tất cả', value: 'all' },
                { label: `Chưa đọc (${unreadCount})`, value: 'unread' },
              ]}
              size="small"
              style={{ marginLeft: 8 }}
            />
          )}
        </div>
        {loading ? (
          <div className="inbox-loading">
            <Spin tip="Đang tải..." />
          </div>
        ) : items.length === 0 ? (
          <Empty description={inboxTab === 'sent' ? 'Chưa gửi thư nào' : 'Chưa có thông báo nào'} />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={items}
            renderItem={(n) => {
              const typeInfo = TYPE_LABELS[n.NotificationType] || { label: n.NotificationType, color: 'default' };
              const isSent = inboxTab === 'sent';
              const recipientName = n.RecipientFullName || n.RecipientUsername;
              const recipientRole = n.RecipientRole;
              return (
                <List.Item
                  className={`inbox-item ${!isSent && !n.IsRead ? 'inbox-item-unread' : ''}`}
                  onClick={() => openDetail(n)}
                  style={{ cursor: 'pointer' }}
                >
                  <List.Item.Meta
                    avatar={
                      isSent ? (
                        <div className="inbox-avatar sent">
                          <UserOutlined />
                        </div>
                      ) : n.SenderId ? (
                        <div className="inbox-avatar">
                          <UserOutlined />
                        </div>
                      ) : (
                        <div className="inbox-avatar system">
                          <FileTextOutlined />
                        </div>
                      )
                    }
                    title={
                      <Space>
                        <span>{n.Title}</span>
                        <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                        {!isSent && !n.IsRead && <Tag color="blue">Mới</Tag>}
                      </Space>
                    }
                    description={
                      <>
                        {isSent ? (
                          recipientName && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Đến: {recipientName}
                              {recipientRole && ` (${recipientRole})`}
                            </Text>
                          )
                        ) : (
                          (n.SenderFullName || n.SenderUsername) && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Từ: {n.SenderFullName || n.SenderUsername}
                              {(n.SenderRole || n.senderRole) && ` (${n.SenderRole || n.senderRole})`}
                            </Text>
                          )
                        )}
                        {n.Message && (
                          <div className="inbox-message-preview">{n.Message}</div>
                        )}
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(n.CreatedAt).fromNow()}
                          {hasAttachment(n) && (
                            <>
                              {' · '}
                              <PaperClipOutlined /> File đính kèm
                            </>
                          )}
                        </Text>
                      </>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>

      <Modal
        title={detailItem?.Title || 'Chi tiết thư'}
        open={!!detailItem}
        onCancel={closeDetail}
        footer={[
          <Button key="close" onClick={closeDetail}>
            Đóng
          </Button>,
        ]}
        width={720}
        destroyOnClose
        className="inbox-detail-modal"
      >
        {detailItem && (
          <div className="inbox-detail-content">
            <div className="inbox-detail-meta">
              {detailItem.SenderFullName && (
                <Text type="secondary">
                  Từ: {detailItem.SenderFullName}
                  {detailItem.SenderRole && ` (${detailItem.SenderRole})`}
                </Text>
              )}
              <Text type="secondary" style={{ marginLeft: 8 }}>
                {dayjs(detailItem.CreatedAt).format('DD/MM/YYYY HH:mm')}
              </Text>
            </div>
            {detailItem.Message && (
              <div className="inbox-detail-message">
                <Text strong>Nội dung chi tiết</Text>
                <div className="inbox-detail-message-body">{detailItem.Message}</div>
              </div>
            )}
            <div className="inbox-detail-attachment">
              <Text strong>
                <PaperClipOutlined /> File đính kèm
              </Text>
              {hasAttachment(detailItem) ? (
                <>
                  {attachmentLoading ? (
                    <Spin size="small" style={{ marginTop: 8 }} />
                  ) : attachmentBlobUrl ? (
                    <div className="inbox-attachment-viewer">
                      {(getAttachmentMimeType(detailItem) || '').toLowerCase().includes('pdf') ? (
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                          <Space wrap>
                            <Button
                              type="primary"
                              icon={<EyeOutlined />}
                              onClick={() => window.open(attachmentBlobUrl, '_blank', 'noopener,noreferrer')}
                            >
                              Xem file PDF (mở tab mới)
                            </Button>
                            <Button
                              icon={<DownloadOutlined />}
                              onClick={downloadAttachment}
                            >
                              Tải file PDF
                            </Button>
                          </Space>
                          <p className="inbox-pdf-hint">
                            Bấm &quot;Xem file PDF&quot; để mở trong tab mới, dễ phóng to và xem rõ nội dung.
                          </p>
                        </Space>
                      ) : (
                        <Button
                          type="primary"
                          icon={<DownloadOutlined />}
                          onClick={downloadAttachment}
                          style={{ marginTop: 8 }}
                        >
                          Tải file {getAttachmentFileName(detailItem)}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                      Không tải được file
                    </Text>
                  )}
                </>
              ) : (
                <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                  Không có file đính kèm. Khi gửi báo cáo, chọn <strong>PDF</strong> hoặc <strong>Excel</strong> trong mục &quot;Đính kèm file&quot; để tạo file (gồm thông tin người gửi, người nhận và nội dung).
                </Text>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Gửi thông báo"
        open={sendModalOpen}
        onCancel={() => setSendModalOpen(false)}
        onOk={handleSend}
        confirmLoading={sending}
        okText="Gửi"
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ sendToType: 'user', notificationType: 'Report' }}>
          <Form.Item name="sendToType" label="Gửi tới">
            <Select
              options={[
                { value: 'user', label: 'Một người cụ thể' },
                { value: 'role', label: 'Cả vai trò (ví dụ: tất cả Người vận hành)' },
              ]}
              onChange={() => form.setFieldValue('toUserId', undefined) || form.setFieldValue('toRoleName', undefined)}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.sendToType !== curr.sendToType}>
            {({ getFieldValue }) =>
              getFieldValue('sendToType') === 'role' ? (
                <Form.Item name="toRoleName" label="Vai trò nhận" rules={[{ required: true, message: 'Chọn vai trò' }]}>
                  <Select
                    placeholder="Chọn vai trò"
                    options={Object.keys(recipientByRole).map((role) => ({ value: role, label: role }))}
                  />
                </Form.Item>
              ) : (
                <Form.Item name="toUserId" label="Người nhận" rules={[{ required: true, message: 'Chọn người nhận' }]}>
                  <Select
                    placeholder="Chọn người nhận"
                    showSearch
                    optionFilterProp="label"
                    options={recipients.map((r) => ({
                      value: r.UserId,
                      label: `${r.FullName || r.Username} (${r.RoleName})`,
                    }))}
                  />
                </Form.Item>
              )
            }
          </Form.Item>
          <Form.Item name="notificationType" label="Loại thông báo">
            <Select
              options={[
                { value: 'Report', label: 'Báo cáo phân tích' },
                { value: 'Task', label: 'Nhiệm vụ' },
                { value: 'Coordination', label: 'Điều phối' },
              ]}
            />
          </Form.Item>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
            <Input placeholder="Ví dụ: Báo cáo phân tích tháng 1 gửi điều phối" />
          </Form.Item>
          <Form.Item name="message" label="Nội dung">
            <Input.TextArea rows={3} placeholder="Nội dung chi tiết (tùy chọn)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InboxPage;
