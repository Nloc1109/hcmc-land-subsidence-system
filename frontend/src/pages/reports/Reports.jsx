import { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Tag, List, Progress, Divider, Statistic, Button, Spin } from 'antd';
import { BarChartOutlined, EnvironmentOutlined, AlertOutlined, WarningOutlined, RiseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import AlertLevelChart from '../../components/charts/AlertLevelChart';
import dashboardApi from '../../api/dashboard';
import './Reports.css';

const { Title, Paragraph, Text } = Typography;

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

/** Chỉ gọi khi người dùng chọn xem thống kê — không chạy lúc load trang báo cáo */
function generateDistrictReports() {
  const districtNames = [
    'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 10', 'Quận 11', 'Quận 12',
    'Bình Thạnh', 'Gò Vấp', 'Phú Nhuận', 'Tân Bình', 'Tân Phú', 'Bình Tân', 'Thành phố Thủ Đức',
    'Huyện Bình Chánh', 'Huyện Cần Giờ', 'Huyện Củ Chi', 'Huyện Hóc Môn', 'Huyện Nhà Bè',
  ];
  return districtNames.map((name, index) => {
    const baseRate = 2.5 + (index % 5);
    const alerts = 3 + (index % 10);
    const totalWards = 7 + (index % 5);
    const activeWards = Math.max(1, Math.min(totalWards, Math.floor(totalWards * 0.6)));
    let riskLevel = 'Thấp';
    if (baseRate >= 6) riskLevel = 'Rất cao';
    else if (baseRate >= 4.5) riskLevel = 'Cao';
    else if (baseRate >= 3.5) riskLevel = 'Trung bình';
    const wards = [
      { wardName: 'Phường 1', activeStations: 2, avgRate: baseRate + 0.3, alerts: Math.max(1, alerts - 2), riskLevel },
      { wardName: 'Phường 2', activeStations: 1, avgRate: baseRate, alerts: Math.max(0, alerts - 4), riskLevel: riskLevel === 'Thấp' ? 'Thấp' : 'Trung bình' },
      { wardName: 'Phường 3', activeStations: 1, avgRate: baseRate - 0.4, alerts: 1, riskLevel: 'Thấp' },
    ];
    return { districtName: name, totalWards, activeWards, avgRate: baseRate, alerts, riskLevel, wards };
  });
}

const VIEW_MAIN = 'main';
const VIEW_DISTRICT_STATS = 'district-stats';

const ReportsPage = () => {
  const [view, setView] = useState(VIEW_MAIN);
  const [districtData, setDistrictData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [overviewStats, setOverviewStats] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [districtStats, setDistrictStats] = useState([]);

  // Load dữ liệu tổng quan khi component mount
  useEffect(() => {
    const loadOverviewData = async () => {
      setOverviewLoading(true);
      try {
        const stats = await dashboardApi.getDashboardStats();
        setOverviewStats(stats);
        
        const districts = await dashboardApi.getDistrictStats();
        setDistrictStats(districts);
      } catch (error) {
        console.error('Error loading overview data:', error);
      } finally {
        setOverviewLoading(false);
      }
    };
    
    loadOverviewData();
  }, []);

  useEffect(() => {
    if (view !== VIEW_DISTRICT_STATS) return;
    setLoading(true);
    const timer = setTimeout(() => {
      setDistrictData(generateDistrictReports());
      setLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [view]);

  const goToDistrictStats = () => setView(VIEW_DISTRICT_STATS);

  const backToReports = () => {
    setView(VIEW_MAIN);
    setDistrictData([]);
  };

  if (view === VIEW_DISTRICT_STATS) {
    return (
      <div className="page-container reports-sub-view">
        <div className="reports-sub-view-header">
          <Button type="default" icon={<ArrowLeftOutlined />} onClick={backToReports} className="reports-back-btn">
            Quay lại trang báo cáo
          </Button>
          <Title level={3} className="section-title">
            <EnvironmentOutlined /> Thống kê theo quận/huyện & phường/xã
          </Title>
          <Paragraph type="secondary">
            Danh sách chi tiết từng quận/huyện và phường/xã. Bấm &quot;Quay lại trang báo cáo&quot; để thoát và ngưng tải dữ liệu.
          </Paragraph>
        </div>

        {loading ? (
          <div className="reports-sub-view-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <Spin size="large" />
            <Text type="secondary">Đang tải dữ liệu thống kê...</Text>
          </div>
        ) : (
          <>
            <Row gutter={[24, 24]}>
              {districtData.map((district) => (
                <Col xs={24} lg={12} key={district.districtName}>
                  <Card
                    className="page-card district-card"
                    title={
                      <div className="district-card-header">
                        <span className="district-name">{district.districtName}</span>
                        <Tag color={getRiskColor(district.riskLevel)}>{district.riskLevel}</Tag>
                      </div>
                    }
                    extra={
                      <div className="district-summary">
                        <span>Phường có hoạt động: <Text strong>{district.activeWards}/{district.totalWards}</Text></span>
                        <span>Cảnh báo: <Text strong><AlertOutlined /> {district.alerts}</Text></span>
                      </div>
                    }
                  >
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                      <Col span={16}>
                        <div className="district-progress">
                          <Text type="secondary">Tốc độ sụt lún trung bình (mm/năm)</Text>
                          <Progress
                            percent={Math.min((district.avgRate / 8) * 100, 100)}
                            status="active"
                            format={() => `${district.avgRate.toFixed(1)} mm/năm`}
                          />
                        </div>
                      </Col>
                      <Col span={8} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 4 }}>Mức cảnh báo</Text>
                          <AlertLevelChart alerts={district.alerts} maxAlerts={10} size={80} />
                        </div>
                      </Col>
                    </Row>
                    <div className="wards-list">
                      <List
                        header={
                          <div className="wards-header">
                            <span>Phường/xã</span><span>Trạm đo</span><span>Tốc độ TB (mm/năm)</span><span>Cảnh báo</span><span>Mức rủi ro</span>
                          </div>
                        }
                        dataSource={district.wards}
                        renderItem={(ward) => (
                          <List.Item className="ward-row">
                            <span className="ward-name">{ward.wardName}</span>
                            <span>{ward.activeStations}</span>
                            <span>{ward.avgRate.toFixed(1)}</span>
                            <span><AlertOutlined style={{ marginRight: 4 }} />{ward.alerts}</span>
                            <span><Tag color={getRiskColor(ward.riskLevel)}>{ward.riskLevel}</Tag></span>
                          </List.Item>
                        )}
                      />
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>

            <Divider />

            <section className="reports-city-overview">
              <Title level={4} className="section-title">
                <BarChartOutlined /> Tổng quan thống kê toàn thành phố Hồ Chí Minh
              </Title>
              <Card className="page-card" style={{ marginTop: 16 }}>
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title="Tổng số quận/huyện" value={districtData.length} prefix={<EnvironmentOutlined />} valueStyle={{ color: '#1890ff' }} />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title="Tổng số phường/xã" value={districtData.reduce((s, d) => s + d.totalWards, 0)} prefix={<EnvironmentOutlined />} valueStyle={{ color: '#52c41a' }} />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title="Phường có hoạt động sụt lún" value={districtData.reduce((s, d) => s + d.activeWards, 0)} prefix={<WarningOutlined />} valueStyle={{ color: '#faad14' }} />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Statistic title="Tổng số cảnh báo" value={districtData.reduce((s, d) => s + d.alerts, 0)} prefix={<AlertOutlined />} valueStyle={{ color: '#ff4d4f' }} />
                  </Col>
                </Row>
                <Divider />
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={12}>
                    <Card title="Phân bố mức rủi ro theo quận/huyện" size="small">
                      <Row gutter={[16, 16]}>
                        {['Rất cao', 'Cao', 'Trung bình', 'Thấp'].map((level) => {
                          const count = districtData.filter((d) => d.riskLevel === level).length;
                          const percentage = districtData.length ? ((count / districtData.length) * 100).toFixed(1) : 0;
                          return (
                            <Col span={24} key={level}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Tag color={getRiskColor(level)}>{level}</Tag>
                                  <Text>{count} quận/huyện</Text>
                                </div>
                                <Text strong>{percentage}%</Text>
                              </div>
                              <Progress percent={parseFloat(percentage)} strokeColor={getRiskColor(level)} showInfo={false} style={{ marginTop: 4 }} />
                            </Col>
                          );
                        })}
                      </Row>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card title="Tốc độ sụt lún trung bình" size="small">
                      <Row gutter={[16, 16]}>
                        <Col span={24}>
                          <Statistic
                            title="Tốc độ trung bình toàn thành phố"
                            value={districtData.length ? (districtData.reduce((s, d) => s + d.avgRate, 0) / districtData.length).toFixed(2) : '-'}
                            suffix="mm/năm"
                            prefix={<RiseOutlined />}
                            valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                          />
                        </Col>
                        {districtData.length > 0 && (
                          <>
                            <Col span={24}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Cao nhất: <Text strong>{Math.max(...districtData.map((d) => d.avgRate)).toFixed(2)} mm/năm</Text>
                                {' - '}{districtData.find((d) => d.avgRate === Math.max(...districtData.map((d) => d.avgRate)))?.districtName}
                              </Text>
                            </Col>
                            <Col span={24}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Thấp nhất: <Text strong>{Math.min(...districtData.map((d) => d.avgRate)).toFixed(2)} mm/năm</Text>
                                {' - '}{districtData.find((d) => d.avgRate === Math.min(...districtData.map((d) => d.avgRate)))?.districtName}
                              </Text>
                            </Col>
                          </>
                        )}
                      </Row>
                    </Card>
                  </Col>
                </Row>
                <Divider />
                <Card title="Top 5 quận/huyện có mức cảnh báo cao nhất" size="small">
                  <List
                    dataSource={[...districtData].sort((a, b) => b.alerts - a.alerts).slice(0, 5)}
                    renderItem={(district, index) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: index === 0 ? '#ff4d4f' : index === 1 ? '#ff7875' : index === 2 ? '#ffa39e' : '#f0f0f0',
                              color: index < 3 ? '#fff' : '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                            }}>{index + 1}</div>
                          }
                          title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Text strong>{district.districtName}</Text><Tag color={getRiskColor(district.riskLevel)}>{district.riskLevel}</Tag></div>}
                          description={
                            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                              <Text type="secondary"><AlertOutlined /> {district.alerts} cảnh báo</Text>
                              <Text type="secondary">Tốc độ: {district.avgRate.toFixed(1)} mm/năm</Text>
                              <Text type="secondary">Phường: {district.activeWards}/{district.totalWards}</Text>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Card>
            </section>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2}>
          <BarChartOutlined /> Báo cáo giám sát sụt lún
        </Title>
        <Paragraph type="secondary">
          Tổng hợp các báo cáo, biểu đồ và số liệu thống kê chi tiết theo khu vực, thời gian và loại chỉ số.
        </Paragraph>
      </div>

      {overviewLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Đang tải dữ liệu báo cáo...</Text>
          </div>
        </div>
      ) : (
        <>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card className="page-card" title="Tổng quan toàn thành phố">
                {overviewStats ? (
                  <div>
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <Statistic
                          title="Tổng số quận/huyện"
                          value={overviewStats.totalDistricts || 0}
                          prefix={<EnvironmentOutlined />}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Col>
                      <Col span={24}>
                        <Statistic
                          title="Tổng số khu vực giám sát"
                          value={overviewStats.totalAreas || 0}
                          prefix={<EnvironmentOutlined />}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Col>
                      <Col span={24}>
                        <Statistic
                          title="Cảnh báo đang hoạt động"
                          value={overviewStats.activeAlerts || 0}
                          prefix={<AlertOutlined />}
                          valueStyle={{ color: '#ff4d4f' }}
                        />
                      </Col>
                      <Col span={24}>
                        <Statistic
                          title="Tổng số bản ghi"
                          value={overviewStats.totalRecords || 0}
                          valueStyle={{ color: '#722ed1' }}
                        />
                      </Col>
                    </Row>
                  </div>
                ) : (
                  <Text type="secondary">Đang tải dữ liệu...</Text>
                )}
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="page-card" title="Báo cáo theo quận/huyện">
                {districtStats.length > 0 ? (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <Text strong>Top {Math.min(5, districtStats.length)} quận/huyện có hoạt động sụt lún:</Text>
                    </div>
                    <List
                      size="small"
                      dataSource={districtStats.slice(0, 5)}
                      renderItem={(district, index) => (
                        <List.Item>
                          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <Text strong>{index + 1}. {district.districtName}</Text>
                              <Tag color={district.riskLevel === 'Critical' ? 'red' : district.riskLevel === 'High' ? 'orange' : 'blue'} style={{ marginLeft: 8 }}>
                                {district.riskLevel}
                              </Tag>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div><Text type="secondary">Tốc độ: </Text><Text strong>{district.avgRate?.toFixed(1) || 0} mm/năm</Text></div>
                              <div><Text type="secondary">Cảnh báo: </Text><Text strong>{district.alerts || 0}</Text></div>
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                      <Button type="link" onClick={goToDistrictStats}>
                        Xem tất cả quận/huyện →
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Text type="secondary">Chưa có dữ liệu quận/huyện</Text>
                )}
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="page-card" title="Báo cáo theo phường/xã">
                {overviewStats ? (
                  <div>
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <Statistic
                          title="Tổng số trạm đo"
                          value={overviewStats.totalStations || 0}
                          prefix={<EnvironmentOutlined />}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Col>
                      <Col span={24}>
                        <Statistic
                          title="Thiết bị đang hoạt động"
                          value={overviewStats.activeDevices || 0}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Col>
                      <Col span={24}>
                        <Statistic
                          title="Cảnh báo nghiêm trọng"
                          value={overviewStats.criticalAlerts || 0}
                          prefix={<WarningOutlined />}
                          valueStyle={{ color: '#ff4d4f' }}
                        />
                      </Col>
                      <Col span={24}>
                        <Statistic
                          title="Tổng số đo đạc"
                          value={overviewStats.totalMeasurements || 0}
                          valueStyle={{ color: '#722ed1' }}
                        />
                      </Col>
                    </Row>
                  </div>
                ) : (
                  <Text type="secondary">Đang tải dữ liệu...</Text>
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}

      <Divider />

      <section className="reports-district-cta">
        <Card className="page-card reports-district-cta-card">
          <div className="reports-district-cta-content">
            <Title level={4} className="section-title">
              <EnvironmentOutlined /> Thống kê theo quận/huyện & phường/xã
            </Title>
            <Paragraph type="secondary">
              Mỗi khối thể hiện chi tiết một quận/huyện, bao gồm số phường có hoạt động sụt lún và trạng thái rủi ro từng phường. Dữ liệu chỉ tải khi bạn chọn xem.
            </Paragraph>
            <Button type="primary" size="large" onClick={goToDistrictStats} className="reports-district-cta-btn">
              Xem thống kê theo quận/huyện & phường/xã
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default ReportsPage;

