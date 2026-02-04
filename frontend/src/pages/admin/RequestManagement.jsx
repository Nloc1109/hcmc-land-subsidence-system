import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
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
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import requestsApi from '../../api/requests';
import { useMessage } from '../../hooks/useMessage';
import './Admin.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PRIORITY_CONFIG = {
  Green: { color: 'green', label: 'Xanh', icon: CheckCircleOutlined },
  Yellow: { color: 'orange', label: 'Vàng', icon: ExclamationCircleOutlined },
  Red: { color: 'red', label: 'Đỏ', icon: CloseCircleOutlined },
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

const RequestManagement = () => {
  const msg = useMessage();
  const [requests, setRequests] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({ status: null, priority: null });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRequests();
    loadAssignableUsers();
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

  const loadAssignableUsers = async () => {
    try {
      const data = await requestsApi.getAssignableUsers();
      setAssignableUsers(data.users || []);
    } catch (error) {
      console.error('Error loading assignable users:', error);
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        assignedTo: values.assignedTo,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
      };
      await requestsApi.createRequest(payload);
      msg.success('Tạo yêu cầu thành công');
      setIsModalVisible(false);
      loadRequests();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi tạo yêu cầu';
      console.error('Error creating request:', error);
      console.error('Error response:', error?.response?.data);
      msg.error(errorMessage);
    }
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
      width: 100,
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
      title: 'Người được giao',
      key: 'assignedTo',
      width: 150,
      render: (record) => (
        <div>
          <div>{record.assignedToName}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.assignedToRole}</Text>
        </div>
      ),
    },
    {
      title: 'Thời hạn',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 150,
      render: (dueDate, record) => {
        if (record.negotiatedDueDate) {
          return (
            <div>
              <div style={{ textDecoration: 'line-through', color: '#999' }}>
                {dayjs(dueDate).format('DD/MM/YYYY HH:mm')}
              </div>
              <div style={{ color: '#faad14' }}>
                {dayjs(record.negotiatedDueDate).format('DD/MM/YYYY HH:mm')}
              </div>
            </div>
          );
        }
        return dueDate ? dayjs(dueDate).format('DD/MM/YYYY HH:mm') : '-';
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2}>Quản lý yêu cầu</Title>
        <Text type="secondary">
          Tạo và quản lý yêu cầu gửi cho các roles khác (trừ Viewer)
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
              title="Đang chờ xử lý"
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
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadRequests}>
              Làm mới
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Tạo yêu cầu mới
            </Button>
          </Space>
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
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="Tạo yêu cầu mới"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        okText="Tạo yêu cầu"
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder="Nhập tiêu đề yêu cầu" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea rows={4} placeholder="Nhập mô tả chi tiết yêu cầu" />
          </Form.Item>

          <Form.Item
            name="priority"
            label="Mức độ ưu tiên"
            rules={[{ required: true, message: 'Vui lòng chọn mức độ ưu tiên' }]}
          >
            <Select placeholder="Chọn mức độ ưu tiên">
              <Select.Option value="Green">
                <Tag color="green">Xanh - Có thể từ chối hoặc chấp nhận</Tag>
              </Select.Option>
              <Select.Option value="Yellow">
                <Tag color="orange">Vàng - Bắt buộc chấp nhận, có thể thương lượng thời gian</Tag>
              </Select.Option>
              <Select.Option value="Red">
                <Tag color="red">Đỏ - Khẩn cấp, bắt buộc làm ngay</Tag>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="assignedTo"
            label="Giao cho"
            rules={[{ required: true, message: 'Vui lòng chọn người được giao' }]}
          >
            <Select
              placeholder="Chọn người được giao yêu cầu"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {assignableUsers.map((user) => (
                <Select.Option key={user.userId} value={user.userId} label={`${user.fullName} (${user.roleName})`}>
                  {user.fullName} <Text type="secondary">({user.roleName})</Text>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Thời hạn (tùy chọn)"
          >
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
              placeholder="Chọn thời hạn hoàn thành"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RequestManagement;

