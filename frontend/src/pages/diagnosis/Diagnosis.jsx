import { useState, useEffect, Suspense, lazy } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Steps,
  Spin,
  Tag,
  List,
  Statistic,
  Empty,
  Button,
  Segmented,
  message,
  Alert,
  Popover,
} from 'antd';
import {
  SearchOutlined,
  AlertOutlined,
  EnvironmentOutlined,
  RiseOutlined,
  SafetyOutlined,
  BulbOutlined,
  BellOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  AimOutlined,
  FilterOutlined,
  FileTextOutlined,
  PrinterOutlined,
  InfoCircleOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import dashboardApi from '../../api/dashboard';
import { fetchElevationForPoints, fetchElevationGrid } from '../../api/elevation';
import RiskDistributionChart from '../../components/charts/RiskDistributionChart';
import SubsidenceChart from '../../components/charts/SubsidenceChart';
import ElevationByZoneChart from '../../components/charts/ElevationByZoneChart';
import ElevationGridChart from '../../components/charts/ElevationGridChart';
import './Diagnosis.css';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Paragraph, Text } = Typography;
const MonitoringMapLazy = lazy(() => import('../../components/maps/MonitoringMap'));

// Màu và nhãn mức rủi ro
const RISK_CONFIG = {
  Critical: { color: '#dc2626', label: 'Rất cao', icon: ThunderboltOutlined },
  High: { color: '#ea580c', label: 'Cao', icon: AlertOutlined },
  Medium: { color: '#2563eb', label: 'Trung bình', icon: BarChartOutlined },
  Low: { color: '#16a34a', label: 'Thấp', icon: SafetyOutlined },
};

// Khuyến nghị theo mức rủi ro
const RECOMMENDATIONS = {
  Critical: [
    'Kiểm tra khẩn cấp hiện trạng công trình và nền đất.',
    'Hạn chế hoặc tạm dừng xây dựng mới trong khu vực.',
    'Tăng tần suất quan trắc lên hàng tuần hoặc hàng ngày.',
    'Đánh giá khả năng di dời hoặc gia cố nền móng.',
    'Phối hợp với đơn vị quản lý nước ngầm để giảm khai thác.',
  ],
  High: [
    'Tăng cường quan trắc định kỳ (2 tuần/lần).',
    'Đánh giá ảnh hưởng đến công trình xung quanh.',
    'Hạn chế khai thác nước ngầm trong bán kính ảnh hưởng.',
    'Lập phương án ứng phó khi vượt ngưỡng nghiêm trọng.',
  ],
  Medium: [
    'Duy trì quan trắc định kỳ (1 tháng/lần).',
    'Theo dõi biến động tốc độ sụt lún.',
    'Rà soạt quy hoạch và hoạt động xây dựng.',
  ],
  Low: [
    'Duy trì quan trắc theo chu kỳ quy định.',
    'Đánh giá tổng thể định kỳ 6 tháng – 1 năm.',
  ],
};

const RISK_FILTER_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Rất cao', value: 'Critical' },
  { label: 'Cao', value: 'High' },
  { label: 'Trung bình', value: 'Medium' },
  { label: 'Thấp', value: 'Low' },
];

const ELEVATION_DIFF_WARNING_M = 0.5;
const OFFSET_DEG = 0.004;
/** Bán kính và lưới khi chọn khu vực từ danh sách (phù hợp kích thước quận/khu vực) */
const AREA_RADIUS_M = 1000;
const AREA_GRID_SIZE = 7;

/** Tọa độ đại diện từng quận TP.HCM (tâm trên đất liền, tránh sông → độ cao 0) */
const DISTRICT_COORDINATES = {
  'Quận 1': { lat: 10.7769, lng: 106.7009 },
  'Quận 2': { lat: 10.7872, lng: 106.7265 },
  'Quận 3': { lat: 10.7826, lng: 106.6848 },
  'Quận 4': { lat: 10.7642, lng: 106.7063 },
  'Quận 5': { lat: 10.7559, lng: 106.6688 },
  'Quận 6': { lat: 10.7466, lng: 106.6492 },
  'Quận 7': { lat: 10.7322, lng: 106.7172 },
  'Quận 8': { lat: 10.7242, lng: 106.6282 },
  'Quận 9': { lat: 10.8388, lng: 106.8390 },
  'Quận 10': { lat: 10.7678, lng: 106.6669 },
  'Quận 11': { lat: 10.7648, lng: 106.6442 },
  'Quận 12': { lat: 10.8428, lng: 106.6535 },
  'Bình Thạnh': { lat: 10.8106, lng: 106.7091 },
  'Tân Phú': { lat: 10.7904, lng: 106.6282 },
  'Gò Vấp': { lat: 10.8388, lng: 106.6654 },
  'Phú Nhuận': { lat: 10.7996, lng: 106.6802 },
  'Tân Bình': { lat: 10.8014, lng: 106.6527 },
  'Bình Tân': { lat: 10.7655, lng: 106.6033 },
  'Thủ Đức': { lat: 10.8494, lng: 106.7537 },
  'Củ Chi': { lat: 11.0066, lng: 106.4942 },
  'Hóc Môn': { lat: 10.8839, lng: 106.5942 },
  'Nhà Bè': { lat: 10.6962, lng: 106.7456 },
  'Cần Giờ': { lat: 10.4111, lng: 106.9547 },
};

function getDistrictCoordinates(districtName, indexFallback = 0) {
  const c = DISTRICT_COORDINATES[districtName];
  if (c) return { lat: c.lat, lng: c.lng };
  const base = { lat: 10.7769, lng: 106.7009 };
  const offset = 0.02 * (indexFallback % 9);
  const angle = (indexFallback * 0.7) % (2 * Math.PI);
  return {
    lat: base.lat + offset * Math.cos(angle),
    lng: base.lng + offset * Math.sin(angle),
  };
}

/** Tạo 5 điểm trong vùng đã chọn: tâm + Bắc, Nam, Đông, Tây */
function getPointsAroundCenter(lat, lng) {
  return [
    { lat, lng, label: 'Tâm' },
    { lat: lat + OFFSET_DEG, lng, label: 'Bắc' },
    { lat: lat - OFFSET_DEG, lng, label: 'Nam' },
    { lat, lng: lng + OFFSET_DEG, label: 'Đông' },
    { lat, lng: lng - OFFSET_DEG, label: 'Tây' },
  ];
}

const DiagnosisPage = () => {
  const [mapAreas, setMapAreas] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [topRiskAreas, setTopRiskAreas] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [riskFilter, setRiskFilter] = useState('all');
  const [trendData, setTrendData] = useState([]);
  const [elevationLoading, setElevationLoading] = useState(false);
  const [elevationByZones, setElevationByZones] = useState([]);
  const [elevationError, setElevationError] = useState(null);
  const [clickedPoint, setClickedPoint] = useState(null);
  const [elevationGridData, setElevationGridData] = useState(null);
  const [gridLastUpdated, setGridLastUpdated] = useState(null);
  const [elevationGridDataForArea, setElevationGridDataForArea] = useState(null);
  const [rainfallPastDays, setRainfallPastDays] = useState(7);
  const [rainfallData, setRainfallData] = useState([]);
  const [rainfallLoading, setRainfallLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadMapData() {
      setMapLoading(true);
      try {
        const districtData = await dashboardApi.getDistrictStats();
        if (cancelled) return;
        const areas = districtData.map((district, index) => {
          const coords = getDistrictCoordinates(district.districtName, index);
          return {
            areaId: index + 1,
            areaCode: `AREA-${String(index + 1).padStart(3, '0')}`,
            areaName: `Khu vực ${district.districtName}`,
            districtName: district.districtName,
            latitude: coords.lat,
            longitude: coords.lng,
            riskLevel: district.riskLevel,
            avgSubsidenceRate: district.avgRate,
            totalRecords: district.totalRecords,
          };
        });
        setMapAreas(areas);
      } catch (error) {
        if (!cancelled) console.error('Error loading map data:', error);
        if (!cancelled) setMapAreas([]);
      } finally {
        if (!cancelled) setMapLoading(false);
      }
    }
    loadMapData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadDiagnosisData() {
      try {
        const [topRisk, alerts] = await Promise.all([
          dashboardApi.getTopRiskAreas(8),
          dashboardApi.getRecentAlerts(15),
        ]);
        if (!cancelled) {
          setTopRiskAreas(topRisk);
          setRecentAlerts(alerts);
        }
      } catch (error) {
        if (!cancelled) console.error('Error loading diagnosis data:', error);
      }
    }
    loadDiagnosisData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadTrend() {
      try {
        const data = await dashboardApi.getSubsidenceTrend(30);
        if (!cancelled) setTrendData(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setTrendData([]);
      }
    }
    loadTrend();
    return () => { cancelled = true; };
  }, []);

  const safeRecentAlerts = Array.isArray(recentAlerts) ? recentAlerts : [];
  const alertsForSelected = selectedArea
    ? safeRecentAlerts.filter((a) => a && a.districtName === selectedArea.districtName)
    : [];

  // Tọa độ khu vực đã chọn (cho flyTo khi chọn từ danh sách)
  const selectedPosition = selectedArea && mapAreas.length > 0
    ? (() => {
        const mapArea = mapAreas.find((a) => a.districtName === selectedArea.districtName);
        return mapArea
          ? { lat: mapArea.latitude, lng: mapArea.longitude }
          : null;
      })()
    : null;

  // Khi có clickedPoint: khảo sát 50m, lấy lưới độ cao và cập nhật mỗi 5 phút
  useEffect(() => {
    if (clickedPoint?.lat == null || clickedPoint?.lng == null) {
      setElevationGridData(null);
      setGridLastUpdated(null);
      return;
    }
    let cancelled = false;
    const fetchGrid = () => {
      setElevationLoading(true);
      setElevationError(null);
      fetchElevationGrid(clickedPoint.lat, clickedPoint.lng, 50, 5)
        .then((data) => {
          if (cancelled) return;
          setElevationGridData(data);
          setGridLastUpdated(new Date());
          setElevationError(null);
        })
        .catch((err) => {
          if (!cancelled) {
            setElevationError(err?.message || 'Không lấy được độ cao');
            setElevationGridData(null);
          }
        })
        .finally(() => {
          if (!cancelled) setElevationLoading(false);
        });
    };
    fetchGrid();
    const interval = setInterval(fetchGrid, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [clickedPoint?.lat, clickedPoint?.lng]);

  // Khi chọn khu vực từ danh sách: lấy 5 điểm + lưới độ cao phù hợp kích thước khu vực (bán kính 1km)
  useEffect(() => {
    if (clickedPoint != null) return;
    if (selectedPosition?.lat == null || selectedPosition?.lng == null) {
      setElevationByZones([]);
      setElevationGridDataForArea(null);
      setElevationError(null);
      return;
    }
    let cancelled = false;
    setElevationLoading(true);
    setElevationError(null);
    const points = getPointsAroundCenter(selectedPosition.lat, selectedPosition.lng);
    Promise.all([
      fetchElevationForPoints(points),
      fetchElevationGrid(selectedPosition.lat, selectedPosition.lng, AREA_RADIUS_M, AREA_GRID_SIZE),
    ])
      .then(([zoneResults, gridData]) => {
        if (cancelled) return;
        const valid = zoneResults.filter((r) => r.elevation != null);
        if (valid.length > 0) {
          setElevationByZones(valid);
          setElevationError(null);
        } else {
          setElevationByZones([]);
          setElevationError('Không lấy được độ cao tại các điểm');
        }
        setElevationGridDataForArea(gridData);
      })
      .catch((err) => {
        if (!cancelled) {
          setElevationError(err?.message || 'Không lấy được độ cao');
          setElevationByZones([]);
          setElevationGridDataForArea(null);
        }
      })
      .finally(() => {
        if (!cancelled) setElevationLoading(false);
      });
    return () => { cancelled = true; };
  }, [clickedPoint, selectedPosition?.lat, selectedPosition?.lng]);

  const criticalCount = safeRecentAlerts.filter((a) => a.severity === 'Critical').length;
  const warningCount = safeRecentAlerts.filter((a) => a.severity === 'Warning').length;

  const elevations = elevationByZones.map((d) => d.elevation).filter((e) => e != null);
  const elevationDiff =
    elevations.length > 0 ? Math.max(...elevations) - Math.min(...elevations) : 0;
  const elevationDiffWarning = elevationDiff >= ELEVATION_DIFF_WARNING_M;
  const centerElevation =
    elevationByZones.find((d) => d.label === 'Tâm')?.elevation ??
    (elevations.length ? elevations[0] : null);

  const safeTopRiskAreas = Array.isArray(topRiskAreas) ? topRiskAreas : [];
  const filteredAreas =
    riskFilter === 'all'
      ? safeTopRiskAreas
      : safeTopRiskAreas.filter((a) => a && a.riskLevel === riskFilter);

  // Xuất báo cáo chẩn đoán (tải file TXT)
  const handleExportReport = () => {
    if (!selectedArea) {
      message.warning('Vui lòng chọn một khu vực trước khi xuất báo cáo.');
      return;
    }
    const config = RISK_CONFIG[selectedArea.riskLevel] || RISK_CONFIG.Medium;
    const recs = RECOMMENDATIONS[selectedArea.riskLevel] || RECOMMENDATIONS.Medium;
    const lines = [
      'BÁO CÁO CHẨN ĐOÁN SỤT LÚN',
      'Hệ thống giám sát sụt lún – TP.HCM',
      `Ngày xuất: ${dayjs().format('DD/MM/YYYY HH:mm')}`,
      '',
      '--- KẾT QUẢ CHẨN ĐOÁN ---',
      `Khu vực: ${selectedArea.areaName}`,
      `Mã: ${selectedArea.areaCode} · Quận: ${selectedArea.districtName}`,
      `Mức rủi ro: ${config.label}`,
      `Tốc độ sụt lún TB: ${selectedArea.avgSubsidenceRate} mm/năm`,
      ...(selectedArea.cumulativeSubsidence != null
        ? [`Sụt lún tích lũy: ${selectedArea.cumulativeSubsidence} mm`]
        : []),
      '',
      '--- KHUYẾN NGHỊ ---',
      ...recs.map((r, i) => `${i + 1}. ${r}`),
    ];
    if (alertsForSelected.length > 0) {
      lines.push('', '--- CẢNH BÁO LIÊN QUAN ---');
      alertsForSelected.forEach((a) => {
        lines.push(`- ${a.title} (${a.severity}, ${dayjs(a.alertTime).format('DD/MM/YYYY')})`);
      });
    }
    const blob = new Blob([lines.join('\r\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chan-doan-${selectedArea.areaCode || selectedArea.districtName}-${dayjs().format('YYYYMMDD')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('Đã tải báo cáo.');
  };

  // In báo cáo (mở cửa sổ in với nội dung chẩn đoán)
  const handlePrintReport = () => {
    if (!selectedArea) {
      message.warning('Vui lòng chọn một khu vực trước khi in báo cáo.');
      return;
    }
    const config = RISK_CONFIG[selectedArea.riskLevel] || RISK_CONFIG.Medium;
    const recs = RECOMMENDATIONS[selectedArea.riskLevel] || RECOMMENDATIONS.Medium;
    const recsHtml = recs.map((r) => `<li>${r}</li>`).join('');
    let alertsHtml = '';
    if (alertsForSelected.length > 0) {
      alertsHtml =
        '<h2>Cảnh báo liên quan</h2><ul>' +
        alertsForSelected
          .map((a) => `<li>${a.title} (${a.severity}, ${dayjs(a.alertTime).format('DD/MM/YYYY')})</li>`)
          .join('') +
        '</ul>';
    }
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Báo cáo chẩn đoán</title>
<style>body{font-family:Inter,sans-serif;padding:24px;max-width:720px;margin:0 auto;color:#0f172a;}
h1{font-size:1.25rem;} h2{font-size:1rem;margin-top:20px;} p,li{line-height:1.6;color:#475569;}
ul{margin:8px 0;padding-left:20px;} .meta{font-size:12px;color:#64748b;}</style></head><body>
<h1>Báo cáo chẩn đoán sụt lún</h1>
<p class="meta">Hệ thống giám sát sụt lún – TP.HCM · Ngày in: ${dayjs().format('DD/MM/YYYY HH:mm')}</p>
<h2>Kết quả chẩn đoán</h2>
<p><strong>${selectedArea.areaName}</strong></p>
<p class="meta">Mã: ${selectedArea.areaCode} · Quận: ${selectedArea.districtName}</p>
<p>Mức rủi ro: <strong>${config.label}</strong></p>
<p>Tốc độ sụt lún TB: ${selectedArea.avgSubsidenceRate} mm/năm</p>
${selectedArea.cumulativeSubsidence != null ? `<p>Sụt lún tích lũy: ${selectedArea.cumulativeSubsidence} mm</p>` : ''}
<h2>Khuyến nghị</h2>
<ul>${recsHtml}</ul>
${alertsHtml}
</body></html>`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
    message.success('Đã mở hộp thoại in.');
  };

  // Bước hiện tại trong quy trình: 0 = chưa chọn, 1 = đã chọn (đang xem), 2 = đã xem kết luận
  const processCurrentStep = selectedArea ? 2 : 0;

  return (
    <div className="page-container diagnosis-page">
      {/* Hero header */}
      <div className="diagnosis-hero">
        <div className="diagnosis-hero-content">
          <Title level={2} className="diagnosis-hero-title">
            <SearchOutlined className="diagnosis-hero-icon" /> Chẩn đoán khu vực
          </Title>
          <Paragraph className="diagnosis-hero-desc">
            Đánh giá nhanh mức độ rủi ro sụt lún theo từng khu vực dựa trên dữ liệu quan trắc và cảnh báo. Chọn một khu vực bên dưới để xem chi tiết và khuyến nghị.
          </Paragraph>
        </div>
        <div className="diagnosis-hero-stats">
          <Statistic
            title="Khu vực giám sát"
            value={mapAreas.length}
            suffix="quận"
            valueStyle={{ color: 'var(--accent-color)' }}
          />
          <Statistic
            title="Cảnh báo nghiêm trọng"
            value={criticalCount}
            valueStyle={{ color: criticalCount > 0 ? '#dc2626' : undefined }}
          />
          <Statistic title="Cảnh báo cần theo dõi" value={warningCount} />
        </div>
      </div>

      {/* Bản đồ (nửa trái) + Chênh lệch độ cao (nửa phải) — cùng kích thước */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }} className="diagnosis-map-elevation-row">
        <Col xs={24} md={12}>
          <Card className="diagnosis-card diagnosis-map-card diagnosis-equal-height" bordered={false}>
            <div className="diagnosis-card-header">
              <EnvironmentOutlined className="diagnosis-card-icon" />
              <span>Bản đồ khu vực giám sát</span>
            </div>
            <div className="diagnosis-map-wrapper diagnosis-map-wrapper--equal">
              {mapLoading ? (
                <div className="diagnosis-map-loading">
                  <Spin size="large" tip="Đang tải bản đồ..." />
                </div>
              ) : (
                <Suspense
                  fallback={
                    <div className="diagnosis-map-loading">
                      <Spin size="large" tip="Đang tải bản đồ..." />
                    </div>
                  }
                >
                  <MonitoringMapLazy
                    areas={mapAreas}
                    height="380px"
                    selectedPosition={selectedPosition}
                    clickedPoint={clickedPoint}
                    onMapClick={(lat, lng) => setClickedPoint({ lat, lng })}
                  />
                </Suspense>
              )}
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
              Click vào một điểm trên bản đồ để khảo sát bán kính 50m và xem hình chiếu đứng độ cao (cập nhật mỗi 5 phút).
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card className="diagnosis-card diagnosis-elevation-card diagnosis-equal-height" bordered={false}>
            <div className="diagnosis-card-header">
              <RiseOutlined className="diagnosis-card-icon" />
              <span>Chênh lệch độ cao các khu vực trong địa điểm</span>
            </div>
            {/* Không chọn điểm trên bản đồ và không chọn khu vực từ danh sách */}
            {!clickedPoint && !selectedArea ? (
              <div className="diagnosis-elevation-placeholder">
                <AimOutlined style={{ fontSize: 40, color: 'var(--border-color)', marginBottom: 12 }} />
                <Text type="secondary">
                  Click vào một điểm trên bản đồ để khảo sát bán kính 50m và xem bản vẽ hình chiếu đứng độ cao (màu theo độ cao, cập nhật mỗi 5 phút).
                </Text>
              </div>
            ) : clickedPoint ? (
              /* Đã click bản đồ: khảo sát 50m, hình chiếu đứng, cập nhật 5 phút */
              <>
                {elevationLoading && !elevationGridData ? (
                  <div className="diagnosis-map-loading" style={{ minHeight: 200 }}>
                    <Spin size="large" tip="Đang khảo sát độ cao trong bán kính 50m..." />
                  </div>
                ) : elevationError && !elevationGridData ? (
                  <Alert type="warning" showIcon message="Không lấy được độ cao" description={elevationError} />
                ) : (
                  <div className="diagnosis-elevation-content-scroll">
                    <div className="diagnosis-elevation-stats">
                      <Statistic
                        title="Chênh lệch trong 50m (m)"
                        value={elevationGridData?.min != null && elevationGridData?.max != null
                          ? (elevationGridData.max - elevationGridData.min).toFixed(3)
                          : '–'}
                        valueStyle={{ color: (elevationGridData?.max - elevationGridData?.min) >= ELEVATION_DIFF_WARNING_M ? '#dc2626' : '#16a34a' }}
                      />
                      <div>
                        <Statistic
                          title="Cập nhật lúc"
                          value={gridLastUpdated ? dayjs(gridLastUpdated).format('HH:mm') : '–'}
                          valueStyle={{ fontSize: 14 }}
                        />
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                          Ghi chú: tự động cập nhật mỗi 5 phút
                        </div>
                      </div>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      Bản vẽ hình chiếu đứng (bán kính 50m) — màu biểu thị độ cao, cập nhật mỗi 5 phút
                    </Text>
                    {elevationGridData?.grid && (
                      <ElevationGridChart
                        grid={elevationGridData.grid}
                        min={elevationGridData.min}
                        max={elevationGridData.max}
                        size={220}
                      />
                    )}
                    <Button
                      type="text"
                      size="small"
                      style={{ marginTop: 12 }}
                      onClick={() => setClickedPoint(null)}
                    >
                      Bỏ chọn điểm khảo sát
                    </Button>
                  </div>
                )}
              </>
            ) : elevationLoading ? (
              <div className="diagnosis-map-loading" style={{ minHeight: 200 }}>
                <Spin size="large" tip="Đang lấy độ cao các điểm..." />
              </div>
            ) : elevationError ? (
              <Alert type="warning" showIcon message="Không lấy được độ cao" description={elevationError} />
            ) : (
              <div className="diagnosis-elevation-content-scroll">
                <div className="diagnosis-elevation-stats">
                  <Statistic
                    title="Độ cao tại tâm (m)"
                    value={centerElevation != null ? centerElevation.toFixed(2) : '–'}
                    valueStyle={{ color: 'var(--accent-color)' }}
                  />
                  <Statistic
                    title="Chênh lệch trong vùng (m)"
                    value={elevationByZones.length ? elevationDiff.toFixed(3) : '–'}
                    valueStyle={{ color: elevationDiffWarning ? '#dc2626' : '#16a34a' }}
                  />
                </div>
                {elevationDiffWarning && (
                  <Alert
                    type="error"
                    showIcon
                    icon={<BellOutlined />}
                    message="Cảnh báo: chênh lệch độ cao lớn trong địa điểm"
                    description={`Chênh lệch giữa các khu vực (Tâm, Bắc, Nam, Đông, Tây) là ${elevationDiff.toFixed(2)} m (≥ ${ELEVATION_DIFF_WARNING_M} m). Cần kiểm tra địa hình, khả năng sụt lún hoặc chênh nền trong vùng.`}
                    style={{ marginBottom: 16 }}
                  />
                )}
                {/* Bản vẽ hình chiếu đứng phù hợp kích thước khu vực (bán kính 1km) */}
                {elevationGridDataForArea?.grid && (
                  <>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                      Bản vẽ hình chiếu đứng khu vực (bán kính {AREA_RADIUS_M / 1000} km)
                    </Text>
                    <ElevationGridChart
                      grid={elevationGridDataForArea.grid}
                      min={elevationGridDataForArea.min}
                      max={elevationGridDataForArea.max}
                      size={240}
                    />
                  </>
                )}
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Độ cao từng hướng (Tâm, Bắc, Nam, Đông, Tây)</Text>
                  <ElevationByZoneChart data={elevationByZones} />
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Nút ghi chú ký hiệu — bấm để hiện popover nổi */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <Popover
          content={
            <div style={{ maxWidth: 360, padding: '4px 0' }}>
              <div style={{ marginBottom: 10, fontWeight: 600, fontSize: 13 }}>Ghi chú ký hiệu</div>
              <div style={{ marginBottom: 10 }}>
                <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Bản vẽ độ cao (hình chiếu đứng)</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      width: 48,
                      height: 10,
                      borderRadius: 4,
                      background: 'linear-gradient(to right, rgb(34,197,53), rgb(255,0,106))',
                      flexShrink: 0,
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>Xanh lá (thấp) → đỏ (cao). Mét so với mực nước biển.</Text>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Mức rủi ro khu vực</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', alignItems: 'center' }}>
                  {Object.entries(RISK_CONFIG).map(([key, { color, label }]) => (
                    <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Cảnh báo</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', alignItems: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#dc2626', flexShrink: 0 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>Nghiêm trọng (Critical)</Text>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ea580c', flexShrink: 0 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>Cần theo dõi (Warning)</Text>
                  </span>
                </div>
              </div>
            </div>
          }
          title={null}
          trigger="click"
          placement="bottomRight"
        >
          <Button type="default" size="small" icon={<InfoCircleOutlined />}>
            Ghi chú ký hiệu
          </Button>
        </Popover>
      </div>

      {/* Chọn khu vực chẩn đoán + Kết quả chẩn đoán — ngay dưới bản đồ & độ cao */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card className="diagnosis-card" bordered={false}>
            <div className="diagnosis-card-header">
              <AimOutlined className="diagnosis-card-icon" />
              <span>Chọn khu vực cần chẩn đoán</span>
            </div>
            <Paragraph type="secondary" className="diagnosis-list-hint">
              Bấm vào một khu vực để xem đánh giá rủi ro và khuyến nghị.
            </Paragraph>
            <div className="diagnosis-filter-row">
              <span className="diagnosis-filter-label">
                <FilterOutlined /> Lọc theo mức rủi ro:
              </span>
              <Segmented
                options={RISK_FILTER_OPTIONS}
                value={riskFilter}
                onChange={setRiskFilter}
                size="small"
              />
            </div>
            <div className="diagnosis-area-list">
              {filteredAreas.length === 0 ? (
                <Empty
                  description={safeTopRiskAreas.length === 0 ? 'Chưa có dữ liệu khu vực' : 'Không có khu vực nào theo mức đã chọn'}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                filteredAreas.map((area) => {
                  const config = RISK_CONFIG[area.riskLevel] || RISK_CONFIG.Medium;
                  const isSelected = selectedArea?.areaId === area.areaId;
                  return (
                    <div
                      key={area.areaId}
                      className={`diagnosis-area-item ${isSelected ? 'diagnosis-area-item--selected' : ''}`}
                      onClick={() => {
                        setClickedPoint(null);
                        setSelectedArea(area);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setClickedPoint(null);
                          setSelectedArea(area);
                        }
                      }}
                    >
                      <div className="diagnosis-area-item-main">
                        <span className="diagnosis-area-item-name">{area.areaName}</span>
                        <Tag color={config.color} className="diagnosis-risk-tag">
                          {config.label}
                        </Tag>
                      </div>
                      <div className="diagnosis-area-item-meta">
                        <Text type="secondary">
                          Tốc độ TB: <strong>{area.avgSubsidenceRate} mm/năm</strong>
                          {area.cumulativeSubsidence != null && (
                            <> · Tích lũy: {area.cumulativeSubsidence} mm</>
                          )}
                          {area.alertCount != null && area.alertCount > 0 && (
                            <> · {area.alertCount} cảnh báo</>
                          )}
                        </Text>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          {selectedArea ? (
            <>
              <Card className="diagnosis-card diagnosis-detail-card" bordered={false}>
                <div className="diagnosis-card-header diagnosis-card-header--actions">
                  <span className="diagnosis-card-header-left">
                    <BarChartOutlined className="diagnosis-card-icon" />
                    <span>Kết quả chẩn đoán</span>
                  </span>
                  <div className="diagnosis-report-actions">
                    <Button
                      type="default"
                      size="small"
                      icon={<FileTextOutlined />}
                      onClick={handleExportReport}
                    >
                      Tải báo cáo
                    </Button>
                    <Button
                      type="default"
                      size="small"
                      icon={<PrinterOutlined />}
                      onClick={handlePrintReport}
                    >
                      In báo cáo
                    </Button>
                  </div>
                </div>
                <div className="diagnosis-detail-content">
                  <div className="diagnosis-detail-title">{selectedArea.areaName}</div>
                  <div className="diagnosis-detail-meta">
                    Mã: {selectedArea.areaCode} · Quận: {selectedArea.districtName}
                  </div>
                  <div className="diagnosis-detail-stats">
                    <div className="diagnosis-detail-stat">
                      <span className="diagnosis-detail-stat-label">Mức rủi ro</span>
                      <Tag
                        style={{
                          backgroundColor: (RISK_CONFIG[selectedArea.riskLevel] || RISK_CONFIG.Medium).color,
                          color: '#fff',
                          border: 'none',
                          padding: '4px 12px',
                          borderRadius: 8,
                        }}
                      >
                        {(RISK_CONFIG[selectedArea.riskLevel] || RISK_CONFIG.Medium).label}
                      </Tag>
                    </div>
                    <div className="diagnosis-detail-stat">
                      <span className="diagnosis-detail-stat-label">Tốc độ sụt lún TB</span>
                      <span className="diagnosis-detail-stat-value">
                        {selectedArea.avgSubsidenceRate} mm/năm
                      </span>
                    </div>
                    {selectedArea.cumulativeSubsidence != null && (
                      <div className="diagnosis-detail-stat">
                        <span className="diagnosis-detail-stat-label">Sụt lún tích lũy</span>
                        <span className="diagnosis-detail-stat-value">
                          {selectedArea.cumulativeSubsidence} mm
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
              <Card className="diagnosis-card" bordered={false}>
                <div className="diagnosis-card-header">
                  <BulbOutlined className="diagnosis-card-icon" />
                  <span>Khuyến nghị</span>
                </div>
                <ul className="diagnosis-recommendations">
                  {(RECOMMENDATIONS[selectedArea.riskLevel] || RECOMMENDATIONS.Medium).map(
                    (item, idx) => (
                      <li key={idx}>{item}</li>
                    )
                  )}
                </ul>
              </Card>
              {alertsForSelected.length > 0 && (
                <Card className="diagnosis-card" bordered={false}>
                  <div className="diagnosis-card-header">
                    <BellOutlined className="diagnosis-card-icon" />
                    <span>Cảnh báo liên quan ({alertsForSelected.length})</span>
                  </div>
                  <List
                    size="small"
                    dataSource={alertsForSelected}
                    renderItem={(alert) => (
                      <List.Item className="diagnosis-alert-item">
                        <div>
                          <Text strong>{alert.title}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(alert.alertTime).fromNow()} · {alert.severity}
                          </Text>
                        </div>
                        <Tag color={alert.severity === 'Critical' ? 'red' : 'orange'}>
                          {alert.severity}
                        </Tag>
                      </List.Item>
                    )}
                  />
                </Card>
              )}
              <Button
                type="text"
                className="diagnosis-clear-selection"
                onClick={() => setSelectedArea(null)}
              >
                Bỏ chọn khu vực
              </Button>
            </>
          ) : (
            <Card className="diagnosis-card diagnosis-placeholder-card" bordered={false}>
              <div className="diagnosis-placeholder">
                <RiseOutlined className="diagnosis-placeholder-icon" />
                <Title level={5}>Chưa chọn khu vực</Title>
                <Paragraph type="secondary">
                  Chọn một khu vực từ danh sách bên trái để xem kết quả chẩn đoán, khuyến nghị và cảnh báo liên quan.
                </Paragraph>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {/* Biểu đồ: phân bố mức rủi ro + xu hướng sụt lún */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <RiskDistributionChart
            areas={safeTopRiskAreas.length > 0 ? safeTopRiskAreas : mapAreas}
            title="Phân bố khu vực theo mức rủi ro"
          />
        </Col>
        <Col xs={24} md={12}>
          {trendData.length > 0 ? (
            <SubsidenceChart data={trendData} title="Xu hướng sụt lún (30 ngày)" />
          ) : (
            <Card className="diagnosis-card" bordered={false} title="Xu hướng sụt lún (30 ngày)">
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin tip="Đang tải dữ liệu..." />
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {/* Quy trình chẩn đoán - trạng thái theo bước người dùng đang ở */}
      <Card className="diagnosis-card diagnosis-process-card" bordered={false}>
        <div className="diagnosis-card-header">
          <CheckCircleOutlined className="diagnosis-card-icon" />
          <span>Quy trình chẩn đoán</span>
        </div>
        <Steps
          direction="horizontal"
          className="diagnosis-steps"
          current={processCurrentStep}
          items={[
            {
              title: 'Chọn khu vực',
              description: selectedArea ? 'Đã chọn khu vực' : 'Từ bản đồ hoặc danh sách khu vực có nguy cơ',
              icon: <AimOutlined />,
            },
            {
              title: 'Phân tích dữ liệu',
              description: selectedArea ? 'Đã tổng hợp tốc độ sụt lún, tích lũy và cảnh báo' : 'Tổng hợp tốc độ sụt lún, tích lũy và cảnh báo',
              icon: <BarChartOutlined />,
            },
            {
              title: 'Kết luận & khuyến nghị',
              description: selectedArea ? 'Xem kết quả và khuyến nghị bên trên' : 'Mức rủi ro và biện pháp theo dõi, can thiệp',
              icon: <SafetyOutlined />,
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default DiagnosisPage;
