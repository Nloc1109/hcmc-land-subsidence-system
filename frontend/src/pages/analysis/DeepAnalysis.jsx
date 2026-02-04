import { useState, useEffect } from 'react';
import { Card, Spin, message } from 'antd';
import DeepAnalysisMap from '../../components/maps/DeepAnalysisMap';
import { getMonitoringAreas } from '../../api/monitoring/areas';
import './DeepAnalysis.css';

const DeepAnalysis = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        setLoading(true);
        const data = await getMonitoringAreas();
        setAreas(data);
      } catch (error) {
        console.error('Error fetching areas:', error);
        message.error('Không thể tải danh sách khu vực giám sát');
      } finally {
        setLoading(false);
      }
    };

    fetchAreas();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '600px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="deep-analysis-page">
      <Card
        title="Bản đồ Phân tích Chuyên sâu"
        style={{ marginBottom: 24 }}
      >
        <p style={{ marginBottom: 16, color: '#666' }}>
          Bản đồ phân tích chuyên sâu cho phép Analyst xem chi tiết các khu vực giám sát, 
          bao gồm dữ liệu lịch sử, dự đoán AI, và thông tin về triều - mưa.
        </p>
      </Card>

      <Card>
        <DeepAnalysisMap areas={areas} height="calc(100vh - 280px)" />
      </Card>
    </div>
  );
};

export default DeepAnalysis;

