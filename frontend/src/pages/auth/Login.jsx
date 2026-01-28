import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth/useAuthStore';
import './Auth.css';

const { Title, Text } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // TODO: Gọi API đăng nhập
      console.log('Login values:', values);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      login({
        username: values.username,
        role: 'Quản trị viên',
      });
      message.success('Đăng nhập thành công!');
      navigate('/');
    } catch (error) {
      message.error('Đăng nhập thất bại. Vui lòng thử lại.');
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
            <Title level={2} className="auth-title">Đăng Nhập</Title>
            <Text className="auth-subtitle">
              Đăng nhập vào hệ thống quản lý sụt lún đất TPHCM
            </Text>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            className="auth-form"
          >
            <Form.Item
              name="username"
              label="Tên đăng nhập"
              rules={[
                { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
                { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập tên đăng nhập"
              />
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

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="auth-submit-button"
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          <div className="auth-footer">
            <Text>
              Chưa có tài khoản?{' '}
              <Link to="/register" className="auth-link">
                Đăng ký ngay
              </Link>
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
