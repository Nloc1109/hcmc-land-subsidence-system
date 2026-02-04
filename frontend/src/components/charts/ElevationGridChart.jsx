/**
 * Bản vẽ hình chiếu đứng: lưới ô màu theo độ cao trong bán kính 50m.
 * props: { grid: number[][], min: number, max: number, size?: number }
 */
const ElevationGridChart = ({ grid = [], min: propMin, max: propMax, size = 220 }) => {
  const rows = grid.length;
  const cols = rows ? grid[0].length : 0;
  const flat = grid.flat().filter((v) => v != null);
  const min = propMin ?? (flat.length ? Math.min(...flat) : 0);
  const max = propMax ?? (flat.length ? Math.max(...flat) : 0);
  const range = max - min || 1;

  /** Màu theo độ cao: thấp → xanh, cao → đỏ */
  const elevationToColor = (elev) => {
    if (elev == null) return 'var(--border-color)';
    const t = (elev - min) / range;
    const r = Math.round(34 + t * 222);
    const g = Math.round(197 - t * 197);
    const b = Math.round(53 + t * 53);
    return `rgb(${r},${g},${b})`;
  };

  if (rows === 0 || cols === 0) return null;

  const cellSize = Math.max(8, Math.min(24, (size - 40) / Math.max(rows, cols)));
  const totalW = cols * cellSize;
  const totalH = rows * cellSize;

  const lowColor = elevationToColor(min);
  const highColor = elevationToColor(max);

  return (
    <div className="elevation-grid-chart" style={{ marginTop: 8 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          width: totalW,
          height: totalH,
          margin: '0 auto',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {grid.map((row, r) =>
          row.map((elev, c) => (
            <div
              key={`${r}-${c}`}
              title={elev != null ? `Độ cao: ${Number(elev).toFixed(2)} m` : '—'}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: elevationToColor(elev),
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            />
          ))
        )}
      </div>
      {/* Ghi chú thang màu độ cao */}
      <div style={{ marginTop: 10 }}>
        <div
          style={{
            height: 8,
            borderRadius: 4,
            background: `linear-gradient(to right, ${lowColor}, ${highColor})`,
            marginBottom: 6,
            maxWidth: 200,
            margin: '0 auto 6px',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--text-secondary)',
            maxWidth: 200,
            margin: '0 auto',
          }}
        >
          <span>Thấp: {min.toFixed(1)} m</span>
          <span>Cao: {max.toFixed(1)} m</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 2 }}>
          Màu biểu thị độ cao so với mực nước biển (m)
        </div>
      </div>
    </div>
  );
};

export default ElevationGridChart;
