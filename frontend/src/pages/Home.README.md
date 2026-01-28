# Trang Home - Hệ Thống Quản Lý Sụt Lún Đất TPHCM

## Tổng quan

Trang Home đã được thiết kế lại với đầy đủ chức năng dựa trên database schema, bao gồm:

### Các tính năng chính:

1. **Hero Section** - Giới thiệu hệ thống với gradient sáng, badge động
2. **Thống kê tổng quan** - 4 thẻ thống kê chính:
   - Khu vực giám sát
   - Cảnh báo đang mở (có badge cảnh báo nghiêm trọng)
   - Thiết bị hoạt động
   - Trạm giám sát

3. **Bản đồ giám sát** - Hiển thị các khu vực giám sát trên bản đồ với:
   - Marker màu sắc theo mức độ rủi ro
   - Popup thông tin chi tiết
   - Vòng tròn hiển thị vùng ảnh hưởng

4. **Cảnh báo mới nhất** - Danh sách 5 cảnh báo mới nhất với:
   - Icon và màu sắc theo mức độ nghiêm trọng
   - Thời gian tương đối (ví dụ: "2 giờ trước")
   - Link đến trang chi tiết

5. **Biểu đồ xu hướng** - Biểu đồ line chart hiển thị:
   - Tốc độ sụt lún theo thời gian
   - Sụt lún tích lũy
   - Dual y-axis

6. **Trạng thái thiết bị** - Progress bars hiển thị:
   - Thiết bị hoạt động
   - Thiết bị không hoạt động
   - Thiết bị bảo trì
   - Thiết bị lỗi

7. **Thống kê theo quận/huyện** - Grid cards hiển thị:
   - Tên quận/huyện
   - Mức độ rủi ro (tag màu)
   - Số khu vực
   - Số cảnh báo
   - Tốc độ sụt lún trung bình

8. **Tính năng chính** - 3 feature cards với icon và mô tả

9. **CTA Section** - Call-to-action để đăng ký/đăng nhập

## Components mới được tạo:

### 1. `frontend/src/api/dashboard.js`
- API service để fetch dữ liệu dashboard
- Có mock data fallback khi API chưa sẵn sàng
- Các functions:
  - `getDashboardStats()` - Thống kê tổng quan
  - `getSubsidenceTrend(days)` - Dữ liệu xu hướng
  - `getDistrictStats()` - Thống kê theo quận
  - `getRecentAlerts(limit)` - Cảnh báo mới nhất
  - `getDeviceStatus()` - Trạng thái thiết bị

### 2. `frontend/src/components/maps/MonitoringMap.jsx`
- Component bản đồ sử dụng react-leaflet
- Hiển thị các khu vực giám sát với marker tùy chỉnh
- Màu sắc marker theo risk level
- Popup với thông tin chi tiết
- Vòng tròn hiển thị vùng ảnh hưởng

### 3. `frontend/src/components/charts/SubsidenceChart.jsx`
- Component biểu đồ sử dụng Chart.js
- Line chart với 2 datasets (tốc độ và tích lũy)
- Dual y-axis
- Responsive và tùy chỉnh theme

## Giao diện:

### Màu sắc chủ đạo:
- Primary: `#3b82f6` (Blue)
- Warning: `#f59e0b` (Amber)
- Success: `#10b981` (Green)
- Critical: `#ef4444` (Red)
- Info: `#8b5cf6` (Purple)

### Hiệu ứng:
- Gradient backgrounds
- Hover effects với transform và shadow
- Backdrop blur
- Animations (pulse, rotate)
- Smooth transitions

### Responsive:
- Mobile-first design
- Breakpoints: xs (24px), sm (576px), md (768px), lg (992px)
- Adaptive font sizes và spacing

## Dependencies sử dụng:

- `react` & `react-dom` - Core framework
- `react-router-dom` - Routing
- `antd` - UI components
- `axios` - HTTP client
- `leaflet` & `react-leaflet` - Maps
- `chart.js` & `react-chartjs-2` - Charts
- `dayjs` - Date manipulation

## Cách sử dụng:

1. Trang Home tự động load dữ liệu khi mount
2. Nếu API chưa sẵn sàng, sẽ sử dụng mock data
3. Tất cả các sections đều có link đến trang chi tiết tương ứng
4. Responsive trên mọi thiết bị

## Cần cấu hình:

1. Tạo file `.env` trong `frontend/` với:
   ```
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

2. Đảm bảo backend API có các endpoints:
   - `GET /api/v1/dashboard/stats`
   - `GET /api/v1/dashboard/subsidence-trend`
   - `GET /api/v1/dashboard/district-stats`
   - `GET /api/v1/alerts/recent`
   - `GET /api/v1/devices/status`

## Notes:

- Tất cả dữ liệu hiện tại là mock data
- Khi backend sẵn sàng, chỉ cần cập nhật API endpoints
- Component được thiết kế để dễ dàng mở rộng
- CSS sử dụng CSS Modules pattern với class names rõ ràng

