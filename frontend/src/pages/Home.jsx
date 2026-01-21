import { Typography, Row, Col, Card, Statistic, Button, Space } from 'antd';
import { 
  EnvironmentOutlined, 
  WarningOutlined, 
  BarChartOutlined,
  GlobalOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const { Title, Paragraph } = Typography;

const HomePage = () => {
  const navigate = useNavigate();

  const stats = [
    {
      title: 'Khu vực giám sát',
      value: 16,
      prefix: <EnvironmentOutlined />,
      suffix: 'khu vực',
    },
    {
      title: 'Cảnh báo đang mở',
      value: 5,
      prefix: <WarningOutlined />,
      suffix: 'cảnh báo',
      valueStyle: { color: '#ff4d4f' },
    },
    {
      title: 'Thiết bị hoạt động',
      value: 27,
      prefix: <BarChartOutlined />,
      suffix: 'thiết bị',
    },
    {
      title: 'Trạm giám sát',
      value: 14,
      prefix: <GlobalOutlined />,
      suffix: 'trạm',
    },
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <Title level={1} className="hero-title">
            Hệ Thống Quản Lý Sụt Lún Đất
          </Title>
          <Title level={2} className="hero-subtitle">
            Thành Phố Hồ Chí Minh
          </Title>
          <Paragraph className="hero-description">
            Hệ thống giám sát và quản lý quá trình sụt lún đất tại các khu vực trọng điểm 
            của Thành phố Hồ Chí Minh, cung cấp dữ liệu thời gian thực và cảnh báo sớm.
          </Paragraph>
          <Space size="large" className="hero-actions">
            <Button 
              type="primary" 
              size="large"
              onClick={() => navigate('/login')}
            >
              Đăng nhập
            </Button>
            <Button 
              size="large"
              onClick={() => navigate('/register')}
            >
              Đăng ký tài khoản
            </Button>
          </Space>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="stats-section">
        <Title level={2} className="section-title">Thống Kê Tổng Quan</Title>
        <Row gutter={[24, 24]}>
          {stats.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card className="stat-card">
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  valueStyle={stat.valueStyle}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <Title level={2} className="section-title">Tính Năng Chính</Title>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12} lg={8}>
            <Card className="feature-card">
              <div className="feature-icon">
                <EnvironmentOutlined />
              </div>
              <Title level={4}>Giám Sát Khu Vực</Title>
              <Paragraph>
                Theo dõi và giám sát các khu vực có nguy cơ sụt lún cao 
                với dữ liệu cập nhật theo thời gian thực.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Card className="feature-card">
              <div className="feature-icon">
                <WarningOutlined />
              </div>
              <Title level={4}>Cảnh Báo Tự Động</Title>
              <Paragraph>
                Hệ thống tự động phát hiện và cảnh báo khi phát hiện 
                dấu hiệu sụt lún bất thường vượt ngưỡng cho phép.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Card className="feature-card">
              <div className="feature-icon">
                <BarChartOutlined />
              </div>
              <Title level={4}>Báo Cáo & Phân Tích</Title>
              <Paragraph>
                Tạo báo cáo chi tiết và phân tích xu hướng sụt lún 
                theo thời gian với biểu đồ trực quan.
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <Card className="cta-card">
          <Title level={2}>Bắt Đầu Sử Dụng Ngay</Title>
          <Paragraph>
            Đăng ký tài khoản để truy cập đầy đủ các tính năng của hệ thống
          </Paragraph>
          <Button 
            type="primary" 
            size="large"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate('/register')}
          >
            Đăng ký ngay
          </Button>
        </Card>
      </section>
    </div>
  );
};

export default HomePage;
