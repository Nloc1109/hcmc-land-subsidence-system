import { Typography, Card, Row, Col, Tag } from 'antd';
import { RobotOutlined, CloudOutlined, EnvironmentOutlined } from '@ant-design/icons';
import './AiPrediction.css';

const { Title, Paragraph, Text } = Typography;

const AiPredictionPage = () => {
  return (
    <div className="ai-prediction-page">
      <div className="ai-header">
        <Title level={2}>
          <RobotOutlined /> AI dự đoán thiên tai theo khu vực
        </Title>
        <Paragraph type="secondary">
          Mô-đun trí tuệ nhân tạo hỗ trợ dự đoán sớm nguy cơ thiên tai (sụt lún, ngập, lũ quét,...) cho từng khu vực
          dựa trên dữ liệu quan trắc và mô hình dự báo.
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={14}>
          <Card className="ai-card" title="Bản đồ dự đoán (đang thiết kế)">
            <Paragraph type="secondary">
              Khu vực này sẽ hiển thị bản đồ tương tác với các lớp thông tin rủi ro, kịch bản dự báo và mức độ ảnh hưởng.
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card className="ai-card" title="Tóm tắt mô hình AI">
            <Paragraph>
              <EnvironmentOutlined style={{ marginRight: 8, color: '#2563eb' }} />
              <Text strong>Mức độ rủi ro theo khu vực</Text>
            </Paragraph>
            <Paragraph type="secondary">
              Mỗi khu vực sẽ được gán một mức độ rủi ro từ <Tag color="green">Thấp</Tag> đến{' '}
              <Tag color="red">Rất cao</Tag> dựa trên nhiều biến đầu vào.
            </Paragraph>
            <Paragraph>
              <CloudOutlined style={{ marginRight: 8, color: '#0ea5e9' }} />
              <Text strong>Kịch bản thời tiết & môi trường</Text>
            </Paragraph>
            <Paragraph type="secondary">
              Tích hợp các kịch bản khí hậu, mưa lớn, triều cường để dự đoán nguy cơ thiên tai tổng hợp.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AiPredictionPage;

