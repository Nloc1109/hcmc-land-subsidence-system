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
  Alert
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
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import MonitoringMap from '../components/maps/MonitoringMap';
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
  const [monitoringAreas, setMonitoringAreas] = useState([]);

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

      // Tạo mock data cho monitoring areas từ district stats
      const areas = districtData.map((district, index) => ({
        areaId: index + 1,
        areaCode: `AREA-${String(index + 1).padStart(3, '0')}`,
        areaName: `Khu vực ${district.districtName}`,
        districtName: district.districtName,
        latitude: 10.7769 + (Math.random() - 0.5) * 0.1,
        longitude: 106.7009 + (Math.random() - 0.5) * 0.1,
        riskLevel: district.riskLevel,
        avgSubsidenceRate: district.avgRate,
      }));
      setMonitoringAreas(areas);
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
          <Space size="large" className="hero-actions">
            <Button 
              type="primary" 
              size="large"
              icon={<DashboardOutlined />}
              onClick={() => navigate('/monitoring')}
            >
              Xem bản đồ giám sát
            </Button>
            <Button 
              size="large"
              icon={<BarChartOutlined />}
              onClick={() => navigate('/reports')}
            >
              Xem báo cáo
            </Button>
          </Space>
        </div>
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
          {/* Map Section */}
          <Col xs={24} lg={16}>
            <Card className="content-card map-card">
              <div className="card-header">
                <Title level={4}>
                  <EnvironmentOutlined /> Bản Đồ Khu Vực Giám Sát
                </Title>
                <Button type="link" onClick={() => navigate('/monitoring')}>
                  Xem chi tiết <ArrowRightOutlined />
                </Button>
              </div>
              {monitoringAreas.length > 0 ? (
                <MonitoringMap areas={monitoringAreas} height="450px" />
              ) : (
                <Empty description="Chưa có dữ liệu khu vực giám sát" />
              )}
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

      {/* District Statistics Section */}
      <section className="district-section">
        <div className="section-header">
          <Title level={2} className="section-title">
            <GlobalOutlined /> Thống Kê Theo Quận/Huyện
          </Title>
        </div>
        <Row gutter={[16, 16]}>
          {districtStats.map((district, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={index}>
              <Card className="district-card">
                <div className="district-header">
                  <Title level={5}>{district.districtName}</Title>
                  <Tag color={getRiskLevelColor(district.riskLevel)}>
                    {district.riskLevel}
                  </Tag>
                </div>
                <div className="district-stats">
                  <div className="district-stat-item">
                    <Text type="secondary">Khu vực:</Text>
                    <Text strong>{district.areas}</Text>
                  </div>
                  <div className="district-stat-item">
                    <Text type="secondary">Cảnh báo:</Text>
                    <Text strong style={{ color: district.alerts > 0 ? '#f59e0b' : '#10b981' }}>
                      {district.alerts}
                    </Text>
                  </div>
                  <div className="district-stat-item">
                    <Text type="secondary">Tốc độ TB:</Text>
                    <Text strong>{district.avgRate} mm/year</Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
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

      {/* CTA Section */}
      <section className="cta-section">
        <Card className="cta-card">
          <div className="cta-content">
            <Title level={2}>Bắt Đầu Sử Dụng Ngay</Title>
            <Paragraph>
              Đăng ký tài khoản để truy cập đầy đủ các tính năng của hệ thống 
              và nhận thông báo cảnh báo sớm về tình trạng sụt lún đất.
            </Paragraph>
            <Space size="large">
              <Button 
                type="primary" 
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={() => navigate('/register')}
              >
                Đăng ký ngay
              </Button>
              <Button 
                size="large"
                onClick={() => navigate('/login')}
              >
                Đã có tài khoản? Đăng nhập
              </Button>
            </Space>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default HomePage;
