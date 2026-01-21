# Thiết Kế Database - Hệ Thống Quản Lý Sụt Lún Đất TPHCM

## 📋 Tổng Quan

Database được thiết kế cho hệ thống quản lý và giám sát quá trình sụt lún đất tại Thành phố Hồ Chí Minh, sử dụng **Microsoft SQL Server**.

## 🗂️ Cấu Trúc Database

### 1. Quản Lý Người Dùng và Phân Quyền

#### **Roles** - Vai trò người dùng
- Quản lý các vai trò trong hệ thống (Admin, Manager, Analyst, Operator, Viewer)
- Mỗi vai trò có quyền hạn khác nhau

#### **Users** - Người dùng
- Thông tin đăng nhập, xác thực
- Liên kết với vai trò
- Theo dõi hoạt động đăng nhập

#### **RefreshTokens** - Token làm mới
- Quản lý JWT refresh tokens
- Hỗ trợ xác thực an toàn

### 2. Quản Lý Địa Lý

#### **Districts** - Quận/Huyện
- Danh sách 24 quận/huyện tại TPHCM
- Thông tin diện tích, dân số

#### **Wards** - Phường/Xã
- Danh sách phường/xã thuộc các quận
- Liên kết với quận

#### **MonitoringAreas** - Khu Vực Giám Sát
- Định nghĩa các khu vực cần giám sát
- Tọa độ GPS (Latitude, Longitude)
- Phân loại mức độ rủi ro (Low, Medium, High, Critical)
- Phân loại loại khu vực (Urban, Industrial, Residential, Agricultural)

### 3. Quản Lý Thiết Bị

#### **DeviceTypes** - Loại Thiết Bị
- GPS Receiver, Inclinometer, Piezometer, Strain Gauge, Leveling Equipment

#### **Manufacturers** - Nhà Sản Xuất
- Thông tin nhà sản xuất thiết bị

#### **Devices** - Thiết Bị Cảm Biến
- Thông tin chi tiết từng thiết bị
- Trạng thái: Active, Inactive, Maintenance, Faulty
- Mức pin, cường độ tín hiệu
- Lịch hiệu chuẩn

#### **MonitoringStations** - Trạm Giám Sát
- Các trạm giám sát tự động/thủ công
- Liên kết với khu vực giám sát

#### **StationDevices** - Liên Kết Thiết Bị-Trạm
- Quan hệ nhiều-nhiều giữa trạm và thiết bị
- Theo dõi lịch sử lắp đặt/gỡ bỏ

### 4. Dữ Liệu Đo Lường

#### **Measurements** - Dữ Liệu Đo Lường
- Dữ liệu thô từ các thiết bị cảm biến
- Thời gian đo, giá trị, đơn vị
- Chất lượng dữ liệu (Good, Fair, Poor, Invalid)
- Điều kiện môi trường (nhiệt độ, độ ẩm, áp suất)

#### **SubsidenceRecords** - Bản Ghi Sụt Lún
- Dữ liệu sụt lún đã xử lý
- Giá trị sụt lún, sụt lún tích lũy, tốc độ sụt lún
- Phương pháp đo: GPS, InSAR, Leveling, Sensor
- Xác minh bởi người dùng

#### **SubsidenceHistory** - Lịch Sử Sụt Lún
- Tổng hợp dữ liệu theo chu kỳ
- Xu hướng: Increasing, Decreasing, Stable, Fluctuating

### 5. Cảnh Báo và Thông Báo

#### **AlertThresholds** - Ngưỡng Cảnh Báo
- Cấu hình ngưỡng cảnh báo cho từng khu vực
- Ngưỡng cảnh báo (Warning) và ngưỡng nghiêm trọng (Critical)
- Các loại: SubsidenceRate, CumulativeSubsidence, MeasurementValue

#### **Alerts** - Cảnh Báo
- Tự động tạo khi vượt ngưỡng
- Mức độ: Info, Warning, Critical, Emergency
- Trạng thái: Open, Acknowledged, Resolved, Closed
- Theo dõi người xử lý và giải quyết

#### **Notifications** - Thông Báo
- Thông báo cho người dùng
- Đánh dấu đã đọc/chưa đọc

### 6. Báo Cáo và Phân Tích

#### **Reports** - Báo Cáo
- Báo cáo định kỳ (Daily, Weekly, Monthly, Annual)
- Trạng thái: Draft, Pending, Approved, Published
- Lưu trữ dữ liệu báo cáo (JSON/XML)
- Đường dẫn file PDF/Excel

#### **DataAnalysis** - Phân Tích Dữ Liệu
- Kết quả phân tích: Trend, Correlation, Prediction, Anomaly
- Mức độ tin cậy (0-100%)

### 7. Bảo Trì và Lịch Sử

#### **MaintenanceSchedules** - Lịch Bảo Trì
- Lịch bảo trì thiết bị
- Loại: Preventive, Corrective, Calibration
- Chi phí, người thực hiện

#### **AuditLogs** - Nhật Ký Hoạt Động
- Ghi lại mọi thao tác trong hệ thống
- Hỗ trợ truy vết và bảo mật

## 🔒 Ràng Buộc và Validation

### Ràng Buộc Dữ Liệu

1. **Email Validation**: Kiểm tra định dạng email hợp lệ
2. **Phone Number**: Độ dài tối thiểu 10 ký tự
3. **Coordinates**: 
   - Latitude: -90 đến 90
   - Longitude: -180 đến 180
4. **Battery/Signal**: 0-100%
5. **Risk Level**: Chỉ cho phép Low, Medium, High, Critical
6. **Status Fields**: Chỉ cho phép các giá trị định nghĩa sẵn
7. **Dates**: Ngày đo không được vượt quá hiện tại

### Foreign Key Constraints

- Đảm bảo tính toàn vẹn dữ liệu
- CASCADE DELETE cho RefreshTokens và Notifications
- RESTRICT DELETE cho các bảng quan trọng

## 📊 Indexes

### Indexes Hiệu Suất

1. **Users**: Email, RoleId, IsActive
2. **MonitoringAreas**: DistrictId, WardId, RiskLevel, Location (Latitude, Longitude)
3. **Devices**: AreaId, DeviceTypeId, Status
4. **Measurements**: DeviceId, StationId, MeasurementTime (Composite index)
5. **SubsidenceRecords**: AreaId, StationId, RecordDate (Composite index)
6. **Alerts**: AreaId, Status, Severity, AlertTime (Composite index)
7. **Notifications**: UserId, IsRead, CreatedAt
8. **AuditLogs**: UserId, EntityType, CreatedAt

## ⚡ Triggers

### 1. Auto Update Timestamps
- Tự động cập nhật `UpdatedAt` khi có thay đổi dữ liệu
- Áp dụng cho: Users, MonitoringAreas, SubsidenceRecords

### 2. Auto Alert Generation
- Tự động tạo cảnh báo khi:
  - Tốc độ sụt lún vượt ngưỡng cảnh báo
  - Tốc độ sụt lún vượt ngưỡng nghiêm trọng
- Trigger trên bảng `SubsidenceRecords`

## 👁️ Views

### 1. vw_SubsidenceSummary
- Tổng hợp dữ liệu sụt lún theo khu vực
- Thống kê: Tổng số bản ghi, ngày ghi cuối, tốc độ trung bình/tối đa

### 2. vw_ActiveAlerts
- Danh sách cảnh báo đang mở
- Kèm thông tin khu vực và người xử lý

### 3. vw_DeviceStatus
- Trạng thái thiết bị
- Tình trạng hiệu chuẩn (Overdue, Due Soon, OK)

## 🛠️ Stored Procedures

### 1. sp_GetSubsidenceData
- Lấy dữ liệu sụt lún theo khu vực và khoảng thời gian
- Parameters: @AreaId, @StartDate, @EndDate

### 2. sp_CalculateSubsidenceStats
- Tính toán thống kê sụt lún
- Trả về: Trung bình, Min, Max, Độ lệch chuẩn

## ⚠️ Các Vấn Đề Cần Lưu Ý

### 1. Vấn Đề Dữ Liệu

#### **Dữ Liệu Thiếu (Missing Data)**
- **Vấn đề**: Thiết bị có thể bị lỗi, mất kết nối
- **Giải pháp**: 
  - Đánh dấu `DataQuality` = 'Poor' hoặc 'Invalid'
  - Cảnh báo khi thiết bị không gửi dữ liệu trong thời gian dài
  - Lưu trữ `RawData` để phân tích sau

#### **Dữ Liệu Bất Thường (Anomalies)**
- **Vấn đề**: Giá trị đo bất thường do nhiễu, lỗi thiết bị
- **Giải pháp**:
  - Validation rules trong application layer
  - Sử dụng `DataQuality` rating
  - Xem xét các giá trị ngoại lai trong phân tích

#### **Đồng Bộ Thời Gian (Time Synchronization)**
- **Vấn đề**: Thiết bị có thể có thời gian không đồng bộ
- **Giải pháp**:
  - Sử dụng NTP (Network Time Protocol)
  - Ghi nhận timestamp từ server khi nhận dữ liệu
  - So sánh với timestamp từ thiết bị

### 2. Vấn Đề Hiệu Suất

#### **Volume Dữ Liệu Lớn**
- **Vấn đề**: Dữ liệu đo có thể được gửi mỗi phút/giờ
- **Giải pháp**:
  - Partitioning bảng `Measurements` theo tháng/năm
  - Archive dữ liệu cũ (> 2 năm)
  - Indexes tối ưu cho queries thường dùng

#### **Query Performance**
- **Vấn đề**: Queries phức tạp trên dữ liệu lớn
- **Giải pháp**:
  - Sử dụng composite indexes
  - Materialized views cho báo cáo
  - Caching kết quả queries thường dùng

### 3. Vấn Đề Bảo Mật

#### **Bảo Mật Dữ Liệu**
- **Vấn đề**: Dữ liệu nhạy cảm về địa lý và môi trường
- **Giải pháp**:
  - Mã hóa dữ liệu nhạy cảm
  - Role-based access control
  - Audit logs cho mọi thao tác

#### **SQL Injection**
- **Vấn đề**: Tấn công SQL injection
- **Giải pháp**:
  - Sử dụng parameterized queries
  - Stored procedures với input validation
  - ORM (Sequelize) với prepared statements

### 4. Vấn Đề Nghiệp Vụ

#### **Xác Minh Dữ Liệu (Data Verification)**
- **Vấn đề**: Cần xác minh tính chính xác của dữ liệu
- **Giải pháp**:
  - Trường `IsVerified` và `VerifiedBy`
  - Workflow phê duyệt dữ liệu
  - So sánh với nhiều nguồn dữ liệu

#### **Ngưỡng Cảnh Báo Động**
- **Vấn đề**: Ngưỡng cảnh báo có thể thay đổi theo thời gian
- **Giải pháp**:
  - Bảng `AlertThresholds` cho phép cấu hình linh hoạt
  - Lịch sử thay đổi ngưỡng
  - Cảnh báo khi ngưỡng được thay đổi

#### **Tính Toán Sụt Lún Tích Lũy**
- **Vấn đề**: Cần tính toán chính xác sụt lún tích lũy
- **Giải pháp**:
  - Lưu trữ `CumulativeSubsidence` trong mỗi bản ghi
  - Trigger hoặc stored procedure để tự động tính toán
  - Xác định điểm tham chiếu (baseline)

### 5. Vấn Đề Kỹ Thuật

#### **Backup và Recovery**
- **Vấn đề**: Mất dữ liệu do lỗi hệ thống
- **Giải pháp**:
  - Backup định kỳ (hàng ngày)
  - Point-in-time recovery
  - Replication cho high availability

#### **Scalability**
- **Vấn đề**: Hệ thống cần mở rộng khi số lượng thiết bị tăng
- **Giải pháp**:
  - Horizontal scaling với read replicas
  - Sharding theo khu vực địa lý
  - Microservices architecture

#### **Data Retention**
- **Vấn đề**: Dữ liệu tích lũy theo thời gian
- **Giải pháp**:
  - Chính sách lưu trữ dữ liệu (retention policy)
  - Archive dữ liệu cũ vào cold storage
  - Compression cho dữ liệu lịch sử

## 📈 Khuyến Nghị

### 1. Monitoring và Alerting
- Giám sát hiệu suất database
- Cảnh báo khi query chậm
- Theo dõi dung lượng database

### 2. Regular Maintenance
- Rebuild indexes định kỳ
- Update statistics
- Cleanup dữ liệu không cần thiết

### 3. Testing
- Unit tests cho stored procedures
- Integration tests cho triggers
- Performance tests với dữ liệu lớn

### 4. Documentation
- Cập nhật tài liệu khi có thay đổi schema
- Ghi chú business rules
- Data dictionary

## 🔄 Migration Strategy

### Phase 1: Core Tables
1. Roles, Users
2. Districts, Wards, MonitoringAreas
3. DeviceTypes, Manufacturers, Devices

### Phase 2: Data Collection
1. MonitoringStations, StationDevices
2. Measurements, SubsidenceRecords

### Phase 3: Intelligence
1. AlertThresholds, Alerts
2. Reports, DataAnalysis

### Phase 4: Maintenance
1. MaintenanceSchedules
2. AuditLogs

## 📝 Notes

- Tất cả timestamps sử dụng `DATETIME2` để hỗ trợ timezone
- Sử dụng `NVARCHAR` cho tiếng Việt (Unicode)
- Decimal precision được chọn phù hợp với yêu cầu đo lường
- Tất cả bảng có `IsActive` flag để soft delete
- Audit trail được ghi lại trong `AuditLogs`
