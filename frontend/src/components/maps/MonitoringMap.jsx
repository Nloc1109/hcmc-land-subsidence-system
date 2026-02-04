import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix cho default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/** Khi có selectedPosition thì flyTo vị trí đó (dùng trong MapContainer) */
function MapFlyTo({ selectedPosition, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (selectedPosition && selectedPosition.lat != null && selectedPosition.lng != null) {
      map.flyTo([selectedPosition.lat, selectedPosition.lng], zoom, { duration: 0.8 });
    }
  }, [selectedPosition, zoom, map]);
  return null;
}

const MonitoringMap = ({ areas = [], height = '400px', selectedPosition = null }) => {
  const mapRef = useRef(null);

  // Default center: TPHCM
  const defaultCenter = [10.7769, 106.7009];
  const defaultZoom = 11;

  // Tính toán bounds để fit tất cả markers (chỉ khi chưa có selectedPosition)
  useEffect(() => {
    if (mapRef.current && areas.length > 0 && !selectedPosition) {
      const bounds = L.latLngBounds(
        areas.map(area => [area.latitude, area.longitude])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [areas, selectedPosition]);

  // Màu sắc theo risk level
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f59e0b';
      case 'Medium': return '#3b82f6';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

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

  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
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
        
        {areas.map((area) => (
          <div key={area.areaId}>
            <Marker
              position={[area.latitude, area.longitude]}
              icon={createCustomIcon(area.riskLevel)}
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
                    <span style={{ 
                      color: getRiskColor(area.riskLevel),
                      fontWeight: '600'
                    }}>
                      {area.riskLevel}
                    </span>
                  </p>
                  {area.avgSubsidenceRate && (
                    <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                      <strong>Tốc độ TB:</strong> {area.avgSubsidenceRate} mm/year
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
            
            {/* Vòng tròn hiển thị vùng ảnh hưởng */}
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
          </div>
        ))}
      </MapContainer>
    </div>
  );
};

export default MonitoringMap;

