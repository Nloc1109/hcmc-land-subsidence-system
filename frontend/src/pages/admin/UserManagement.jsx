import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  App,
  Space,
  Tag,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  InputNumber,
  Switch,
} from 'antd';
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  LockOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import usersApi from '../../api/users';
import authApi from '../../api/auth';
import './Admin.css';

const { Search } = Input;

const UserManagement = () => {
  const { message } = App.useApp();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [resetPasswordModal, setResetPasswordModal] = useState({ visible: false, userId: null });
  const [resetPasswordForm] = Form.useForm();

  useEffect(() => {
    loadRoles();
    loadUsers();
  }, [pagination.current, pagination.pageSize, searchText, selectedRole]);

  const loadRoles = async () => {
    try {
      const data = await authApi.getRoles();
      const list = (data.roles || []).filter((r) => (r.RoleName || r.roleName) !== 'Manager');
      setRoles(list);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText || undefined,
        roleId: selectedRole || undefined,
      };
      const data = await usersApi.getUsers(params);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (error) {
      message.error('Lỗi khi tải danh sách người dùng');
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.Username,
      email: user.Email,
      fullName: user.FullName,
      phoneNumber: user.PhoneNumber,
      roleId: user.RoleId,
      isActive: user.IsActive,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (userId) => {
    try {
      await usersApi.deleteUser(userId);
      message.success('Xóa người dùng thành công');
      loadUsers();
    } catch (error) {
      message.error('Lỗi khi xóa người dùng');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        await usersApi.updateUser(editingUser.UserId, values);
        message.success('Cập nhật người dùng thành công');
      } else {
        await usersApi.createUser(values);
        message.success('Tạo người dùng thành công');
      }
      setIsModalVisible(false);
      form.resetFields();
      loadUsers();
    } catch (error) {
      const msg = error?.response?.data?.message || 'Lỗi khi lưu người dùng';
      message.error(msg);
    }
  };

  const handleResetPassword = async (values) => {
    try {
      await usersApi.resetPassword(resetPasswordModal.userId, values.newPassword);
      message.success('Đặt lại mật khẩu thành công');
      setResetPasswordModal({ visible: false, userId: null });
      resetPasswordForm.resetFields();
    } catch (error) {
      message.error('Lỗi khi đặt lại mật khẩu');
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'UserId',
      key: 'UserId',
      width: 80,
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'Username',
      key: 'Username',
    },
    {
      title: 'Họ và tên',
      dataIndex: 'FullName',
      key: 'FullName',
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
        <Tag color={role === 'Admin' ? 'red' : 'default'}>
          {role}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'IsActive',
      key: 'IsActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Hoạt động' : 'Vô hiệu'}</Tag>
      ),
    },
    {
      title: 'Đăng nhập cuối',
      dataIndex: 'LastLoginAt',
      key: 'LastLoginAt',
      render: (date) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'Chưa đăng nhập'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Sửa
          </Button>
          <Button
            type="link"
            icon={<LockOutlined />}
            onClick={() => setResetPasswordModal({ visible: true, userId: record.UserId })}
            size="small"
          >
            Đặt lại MK
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa người dùng này?"
            onConfirm={() => handleDelete(record.UserId)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const activeUsers = users.filter((u) => u.IsActive).length;
  const inactiveUsers = users.filter((u) => !u.IsActive).length;

  return (
    <div className="admin-page">
      <Card>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic title="Tổng số người dùng" value={total} />
          </Col>
          <Col span={6}>
            <Statistic title="Đang hoạt động" value={activeUsers} valueStyle={{ color: '#3f8600' }} />
          </Col>
          <Col span={6}>
            <Statistic title="Vô hiệu" value={inactiveUsers} valueStyle={{ color: '#cf1322' }} />
          </Col>
          <Col span={6}>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={handleCreate}
              block
            >
              Tạo người dùng mới
            </Button>
          </Col>
        </Row>

        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Search
              placeholder="Tìm kiếm người dùng..."
              allowClear
              style={{ width: 300 }}
              onSearch={(value) => {
                setSearchText(value);
                setPagination({ ...pagination, current: 1 });
              }}
            />
            <Select
              placeholder="Lọc theo vai trò"
              allowClear
              style={{ width: 200 }}
              onChange={(value) => {
                setSelectedRole(value);
                setPagination({ ...pagination, current: 1 });
              }}
            >
              {roles.map((role) => (
                <Select.Option key={role.RoleId} value={role.RoleId}>
                  {role.RoleName}
                </Select.Option>
              ))}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={loadUsers}>
              Làm mới
            </Button>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="UserId"
          loading={loading}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} người dùng`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Modal tạo/sửa người dùng */}
      <Modal
        title={editingUser ? 'Sửa người dùng' : 'Tạo người dùng mới'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {!editingUser && (
            <Form.Item
              name="username"
              label="Tên đăng nhập"
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
            >
              <Input />
            </Form.Item>
          )}

          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="phoneNumber" label="Số điện thoại">
            <Input />
          </Form.Item>

          <Form.Item
            name="roleId"
            label="Vai trò"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select>
              {roles.map((role) => (
                <Select.Option key={role.RoleId} value={role.RoleId}>
                  {role.RoleName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
              ]}
            >
              <Input.Password />
            </Form.Item>
          )}

          {editingUser && (
            <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Vô hiệu" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Modal đặt lại mật khẩu */}
      <Modal
        title="Đặt lại mật khẩu"
        open={resetPasswordModal.visible}
        onCancel={() => {
          setResetPasswordModal({ visible: false, userId: null });
          resetPasswordForm.resetFields();
        }}
        onOk={() => resetPasswordForm.submit()}
      >
        <Form
          form={resetPasswordForm}
          layout="vertical"
          onFinish={handleResetPassword}
        >
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;

