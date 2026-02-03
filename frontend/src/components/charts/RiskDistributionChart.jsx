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

const RISK_ORDER = ['Critical', 'High', 'Medium', 'Low'];
const RISK_LABELS = {
  Critical: 'Rất cao',
  High: 'Cao',
  Medium: 'Trung bình',
  Low: 'Thấp',
};
const RISK_COLORS = {
  Critical: 'rgba(220, 38, 38, 0.75)',
  High: 'rgba(234, 88, 12, 0.75)',
  Medium: 'rgba(37, 99, 235, 0.75)',
  Low: 'rgba(22, 163, 74, 0.75)',
};
const RISK_BORDERS = {
  Critical: '#dc2626',
  High: '#ea580c',
  Medium: '#2563eb',
  Low: '#16a34a',
};

/**
 * Biểu đồ cột: phân bố số khu vực theo mức rủi ro (phục vụ chẩn đoán sụt lún).
 * @param {Array<{ riskLevel: string }>} areas - Danh sách khu vực có riskLevel
 * @param {string} title - Tiêu đề card
 */
const RiskDistributionChart = ({ areas = [], title = 'Phân bố khu vực theo mức rủi ro' }) => {
  const counts = RISK_ORDER.reduce((acc, level) => {
    acc[level] = areas.filter((a) => a.riskLevel === level).length;
    return acc;
  }, {});

  const chartData = {
    labels: RISK_ORDER.map((level) => RISK_LABELS[level]),
    datasets: [
      {
        label: 'Số khu vực',
        data: RISK_ORDER.map((level) => counts[level]),
        backgroundColor: RISK_ORDER.map((level) => RISK_COLORS[level]),
        borderColor: RISK_ORDER.map((level) => RISK_BORDERS[level]),
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
        display: false,
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
        callbacks: {
          afterLabel: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = total ? Math.round((ctx.raw / total) * 100) : 0;
            return `Tỷ lệ: ${pct}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: { size: 11, family: "'Inter', sans-serif" },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: '#64748b',
          font: { size: 11 },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  };

  return (
    <Card title={title} className="chart-card" style={{ height: '100%' }}>
      <div style={{ height: 220, position: 'relative' }}>
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
};

export default RiskDistributionChart;
