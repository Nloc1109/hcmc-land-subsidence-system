import { Typography, Card, Row, Col, Tag, List, Progress, Divider } from 'antd';
import { BarChartOutlined, EnvironmentOutlined, AlertOutlined } from '@ant-design/icons';
import './Reports.css';

const { Title, Paragraph, Text } = Typography;

// Danh sách tất cả quận/huyện TP.HCM (hiện mô phỏng dữ liệu)
const districtNames = [
  'Quận 1',
  'Quận 3',
  'Quận 4',
  'Quận 5',
  'Quận 6',
  'Quận 7',
  'Quận 8',
  'Quận 10',
  'Quận 11',
  'Quận 12',
  'Bình Thạnh',
  'Gò Vấp',
  'Phú Nhuận',
  'Tân Bình',
  'Tân Phú',
  'Bình Tân',
  'Thành phố Thủ Đức',
  'Huyện Bình Chánh',
  'Huyện Cần Giờ',
  'Huyện Củ Chi',
  'Huyện Hóc Môn',
  'Huyện Nhà Bè',
];

const districtReports = districtNames.map((name, index) => {
  // Tạo mock số liệu khác nhau một chút cho từng quận
  const baseRate = 2.5 + (index % 5); // 2.5 -> 6.5 mm/năm
  const alerts = 3 + (index % 10);
  const totalWards = 7 + (index % 5);
  const activeWards = Math.max(1, Math.min(totalWards, Math.floor(totalWards * 0.6)));

  let riskLevel = 'Thấp';
  if (baseRate >= 6) riskLevel = 'Rất cao';
  else if (baseRate >= 4.5) riskLevel = 'Cao';
  else if (baseRate >= 3.5) riskLevel = 'Trung bình';

  const wards = [
    {
      wardName: 'Phường 1',
      activeStations: 2,
      avgRate: baseRate + 0.3,
      alerts: Math.max(1, alerts - 2),
      riskLevel,
    },
    {
      wardName: 'Phường 2',
      activeStations: 1,
      avgRate: baseRate,
      alerts: Math.max(0, alerts - 4),
      riskLevel: riskLevel === 'Thấp' ? 'Thấp' : 'Trung bình',
    },
    {
      wardName: 'Phường 3',
      activeStations: 1,
      avgRate: baseRate - 0.4,
      alerts: 1,
      riskLevel: 'Thấp',
    },
  ];

  return {
    districtName: name,
    totalWards,
    activeWards,
    avgRate: baseRate,
    alerts,
    riskLevel,
    wards,
  };
});

const getRiskColor = (riskLevel) => {
  switch (riskLevel) {
    case 'Rất cao':
      return 'red';
    case 'Cao':
      return 'orange';
    case 'Trung bình':
      return 'blue';
    case 'Thấp':
    default:
      return 'green';
  }
};

const ReportsPage = () => {
  return (
    <div className="reports-page">
      <div className="reports-header">
        <Title level={2}>
          <BarChartOutlined /> Báo cáo giám sát sụt lún
        </Title>
        <Paragraph type="secondary">
          Tổng hợp các báo cáo, biểu đồ và số liệu thống kê chi tiết theo khu vực, thời gian và loại chỉ số.
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card className="reports-card" title="Tổng quan toàn thành phố">
            <Text type="secondary">
              Xem nhanh tổng số quận/huyện, phường/xã có hoạt động sụt lún và mức độ rủi ro chung.
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="reports-card" title="Báo cáo theo quận/huyện">
            <Text type="secondary">
              Thống kê chi tiết số phường có hoạt động sụt lún, tốc độ trung bình và số lượng cảnh báo.
            </Text>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="reports-card" title="Báo cáo theo phường/xã">
            <Text type="secondary">
              Danh sách từng phường/xã có hoạt động sụt lún kèm mức độ rủi ro và số trạm đo.
            </Text>
          </Card>
        </Col>
      </Row>

      <Divider />

      <section className="reports-district-section">
        <div className="section-header">
          <Title level={3} className="section-title">
            <EnvironmentOutlined /> Thống kê theo quận/huyện & phường/xã
          </Title>
          <Text className="section-subtitle">
            Mỗi khối bên dưới thể hiện chi tiết cho một quận/huyện, bao gồm số phường có hoạt động sụt lún và trạng thái
            rủi ro của từng phường.
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {districtReports.map((district) => (
            <Col xs={24} lg={12} key={district.districtName}>
              <Card
                className="reports-card district-card"
                title={
                  <div className="district-card-header">
                    <span className="district-name">{district.districtName}</span>
                    <Tag color={getRiskColor(district.riskLevel)}>{district.riskLevel}</Tag>
                  </div>
                }
                extra={
                  <div className="district-summary">
                    <span>
                      Phường có hoạt động:{' '}
                      <Text strong>
                        {district.activeWards}/{district.totalWards}
                      </Text>
                    </span>
                    <span>
                      Cảnh báo:{' '}
                      <Text strong>
                        <AlertOutlined /> {district.alerts}
                      </Text>
                    </span>
                  </div>
                }
              >
                <div className="district-progress">
                  <Text type="secondary">Tốc độ sụt lún trung bình (mm/năm)</Text>
                  <Progress
                    percent={Math.min((district.avgRate / 8) * 100, 100)}
                    status="active"
                    format={() => `${district.avgRate.toFixed(1)} mm/năm`}
                  />
                </div>

                <div className="wards-list">
                  <List
                    header={
                      <div className="wards-header">
                        <span>Phường/xã</span>
                        <span>Trạm đo</span>
                        <span>Tốc độ TB (mm/năm)</span>
                        <span>Cảnh báo</span>
                        <span>Mức rủi ro</span>
                      </div>
                    }
                    dataSource={district.wards}
                    renderItem={(ward) => (
                      <List.Item className="ward-row">
                        <span className="ward-name">{ward.wardName}</span>
                        <span>{ward.activeStations}</span>
                        <span>{ward.avgRate.toFixed(1)}</span>
                        <span>
                          <AlertOutlined style={{ marginRight: 4 }} />
                          {ward.alerts}
                        </span>
                        <span>
                          <Tag color={getRiskColor(ward.riskLevel)}>{ward.riskLevel}</Tag>
                        </span>
                      </List.Item>
                    )}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    </div>
  );
};

export default ReportsPage;

