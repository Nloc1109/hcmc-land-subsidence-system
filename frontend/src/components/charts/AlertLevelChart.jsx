import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const AlertLevelChart = ({ alerts = 0, maxAlerts = 10, size = 80 }) => {
  // Tính toán mức cảnh báo dựa trên số lượng alerts
  const alertLevel = alerts === 0 ? 0 : alerts <= 2 ? 1 : alerts <= 5 ? 2 : 3;
  const colors = ['#52c41a', '#faad14', '#fa8c16', '#ff4d4f']; // Xanh, Vàng, Cam, Đỏ
  const labels = ['Không có', 'Thấp', 'Trung bình', 'Cao'];
  
  // Tạo dữ liệu cho biểu đồ
  const data = {
    labels: [labels[alertLevel]],
    datasets: [
      {
        data: [100], // 100% cho mức cảnh báo hiện tại
        backgroundColor: [colors[alertLevel]],
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: () => `${labels[alertLevel]} (${alerts} cảnh báo)`,
        },
      },
    },
  };

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <Doughnut data={data} options={options} />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          color: colors[alertLevel],
        }}
      >
        {alerts}
      </div>
    </div>
  );
};

export default AlertLevelChart;
