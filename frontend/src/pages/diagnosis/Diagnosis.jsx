import { useState, Suspense, lazy } from 'react';
import { Typography, Card, Row, Col, Steps, Button, Spin } from 'antd';
import { SearchOutlined, AlertOutlined, EnvironmentOutlined, CloseOutlined } from '@ant-design/icons';
import dashboardApi from '../../api/dashboard';
import './Diagnosis.css';

const { Title, Paragraph, Text } = Typography;

const MonitoringMapLazy = lazy(() => import('../../components/maps/MonitoringMap'));

const DiagnosisPage = () => {
  const [mapVisible, setMapVisible] = useState(false);
  const [mapAreas, setMapAreas] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);

  const openMap = async () => {
    setMapLoading(true);
    setMapVisible(true);
    try {
      const districtData = await dashboardApi.getDistrictStats();
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
      setMapAreas(areas);
    } catch (error) {
      console.error('Error loading map data:', error);
      setMapAreas([]);
    } finally {
      setMapLoading(false);
    }
  };

  const closeMap = () => setMapVisible(false);

  return (
    <div className="page-container diagnosis-page">
      <div className="page-header">
        <Title level={2}>
          <SearchOutlined /> Chuẩn đoán khu vực
        </Title>
        <Paragraph type="secondary">
          Hỗ trợ đánh giá nhanh mức độ rủi ro sụt lún của từng khu vực dựa trên dữ liệu quan trắc và lịch sử cảnh báo.
        </Paragraph>
      </div>

      {/* Section riêng: Mở bản đồ khu vực giám sát */}
      <Card className="page-card diagnosis-map-card" title={<><EnvironmentOutlined /> Bản đồ khu vực giám sát</>}>
        {!mapVisible ? (
          <div className="diagnosis-map-actions diagnosis-map-actions-standalone">
            <Paragraph type="secondary" className="diagnosis-map-hint">
              Bấm nút bên dưới để tải và xem bản đồ các khu vực giám sát, chọn khu vực cần chuẩn đoán. Bản đồ chỉ tải khi bạn mở.
            </Paragraph>
            <Button
              type="primary"
              size="large"
              icon={<EnvironmentOutlined />}
              onClick={openMap}
              loading={mapLoading}
              className="diagnosis-open-map-btn"
            >
              Mở bản đồ khu vực giám sát
            </Button>
          </div>
        ) : (
          <>
            <div className="diagnosis-map-actions">
              <Button icon={<CloseOutlined />} onClick={closeMap}>
                Đóng bản đồ
              </Button>
            </div>
            <div className="diagnosis-map-wrapper">
              {mapLoading ? (
                <div className="diagnosis-map-loading">
                  <Spin size="large" tip="Đang tải bản đồ..." />
                </div>
              ) : (
                <Suspense fallback={
                  <div className="diagnosis-map-loading">
                    <Spin size="large" tip="Đang tải bản đồ..." />
                  </div>
                }>
                  <MonitoringMapLazy areas={mapAreas} height="480px" />
                </Suspense>
              )}
            </div>
          </>
        )}
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={14}>
          <Card className="page-card" title="Quy trình chuẩn đoán">
            <Steps
              direction="vertical"
              items={[
                {
                  title: 'Chọn khu vực cần đánh giá',
                  description: 'Dùng bản đồ khu vực giám sát phía trên để chọn quận/huyện hoặc khu vực cụ thể.',
                },
                {
                  title: 'Phân tích dữ liệu',
                  description: 'Hệ thống tổng hợp dữ liệu sụt lún, cảnh báo và trạng thái thiết bị.',
                },
                {
                  title: 'Kết luận & khuyến nghị',
                  description: 'Đưa ra mức độ rủi ro và gợi ý biện pháp theo dõi, can thiệp.',
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card className="page-card" title="Trạng thái chung">
            <Paragraph>
              <AlertOutlined style={{ color: '#f59e0b', marginRight: 8 }} />
              <Text strong>Mô-đun chuẩn đoán đang trong giai đoạn thiết kế logic xử lý.</Text>
            </Paragraph>
            <Paragraph type="secondary">
              Dùng nút &quot;Mở bản đồ khu vực giám sát&quot; để xem bản đồ và chọn khu vực cần chuẩn đoán. Bản đồ chỉ tải khi bạn bấm mở, giúp trang tải nhanh hơn.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DiagnosisPage;

