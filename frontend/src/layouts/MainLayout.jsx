import { useState, useEffect } from 'react';
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
  MenuOutlined,
  UserOutlined,
  FileTextOutlined,
  SettingOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/auth/useAuthStore';
import CookieConsent from '../components/CookieConsent';
import './MainLayout.css';

const { Header, Content, Footer, Sider } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { isAuthenticated, user, logout } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    logout: state.logout,
  }));

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hiện header khi ở top hoặc scroll lên
      if (currentScrollY < 10) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Ẩn header khi scroll xuống (sau khi scroll quá 100px)
        setHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Hiện header khi scroll lên
        setHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Lấy role từ user (hỗ trợ cả camelCase và PascalCase)
  // Backend trả về 'role', nhưng cũng hỗ trợ 'roleName' để tương thích
  const userRole = user?.role || user?.roleName || user?.RoleName;
  const isAdmin = userRole === 'Admin';
  const isAnalyst = userRole === 'Analyst';
  const isViewer = userRole === 'Viewer';
  const isOperator = userRole === 'Operator';
  const isManager = userRole === 'Manager';
  
  const menuItems = isAuthenticated
    ? [
        // Tất cả role đều có Trang chủ
        {
          key: '/',
          icon: <HomeOutlined />,
          label: 'Trang chủ',
        },
        // Viewer, Manager, Analyst, Admin: Tin tức
        ...((isViewer || isManager || isAnalyst || isAdmin)
          ? [
              {
                key: '/news',
                icon: <NotificationOutlined />,
                label: 'Tin tức',
              },
            ]
          : []),
        // Manager, Analyst, Admin: Báo cáo
        ...((isManager || isAnalyst || isAdmin)
          ? [
              {
                key: '/reports',
                icon: <BarChartOutlined />,
                label: 'Báo cáo',
              },
            ]
          : []),
        // Operator, Manager, Admin: Chẩn đoán
        ...((isOperator || isManager || isAdmin)
          ? [
              {
                key: '/diagnosis',
                icon: <SearchOutlined />,
                label: 'Chẩn đoán',
              },
            ]
          : []),
        // Operator, Manager, Admin: AI Dự đoán
        ...((isOperator || isManager || isAdmin)
          ? [
              {
                key: '/ai-prediction',
                icon: <RobotOutlined />,
                label: 'AI dự đoán thiên tai',
              },
            ]
          : []),
        // Analyst, Admin: Phân tích chuyên sâu
        ...((isAnalyst || isAdmin)
          ? [
              {
                key: '/analysis',
                icon: <GlobalOutlined />,
                label: 'Phân tích chuyên sâu',
              },
            ]
          : []),
        // Admin: Quản trị
        ...(isAdmin
          ? [
              {
                key: 'admin',
                icon: <SettingOutlined />,
                label: 'Quản trị',
                children: [
                  {
                    key: '/admin/users',
                    icon: <UserOutlined />,
                    label: 'Quản lý người dùng',
                  },
                  {
                    key: '/admin/login-logs',
                    icon: <FileTextOutlined />,
                    label: 'Log đăng nhập',
                  },
                ],
              },
            ]
          : []),
      ]
    : [];

  const handleMenuClick = ({ key }) => {
    // Chỉ navigate nếu key là một route hợp lệ (bắt đầu bằng /)
    if (key.startsWith('/')) {
      navigate(key);
    }
  };
  
  // Xác định selectedKeys cho menu (bao gồm cả submenu)
  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/users')) return ['/admin/users'];
    if (path.startsWith('/admin/login-logs')) return ['/admin/login-logs'];
    if (path.startsWith('/analysis')) return ['/analysis'];
    return [path];
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const hasSidebar = isAuthenticated && menuItems.length > 0;

  return (
    <Layout className={`main-layout ${hasSidebar ? 'has-sidebar' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <CookieConsent />
      {hasSidebar && (
        <Sider 
          className="main-sider"
          width={250}
          collapsedWidth={60}
          theme="light"
          collapsible
          collapsed={collapsed}
          trigger={null}
          style={{ position: 'fixed', left: 0, top: 0, bottom: 0 }}
        >
          <div className="sidebar-header">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="hamburger-button-sidebar"
            />
          </div>
          <div className="sidebar-logo" onClick={() => navigate('/')}>
            <img 
              src="/logo.png" 
              alt="Logo" 
              style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            {!collapsed && <h1>HCM Land Subsidence</h1>}
          </div>
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={getSelectedKeys()}
            defaultOpenKeys={isAdmin ? ['admin'] : []}
            items={menuItems}
            onClick={handleMenuClick}
            className="sidebar-menu"
            inlineCollapsed={collapsed}
          />
        </Sider>
      )}
      <Layout className="main-layout-content">
        <Header className={`main-header ${headerVisible ? 'header-visible' : 'header-hidden'}`}>
          <div className="header-content">
            <div className="header-left">
              {(!isAuthenticated || menuItems.length === 0) && (
                <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img 
                    src="/logo.png" 
                    alt="Logo" 
                    style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <h1>HCM Land Subsidence</h1>
                </div>
              )}
            </div>
            <div className="header-right">
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
    </Layout>
  );
};

export default MainLayout;
