/**
 * Open-Meteo Elevation API
 * https://open-meteo.com/en/docs/elevation-api
 * Trả về độ cao (m) so với mực nước biển tại tọa độ (lat, lng).
 */

const ELEVATION_API = 'https://api.open-meteo.com/v1/elevation';

/** Một điểm: trả về độ cao (m) hoặc null */
export async function fetchElevation(latitude, longitude) {
  const url = new URL(ELEVATION_API);
  url.searchParams.set('latitude', latitude);
  url.searchParams.set('longitude', longitude);
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error('Không lấy được độ cao');
  const data = await res.json();
  const value = data?.elevation?.[0];
  return typeof value === 'number' ? value : null;
}

/**
 * Nhiều điểm: points = [{ lat, lng, label }, ...].
 * Trả về [{ label, elevation }, ...] (elevation = m, hoặc null nếu lỗi).
 * Gọi API từng điểm (Open-Meteo có thể không hỗ trợ nhiều tọa độ trong 1 request).
 */
export async function fetchElevationForPoints(points) {
  const results = await Promise.all(
    points.map(async (p) => {
      try {
        const elev = await fetchElevation(p.lat, p.lng);
        return { label: p.label, elevation: elev };
      } catch {
        return { label: p.label, elevation: null };
      }
    })
  );
  return results;
}

/** Chuyển mét sang độ (lat): 1° lat ≈ 111320 m */
const METERS_TO_DEG_LAT = 1 / 111320;

/**
 * Tạo lưới điểm trong bán kính radiusMeters (m) quanh (centerLat, centerLng).
 * gridSize = số điểm mỗi chiều (ví dụ 5 → lưới 5x5).
 * Trả về [{ lat, lng, row, col }, ...] sắp xếp theo row, col.
 */
export function getGridPointsInRadius(centerLat, centerLng, radiusMeters = 50, gridSize = 5) {
  const points = [];
  const latRad = (centerLat * Math.PI) / 180;
  const cosLat = Math.cos(latRad);
  const degPerMeterLng = 1 / (111320 * cosLat);
  const stepM = (2 * radiusMeters) / (gridSize - 1);
  const startM = -radiusMeters;

  for (let row = 0; row < gridSize; row++) {
    const dy = startM + row * stepM;
    for (let col = 0; col < gridSize; col++) {
      const dx = startM + col * stepM;
      const distM = Math.sqrt(dx * dx + dy * dy);
      if (distM > radiusMeters + 1) continue; // bỏ điểm ngoài vòng tròn
      const lat = centerLat + dy * METERS_TO_DEG_LAT;
      const lng = centerLng + dx * degPerMeterLng;
      points.push({ lat, lng, row, col });
    }
  }
  return points;
}

/**
 * Lấy độ cao cho lưới điểm trong bán kính 50m.
 * Trả về { grid: number[][] (row-major), points: [{ lat, lng, row, col, elevation }], min, max }.
 */
export async function fetchElevationGrid(centerLat, centerLng, radiusMeters = 50, gridSize = 5) {
  const points = getGridPointsInRadius(centerLat, centerLng, radiusMeters, gridSize);
  const results = await Promise.all(
    points.map(async (p) => {
      try {
        const elevation = await fetchElevation(p.lat, p.lng);
        return { ...p, elevation };
      } catch {
        return { ...p, elevation: null };
      }
    })
  );
  const valid = results.filter((r) => r.elevation != null);
  const elevations = valid.map((r) => r.elevation);
  const min = elevations.length ? Math.min(...elevations) : null;
  const max = elevations.length ? Math.max(...elevations) : null;
  const grid = [];
  for (let r = 0; r < gridSize; r++) {
    grid[r] = Array(gridSize).fill(null);
    for (let c = 0; c < gridSize; c++) {
      const pt = results.find((x) => x.row === r && x.col === c);
      if (pt != null) grid[r][c] = pt.elevation;
    }
  }
  return { grid, points: results, min, max };
}
