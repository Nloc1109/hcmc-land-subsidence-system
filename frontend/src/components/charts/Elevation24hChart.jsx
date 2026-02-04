import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Biểu đồ độ cao (m) theo 24 giờ.
 * data: [{ hour: string, elevation: number }, ...]
 */
const Elevation24hChart = ({ data = [], title = 'Độ cao 24h (m)' }) => {
  const chartData = {
    labels: data.map((d) => d.hour),
    datasets: [
      {
        label: 'Độ cao (m)',
        data: data.map((d) => d.elevation),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
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
          label: (ctx) => `Độ cao: ${ctx.raw?.toFixed(2) ?? ctx.raw} m`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#64748b', maxTicksLimit: 12 },
      },
      y: {
        title: { display: true, text: 'Độ cao (m)', color: '#16a34a' },
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#64748b' },
      },
    },
  };

  if (data.length === 0) return null;

  return (
    <div style={{ height: '220px', position: 'relative' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default Elevation24hChart;
