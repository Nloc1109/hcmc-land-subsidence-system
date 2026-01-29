import { Typography, Card, Row, Col, Steps } from 'antd';
import { SearchOutlined, AlertOutlined } from '@ant-design/icons';
import './Diagnosis.css';

const { Title, Paragraph, Text } = Typography;

const DiagnosisPage = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2}>
          <SearchOutlined /> Chuẩn đoán khu vực
        </Title>
        <Paragraph type="secondary">
          Hỗ trợ đánh giá nhanh mức độ rủi ro sụt lún của từng khu vực dựa trên dữ liệu quan trắc và lịch sử cảnh báo.
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={14}>
          <Card className="page-card" title="Quy trình chuẩn đoán">
            <Steps
              direction="vertical"
              items={[
                {
                  title: 'Chọn khu vực cần đánh giá',
                  description: 'Lựa chọn quận/huyện hoặc khu vực giám sát cụ thể.',
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
              Giao diện đã sẵn sàng để tích hợp các bộ lọc, bảng kết quả và bản đồ chi tiết cho từng khu vực.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DiagnosisPage;

