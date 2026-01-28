import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card } from 'antd';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DistrictChart = ({ data = [], title = 'Phân bố dữ liệu theo quận/huyện' }) => {
  const chartData = {
    labels: data.map(item => item.districtName),
    datasets: [
      {
        label: 'Số bản ghi',
        data: data.map(item => item.count),
        backgroundColor: 'rgba(37, 99, 235, 0.6)',
        borderColor: '#2563eb',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#475569',
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          padding: 15,
          usePointStyle: true,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#2563eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#64748b',
        },
      },
    },
  };

  return (
    <Card className="chart-card">
      <div style={{ height: '300px', position: 'relative' }}>
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
};

export default DistrictChart;

