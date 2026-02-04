import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { AutoComplete, Input, Button, Card, Drawer, Space, Tag, Switch, Typography, Spin, Empty, Alert, Collapse, Badge } from 'antd';
import { SearchOutlined, EnvironmentOutlined, CloseOutlined, CheckCircleOutlined } from '@ant-design/icons';
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
  Filler,
} from 'chart.js';
import 'leaflet/dist/leaflet.css';
import { getAreaDetails } from '../../api/monitoring/areas';
import axios from 'axios';

// Đăng ký Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Fix cho default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const { Text, Title: AntTitle } = Typography;
const { Panel } = Collapse;

/** Component để flyTo vị trí */
function MapFlyTo({ selectedPosition, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (selectedPosition && selectedPosition.lat != null && selectedPosition.lng != null) {
      map.flyTo([selectedPosition.lat, selectedPosition.lng], zoom, { duration: 0.8 });
    }
  }, [selectedPosition, zoom, map]);
  return null;
}

/** Gom mưa theo ngày để vẽ biểu đồ */
function groupHourlyToDailyTotals(times = [], values = []) {
  const byDay = new Map();
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    const v = Number(values[i] ?? 0);
    const day = String(t).slice(0, 10); // YYYY-MM-DD
    byDay.set(day, (byDay.get(day) || 0) + (Number.isFinite(v) ? v : 0));
  }
  const days = Array.from(byDay.keys()).sort();
  return days.map((d) => ({ day: d, total: Number(byDay.get(d).toFixed(2)) }));
}

// Màu sắc theo risk level (function declaration để dùng trước khi khai báo trong JSX/options)
function getRiskColor(riskLevel) {
  switch (riskLevel) {
    case 'Critical': return '#ef4444';
    case 'High': return '#f59e0b';
    case 'Medium': return '#3b82f6';
    case 'Low': return '#10b981';
    default: return '#6b7280';
  }
}

const DeepAnalysisMap = ({ areas = [], height = '600px' }) => {
  const mapRef = useRef(null);
  const [searchValue, setSearchValue] = useState('');
  const [filteredAreas, setFilteredAreas] = useState(areas);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [areaDetails, setAreaDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [rainDaily, setRainDaily] = useState(null);
  const [rainError, setRainError] = useState(null);
  const [loadingRain, setLoadingRain] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  
  // Layer controls
  const [showHistorical, setShowHistorical] = useState(true);
  const [showAIPrediction, setShowAIPrediction] = useState(true);
  const [showTideRain, setShowTideRain] = useState(false);

  // Default center: TPHCM
  const defaultCenter = [10.7769, 106.7009];
  const defaultZoom = 11;

  // Tìm kiếm khu vực
  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredAreas(areas);
      return;
    }

    const searchLower = searchValue.toLowerCase();
    const filtered = areas.filter(
      (area) =>
        area.areaName?.toLowerCase().includes(searchLower) ||
        area.areaCode?.toLowerCase().includes(searchLower) ||
        area.districtName?.toLowerCase().includes(searchLower) ||
        area.wardName?.toLowerCase().includes(searchLower)
    );
    setFilteredAreas(filtered);
  }, [searchValue, areas]);

  const autoCompleteOptions = filteredAreas.slice(0, 20).map((area) => ({
    value: String(area.areaId),
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {area.areaName}
          </div>
          <div style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {area.areaCode} • {area.districtName}
            {area.wardName ? ` • ${area.wardName}` : ''}
          </div>
        </div>
        <Tag color={getRiskColor(area.riskLevel)} style={{ margin: 0, alignSelf: 'start' }}>
          {area.riskLevel}
        </Tag>
      </div>
    ),
  }));

  // Khi click vào khu vực
  const handleAreaClick = async (area) => {
    setSelectedArea(area);
    setSelectedPosition({ lat: area.latitude, lng: area.longitude });
    setDrawerVisible(true);
    setLoadingDetails(true);
    setAreaDetails(null);
    setAiPrediction(null);
    setAiError(null);
    setRainDaily(null);
    setRainError(null);

    try {
      const details = await getAreaDetails(area.areaId);
      setAreaDetails(details);
    } catch (error) {
      console.error('Error loading area details:', error);
    } finally {
      setLoadingDetails(false);
    }

    // Fetch AI dự đoán (nếu bật layer)
    if (showAIPrediction) {
      try {
        setLoadingAI(true);
        setAiError(null);
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
        const areaForAI = area?.districtName || area?.areaName || '';
        const res = await axios.post(
          `${baseUrl}/ai/predict`,
          { area: areaForAI },
          { timeout: 120000 }
        );
        setAiPrediction(res.data);
      } catch (err) {
        console.error('Error loading AI prediction:', err);
        setAiError(err?.response?.data?.message || 'Không thể tải AI dự đoán.');
      } finally {
        setLoadingAI(false);
      }
    }

    // Fetch mưa lịch sử (nếu bật layer Triều–mưa)
    if (showTideRain) {
      try {
        setLoadingRain(true);
        setRainError(null);
        const lat = area.latitude;
        const lng = area.longitude;
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}` +
          `&longitude=${encodeURIComponent(lng)}` +
          `&hourly=precipitation` +
          `&past_days=7&forecast_days=1&timezone=Asia%2FBangkok`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
        const data = await res.json();
        const times = data?.hourly?.time || [];
        const vals = data?.hourly?.precipitation || [];
        const daily = groupHourlyToDailyTotals(times, vals);
        setRainDaily(daily);
      } catch (err) {
        console.error('Error loading rain history:', err);
        setRainError('Không thể tải lịch sử mưa (Open-Meteo).');
      } finally {
        setLoadingRain(false);
      }
    }
  };

  // Định vị vị trí hiện tại
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          setSelectedPosition(location);
          setUserLocation(location);
          if (mapRef.current) {
            mapRef.current.flyTo([latitude, longitude], 15);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  // Khi toggle layer thay đổi và đã chọn khu vực, tự refresh dữ liệu AI / mưa
  useEffect(() => {
    if (!drawerVisible || !selectedArea) return;
    // chỉ refresh AI khi bật
    if (showAIPrediction && !loadingAI && aiPrediction == null && aiError == null) {
      handleAreaClick(selectedArea);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAIPrediction]);

  useEffect(() => {
    if (!drawerVisible || !selectedArea) return;
    if (showTideRain && !loadingRain && rainDaily == null && rainError == null) {
      handleAreaClick(selectedArea);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTideRain]);

  // Icon marker tùy chỉnh
  const createCustomIcon = (riskLevel) => {
    const color = getRiskColor(riskLevel);
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  // Chuẩn bị dữ liệu cho biểu đồ time series
  const prepareTimeSeriesData = () => {
    if (!areaDetails?.timeSeries || areaDetails.timeSeries.length === 0) {
      return null;
    }

    const sortedData = [...areaDetails.timeSeries].reverse();
    const labels = sortedData.map((item) => {
      const date = new Date(item.date);
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    });
    const values = sortedData.map((item) => item.subsidenceValue || item.subsidenceRate || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Giá trị sụt lún (mm)',
          data: values,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const timeSeriesData = prepareTimeSeriesData();
  const rainChartData =
    rainDaily && rainDaily.length > 0
      ? {
          labels: rainDaily.map((d) => {
            const dt = new Date(d.day);
            return dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
          }),
          datasets: [
            {
              label: 'Tổng mưa theo ngày (mm)',
              data: rainDaily.map((d) => d.total),
              borderColor: '#22c55e',
              backgroundColor: 'rgba(34, 197, 94, 0.12)',
              fill: true,
              tension: 0.35,
            },
          ],
        }
      : null;

  const TOOLBAR_HEIGHT = 52;

  return (
    <div style={{ height, width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Toolbar (nằm trên map, không che map) */}
      <div
        style={{
          height: TOOLBAR_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <AutoComplete
          options={autoCompleteOptions}
          onSearch={(text) => setSearchValue(text)}
          onSelect={(areaId) => {
            const area = areas.find((a) => String(a.areaId) === String(areaId));
            if (area) handleAreaClick(area);
          }}
          style={{ flex: 1, minWidth: 320, maxWidth: 560 }}
          filterOption={false}
          value={searchValue}
          onChange={setSearchValue}
        >
          <Input
            placeholder="Tìm kiếm khu vực (gõ tên/mã/quận/phường rồi chọn trong danh sách)..."
            prefix={<SearchOutlined />}
            allowClear
          />
        </AutoComplete>
        <Badge count={filteredAreas.length} overflowCount={9999} color="#3b82f6" title="Số khu vực khớp tìm kiếm" />
        <Button
          type="primary"
          icon={<EnvironmentOutlined />}
          onClick={handleLocateMe}
        >
          Định vị tôi
        </Button>
      </div>

      {/* Layer controls */}
      <Card
        style={{
          position: 'absolute',
          top: 60,
          right: 10,
          zIndex: 1000,
          width: 250,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
        title="Điều khiển Layer"
        size="small"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text>Dữ liệu lịch sử</Text>
            <Switch checked={showHistorical} onChange={setShowHistorical} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text>AI dự đoán</Text>
            <Switch checked={showAIPrediction} onChange={setShowAIPrediction} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text>Triều – mưa</Text>
            <Switch checked={showTideRain} onChange={setShowTideRain} />
          </div>
        </Space>
      </Card>

      {/* Map */}
      <div style={{ position: 'relative', flex: 1, width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          scrollWheelZoom={true}
        >
          <MapFlyTo selectedPosition={selectedPosition} zoom={14} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>Vị trí của bạn</Popup>
            </Marker>
          )}

          {filteredAreas.map((area) => (
            <div key={area.areaId}>
              <Marker
                position={[area.latitude, area.longitude]}
                icon={createCustomIcon(area.riskLevel)}
                eventHandlers={{
                  click: () => handleAreaClick(area),
                }}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
                      {area.areaName}
                    </h3>
                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                      <strong>Mã:</strong> {area.areaCode}
                    </p>
                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                      <strong>Quận:</strong> {area.districtName}
                    </p>
                    <p style={{ margin: '4px 0', fontSize: '14px' }}>
                      <strong>Mức độ rủi ro:</strong>{' '}
                      <span
                        style={{
                          color: getRiskColor(area.riskLevel),
                          fontWeight: '600',
                        }}
                      >
                        {area.riskLevel}
                      </span>
                    </p>
                    {area.avgSubsidenceRate && (
                      <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                        <strong>Tốc độ TB:</strong> {area.avgSubsidenceRate} mm/year
                      </p>
                    )}
                    <Button
                      type="link"
                      size="small"
                      onClick={() => handleAreaClick(area)}
                      style={{ padding: 0, marginTop: 8 }}
                    >
                      Xem chi tiết →
                    </Button>
                  </div>
                </Popup>
              </Marker>

              {/* Vòng tròn hiển thị vùng ảnh hưởng */}
              {showHistorical && (
                <Circle
                  center={[area.latitude, area.longitude]}
                  radius={500}
                  pathOptions={{
                    color: getRiskColor(area.riskLevel),
                    fillColor: getRiskColor(area.riskLevel),
                    fillOpacity: 0.1,
                    weight: 2,
                  }}
                />
              )}
            </div>
          ))}
        </MapContainer>
      </div>

      {/* Drawer hiển thị chi tiết khu vực */}
      <Drawer
        title={
          selectedArea ? (
            <div>
              <AntTitle level={4} style={{ margin: 0 }}>
                {selectedArea.areaName}
              </AntTitle>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {selectedArea.areaCode} • {selectedArea.districtName}
              </Text>
            </div>
          ) : (
            'Chi tiết khu vực'
          )
        }
        placement="right"
        onClose={() => {
          setDrawerVisible(false);
          setSelectedArea(null);
          setAreaDetails(null);
          setAiPrediction(null);
          setAiError(null);
          setRainDaily(null);
          setRainError(null);
        }}
        open={drawerVisible}
        width={600}
        extra={
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => {
              setDrawerVisible(false);
              setSelectedArea(null);
              setAreaDetails(null);
              setAiPrediction(null);
              setAiError(null);
              setRainDaily(null);
              setRainError(null);
            }}
          />
        }
      >
        {loadingDetails ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : areaDetails ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Mức độ rủi ro */}
            <Card size="small" title="Mức độ rủi ro">
              <Tag
                color={
                  areaDetails.area.riskLevel === 'Critical'
                    ? 'red'
                    : areaDetails.area.riskLevel === 'High'
                    ? 'orange'
                    : areaDetails.area.riskLevel === 'Medium'
                    ? 'blue'
                    : 'green'
                }
                style={{ fontSize: '16px', padding: '4px 12px' }}
              >
                {areaDetails.area.riskLevel}
              </Tag>
            </Card>

            {/* Độ tin cậy mô hình */}
            {areaDetails.analysis && (
              <Card size="small" title="Độ tin cậy mô hình">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Loại phân tích: </Text>
                    <Text>{areaDetails.analysis.analysisType}</Text>
                  </div>
                  {areaDetails.analysis.confidenceLevel !== null && (
                    <div>
                      <Text strong>Độ tin cậy: </Text>
                      <Tag color={areaDetails.analysis.confidenceLevel >= 80 ? 'green' : areaDetails.analysis.confidenceLevel >= 60 ? 'orange' : 'red'}>
                        {areaDetails.analysis.confidenceLevel.toFixed(1)}%
                      </Tag>
                    </div>
                  )}
                  {areaDetails.analysis.periodStart && areaDetails.analysis.periodEnd && (
                    <div>
                      <Text strong>Kỳ phân tích: </Text>
                      <Text>
                        {new Date(areaDetails.analysis.periodStart).toLocaleDateString('vi-VN')} -{' '}
                        {new Date(areaDetails.analysis.periodEnd).toLocaleDateString('vi-VN')}
                      </Text>
                    </div>
                  )}
                </Space>
              </Card>
            )}

            {/* Chuỗi thời gian */}
            {timeSeriesData ? (
              <Card size="small" title="Chuỗi thời gian">
                <Line
                  data={timeSeriesData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top',
                      },
                      tooltip: {
                        mode: 'index',
                        intersect: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: false,
                        title: {
                          display: true,
                          text: 'Giá trị (mm)',
                        },
                      },
                    },
                  }}
                  height={250}
                />
              </Card>
            ) : (
              <Card size="small" title="Chuỗi thời gian">
                <Empty description="Chưa có dữ liệu chuỗi thời gian" />
              </Card>
            )}

            {/* AI dự đoán */}
            {showAIPrediction && (
              <Card size="small" title="AI dự đoán">
                {loadingAI ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Spin />
                  </div>
                ) : aiError ? (
                  <Alert type="error" showIcon message={aiError} />
                ) : aiPrediction?.predictions ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>Khu vực AI: </Text>
                      <Text>{aiPrediction.area}</Text>
                    </div>
                    <div>
                      <Text strong>Mức rủi ro (1 năm): </Text>
                      <Tag color="blue">{aiPrediction.predictions.oneYear?.overallRisk || 'N/A'}</Tag>
                    </div>
                    <Text type="secondary">{aiPrediction.predictions.oneYear?.summary}</Text>
                    <Collapse size="small">
                      <Panel header="Xem chi tiết 1 năm tới" key="oneYear">
                        {(aiPrediction.predictions.oneYear?.disasters || []).map((d, idx) => (
                          <Card key={idx} size="small" style={{ marginBottom: 8 }}>
                            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                              <Text strong>{d.type}</Text>
                              <Text type="secondary">
                                Khả năng: {d.probability} • Mức độ: {d.severity}
                              </Text>
                              <Text>{d.description}</Text>
                              <Text type="secondary">
                                <strong>Ảnh hưởng:</strong> {d.affectedAreas}
                              </Text>
                              <Text type="secondary">
                                <strong>Phòng ngừa:</strong> {d.preventionMeasures}
                              </Text>
                            </Space>
                          </Card>
                        ))}
                      </Panel>
                      <Panel header="Xem tóm tắt 2 năm & 5 năm" key="more">
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div>
                            <Text strong>2 năm: </Text>
                            <Tag color="orange">{aiPrediction.predictions.twoYears?.overallRisk || 'N/A'}</Tag>
                            <div style={{ marginTop: 6 }}>
                              <Text type="secondary">{aiPrediction.predictions.twoYears?.summary}</Text>
                            </div>
                          </div>
                          <div>
                            <Text strong>5 năm: </Text>
                            <Tag color="red">{aiPrediction.predictions.fiveYears?.overallRisk || 'N/A'}</Tag>
                            <div style={{ marginTop: 6 }}>
                              <Text type="secondary">{aiPrediction.predictions.fiveYears?.summary}</Text>
                            </div>
                          </div>
                        </Space>
                      </Panel>
                    </Collapse>
                  </Space>
                ) : (
                  <Empty description="Chưa có dữ liệu AI dự đoán" />
                )}
              </Card>
            )}

            {/* Triều – mưa (hiện tại: mưa lịch sử; triều sẽ tích hợp nguồn riêng) */}
            {showTideRain && (
              <Card size="small" title="Triều – mưa (lịch sử)">
                {loadingRain ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Spin />
                  </div>
                ) : rainError ? (
                  <Alert type="error" showIcon message={rainError} />
                ) : rainChartData ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text type="secondary">
                      Mưa được lấy theo tọa độ khu vực (Open-Meteo), tổng theo ngày trong 7 ngày gần nhất.
                    </Text>
                    <Line
                      data={rainChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: true, position: 'top' } },
                        scales: { y: { title: { display: true, text: 'mm' } } },
                      }}
                      height={220}
                    />
                    <Alert
                      type="info"
                      showIcon
                      message="Dữ liệu TRIỀU hiện chưa được nối nguồn trong phiên bản này."
                      description="Nếu bạn có nguồn dữ liệu triều (API/CSV/DB), mình sẽ tích hợp vào cùng layer này."
                    />
                  </Space>
                ) : (
                  <Empty description="Chưa có dữ liệu mưa lịch sử" />
                )}
              </Card>
            )}

            {/* Thông tin bổ sung */}
            <Card size="small" title="Thông tin khu vực">
              <Space direction="vertical" style={{ width: '100%' }}>
                {areaDetails.area.wardName && (
                  <div>
                    <Text strong>Phường/Xã: </Text>
                    <Text>{areaDetails.area.wardName}</Text>
                  </div>
                )}
                {areaDetails.area.areaType && (
                  <div>
                    <Text strong>Loại khu vực: </Text>
                    <Text>{areaDetails.area.areaType}</Text>
                  </div>
                )}
                {areaDetails.area.elevation !== null && (
                  <div>
                    <Text strong>Độ cao: </Text>
                    <Text>{areaDetails.area.elevation.toFixed(2)} m</Text>
                  </div>
                )}
                {areaDetails.area.description && (
                  <div>
                    <Text strong>Mô tả: </Text>
                    <Text>{areaDetails.area.description}</Text>
                  </div>
                )}
              </Space>
            </Card>
          </Space>
        ) : (
          <Empty description="Không thể tải chi tiết khu vực" />
        )}
      </Drawer>
    </div>
  );
};

export default DeepAnalysisMap;

