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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * Biểu đồ cột: độ cao (m) theo từng khu vực/điểm trong địa điểm đã chọn.
 * data: [{ label: string, elevation: number }, ...]
 */
const ElevationByZoneChart = ({ data = [] }) => {
  const valid = data.filter((d) => d.elevation != null);
  if (valid.length === 0) return null;

  const chartData = {
    labels: valid.map((d) => d.label),
    datasets: [
      {
        label: 'Độ cao (m)',
        data: valid.map((d) => Number(d.elevation.toFixed(2))),
        backgroundColor: [
          'rgba(37, 99, 235, 0.7)',
          'rgba(22, 163, 74, 0.7)',
          'rgba(234, 88, 12, 0.7)',
          'rgba(139, 92, 246, 0.7)',
          'rgba(236, 72, 153, 0.7)',
        ],
        borderColor: ['#2563eb', '#16a34a', '#ea580c', '#8b5cf6', '#ec4899'],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Độ cao: ${ctx.raw} m`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
      y: {
        title: { display: true, text: 'Độ cao (m)', color: '#16a34a' },
        grid: { color: 'rgba(0,0,0,0.06)' },
        ticks: { color: '#64748b' },
      },
    },
  };

  return (
    <div style={{ height: '220px', position: 'relative' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default ElevationByZoneChart;
