import { Typography, Button, Card, Space } from 'antd';
import { LoginOutlined, EnvironmentOutlined, SafetyOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import './Landing.css';

const { Title, Paragraph, Text } = Typography;

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-container">
        <Card className="landing-card">
          <div className="landing-header">
            <Title level={1} className="landing-title">
              Hệ thống Quản lý Sụt lún Đất TPHCM
            </Title>
            <Text type="secondary" className="landing-subtitle">
              HCM Land Subsidence Management System
            </Text>
          </div>

          <div className="landing-info">
            <Paragraph className="landing-desc">
              Hệ thống web quản lý và giám sát quá trình sụt lún đất tại Thành phố Hồ Chí Minh, hỗ trợ theo dõi dữ liệu,
              báo cáo, tin tức và dự đoán rủi ro bằng AI.
            </Paragraph>
            <ul className="landing-features">
              <li>
                <EnvironmentOutlined /> Theo dõi khu vực và trạm giám sát trên bản đồ
              </li>
              <li>
                <BarChartOutlined /> Báo cáo thống kê và biểu đồ sụt lún
              </li>
              <li>
                <SafetyOutlined /> Chuẩn đoán và cảnh báo sớm
              </li>
              <li>
                <SafetyOutlined /> AI dự đoán thiên tai theo khu vực
              </li>
            </ul>
          </div>

          <div className="landing-actions">
            <Space size="middle" wrap>
              <Button
                type="primary"
                size="large"
                icon={<LoginOutlined />}
                onClick={() => navigate('/login')}
                className="landing-btn-login"
              >
                Đăng nhập
              </Button> 
              <Text> 
                Chưa có tài khoản?{' '}
                <Link to="/register" className="landing-link">
                  Đăng ký
                </Link>
              </Text>
            </Space>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Landing;
