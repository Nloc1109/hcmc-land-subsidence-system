import { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Space,
  Button,
  Select,
  DatePicker,
  Input,
  Row,
  Col,
  Statistic,
  Tag,
  Descriptions,
} from 'antd';
import {
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import auditLogsApi from '../../api/audit-logs';
import usersApi from '../../api/users';
import './Admin.css';

const { RangePicker } = DatePicker;

const LoginLogs = () => {
  const [logs, setLogs] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50 });
  const [filters, setFilters] = useState({
    userId: null,
    actionType: 'Login',
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    loadUsers();
    loadLogs();
    loadStatistics();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadUsers = async () => {
    try {
      const data = await usersApi.getUsers({ limit: 1000 });
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        userId: filters.userId || undefined,
        actionType: filters.actionType || undefined,
        startDate: filters.startDate ? filters.startDate.format('YYYY-MM-DD') : undefined,
        endDate: filters.endDate ? filters.endDate.format('YYYY-MM-DD') : undefined,
      };
      const data = await auditLogsApi.getLoginLogs(params);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const params = {
        startDate: filters.startDate ? filters.startDate.format('YYYY-MM-DD') : undefined,
        endDate: filters.endDate ? filters.endDate.format('YYYY-MM-DD') : undefined,
      };
      const data = await auditLogsApi.getStatistics(params);
      setStatistics(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setFilters({
        ...filters,
        startDate: dates[0],
        endDate: dates[1],
      });
      setPagination({ ...pagination, current: 1 });
    } else {
      setFilters({
        ...filters,
        startDate: null,
        endDate: null,
      });
    }
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
      width: 180,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm:ss'),
      sorter: (a, b) => dayjs(a.CreatedAt).unix() - dayjs(b.CreatedAt).unix(),
    },
    {
      title: 'Người dùng',
      key: 'user',
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <div>
            <div>{record.Username}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.FullName}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'Email',
      key: 'Email',
    },
    {
      title: 'Vai trò',
      dataIndex: 'RoleName',
      key: 'RoleName',
      render: (role) => (
        <Tag color={role === 'Admin' ? 'red' : role === 'Manager' ? 'blue' : 'default'}>
          {role}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'ActionType',
      key: 'ActionType',
      render: (action) => (
        <Tag
          color={action === 'Login' ? 'green' : 'orange'}
          icon={action === 'Login' ? <LoginOutlined /> : <LogoutOutlined />}
        >
          {action === 'Login' ? 'Đăng nhập' : 'Đăng xuất'}
        </Tag>
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'IpAddress',
      key: 'IpAddress',
    },
    {
      title: 'User Agent',
      dataIndex: 'UserAgent',
      key: 'UserAgent',
      ellipsis: true,
    },
  ];

  const loginCount = statistics?.actionStats?.find((s) => s.ActionType === 'Login')?.Count || 0;
  const logoutCount = statistics?.actionStats?.find((s) => s.ActionType === 'Logout')?.Count || 0;

  return (
    <div className="admin-page">
      <Card>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Statistic title="Tổng số log" value={total} />
          </Col>
          <Col span={8}>
            <Statistic
              title="Đăng nhập"
              value={loginCount}
              valueStyle={{ color: '#3f8600' }}
              prefix={<LoginOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Đăng xuất"
              value={logoutCount}
              valueStyle={{ color: '#cf1322' }}
              prefix={<LogoutOutlined />}
            />
          </Col>
        </Row>

        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Select
              placeholder="Lọc theo người dùng"
              allowClear
              style={{ width: 200 }}
              showSearch
              optionFilterProp="children"
              onChange={(value) => {
                setFilters({ ...filters, userId: value });
                setPagination({ ...pagination, current: 1 });
              }}
            >
              {users.map((user) => (
                <Select.Option key={user.UserId} value={user.UserId}>
                  {user.Username} - {user.FullName}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder="Loại hành động"
              allowClear
              style={{ width: 150 }}
              value={filters.actionType}
              onChange={(value) => {
                setFilters({ ...filters, actionType: value });
                setPagination({ ...pagination, current: 1 });
              }}
            >
              <Select.Option value="Login">Đăng nhập</Select.Option>
              <Select.Option value="Logout">Đăng xuất</Select.Option>
            </Select>
            <RangePicker
              onChange={handleDateRangeChange}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
            />
            <Button icon={<ReloadOutlined />} onClick={loadLogs}>
              Làm mới
            </Button>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={logs}
          rowKey="LogId"
          loading={loading}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} log`,
          }}
          onChange={(newPagination) => setPagination(newPagination)}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default LoginLogs;

