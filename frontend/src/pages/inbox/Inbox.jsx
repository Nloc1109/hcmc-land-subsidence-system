import { useState, useEffect } from 'react';
import {
  Card,
  List,
  Button,
  Modal,
  Tag,
  Space,
  Typography,
  Empty,
  Spin,
  App,
  message as antdMessage,
  Segmented,
  Checkbox,
  Popconfirm,
  Pagination,
} from 'antd';
import {
  MailOutlined,
  UserOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import notificationsApi from '../../api/notifications';
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

/** Vai trò người gửi → nhãn nguồn báo cáo (Operator, Admin, Analyst; Manager ẩn) */
const ROLE_SOURCE_LABELS = {
  Operator: 'Phòng vận hành',
  Admin: 'Quản trị',
  Analyst: 'Phân tích',
};
const getSourceLabel = (role) => (role && ROLE_SOURCE_LABELS[role]) || null;

const InboxPage = () => {
  const appApi = App.useApp();
  const message = appApi?.message ?? antdMessage;
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inboxTab, setInboxTab] = useState('inbox'); // 'inbox' | 'sent'
  const [filter, setFilter] = useState('all'); // all | unread (chỉ cho thư đến)
  const [detailItem, setDetailItem] = useState(null);
  const [attachmentBlobUrl, setAttachmentBlobUrl] = useState(null);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadNotifications = async () => {
    setLoading(true);
    try {
      if (inboxTab === 'sent') {
        const data = await notificationsApi.getSentList({ page, limit: pageSize });
        setItems(data.items || []);
        setTotal(data.total || 0);
      } else {
        const params = { page, limit: pageSize, ...(filter === 'unread' ? { unreadOnly: 'true' } : {}) };
        const data = await notificationsApi.getList(params);
        setItems(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      message?.error(inboxTab === 'sent' ? 'Không tải được thư đã gửi' : 'Không tải được thông báo');
      setItems([]);
      setTotal(0);
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
    setPage(1);
  }, [filter, inboxTab]);

  useEffect(() => {
    loadNotifications();
    if (inboxTab === 'inbox') {
      const t = setTimeout(() => loadUnreadCount(), 400);
      return () => clearTimeout(t);
    }
  }, [page, filter, inboxTab]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleListWheel = (e) => {
    if (totalPages <= 1) return;
    if (e.deltaY > 0 && page < totalPages) {
      e.preventDefault();
      setPage((p) => p + 1);
    } else if (e.deltaY < 0 && page > 1) {
      e.preventDefault();
      setPage((p) => p - 1);
    }
  };

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
        .catch(() => message?.error?.('Không tải được file đính kèm. Thử mở lại thư sau vài giây.'))
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

  const toggleEditMode = () => {
    setEditMode(true);
    setSelectedIds(new Set());
  };

  const exitEditMode = () => {
    setEditMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(items.map((n) => n.NotificationId)));
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      let ok = 0;
      let fail = 0;
      for (const id of selectedIds) {
        try {
          await notificationsApi.delete(id);
          ok += 1;
        } catch (_) {
          fail += 1;
        }
      }
      if (ok) {
        message?.success?.(`Đã xóa ${ok} thông báo${fail ? `, ${fail} lỗi` : ''}`);
        setItems((prev) => prev.filter((n) => !selectedIds.has(n.NotificationId)));
        setTotal((t) => Math.max(0, t - ok));
        loadUnreadCount();
      }
      if (fail) message?.error?.(`Không xóa được ${fail} thông báo`);
      exitEditMode();
    } finally {
      setDeleting(false);
    }
  };

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
        <SendReportButton sourcePageName="Hộp thư" type="default" />
      </div>

      <Card className="inbox-card">
        <div className="inbox-toolbar">
          <div className="inbox-toolbar-left">
            <div className="inbox-toolbar-segments">
              <Segmented
                value={inboxTab}
                onChange={(v) => { setInboxTab(v); if (editMode) exitEditMode(); }}
                options={[
                  { label: 'Thư đến', value: 'inbox' },
                  { label: 'Thư đã gửi', value: 'sent' },
                ]}
                size="small"
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
                />
              )}
            </div>
          </div>
          <Space wrap className="inbox-toolbar-actions">
            {editMode ? (
              <>
                <Button size="small" onClick={selectAll}>
                  Chọn tất cả
                </Button>
                <Popconfirm
                  title="Xóa thông báo đã chọn?"
                  description={`Bạn sẽ xóa ${selectedIds.size} thông báo. Không thể hoàn tác.`}
                  onConfirm={handleDeleteSelected}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    loading={deleting}
                    disabled={selectedIds.size === 0}
                  >
                    Xóa
                  </Button>
                </Popconfirm>
                <Button type="primary" size="small" icon={<CheckOutlined />} onClick={exitEditMode}>
                  Xong
                </Button>
              </>
            ) : (
              <Button icon={<EditOutlined />} onClick={toggleEditMode}>
                Điều chỉnh
              </Button>
            )}
          </Space>
        </div>
        <div
          className="inbox-list-area"
          onWheel={handleListWheel}
          style={{ touchAction: 'pan-y' }}
        >
          {loading ? (
            <div className="inbox-loading">
              <Spin tip="Đang tải..."><div style={{ minHeight: 120 }} /></Spin>
            </div>
          ) : items.length === 0 ? (
            <Empty description={inboxTab === 'sent' ? 'Chưa gửi thư nào' : 'Chưa có thông báo nào'} />
          ) : (
            <>
              <List
                itemLayout="horizontal"
                dataSource={items}
                renderItem={(n) => {
              const typeInfo = TYPE_LABELS[n.NotificationType] || { label: n.NotificationType, color: 'default' };
              const isSent = inboxTab === 'sent';
              const recipientName = n.RecipientFullName || n.RecipientUsername;
              const recipientRole = n.RecipientRole;
              const id = n.NotificationId;
              const isSelected = selectedIds.has(id);
              const onRowClick = editMode
                ? (e) => toggleSelect(id, e)
                : () => openDetail(n);
              return (
                <List.Item
                  className={`inbox-item ${!isSent && !n.IsRead ? 'inbox-item-unread' : ''} ${editMode ? 'inbox-item-edit' : ''} ${isSelected ? 'inbox-item-selected' : ''}`}
                  onClick={onRowClick}
                  style={{ cursor: 'pointer' }}
                  extra={
                    editMode ? (
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => toggleSelect(id, e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : null
                  }
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
                      <Space size="small" wrap className="inbox-item-title-row">
                        <Text ellipsis={{ tooltip: n.Title }} className="inbox-item-title-text">
                          {n.Title}
                        </Text>
                        <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                        {!isSent && !n.IsRead && <Tag color="blue">Mới</Tag>}
                      </Space>
                    }
                    description={
                      <div className="inbox-item-desc">
                        <div className="inbox-item-meta-line">
                          {isSent ? (
                            recipientName && (
                              <Text type="secondary" className="inbox-item-meta">
                                Đến: {recipientName}
                                {recipientRole && ` (${recipientRole})`}
                              </Text>
                            )
                          ) : (
                            (n.SenderFullName || n.SenderUsername) && (
                              <Text type="secondary" className="inbox-item-meta">
                                Từ: {n.SenderFullName || n.SenderUsername}
                                {(n.SenderRole || n.senderRole) && ` (${n.SenderRole || n.senderRole})`}
                              </Text>
                            )
                          )}
                          <Text type="secondary" className="inbox-item-meta inbox-item-time">
                            {dayjs(n.CreatedAt).fromNow()}
                            {hasAttachment(n) && (
                              <>
                                {' · '}
                                <PaperClipOutlined /> Đính kèm
                              </>
                            )}
                          </Text>
                        </div>
                        {n.Message && (
                          <div className="inbox-message-preview">{n.Message}</div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
              />
              {total > pageSize && (
                <div className="inbox-pagination-wrap">
                  <Pagination
                    current={page}
                    total={total}
                    pageSize={pageSize}
                    onChange={setPage}
                    showSizeChanger={false}
                    showPrevNextJumpers={false}
                    prevIcon={<span>‹</span>}
                    nextIcon={<span>›</span>}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      <Modal
        title={
          <Text ellipsis={{ tooltip: detailItem?.Title }} style={{ maxWidth: 480, display: 'block' }}>
            {detailItem?.Title || 'Chi tiết thư'}
          </Text>
        }
        open={!!detailItem}
        onCancel={closeDetail}
        footer={[
          <Button key="close" type="primary" onClick={closeDetail}>
            Đóng
          </Button>,
        ]}
        width={720}
        destroyOnHidden
        className="inbox-detail-modal"
      >
        {detailItem && (
          <div className="inbox-detail-content">
            <div className="inbox-detail-meta">
              <div className="inbox-detail-meta-row">
                {detailItem.SenderFullName && (
                  <Text type="secondary">
                    Từ: {detailItem.SenderFullName}
                    {detailItem.SenderRole && ` (${detailItem.SenderRole})`}
                  </Text>
                )}
                <Text type="secondary" className="inbox-detail-time">
                  {dayjs(detailItem.CreatedAt).format('DD/MM/YYYY HH:mm')}
                </Text>
              </div>
              {getSourceLabel(detailItem.SenderRole || detailItem.senderRole) && (
                <Text type="secondary" className="inbox-detail-source">
                  Nguồn báo cáo: {getSourceLabel(detailItem.SenderRole || detailItem.senderRole)}
                </Text>
              )}
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
    </div>
  );
};

export default InboxPage;
