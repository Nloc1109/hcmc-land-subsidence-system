import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Select } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../../api/auth';
import './Auth.css';

const { Title, Text } = Typography;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setRoleLoading(true);
        const data = await authApi.getRoles();
        setRoles(data.roles || []);
      } catch (error) {
        // Không chặn đăng ký nếu lỗi, chỉ báo nhẹ
        console.error('Load roles error:', error);
        message.warning('Không tải được danh sách vai trò, sẽ dùng vai trò mặc định.');
      } finally {
        setRoleLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: values.fullName,
        username: values.username,
        email: values.email,
        phoneNumber: values.phoneNumber,
        password: values.password,
        roleId: values.roleId, // có thể undefined, backend sẽ dùng mặc định
      };

      await authApi.register(payload);
      message.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (error) {
      const msg = error?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Card className="auth-card">
          <div className="auth-header">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/')}
              className="back-button"
            >
              Về trang chủ
            </Button>
            <Title level={2} className="auth-title">Đăng Ký</Title>
            <Text className="auth-subtitle">
              Tạo tài khoản mới để sử dụng hệ thống
            </Text>
          </div>

          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            className="auth-form"
          >
            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[
                { required: true, message: 'Vui lòng nhập họ và tên!' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập họ và tên"
              />
            </Form.Item>

            <Form.Item
              name="username"
              label="Tên đăng nhập"
              rules={[
                { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
                { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' },
                { pattern: /^[a-zA-Z0-9_]+$/, message: 'Tên đăng nhập chỉ chứa chữ, số và dấu gạch dưới!' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập tên đăng nhập"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Nhập email"
              />
            </Form.Item>

            <Form.Item
              name="phoneNumber"
              label="Số điện thoại"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại!' },
                { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="Nhập số điện thoại"
              />
            </Form.Item>

            <Form.Item
              name="roleId"
              label="Vai trò trong hệ thống"
              tooltip="Admin là mặc định trong hệ thống và không thể tự đăng ký."
              rules={[
                { required: true, message: 'Vui lòng chọn vai trò!' },
              ]}
            >
              <Select
                placeholder="Chọn vai trò (không bao gồm Admin)"
                loading={roleLoading}
                allowClear={false}
              >
                {roles.map((role) => (
                  <Select.Option key={role.RoleId} value={role.RoleId}>
                    {role.RoleName}
                    {role.Description ? ` - ${role.Description}` : ''}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập lại mật khẩu"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="auth-submit-button"
              >
                Đăng ký
              </Button>
            </Form.Item>
          </Form>

          <div className="auth-footer">
            <Text>
              Đã có tài khoản?{' '}
              <Link to="/login" className="auth-link">
                Đăng nhập ngay
              </Link>
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
