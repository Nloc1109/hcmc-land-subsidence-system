import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Divider,
  message,
  Popconfirm,
  Alert,
} from 'antd';
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PlayCircleOutlined,
  CheckOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import requestsApi from '../api/requests';
import { useMessage } from '../hooks/useMessage';
import './MyRequests.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const PRIORITY_CONFIG = {
  Green: { color: 'green', label: 'Xanh', icon: CheckCircleOutlined, description: 'Có thể từ chối hoặc chấp nhận' },
  Yellow: { color: 'orange', label: 'Vàng', icon: ExclamationCircleOutlined, description: 'Bắt buộc chấp nhận, có thể thương lượng thời gian' },
  Red: { color: 'red', label: 'Đỏ', icon: CloseCircleOutlined, description: 'Khẩn cấp, bắt buộc làm ngay' },
};

const STATUS_CONFIG = {
  Pending: { color: 'default', label: 'Chờ xử lý' },
  Accepted: { color: 'blue', label: 'Đã chấp nhận' },
  Rejected: { color: 'red', label: 'Đã từ chối' },
  Negotiating: { color: 'orange', label: 'Đang thương lượng' },
  InProgress: { color: 'processing', label: 'Đang thực hiện' },
  Completed: { color: 'success', label: 'Hoàn thành' },
  Cancelled: { color: 'default', label: 'Đã hủy' },
};

const MyRequests = () => {
  const msg = useMessage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({ status: null, priority: null });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionModal, setActionModal] = useState({ visible: false, type: null });
  const [form] = Form.useForm();
  const [negotiateForm] = Form.useForm();

  useEffect(() => {
    loadRequests();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
      };
      const data = await requestsApi.getRequests(params);
      setRequests(data.requests || []);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      msg.error('Lỗi khi tải danh sách yêu cầu');
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (request) => {
    try {
      await requestsApi.acceptRequest(request.requestId);
      msg.success('Đã chấp nhận yêu cầu');
      loadRequests();
      setActionModal({ visible: false, type: null });
    } catch (error) {
      msg.error(error?.response?.data?.message || 'Lỗi khi chấp nhận yêu cầu');
    }
  };

  const handleReject = async (values) => {
    try {
      await requestsApi.rejectRequest(selectedRequest.requestId, values.rejectionReason);
      msg.success('Đã từ chối yêu cầu');
      loadRequests();
      setActionModal({ visible: false, type: null });
      setSelectedRequest(null);
    } catch (error) {
      msg.error(error?.response?.data?.message || 'Lỗi khi từ chối yêu cầu');
    }
  };

  const handleNegotiate = async (values) => {
    try {
      await requestsApi.negotiateRequest(
        selectedRequest.requestId,
        values.negotiatedDueDate.toISOString(),
        values.negotiationMessage
      );
      msg.success('Đã gửi yêu cầu thương lượng');
      loadRequests();
      setActionModal({ visible: false, type: null });
      setSelectedRequest(null);
      negotiateForm.resetFields();
    } catch (error) {
      msg.error(error?.response?.data?.message || 'Lỗi khi thương lượng yêu cầu');
    }
  };

  const handleStart = async (request) => {
    try {
      await requestsApi.startRequest(request.requestId);
      msg.success('Đã bắt đầu làm việc');
      loadRequests();
    } catch (error) {
      msg.error(error?.response?.data?.message || 'Lỗi khi bắt đầu làm việc');
    }
  };

  const handleComplete = async (request) => {
    try {
      await requestsApi.completeRequest(request.requestId);
      msg.success('Đã hoàn thành yêu cầu');
      loadRequests();
    } catch (error) {
      msg.error(error?.response?.data?.message || 'Lỗi khi hoàn thành yêu cầu');
    }
  };

  const openActionModal = (request, type) => {
    setSelectedRequest(request);
    setActionModal({ visible: true, type });
    if (type === 'reject') {
      form.resetFields();
    } else if (type === 'negotiate') {
      negotiateForm.resetFields();
      negotiateForm.setFieldsValue({
        negotiatedDueDate: request.dueDate ? dayjs(request.dueDate) : null,
      });
    }
  };

  const getActionButtons = (request) => {
    const buttons = [];
    
    if (request.status === 'Pending') {
      if (request.priority === 'Green') {
        buttons.push(
          <Button
            key="accept"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleAccept(request)}
          >
            Chấp nhận
          </Button>
        );
        buttons.push(
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => openActionModal(request, 'reject')}
          >
            Từ chối
          </Button>
        );
      } else if (request.priority === 'Yellow') {
        buttons.push(
          <Button
            key="accept"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleAccept(request)}
          >
            Chấp nhận
          </Button>
        );
        buttons.push(
          <Button
            key="negotiate"
            icon={<MessageOutlined />}
            onClick={() => openActionModal(request, 'negotiate')}
          >
            Thương lượng thời gian
          </Button>
        );
      } else if (request.priority === 'Red') {
        buttons.push(
          <Button
            key="accept"
            type="primary"
            danger
            icon={<CheckCircleOutlined />}
            onClick={() => handleAccept(request)}
          >
            Chấp nhận (Khẩn cấp)
          </Button>
        );
      }
    } else if (request.status === 'Accepted') {
      buttons.push(
        <Button
          key="start"
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={() => handleStart(request)}
        >
          Bắt đầu làm việc
        </Button>
      );
    } else if (request.status === 'InProgress') {
      buttons.push(
        <Button
          key="complete"
          type="primary"
          icon={<CheckOutlined />}
          onClick={() => handleComplete(request)}
        >
          Hoàn thành
        </Button>
      );
    } else if (request.status === 'Negotiating') {
      buttons.push(
        <Button
          key="accept"
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => handleAccept(request)}
        >
          Chấp nhận thời gian mới
        </Button>
      );
    }
    
    return buttons.length > 0 ? <Space>{buttons}</Space> : null;
  };

  const columns = [
    {
      title: 'Mã yêu cầu',
      dataIndex: 'requestCode',
      key: 'requestCode',
      width: 120,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Mức độ',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority) => {
        const config = PRIORITY_CONFIG[priority];
        const Icon = config?.icon || CheckCircleOutlined;
        return (
          <Tag color={config?.color} icon={<Icon />}>
            {config?.label || priority}
          </Tag>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status) => {
        const config = STATUS_CONFIG[status];
        return <Tag color={config?.color}>{config?.label || status}</Tag>;
      },
    },
    {
      title: 'Thời hạn',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 180,
      render: (dueDate, record) => {
        if (record.negotiatedDueDate) {
          return (
            <div>
              <div style={{ textDecoration: 'line-through', color: '#999', fontSize: 12 }}>
                {dayjs(dueDate).format('DD/MM/YYYY HH:mm')}
              </div>
              <div style={{ color: '#faad14' }}>
                {dayjs(record.negotiatedDueDate).format('DD/MM/YYYY HH:mm')}
                <Tag color="orange" style={{ marginLeft: 8 }}>Đã thương lượng</Tag>
              </div>
            </div>
          );
        }
        return dueDate ? dayjs(dueDate).format('DD/MM/YYYY HH:mm') : '-';
      },
    },
    {
      title: 'Người giao',
      key: 'createdBy',
      width: 150,
      render: (record) => record.createdByName || '-',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_, record) => getActionButtons(record),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2}>Yêu cầu của tôi</Title>
        <Text type="secondary">
          Xem và xử lý các yêu cầu được giao cho bạn
        </Text>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8} md={6}>
            <Statistic
              title="Tổng yêu cầu"
              value={total}
              prefix={<ReloadOutlined />}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Statistic
              title="Chờ xử lý"
              value={requests.filter((r) => r.status === 'Pending').length}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Statistic
              title="Đang thực hiện"
              value={requests.filter((r) => r.status === 'InProgress').length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Statistic
              title="Đã hoàn thành"
              value={requests.filter((r) => r.status === 'Completed').length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <Space>
            <Select
              placeholder="Lọc theo trạng thái"
              style={{ width: 150 }}
              allowClear
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <Select.Option key={key} value={key}>
                  {config.label}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder="Lọc theo mức độ"
              style={{ width: 150 }}
              allowClear
              value={filters.priority}
              onChange={(value) => setFilters({ ...filters, priority: value })}
            >
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <Select.Option key={key} value={key}>
                  {config.label}
                </Select.Option>
              ))}
            </Select>
          </Space>
          <Button icon={<ReloadOutlined />} onClick={loadRequests}>
            Làm mới
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={requests}
          rowKey="requestId"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} yêu cầu`,
            onChange: (page, pageSize) => {
              setPagination({ current: page, pageSize });
            },
          }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: '16px 0' }}>
                <Paragraph>
                  <Text strong>Mô tả: </Text>
                  {record.description || 'Không có mô tả'}
                </Paragraph>
                {record.rejectionReason && (
                  <Alert
                    type="error"
                    message="Lý do từ chối"
                    description={record.rejectionReason}
                    style={{ marginTop: 8 }}
                  />
                )}
                {record.negotiationMessage && (
                  <Alert
                    type="warning"
                    message="Thông điệp thương lượng"
                    description={record.negotiationMessage}
                    style={{ marginTop: 8 }}
                  />
                )}
                <Divider />
                <Row gutter={16}>
                  <Col span={12}>
                    <Text type="secondary">Người giao: </Text>
                    <Text strong>{record.createdByName}</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Ngày tạo: </Text>
                    <Text>{dayjs(record.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                  </Col>
                </Row>
              </div>
            ),
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Modal từ chối (chỉ mức Green) */}
      <Modal
        title="Từ chối yêu cầu"
        open={actionModal.visible && actionModal.type === 'reject'}
        onCancel={() => {
          setActionModal({ visible: false, type: null });
          setSelectedRequest(null);
        }}
        onOk={() => form.submit()}
        okText="Từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        {selectedRequest && (
          <>
            <Alert
              type="info"
              message="Chỉ yêu cầu mức Xanh mới có thể từ chối"
              style={{ marginBottom: 16 }}
            />
            <Form form={form} layout="vertical" onFinish={handleReject}>
              <Form.Item
                name="rejectionReason"
                label="Lý do từ chối"
                rules={[{ required: true, message: 'Vui lòng nhập lý do từ chối' }]}
              >
                <TextArea rows={4} placeholder="Nhập lý do từ chối yêu cầu" />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* Modal thương lượng (chỉ mức Yellow) */}
      <Modal
        title="Thương lượng thời gian"
        open={actionModal.visible && actionModal.type === 'negotiate'}
        onCancel={() => {
          setActionModal({ visible: false, type: null });
          setSelectedRequest(null);
          negotiateForm.resetFields();
        }}
        onOk={() => negotiateForm.submit()}
        okText="Gửi yêu cầu thương lượng"
        cancelText="Hủy"
      >
        {selectedRequest && (
          <>
            <Alert
              type="warning"
              message="Yêu cầu mức Vàng bắt buộc phải chấp nhận, nhưng bạn có thể thương lượng về thời gian hoàn thành"
              style={{ marginBottom: 16 }}
            />
            <Form form={negotiateForm} layout="vertical" onFinish={handleNegotiate}>
              <Form.Item
                name="negotiatedDueDate"
                label="Thời hạn mới"
                rules={[{ required: true, message: 'Vui lòng chọn thời hạn mới' }]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: '100%' }}
                  placeholder="Chọn thời hạn mới"
                />
              </Form.Item>
              <Form.Item
                name="negotiationMessage"
                label="Thông điệp thương lượng"
              >
                <TextArea rows={3} placeholder="Giải thích lý do cần thay đổi thời hạn" />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default MyRequests;

