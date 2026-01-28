import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Space } from 'antd';
import { HomeOutlined, DashboardOutlined, LoginOutlined, UserAddOutlined, LogoutOutlined } from '@ant-design/icons';
import './MainLayout.css';

const { Header, Content, Footer } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: 'Trang chủ',
    },
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
  ];

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
      <Header className="main-header">
        <div className="header-content">
          <div className="logo">
            <h1>HCM Land Subsidence</h1>
          </div>
          <div className="header-right">
            <Menu
              theme="light"
              mode="horizontal"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={handleMenuClick}
              className="main-menu"
            />
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
