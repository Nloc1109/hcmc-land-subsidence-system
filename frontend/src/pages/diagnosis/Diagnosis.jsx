import { useState, useEffect, useMemo, Suspense, lazy } from 'react';
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
  Select,
  Table,
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
  CloudOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import dashboardApi from '../../api/dashboard';
import RiskDistributionChart from '../../components/charts/RiskDistributionChart';
import SubsidenceChart from '../../components/charts/SubsidenceChart';
import SendReportButton from '../../components/SendReportButton';
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

// Quận/huyện TP.HCM với tọa độ trung tâm (để gọi Open-Meteo)
const DISTRICTS_RAINFALL = [
  { name: 'Quận 1', lat: 10.7769, lon: 106.7009 },
  { name: 'Quận 2', lat: 10.7872, lon: 106.749 },
  { name: 'Quận 7', lat: 10.7297, lon: 106.7172 },
  { name: 'Quận 12', lat: 10.8631, lon: 106.6297 },
  { name: 'Bình Thạnh', lat: 10.8106, lon: 106.7091 },
  { name: 'Tân Phú', lat: 10.7905, lon: 106.6282 },
];

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

const DiagnosisPage = () => {
  const [mapAreas, setMapAreas] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [topRiskAreas, setTopRiskAreas] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [riskFilter, setRiskFilter] = useState('all');
  const [trendData, setTrendData] = useState([]);
  const [rainfallData, setRainfallData] = useState([]);
  const [rainfallLoading, setRainfallLoading] = useState(false);
  const [rainfallPastDays, setRainfallPastDays] = useState(7);

  useEffect(() => {
    let cancelled = false;
    async function loadMapData() {
      setMapLoading(true);
      try {
        const districtData = await dashboardApi.getDistrictStats();
        if (cancelled) return;
        const areas = districtData.map((district, index) => ({
          areaId: index + 1,
          areaCode: `AREA-${String(index + 1).padStart(3, '0')}`,
          areaName: `Khu vực ${district.districtName}`,
          districtName: district.districtName,
          latitude: 10.7769 + (Math.random() - 0.5) * 0.1,
          longitude: 106.7009 + (Math.random() - 0.5) * 0.1,
          riskLevel: district.riskLevel,
          avgSubsidenceRate: district.avgRate,
          totalRecords: district.totalRecords,
        }));
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

  const alertsForSelected = selectedArea
    ? recentAlerts.filter((a) => a.districtName === selectedArea.districtName)
    : [];

  // Tọa độ khu vực đã chọn để bản đồ flyTo (khớp theo quận trong mapAreas)
  const selectedPosition = selectedArea && mapAreas.length > 0
    ? (() => {
        const mapArea = mapAreas.find((a) => a.districtName === selectedArea.districtName);
        return mapArea
          ? { lat: mapArea.latitude, lng: mapArea.longitude }
          : null;
      })()
    : null;

  const criticalCount = recentAlerts.filter((a) => a.severity === 'Critical').length;
  const warningCount = recentAlerts.filter((a) => a.severity === 'Warning').length;

  // Lọc danh sách theo mức rủi ro
  const filteredAreas =
    riskFilter === 'all'
      ? topRiskAreas
      : topRiskAreas.filter((a) => a.riskLevel === riskFilter);

  // Số liệu báo cáo đưa vào file PDF/Excel khi gửi từ trang Chẩn đoán
  const diagnosisReportData = useMemo(() => {
    const lines = [];
    lines.push('Tổng quan chẩn đoán');
    lines.push(`Số khu vực giám sát: ${mapAreas.length}`);
    lines.push(`Cảnh báo nghiêm trọng: ${criticalCount} | Cảnh báo cần theo dõi: ${warningCount}`);
    if (topRiskAreas.length > 0) {
      const byRisk = topRiskAreas.reduce((acc, a) => {
        const r = a.riskLevel || 'Khác';
        acc[r] = (acc[r] || 0) + 1;
        return acc;
      }, {});
      lines.push('Phân bố rủi ro: ' + Object.entries(byRisk).map(([k, v]) => `${k}: ${v}`).join(' | '));
    }
    if (selectedArea) {
      const config = RISK_CONFIG[selectedArea.riskLevel] || RISK_CONFIG.Medium;
      const recs = RECOMMENDATIONS[selectedArea.riskLevel] || RECOMMENDATIONS.Medium;
      lines.push('');
      lines.push('Khu vực đang chọn');
      lines.push(`Khu vực: ${selectedArea.areaName} (${selectedArea.districtName})`);
      lines.push(`Mức rủi ro: ${config.label}`);
      lines.push(`Tốc độ sụt lún TB: ${selectedArea.avgSubsidenceRate} mm/năm`);
      if (selectedArea.cumulativeSubsidence != null) lines.push(`Sụt lún tích lũy: ${selectedArea.cumulativeSubsidence} mm`);
      lines.push('Khuyến nghị:');
      recs.forEach((r, i) => lines.push(`  ${i + 1}. ${r}`));
      if (alertsForSelected.length > 0) {
        lines.push('Cảnh báo liên quan:');
        alertsForSelected.slice(0, 5).forEach((a) => lines.push(`  - ${a.title} (${a.severity})`));
      }
    }
    if (rainfallData && rainfallData.length > 0) {
      lines.push('');
      lines.push(`Lượng mưa (${rainfallPastDays} ngày qua):`);
      rainfallData.forEach((r) => lines.push(`  ${r.districtName}: ${r.totalMm?.toFixed(1) ?? '-'} mm`));
    }
    return lines.join('\n');
  }, [mapAreas.length, criticalCount, warningCount, topRiskAreas, selectedArea, alertsForSelected, rainfallData, rainfallPastDays]);

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

  // Lấy lượng mưa từ Open-Meteo theo quận (past_days + hourly=precipitation)
  const handleLoadRainfall = async () => {
    setRainfallLoading(true);
    setRainfallData([]);
    try {
      const results = await Promise.all(
        DISTRICTS_RAINFALL.map(async (d) => {
          const url = `${OPEN_METEO_BASE}?latitude=${d.lat}&longitude=${d.lon}&past_days=${rainfallPastDays}&hourly=precipitation`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          const times = json.hourly?.time || [];
          const precip = json.hourly?.precipitation || [];
          const totalMm = precip.reduce((sum, v) => sum + (Number(v) || 0), 0);
          const avgPerDay = times.length > 0 ? totalMm / rainfallPastDays : 0;
          return {
            districtName: d.name,
            totalMm: Math.round(totalMm * 10) / 10,
            avgPerDayMm: Math.round(avgPerDay * 10) / 10,
            days: rainfallPastDays,
          };
        })
      );
      setRainfallData(results);
      message.success(`Đã tải lượng mưa ${rainfallPastDays} ngày qua cho ${results.length} quận.`);
    } catch (err) {
      console.error('Error fetching rainfall:', err);
      message.error('Không tải được dữ liệu mưa từ Open-Meteo. Vui lòng thử lại.');
      setRainfallData([]);
    } finally {
      setRainfallLoading(false);
    }
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
          <SendReportButton sourcePageName="Chẩn đoán" type="default" reportData={diagnosisReportData} />
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

      {/* Bản đồ */}
      <Card className="diagnosis-card diagnosis-map-card" bordered={false}>
        <div className="diagnosis-card-header">
          <EnvironmentOutlined className="diagnosis-card-icon" />
          <span>Bản đồ khu vực giám sát</span>
        </div>
        <div className="diagnosis-map-wrapper">
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
              <MonitoringMapLazy areas={mapAreas} height="420px" selectedPosition={selectedPosition} />
            </Suspense>
          )}
        </div>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Danh sách khu vực có nguy cơ + Chọn để chẩn đoán */}
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
                  description={topRiskAreas.length === 0 ? 'Chưa có dữ liệu khu vực' : 'Không có khu vực nào theo mức đã chọn'}
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
                      onClick={() => setSelectedArea(area)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedArea(area)}
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

        {/* Chi tiết chẩn đoán + Khuyến nghị */}
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

      {/* Thống kê lượng mưa trung bình theo quận (Open-Meteo) */}
      <Card className="diagnosis-card diagnosis-rainfall-card" bordered={false} style={{ marginTop: 24 }}>
        <div className="diagnosis-card-header">
          <CloudOutlined className="diagnosis-card-icon" />
          <span>Thống kê lượng mưa trung bình theo quận</span>
        </div>
        <Paragraph type="secondary" className="diagnosis-list-hint">
          Dữ liệu lượng mưa từ Open-Meteo theo tọa độ trung tâm từng quận. Chọn khoảng thời gian và bấm xem. Đơn vị: mm.
        </Paragraph>
        <div className="diagnosis-rainfall-actions">
          <Select
            value={rainfallPastDays}
            onChange={setRainfallPastDays}
            options={[
              { label: '7 ngày qua', value: 7 },
              { label: '14 ngày qua', value: 14 },
            ]}
            style={{ width: 160 }}
          />
          <Button
            type="primary"
            icon={<CloudOutlined />}
            loading={rainfallLoading}
            onClick={handleLoadRainfall}
          >
            Xem thống kê lượng mưa theo quận
          </Button>
        </div>
        {rainfallData.length > 0 && (
          <Table
            size="small"
            dataSource={rainfallData}
            rowKey="districtName"
            pagination={false}
            columns={[
              { title: 'Quận / Huyện', dataIndex: 'districtName', key: 'districtName', width: 140 },
              { title: 'Tổng lượng mưa (mm)', dataIndex: 'totalMm', key: 'totalMm', align: 'right', render: (v) => v.toFixed(1) },
              { title: 'Trung bình/ngày (mm)', dataIndex: 'avgPerDayMm', key: 'avgPerDayMm', align: 'right', render: (v) => v.toFixed(1) },
              { title: 'Khoảng thời gian', key: 'days', render: (_, r) => `${r.days} ngày qua` },
            ]}
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      {/* Phân bố mức rủi ro + xu hướng sụt lún (đặt dưới quy trình chẩn đoán) */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <RiskDistributionChart
            areas={topRiskAreas.length > 0 ? topRiskAreas : mapAreas}
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
    </div>
  );
};

export default DiagnosisPage;
