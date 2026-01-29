import { useState } from 'react';
import { Typography, Card, Row, Col, Tag, Button, Select, Spin, Alert, Timeline, Collapse } from 'antd';
import {
  RobotOutlined,
  CloudOutlined,
  EnvironmentOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import './AiPrediction.css';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

// Danh sách quận/huyện TP.HCM
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

const getProbabilityColor = (probability) => {
  switch (probability) {
    case 'Cao':
      return 'red';
    case 'Trung bình':
      return 'orange';
    case 'Thấp':
    default:
      return 'green';
  }
};

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'Rất nghiêm trọng':
      return 'red';
    case 'Nghiêm trọng':
      return 'orange';
    case 'Trung bình':
      return 'blue';
    case 'Nhẹ':
    default:
      return 'green';
  }
};

const AiPredictionPage = () => {
  const [selectedArea, setSelectedArea] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictionData, setPredictionData] = useState(null);

  const handlePredict = async () => {
    if (!selectedArea) {
      setError('Vui lòng chọn khu vực cần dự đoán.');
      return;
    }

    setLoading(true);
    setError(null);
    setPredictionData(null);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const res = await axios.post(
        `${baseUrl}/ai/predict`,
        { area: selectedArea },
        {
          timeout: 120000, // 120 giây timeout
        }
      );
      setPredictionData(res.data);
    } catch (err) {
      console.error('Failed to get prediction:', err);
      setError(err?.response?.data?.message || 'Không thể thực hiện dự đoán. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const renderDisasterCard = (disaster, index) => (
    <Card
      key={index}
      size="small"
      style={{ marginBottom: 12, background: '#fff' }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThunderboltOutlined style={{ color: '#faad14' }} />
          <Text strong>{disaster.type}</Text>
        </div>
      }
      extra={
        <div style={{ display: 'flex', gap: 8 }}>
          <Tag color={getProbabilityColor(disaster.probability)}>Khả năng: {disaster.probability}</Tag>
          <Tag color={getSeverityColor(disaster.severity)}>Mức độ: {disaster.severity}</Tag>
        </div>
      }
    >
      <Paragraph>{disaster.description}</Paragraph>
      <div style={{ marginTop: 8 }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <strong>Khu vực ảnh hưởng:</strong> {disaster.affectedAreas}
        </Text>
      </div>
      <div style={{ marginTop: 8 }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <strong>Biện pháp phòng ngừa:</strong> {disaster.preventionMeasures}
        </Text>
      </div>
    </Card>
  );

  return (
    <div className="page-container">
      <div className="page-section">
        <Title level={2}>
          <RobotOutlined /> AI dự đoán thiên tai theo khu vực
        </Title>
        <Paragraph type="secondary">
          Hệ thống AI phân tích và dự đoán các khả năng thiên tai cho từng khu vực trong 1, 2, và 5 năm tới dựa trên
          dữ liệu địa chất, khí hậu và xu hướng biến đổi môi trường.
        </Paragraph>
      </div>

      {/* Form chọn khu vực và dự đoán */}
      <Card className="page-card filter-section">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Text strong>Chọn khu vực:</Text>
            <Select
              placeholder="Chọn quận/huyện"
              style={{ width: '100%', marginTop: 8 }}
              size="large"
              value={selectedArea}
              onChange={setSelectedArea}
            >
              {districtNames.map((name) => (
                <Option key={name} value={name}>
                  {name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={16}>
            <Button
              type="primary"
              size="large"
              icon={<RobotOutlined />}
              onClick={handlePredict}
              loading={loading}
              disabled={!selectedArea}
              style={{ width: '100%' }}
            >
              {loading ? 'Đang phân tích...' : 'Dự đoán thiên tai'}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Hiển thị lỗi */}
      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Loading state */}
      {loading && (
        <Card className="page-card">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Spin size="large" tip="Đang phân tích và dự đoán thiên tai..." />
            <Paragraph type="secondary" style={{ marginTop: 16 }}>
              Hệ thống AI đang phân tích khu vực <Text strong>{selectedArea}</Text> và dự đoán các khả năng thiên tai.
              Quá trình này có thể mất 30-60 giây.
            </Paragraph>
          </div>
        </Card>
      )}

      {/* Kết quả dự đoán */}
      {!loading && predictionData && (
        <>
          <Card className="page-card page-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <EnvironmentOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  Khu vực: {predictionData.area}
                </Title>
                <Text type="secondary">Ngày phân tích: {predictionData.analysisDate || 'N/A'}</Text>
              </div>
            </div>
          </Card>

          {/* Timeline dự đoán */}
          <Card className="page-card page-section" title="Dự đoán theo thời gian">
            <Timeline
              mode="left"
              items={[
                {
                  label: <Text strong>1 năm tới</Text>,
                  color: getRiskColor(predictionData.predictions.oneYear.overallRisk),
                  children: (
                    <Card size="small" style={{ marginLeft: 16 }}>
                      <div style={{ marginBottom: 12 }}>
                        <Tag color={getRiskColor(predictionData.predictions.oneYear.overallRisk)}>
                          Mức rủi ro tổng thể: {predictionData.predictions.oneYear.overallRisk}
                        </Tag>
                      </div>
                      <Paragraph>{predictionData.predictions.oneYear.summary}</Paragraph>
                      <Collapse size="small" style={{ marginTop: 12 }}>
                        <Panel header={`Xem chi tiết ${predictionData.predictions.oneYear.disasters.length} loại thiên tai`} key="1">
                          {predictionData.predictions.oneYear.disasters.map((disaster, idx) =>
                            renderDisasterCard(disaster, idx)
                          )}
                        </Panel>
                      </Collapse>
                    </Card>
                  ),
                },
                {
                  label: <Text strong>2 năm tới</Text>,
                  color: getRiskColor(predictionData.predictions.twoYears.overallRisk),
                  children: (
                    <Card size="small" style={{ marginLeft: 16 }}>
                      <div style={{ marginBottom: 12 }}>
                        <Tag color={getRiskColor(predictionData.predictions.twoYears.overallRisk)}>
                          Mức rủi ro tổng thể: {predictionData.predictions.twoYears.overallRisk}
                        </Tag>
                      </div>
                      <Paragraph>{predictionData.predictions.twoYears.summary}</Paragraph>
                      <Collapse size="small" style={{ marginTop: 12 }}>
                        <Panel header={`Xem chi tiết ${predictionData.predictions.twoYears.disasters.length} loại thiên tai`} key="2">
                          {predictionData.predictions.twoYears.disasters.map((disaster, idx) =>
                            renderDisasterCard(disaster, idx)
                          )}
                        </Panel>
                      </Collapse>
                    </Card>
                  ),
                },
                {
                  label: <Text strong>5 năm tới</Text>,
                  color: getRiskColor(predictionData.predictions.fiveYears.overallRisk),
                  children: (
                    <Card size="small" style={{ marginLeft: 16 }}>
                      <div style={{ marginBottom: 12 }}>
                        <Tag color={getRiskColor(predictionData.predictions.fiveYears.overallRisk)}>
                          Mức rủi ro tổng thể: {predictionData.predictions.fiveYears.overallRisk}
                        </Tag>
                      </div>
                      <Paragraph>{predictionData.predictions.fiveYears.summary}</Paragraph>
                      <Collapse size="small" style={{ marginTop: 12 }}>
                        <Panel header={`Xem chi tiết ${predictionData.predictions.fiveYears.disasters.length} loại thiên tai`} key="3">
                          {predictionData.predictions.fiveYears.disasters.map((disaster, idx) =>
                            renderDisasterCard(disaster, idx)
                          )}
                        </Panel>
                      </Collapse>
                    </Card>
                  ),
                },
              ]}
            />
          </Card>

          {/* Khuyến nghị */}
          {predictionData.recommendations && predictionData.recommendations.length > 0 && (
            <Card
              className="page-card"
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  Khuyến nghị phòng ngừa và ứng phó
                </div>
              }
            >
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {predictionData.recommendations.map((rec, index) => (
                  <li key={index} style={{ marginBottom: 12 }}>
                    <Text>{rec}</Text>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      {/* Hướng dẫn khi chưa có dữ liệu */}
      {!loading && !predictionData && !error && (
        <Row gutter={[24, 24]}>
          <Col xs={24} md={14}>
            <Card className="page-card" title="Hướng dẫn sử dụng">
              <Paragraph>
                <strong>Bước 1:</strong> Chọn khu vực (quận/huyện) cần dự đoán từ danh sách ở trên.
              </Paragraph>
              <Paragraph>
                <strong>Bước 2:</strong> Nhấn nút <Text strong>"Dự đoán thiên tai"</Text> để hệ thống AI bắt đầu phân tích.
              </Paragraph>
              <Paragraph>
                <strong>Bước 3:</strong> Xem kết quả dự đoán theo 3 mốc thời gian: 1 năm, 2 năm, và 5 năm tới.
              </Paragraph>
              <Paragraph type="secondary">
                Hệ thống sẽ phân tích các loại thiên tai có thể xảy ra bao gồm: sụt lún đất, ngập lụt, lũ quét, sạt lở
                đất, triều cường, mưa lớn, hạn hán, xâm nhập mặn và các thiên tai khác.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={10}>
            <Card className="page-card" title="Thông tin về mô hình AI">
              <Paragraph>
                <CloudOutlined style={{ marginRight: 8, color: '#2563eb' }} />
                <Text strong>Phân tích đa chiều</Text>
              </Paragraph>
              <Paragraph type="secondary">
                Hệ thống phân tích dựa trên địa chất, khí hậu, địa hình và xu hướng biến đổi môi trường của từng khu vực.
              </Paragraph>
              <Paragraph>
                <WarningOutlined style={{ marginRight: 8, color: '#faad14' }} />
                <Text strong>Dự đoán theo thời gian</Text>
              </Paragraph>
              <Paragraph type="secondary">
                Cung cấp dự đoán ngắn hạn (1 năm), trung hạn (2 năm) và dài hạn (5 năm) để hỗ trợ quy hoạch và ứng phó.
              </Paragraph>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default AiPredictionPage;
