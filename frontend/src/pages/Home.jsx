import { useState, useEffect, useMemo } from 'react';
import { 
  Typography, 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Button, 
  Space,
  Spin
} from 'antd';
import { 
  EnvironmentOutlined, 
  WarningOutlined, 
  BarChartOutlined,
  GlobalOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
  FileTextOutlined,
  CalendarOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dashboardApi from '../api/dashboard';
import SendReportButton from '../components/SendReportButton';
import './Home.css';

const { Title, Paragraph, Text } = Typography;

const HomePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [news, setNews] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const homeReportData = useMemo(() => {
    if (!stats) return '';
    const totalAlerts = stats.totalAlerts ?? stats.activeAlerts ?? (stats.criticalAlerts != null && stats.warningAlerts != null ? stats.criticalAlerts + stats.warningAlerts : null);
    const lines = [
      'Tổng quan từ Trang chủ',
      `Tổng số khu vực: ${stats.totalAreas ?? '—'}`,
      `Tổng số cảnh báo: ${totalAlerts ?? '—'}`,
      ...(stats.criticalAlerts != null ? [`Cảnh báo nghiêm trọng: ${stats.criticalAlerts}`] : []),
      ...(stats.warningAlerts != null ? [`Cảnh báo cần theo dõi: ${stats.warningAlerts}`] : []),
      ...(stats.highRiskAreas != null ? [`Khu vực rủi ro cao: ${stats.highRiskAreas}`] : []),
      ...(stats.lastUpdated ? [`Cập nhật: ${stats.lastUpdated}`] : []),
    ];
    return lines.filter(Boolean).join('\n');
  }, [stats]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const statsData = await dashboardApi.getDashboardStats();
      setStats(statsData);
      
      // Mock data cho tin tức nổi bật
      const mockNews = [
        {
          id: 1,
          title: 'Hệ thống giám sát sụt lún đất tại Quận 1 hoạt động hiệu quả',
          summary: 'Hệ thống giám sát mới được triển khai tại khu vực trung tâm thành phố đã ghi nhận hiệu quả cao trong việc phát hiện sớm các dấu hiệu sụt lún.',
          date: '2024-01-15',
          views: 1250,
          category: 'Công nghệ',
          image: 'https://via.placeholder.com/300x200?text=News+1'
        },
        {
          id: 2,
          title: 'Cảnh báo sụt lún tại khu vực Quận 7 - Cần theo dõi sát sao',
          summary: 'Hệ thống đã phát hiện dấu hiệu sụt lún bất thường tại một số khu vực thuộc Quận 7, các cơ quan chức năng đang tiến hành kiểm tra.',
          date: '2024-01-14',
          views: 980,
          category: 'Cảnh báo',
          image: 'https://via.placeholder.com/300x200?text=News+2'
        },
        {
          id: 3,
          title: 'Hội thảo về giải pháp chống sụt lún đất tại TP.HCM',
          summary: 'Hội thảo quốc tế về các giải pháp công nghệ mới trong phòng chống sụt lún đất sẽ được tổ chức vào tháng tới.',
          date: '2024-01-12',
          views: 756,
          category: 'Sự kiện',
          image: 'https://via.placeholder.com/300x200?text=News+3'
        },
        {
          id: 4,
          title: 'Nâng cấp hệ thống cảm biến giám sát tại 24 quận huyện',
          summary: 'Dự án nâng cấp hệ thống cảm biến giám sát sụt lún đất tại tất cả các quận huyện đã hoàn thành giai đoạn 1.',
          date: '2024-01-10',
          views: 643,
          category: 'Dự án',
          image: 'https://via.placeholder.com/300x200?text=News+4'
        },
        {
          id: 5,
          title: 'Báo cáo thường niên về tình trạng sụt lún đất năm 2023',
          summary: 'Báo cáo tổng hợp về tình trạng sụt lún đất tại TP.HCM năm 2023 đã được công bố với nhiều số liệu quan trọng.',
          date: '2024-01-08',
          views: 1120,
          category: 'Báo cáo',
          image: 'https://via.placeholder.com/300x200?text=News+5'
        }
      ];
      setNews(mockNews);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
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
      <Row gutter={[24, 0]} style={{ margin: 0 }}>
        {/* Main Content - Left */}
        <Col xs={24} lg={16} className="main-content-col">
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
            <SendReportButton sourcePageName="Trang chủ" type="default" reportData={homeReportData} />
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

          {/* Features Section */}
          <section className="features-section">
            <div className="section-header">
              <Title level={2} className="section-title">Tính Năng Chính</Title>
              <Text className="section-subtitle">Hệ thống được trang bị đầy đủ công cụ giám sát và phân tích</Text>
            </div>
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
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
              <Col xs={24} md={12}>
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
              <Col xs={24} md={12}>
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

        </Col>

        {/* News Section - Right Sidebar */}
        <Col xs={24} lg={8} className="news-sidebar-col">
          <Card className="news-card news-sidebar">
            <div className="section-header">
              <Title level={2} className="section-title">
                <FileTextOutlined /> Tin Tức Nổi Bật
              </Title>
            </div>
            <div className="news-list">
              {news.map((item) => (
                <Card
                  key={item.id}
                  className="news-item"
                  hoverable
                  onClick={() => navigate(`/news/${item.id}`)}
                  style={{ marginBottom: 16 }}
                >
                  <div className="news-item-header">
                    <Text type="secondary" className="news-category">
                      {item.category}
                    </Text>
                    <Text type="secondary" className="news-date">
                      <CalendarOutlined /> {item.date}
                    </Text>
                  </div>
                  <Title level={5} className="news-title">
                    {item.title}
                  </Title>
                  <Paragraph className="news-summary" ellipsis={{ rows: 2 }}>
                    {item.summary}
                  </Paragraph>
                  <div className="news-footer">
                    <Text type="secondary" className="news-views">
                      <EyeOutlined /> {item.views} lượt xem
                    </Text>
                    <Button type="link" size="small">
                      Đọc thêm <ArrowRightOutlined />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomePage;
