import { useState, useEffect } from 'react';
import { 
  Typography, 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Button, 
  Space, 
  Tag, 
  List, 
  Avatar, 
  Progress,
  Empty,
  Spin,
  Carousel
} from 'antd';
import { 
  EnvironmentOutlined, 
  WarningOutlined, 
  BarChartOutlined,
  GlobalOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  DashboardOutlined,
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  NotificationOutlined,
  SearchOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import SubsidenceChart from '../components/charts/SubsidenceChart';
import dashboardApi from '../api/dashboard';
import './Home.css';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Paragraph, Text } = Typography;

const HomePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [districtStats, setDistrictStats] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load tất cả data song song
      const [
        statsData,
        trendDataResult,
        districtData,
        alertsData,
        deviceData,
      ] = await Promise.all([
        dashboardApi.getDashboardStats(),
        dashboardApi.getSubsidenceTrend(30),
        dashboardApi.getDistrictStats(),
        dashboardApi.getRecentAlerts(5),
        dashboardApi.getDeviceStatus(),
      ]);

      setStats(statsData);
      setTrendData(trendDataResult);
      setDistrictStats(districtData);
      setRecentAlerts(alertsData);
      setDeviceStatus(deviceData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical':
      case 'Emergency':
        return '#ef4444';
      case 'Warning':
        return '#f59e0b';
      case 'Info':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'Critical':
      case 'Emergency':
        return <CloseCircleOutlined />;
      case 'Warning':
        return <ExclamationCircleOutlined />;
      default:
        return <CheckCircleOutlined />;
    }
  };

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Critical': return 'red';
      case 'High': return 'orange';
      case 'Medium': return 'blue';
      case 'Low': return 'green';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="home-page loading-container">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <ThunderboltOutlined /> Hệ thống giám sát thời gian thực
          </div>
          <Title level={1} className="hero-title">
            Hệ Thống Quản Lý Sụt Lún Đất
          </Title>
          <Title level={2} className="hero-subtitle">
            Thành Phố Hồ Chí Minh
          </Title>
          <Paragraph className="hero-description">
            Hệ thống giám sát và quản lý quá trình sụt lún đất tại các khu vực trọng điểm 
            của Thành phố Hồ Chí Minh, cung cấp dữ liệu thời gian thực và cảnh báo sớm 
            để bảo vệ an toàn cộng đồng.
          </Paragraph>
        </div>
      </section>

      {/* Carousel hình ảnh minh họa - tự đổi ảnh theo thời gian, mũi tên trái/phải mờ */}
      <section className="home-carousel-section">
        <Carousel
          autoplay
          autoplaySpeed={4500}
          effect="fade"
          arrows
          className="home-carousel"
          style={{ margin: '0 auto', maxWidth: 1200 }}
        >
          {[
            { src: 'https://picsum.photos/seed/subsidence1/1200/500', alt: 'Minh họa giám sát sụt lún' },
            { src: 'https://picsum.photos/seed/subsidence2/1200/500', alt: 'Khu vực quan trắc' },
            { src: 'https://picsum.photos/seed/subsidence3/1200/500', alt: 'Hệ thống theo dõi' },
            { src: 'https://picsum.photos/seed/subsidence4/1200/500', alt: 'Bản đồ và dữ liệu' },
          ].map((item, index) => (
            <div key={index} className="home-carousel-slide">
              <img src={item.src} alt={item.alt} className="home-carousel-img" />
            </div>
          ))}
        </Carousel>
      </section>

      {/* Statistics Section */}
      <section className="stats-section">
        <div className="section-header">
          <Title level={2} className="section-title">
            <DashboardOutlined /> Thống Kê Tổng Quan
          </Title>
          <Text className="section-subtitle">Dữ liệu cập nhật theo thời gian thực</Text>
        </div>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card stat-card-primary">
              <Statistic
                title="Khu vực giám sát"
                value={stats?.totalAreas || 0}
                prefix={<EnvironmentOutlined />}
                suffix="khu vực"
                valueStyle={{ color: '#3b82f6' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card stat-card-warning">
              <Statistic
                title="Cảnh báo đang mở"
                value={stats?.activeAlerts || 0}
                prefix={<WarningOutlined />}
                suffix="cảnh báo"
                valueStyle={{ color: '#f59e0b' }}
              />
              {stats?.criticalAlerts > 0 && (
                <div className="stat-alert-badge">
                  {stats.criticalAlerts} nghiêm trọng
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card stat-card-success">
              <Statistic
                title="Thiết bị hoạt động"
                value={stats?.activeDevices || 0}
                prefix={<BarChartOutlined />}
                suffix="thiết bị"
                valueStyle={{ color: '#10b981' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card stat-card-info">
              <Statistic
                title="Trạm giám sát"
                value={stats?.totalStations || 0}
                prefix={<GlobalOutlined />}
                suffix="trạm"
                valueStyle={{ color: '#8b5cf6' }}
              />
            </Card>
          </Col>
        </Row>
      </section>

      {/* Main Content Grid */}
      <section className="main-content-section">
        <Row gutter={[24, 24]}>
          {/* CTA Bản đồ: chuyển sang Chuẩn đoán, không load map trên Home */}
          <Col xs={24} lg={16}>
            <Card className="content-card map-cta-card">
              <div className="card-header">
                <Title level={4}>
                  <EnvironmentOutlined /> Bản Đồ Khu Vực Giám Sát
                </Title>
                <Button type="primary" onClick={() => navigate('/diagnosis')}>
                  Xem bản đồ tại Chuẩn đoán <ArrowRightOutlined />
                </Button>
              </div>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Sử dụng bản đồ trong mô-đun Chuẩn đoán để chọn khu vực, xem mức độ rủi ro và hỗ trợ đánh giá sụt lún. Bản đồ chỉ tải khi bạn mở tại trang Chuẩn đoán.
              </Paragraph>
            </Card>
          </Col>

          {/* Alerts Section */}
          <Col xs={24} lg={8}>
            <Card className="content-card alerts-card">
              <div className="card-header">
                <Title level={4}>
                  <BellOutlined /> Cảnh Báo Mới Nhất
                </Title>
                <Button type="link" onClick={() => navigate('/alerts')}>
                  Xem tất cả <ArrowRightOutlined />
                </Button>
              </div>
              {recentAlerts.length > 0 ? (
                <List
                  dataSource={recentAlerts}
                  renderItem={(alert) => (
                    <List.Item className="alert-item">
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            style={{
                              backgroundColor: getSeverityColor(alert.severity),
                            }}
                            icon={getSeverityIcon(alert.severity)}
                          />
                        }
                        title={
                          <div>
                            <Text strong>{alert.title}</Text>
                            <Tag
                              color={getSeverityColor(alert.severity)}
                              style={{ marginLeft: 8 }}
                            >
                              {alert.severity}
                            </Tag>
                          </div>
                        }
                        description={
                          <div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {alert.areaName}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {dayjs(alert.alertTime).fromNow()}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="Không có cảnh báo mới" />
              )}
            </Card>
          </Col>
        </Row>
      </section>

      {/* Charts and Analysis Section */}
      <section className="charts-section">
        <div className="section-header">
          <Title level={2} className="section-title">
            <BarChartOutlined /> Phân Tích & Xu Hướng
          </Title>
        </div>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <SubsidenceChart data={trendData} title="Xu hướng sụt lún 30 ngày qua" />
          </Col>
          <Col xs={24} lg={8}>
            <Card className="content-card">
              <Title level={4}>
                <SafetyOutlined /> Trạng Thái Thiết Bị
              </Title>
              {deviceStatus && (
                <div className="device-status">
                  <div className="status-item">
                    <Text>Hoạt động</Text>
                    <Progress
                      percent={(deviceStatus.active / (deviceStatus.active + deviceStatus.inactive + deviceStatus.maintenance + deviceStatus.faulty)) * 100}
                      strokeColor="#10b981"
                      format={() => `${deviceStatus.active} thiết bị`}
                    />
                  </div>
                  <div className="status-item">
                    <Text>Không hoạt động</Text>
                    <Progress
                      percent={(deviceStatus.inactive / (deviceStatus.active + deviceStatus.inactive + deviceStatus.maintenance + deviceStatus.faulty)) * 100}
                      strokeColor="#6b7280"
                      format={() => `${deviceStatus.inactive} thiết bị`}
                    />
                  </div>
                  <div className="status-item">
                    <Text>Bảo trì</Text>
                    <Progress
                      percent={(deviceStatus.maintenance / (deviceStatus.active + deviceStatus.inactive + deviceStatus.maintenance + deviceStatus.faulty)) * 100}
                      strokeColor="#f59e0b"
                      format={() => `${deviceStatus.maintenance} thiết bị`}
                    />
                  </div>
                  <div className="status-item">
                    <Text>Lỗi</Text>
                    <Progress
                      percent={(deviceStatus.faulty / (deviceStatus.active + deviceStatus.inactive + deviceStatus.maintenance + deviceStatus.faulty)) * 100}
                      strokeColor="#ef4444"
                      format={() => `${deviceStatus.faulty} thiết bị`}
                    />
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <Title level={2} className="section-title">Tính Năng Chính</Title>
          <Text className="section-subtitle">Hệ thống được trang bị đầy đủ công cụ giám sát và phân tích</Text>
        </div>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12} lg={8}>
            <Card className="feature-card">
              <div className="feature-icon feature-icon-primary">
                <EnvironmentOutlined />
              </div>
              <Title level={4}>Giám Sát Khu Vực</Title>
              <Paragraph>
                Theo dõi và giám sát các khu vực có nguy cơ sụt lún cao 
                với dữ liệu cập nhật theo thời gian thực từ hệ thống GPS và cảm biến.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Card className="feature-card">
              <div className="feature-icon feature-icon-warning">
                <WarningOutlined />
              </div>
              <Title level={4}>Cảnh Báo Tự Động</Title>
              <Paragraph>
                Hệ thống tự động phát hiện và cảnh báo khi phát hiện 
                dấu hiệu sụt lún bất thường vượt ngưỡng cho phép với độ chính xác cao.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Card className="feature-card">
              <div className="feature-icon feature-icon-success">
                <BarChartOutlined />
              </div>
              <Title level={4}>Báo Cáo & Phân Tích</Title>
              <Paragraph>
                Tạo báo cáo chi tiết và phân tích xu hướng sụt lún 
                theo thời gian với biểu đồ trực quan và dự báo chính xác.
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </section>

      {/* Section PR / Marketing dự án */}
      <section className="home-marketing-section">
        <div className="marketing-inner">
          <div className="marketing-badge">Dự án trọng điểm</div>
          <Title level={2} className="marketing-title">
            Hệ thống Quản lý Sụt lún Đất — Giải pháp giám sát an toàn cho TPHCM
          </Title>
          <Paragraph className="marketing-lead">
            Dự án được triển khai nhằm theo dõi liên tục tình trạng sụt lún tại các khu vực trọng điểm,
            hỗ trợ cơ quan quản lý và người dân có thông tin kịp thời để phòng ngừa rủi ro và bảo vệ an toàn.
          </Paragraph>
          <Row gutter={[24, 24]} className="marketing-points">
            <Col xs={24} md={12} lg={6}>
              <div className="marketing-point">
                <SafetyOutlined className="marketing-point-icon" />
                <Text strong>Dữ liệu thời gian thực</Text>
                <Text type="secondary">Cập nhật từ trạm quan trắc và cảm biến</Text>
              </div>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <div className="marketing-point">
                <ThunderboltOutlined className="marketing-point-icon" />
                <Text strong>Cảnh báo sớm</Text>
                <Text type="secondary">Tự động khi vượt ngưỡng an toàn</Text>
              </div>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <div className="marketing-point">
                <BarChartOutlined className="marketing-point-icon" />
                <Text strong>Báo cáo & phân tích</Text>
                <Text type="secondary">Biểu đồ, xu hướng và báo cáo chi tiết</Text>
              </div>
            </Col>
            <Col xs={24} md={12} lg={6}>
              <div className="marketing-point">
                <RobotOutlined className="marketing-point-icon" />
                <Text strong>AI dự đoán</Text>
                <Text type="secondary">Dự báo rủi ro theo khu vực và thời gian</Text>
              </div>
            </Col>
          </Row>
          <div className="marketing-footer">
            <Text type="secondary">
              Hệ thống Quản lý Sụt lún Đất TPHCM — Đối tác tin cậy trong giám sát an toàn hạ tầng và cộng đồng.
            </Text>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
