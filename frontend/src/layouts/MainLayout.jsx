import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Space, Tag } from 'antd';
import {
  HomeOutlined,
  LoginOutlined,
  UserAddOutlined,
  LogoutOutlined,
  BarChartOutlined,
  NotificationOutlined,
  SearchOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/auth/useAuthStore';
import CookieConsent from '../components/CookieConsent';
import './MainLayout.css';

const { Header, Content, Footer } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    logout: state.logout,
  }));

  const menuItems = isAuthenticated
    ? [
        {
          key: '/',
          icon: <HomeOutlined />,
          label: 'Trang chủ',
        },
        {
          key: '/reports',
          icon: <BarChartOutlined />,
          label: 'Báo cáo',
        },
        {
          key: '/news',
          icon: <NotificationOutlined />,
          label: 'Tin tức',
        },
        {
          key: '/diagnosis',
          icon: <SearchOutlined />,
          label: 'Chuẩn đoán',
        },
        {
          key: '/ai-prediction',
          icon: <RobotOutlined />,
          label: 'AI dự đoán thiên tai',
        },
      ]
    : [];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <Layout className="main-layout">
      <CookieConsent />
      <Header className="main-header">
        <div className="header-content">
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
            <img 
              src="/logo.png" 
              alt="Logo" 
              style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                // Fallback nếu logo chưa có
                e.target.style.display = 'none';
              }}
            />
            <h1>HCM Land Subsidence</h1>
          </div>
          <div className="header-right">
            {menuItems.length > 0 && (
              <Menu
                theme="light"
                mode="horizontal"
                disabledOverflow
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={handleMenuClick}
                className="main-menu"
              />
            )}
            {isAuthenticated ? (
              <Space className="auth-buttons">
                <span>{user?.username}</span>
                {user?.role && <Tag color="blue">{user.role}</Tag>}
                <Button
                  type="text"
                  icon={<LogoutOutlined />}
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  Đăng xuất
                </Button>
              </Space>
            ) : (
              <Space className="auth-buttons">
                <Button
                  type="default"
                  icon={<LoginOutlined />}
                  onClick={handleLogin}
                >
                  Đăng nhập
                </Button>
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={handleRegister}
                >
                  Đăng ký
                </Button>
              </Space>
            )}
          </div>
        </div>
      </Header>
      <Content className="main-content">
        <Outlet />
      </Content>
      <Footer className="main-footer">
        <div className="footer-content">
          <p>&copy; 2024 Hệ thống Quản lý Sụt lún Đất TPHCM. All rights reserved.</p>
        </div>
      </Footer>
    </Layout>
  );
};

export default MainLayout;
