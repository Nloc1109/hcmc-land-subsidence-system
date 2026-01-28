import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Space,
  Typography,
  Spin,
  Progress,
  Alert,
  Button,
} from 'antd';
import {
  EnvironmentOutlined,
  WarningOutlined,
  BarChartOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  DashboardOutlined,
  BellOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import MonitoringMap from '../../components/maps/MonitoringMap';
import SubsidenceChart from '../../components/charts/SubsidenceChart';
import DistrictChart from '../../components/charts/DistrictChart';
import dashboardApi from '../../api/dashboard';
import './Dashboard.css';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [districtStats, setDistrictStats] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [topRiskAreas, setTopRiskAreas] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [deviceTypeStats, setDeviceTypeStats] = useState([]);
  const [districtDistribution, setDistrictDistribution] = useState([]);
  const [monitoringAreas, setMonitoringAreas] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
    // Auto refresh mỗi 5 phút
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        statsData,
        trendDataResult,
        districtData,
        alertsData,
        topAreasData,
        recentRecordsData,
        deviceData,
        deviceTypeData,
        distributionData,
      ] = await Promise.all([
        dashboardApi.getDashboardStats(),
        dashboardApi.getSubsidenceTrend(30),
        dashboardApi.getDistrictStats(),
        dashboardApi.getRecentAlerts(10),
        dashboardApi.getTopRiskAreas(5),
        dashboardApi.getRecentSubsidenceRecords(10),
        dashboardApi.getDeviceStatus(),
        dashboardApi.getDeviceTypeStats(),
        dashboardApi.getDistrictDistribution(),
      ]);

      setStats(statsData);
      setTrendData(trendDataResult);
      setDistrictStats(districtData);
      setRecentAlerts(alertsData);
      setTopRiskAreas(topAreasData);
      setRecentRecords(recentRecordsData);
      setDeviceStatus(deviceData);
      setDeviceTypeStats(deviceTypeData);
      setDistrictDistribution(distributionData);
      setLastUpdated(new Date());

      // Tạo monitoring areas từ top risk areas
      const areas = topAreasData.map((area) => ({
        areaId: area.areaId,
        areaCode: area.areaCode,
        areaName: area.areaName,
        districtName: area.districtName,
        latitude: 10.7769 + (Math.random() - 0.5) * 0.1,
        longitude: 106.7009 + (Math.random() - 0.5) * 0.1,
        riskLevel: area.riskLevel,
        avgSubsidenceRate: area.avgSubsidenceRate,
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
        return 'red';
      case 'Warning':
        return 'orange';
      case 'Info':
        return 'blue';
      default:
        return 'default';
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
        return <InfoCircleOutlined />;
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'red';
      case 'Acknowledged': return 'orange';
      case 'Resolved': return 'green';
      case 'Closed': return 'default';
      default: return 'default';
    }
  };

  // Columns cho bảng cảnh báo
  const alertsColumns = [
    {
      title: 'Mã cảnh báo',
      dataIndex: 'alertCode',
      key: 'alertCode',
      width: 150,
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Khu vực',
      dataIndex: 'areaName',
      key: 'areaName',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Mức độ',
      dataIndex: 'severity',
      key: 'severity',
      width: 120,
      render: (severity) => (
        <Tag color={getSeverityColor(severity)} icon={getSeverityIcon(severity)}>
          {severity}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Thời gian',
      dataIndex: 'alertTime',
      key: 'alertTime',
      width: 150,
      render: (time) => dayjs(time).fromNow(),
      sorter: (a, b) => new Date(a.alertTime) - new Date(b.alertTime),
    },
  ];

  // Columns cho bảng top risk areas
  const topAreasColumns = [
    {
      title: 'Khu vực',
      dataIndex: 'areaName',
      key: 'areaName',
      ellipsis: true,
    },
    {
      title: 'Quận/Huyện',
      dataIndex: 'districtName',
      key: 'districtName',
      width: 120,
    },
    {
      title: 'Mức độ rủi ro',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 130,
      render: (riskLevel) => (
        <Tag color={getRiskLevelColor(riskLevel)}>{riskLevel}</Tag>
      ),
    },
    {
      title: 'Tốc độ TB (mm/year)',
      dataIndex: 'avgSubsidenceRate',
      key: 'avgSubsidenceRate',
      width: 150,
      render: (rate) => <Text strong>{rate}</Text>,
      sorter: (a, b) => a.avgSubsidenceRate - b.avgSubsidenceRate,
    },
    {
      title: 'Tích lũy (mm)',
      dataIndex: 'cumulativeSubsidence',
      key: 'cumulativeSubsidence',
      width: 120,
      render: (value) => <Text>{value}</Text>,
    },
    {
      title: 'Cảnh báo',
      dataIndex: 'alertCount',
      key: 'alertCount',
      width: 100,
      render: (count) => (
        <Tag color={count > 0 ? 'red' : 'green'}>
          {count > 0 ? `${count} cảnh báo` : 'Không có'}
        </Tag>
      ),
    },
  ];

  // Columns cho bảng recent records
  const recentRecordsColumns = [
    {
      title: 'Khu vực',
      dataIndex: 'areaName',
      key: 'areaName',
      ellipsis: true,
    },
    {
      title: 'Ngày ghi nhận',
      dataIndex: 'recordDate',
      key: 'recordDate',
      width: 120,
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => new Date(a.recordDate) - new Date(b.recordDate),
    },
    {
      title: 'Giá trị (mm)',
      dataIndex: 'subsidenceValue',
      key: 'subsidenceValue',
      width: 110,
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: 'Tốc độ (mm/year)',
      dataIndex: 'subsidenceRate',
      key: 'subsidenceRate',
      width: 130,
      render: (rate) => (
        <Tag color={rate > 5 ? 'red' : rate > 3 ? 'orange' : 'green'}>
          {rate}
        </Tag>
      ),
    },
    {
      title: 'Tích lũy (mm)',
      dataIndex: 'cumulativeSubsidence',
      key: 'cumulativeSubsidence',
      width: 120,
    },
    {
      title: 'Phương pháp',
      dataIndex: 'measurementMethod',
      key: 'measurementMethod',
      width: 120,
    },
    {
      title: 'Chất lượng',
      dataIndex: 'qualityRating',
      key: 'qualityRating',
      width: 100,
      render: (rating) => (
        <Tag color={rating === 'Excellent' ? 'green' : rating === 'Good' ? 'blue' : 'orange'}>
          {rating}
        </Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-page loading-container">
        <Spin size="large" tip="Đang tải dữ liệu dashboard..." />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header với refresh button */}
      <div className="dashboard-header">
        <div>
          <Title level={2} className="dashboard-title">
            <DashboardOutlined /> Dashboard Giám Sát
          </Title>
          <Text type="secondary">
            Cập nhật lần cuối: {dayjs(lastUpdated).format('DD/MM/YYYY HH:mm:ss')}
          </Text>
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={loadDashboardData}
          loading={loading}
        >
          Làm mới
        </Button>
      </div>

      {/* Cảnh báo quan trọng */}
      {stats?.criticalAlerts > 0 && (
        <Alert
          message={`Có ${stats.criticalAlerts} cảnh báo nghiêm trọng cần xử lý ngay!`}
          type="error"
          icon={<ExclamationCircleOutlined />}
          showIcon
          closable
          action={
            <Button size="small" onClick={() => navigate('/alerts')}>
              Xem chi tiết
            </Button>
          }
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Stats Cards */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-primary">
            <Statistic
              title="Khu vực giám sát"
              value={stats?.totalAreas || 0}
              prefix={<EnvironmentOutlined />}
              suffix="khu vực"
              valueStyle={{ color: '#2563eb' }}
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
              prefix={<ThunderboltOutlined />}
              suffix={`/ ${(stats?.activeDevices || 0) + (stats?.inactiveDevices || 0) + (stats?.maintenanceDevices || 0) + (stats?.faultyDevices || 0)}`}
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

      {/* Main Content Grid */}
      <Row gutter={[16, 16]} className="main-content-row">
        {/* Biểu đồ xu hướng */}
        <Col xs={24} lg={16}>
          <Card className="dashboard-card" title={<><BarChartOutlined /> Xu hướng sụt lún 30 ngày qua</>}>
            <SubsidenceChart data={trendData} />
          </Card>
        </Col>

        {/* Trạng thái thiết bị */}
        <Col xs={24} lg={8}>
          <Card className="dashboard-card" title={<><SafetyOutlined /> Trạng thái thiết bị</>}>
            {deviceStatus && (
              <div className="device-status">
                <div className="status-item">
                  <div className="status-header">
                    <Text>Hoạt động</Text>
                    <Text strong>{deviceStatus.active}</Text>
                  </div>
                  <Progress
                    percent={Math.round((deviceStatus.active / (deviceStatus.active + deviceStatus.inactive + deviceStatus.maintenance + deviceStatus.faulty)) * 100)}
                    strokeColor="#10b981"
                    showInfo={false}
                  />
                </div>
                <div className="status-item">
                  <div className="status-header">
                    <Text>Không hoạt động</Text>
                    <Text strong>{deviceStatus.inactive}</Text>
                  </div>
                  <Progress
                    percent={Math.round((deviceStatus.inactive / (deviceStatus.active + deviceStatus.inactive + deviceStatus.maintenance + deviceStatus.faulty)) * 100)}
                    strokeColor="#6b7280"
                    showInfo={false}
                  />
                </div>
                <div className="status-item">
                  <div className="status-header">
                    <Text>Bảo trì</Text>
                    <Text strong>{deviceStatus.maintenance}</Text>
                  </div>
                  <Progress
                    percent={Math.round((deviceStatus.maintenance / (deviceStatus.active + deviceStatus.inactive + deviceStatus.maintenance + deviceStatus.faulty)) * 100)}
                    strokeColor="#f59e0b"
                    showInfo={false}
                  />
                </div>
                <div className="status-item">
                  <div className="status-header">
                    <Text>Lỗi</Text>
                    <Text strong>{deviceStatus.faulty}</Text>
                  </div>
                  <Progress
                    percent={Math.round((deviceStatus.faulty / (deviceStatus.active + deviceStatus.inactive + deviceStatus.maintenance + deviceStatus.faulty)) * 100)}
                    strokeColor="#ef4444"
                    showInfo={false}
                  />
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Bản đồ và Cảnh báo */}
      <Row gutter={[16, 16]} className="main-content-row">
        <Col xs={24} lg={16}>
          <Card className="dashboard-card" title={<><EnvironmentOutlined /> Bản đồ khu vực giám sát</>}>
            {monitoringAreas.length > 0 ? (
              <MonitoringMap areas={monitoringAreas} height="400px" />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text type="secondary">Chưa có dữ liệu khu vực giám sát</Text>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            className="dashboard-card"
            title={<><BellOutlined /> Cảnh báo mới nhất</>}
            extra={<Button type="link" onClick={() => navigate('/alerts')}>Xem tất cả</Button>}
          >
            <Table
              dataSource={recentAlerts}
              columns={alertsColumns}
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
              rowKey="alertId"
            />
          </Card>
        </Col>
      </Row>

      {/* Top Risk Areas và Recent Records */}
      <Row gutter={[16, 16]} className="main-content-row">
        <Col xs={24} lg={12}>
          <Card
            className="dashboard-card"
            title={<><WarningOutlined /> Top khu vực có nguy cơ cao</>}
            extra={<Button type="link" onClick={() => navigate('/monitoring')}>Xem chi tiết</Button>}
          >
            <Table
              dataSource={topRiskAreas}
              columns={topAreasColumns}
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
              rowKey="areaId"
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            className="dashboard-card"
            title={<><BarChartOutlined /> Bản ghi sụt lún mới nhất</>}
            extra={<Button type="link" onClick={() => navigate('/subsidence')}>Xem tất cả</Button>}
          >
            <Table
              dataSource={recentRecords}
              columns={recentRecordsColumns}
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
              rowKey="recordId"
            />
          </Card>
        </Col>
      </Row>

      {/* Biểu đồ phân bố theo quận */}
      <Row gutter={[16, 16]} className="main-content-row">
        <Col xs={24}>
          <Card className="dashboard-card" title={<><BarChartOutlined /> Phân bố dữ liệu theo quận/huyện</>}>
            <DistrictChart data={districtDistribution} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

