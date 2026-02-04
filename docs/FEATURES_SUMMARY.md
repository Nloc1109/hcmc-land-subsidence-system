# 📋 Tổng Kết Chức Năng Hệ Thống
## Hệ Thống Quản Lý Sụt Lún Đất TPHCM

---

## 🔐 1. XÁC THỰC VÀ PHÂN QUYỀN

### 1.1 Đăng nhập (Login)
- **Route**: `/login`
- **Chức năng**: 
  - Đăng nhập bằng username/password
  - JWT authentication
  - Lưu token vào localStorage
  - Redirect về trang chủ sau khi đăng nhập

### 1.2 Đăng ký (Register)
- **Route**: `/register`
- **Chức năng**:
  - Đăng ký tài khoản mới
  - Chọn role (trừ Admin)
  - Validation form
  - Hash password bằng bcryptjs

### 1.3 Phân quyền theo Role
- **5 Roles**: Admin, Manager, Analyst, Operator, Viewer
- **Protected Routes**: Tất cả route sau `/` đều yêu cầu đăng nhập
- **Role-based Menu**: Menu hiển thị khác nhau theo role

---

## 🏠 2. TRANG CHỦ (Dashboard)

### 2.1 Dashboard Overview
- **Route**: `/` (index)
- **Chức năng**:
  - Thống kê tổng quan:
    - Tổng số khu vực giám sát
    - Tổng số trạm giám sát
    - Số lượng thiết bị (Active, Inactive, Maintenance, Faulty)
    - Số cảnh báo (Active, Critical, Warning)
    - Tổng số bản ghi và measurements
  - Biểu đồ xu hướng sụt lún (30 ngày)
  - Thống kê theo quận/huyện
  - Top khu vực có nguy cơ cao
  - Danh sách cảnh báo mới nhất

---

## 📊 3. BÁO CÁO (Reports)

### 3.1 Trang Báo Cáo
- **Route**: `/reports`
- **Chức năng**:
  - Xem danh sách báo cáo
  - Lọc theo loại báo cáo (Daily, Weekly, Monthly, Annual)
  - Lọc theo trạng thái (Draft, Pending, Approved, Published)
  - Xem chi tiết báo cáo
  - Download báo cáo (PDF/Excel)

---

## 📰 4. TIN TỨC (News)

### 4.1 Trang Tin Tức
- **Route**: `/news`
- **Chức năng**:
  - Xem danh sách tin tức về sụt lún đất
  - Tin tức được AI tóm tắt từ OpenAI
  - Lọc theo khu vực (TPHCM, Việt Nam)
  - Hiển thị: tiêu đề, nguồn, ngày đăng, tóm tắt, tags
  - Cache tin tức để tối ưu performance

---

## 🔍 5. CHUẨN ĐOÁN (Diagnosis)

### 5.1 Trang Chuẩn Đoán
- **Route**: `/diagnosis`
- **Chức năng**:
  - Phân tích và chuẩn đoán tình trạng sụt lún
  - Xem top khu vực có nguy cơ cao
  - Thống kê theo quận/huyện
  - Biểu đồ phân bố rủi ro
  - Danh sách cảnh báo

---

## 🤖 6. AI DỰ ĐOÁN THIÊN TAI

### 6.1 Trang AI Dự Đoán
- **Route**: `/ai-prediction`
- **Chức năng**:
  - Chọn khu vực (quận/huyện TPHCM)
  - AI phân tích và dự đoán thiên tai:
    - **1 năm tới**: Rủi ro tổng thể, danh sách thiên tai, khả năng xảy ra, mức độ nghiêm trọng
    - **2 năm tới**: Tương tự
    - **5 năm tới**: Tương tự
  - Hiển thị khuyến nghị phòng ngừa
  - Timeline dự đoán theo thời gian
  - Sử dụng OpenAI API để phân tích

---

## 🗺️ 7. PHÂN TÍCH CHUYÊN SÂU (Dành cho Analyst)

### 7.1 Bản Đồ Phân Tích Chuyên Sâu
- **Route**: `/analysis`
- **Chỉ dành cho**: Role **Analyst**
- **Chức năng chính**:

#### 7.1.1 Tìm Kiếm Khu Vực
- **AutoComplete Search Bar**:
  - Tìm kiếm theo: tên khu vực, mã khu vực, quận, phường
  - Hiển thị danh sách gợi ý khi gõ
  - Click vào kết quả → bay tới vị trí trên map + mở chi tiết
  - Badge hiển thị số lượng kết quả

#### 7.1.2 Định Vị Vị Trí Hiện Tại
- **Nút "Định vị tôi"**:
  - Sử dụng Geolocation API
  - Tự động bay tới vị trí hiện tại
  - Hiển thị marker "Vị trí của bạn"

#### 7.1.3 Điều Khiển Layer
- **3 Layer có thể bật/tắt**:
  - ✅ **Dữ liệu lịch sử**: Hiển thị vòng tròn ảnh hưởng, marker theo risk level
  - ✅ **AI dự đoán**: Hiển thị dự đoán AI khi click khu vực
  - ✅ **Triều – mưa**: Hiển thị biểu đồ mưa lịch sử (7 ngày gần nhất)

#### 7.1.4 Click Khu Vực → Xem Chi Tiết
Khi click vào một khu vực trên bản đồ, Drawer bên phải hiển thị:

1. **Mức độ rủi ro**:
   - Tag màu theo risk level (Low, Medium, High, Critical)
   - Thông tin chi tiết khu vực

2. **Độ tin cậy mô hình**:
   - Loại phân tích (Trend, Correlation, Prediction, Anomaly)
   - Độ tin cậy (%)
   - Kỳ phân tích (từ ngày - đến ngày)

3. **Chuỗi thời gian (Time Series)**:
   - Biểu đồ Line Chart hiển thị giá trị sụt lún theo thời gian
   - Dữ liệu 12 tháng gần nhất
   - Hiển thị xu hướng tăng/giảm

4. **AI Dự Đoán** (nếu bật layer):
   - Dự đoán 1, 2, 5 năm tới
   - Rủi ro tổng thể
   - Danh sách thiên tai có thể xảy ra
   - Khuyến nghị

5. **Triều – Mưa** (nếu bật layer):
   - Biểu đồ mưa 7 ngày gần nhất
   - Dữ liệu từ Open-Meteo API
   - Tọa độ theo khu vực

6. **Thông tin bổ sung**:
   - Phường/Xã
   - Loại khu vực (Urban, Industrial, Residential, Agricultural)
   - Độ cao
   - Mô tả

---

## 👥 8. QUẢN TRỊ (Admin Only)

### 8.1 Quản Lý Người Dùng
- **Route**: `/admin/users`
- **Chỉ dành cho**: Role **Admin**
- **Chức năng**:
  - Xem danh sách người dùng (phân trang)
  - Tìm kiếm người dùng
  - Thêm người dùng mới
  - Sửa thông tin người dùng
  - Xóa/vô hiệu hóa người dùng
  - Reset password
  - Phân quyền role

### 8.2 Log Đăng Nhập
- **Route**: `/admin/login-logs`
- **Chỉ dành cho**: Role **Admin**
- **Chức năng**:
  - Xem lịch sử đăng nhập
  - Lọc theo người dùng, thời gian, action type
  - Thống kê đăng nhập
  - Export log

---

## 🗄️ 9. BACKEND API

### 9.1 Authentication API
- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/register` - Đăng ký
- `GET /api/v1/auth/roles` - Lấy danh sách roles
- `GET /api/v1/auth/me` - Lấy thông tin user hiện tại

### 9.2 Dashboard API
- `GET /api/v1/dashboard/stats` - Thống kê tổng quan
- `GET /api/v1/dashboard/subsidence-trend` - Xu hướng sụt lún
- `GET /api/v1/dashboard/district-stats` - Thống kê theo quận

### 9.3 Monitoring Areas API
- `GET /api/v1/monitoring-areas` - Lấy danh sách khu vực giám sát
- `GET /api/v1/monitoring-areas/:areaId` - Lấy chi tiết khu vực (bao gồm time series, analysis)

### 9.4 Areas API
- `GET /api/v1/areas/top-risk` - Top khu vực có nguy cơ cao

### 9.5 Alerts API
- `GET /api/v1/alerts/recent` - Cảnh báo mới nhất

### 9.6 Devices API
- `GET /api/v1/devices/status` - Trạng thái thiết bị

### 9.7 Users API (Admin)
- `GET /api/v1/users` - Danh sách users
- `POST /api/v1/users` - Tạo user mới
- `PUT /api/v1/users/:id` - Sửa user
- `DELETE /api/v1/users/:id` - Xóa user
- `POST /api/v1/users/:id/reset-password` - Reset password

### 9.8 Audit Logs API (Admin)
- `GET /api/v1/audit-logs/login` - Log đăng nhập
- `GET /api/v1/audit-logs/statistics` - Thống kê log

### 9.9 AI & News API
- `POST /api/ai/predict` - AI dự đoán thiên tai
- `GET /api/news/subsidence` - Tin tức về sụt lún

---

## 📊 10. DATABASE

### 10.1 Các Bảng Chính
- **Users & Roles**: Quản lý người dùng và phân quyền
- **Districts & Wards**: Quản lý địa lý
- **MonitoringAreas**: Khu vực giám sát
- **Devices & MonitoringStations**: Thiết bị và trạm giám sát
- **SubsidenceRecords**: Bản ghi sụt lún (chuỗi thời gian)
- **DataAnalysis**: Phân tích AI với confidence level
- **Alerts & AlertThresholds**: Cảnh báo
- **Reports**: Báo cáo
- **AuditLogs**: Log hoạt động

### 10.2 Scripts Seeder
- `npm run seed:analysis` - Tạo dữ liệu mẫu cơ bản (~30 khu vực)
- `npm run seed:many` - Tạo nhiều dữ liệu mẫu (~100+ khu vực)
- `npm run seed:many:clear` - Xóa dữ liệu cũ và tạo mới

---

## 🎨 11. UI/UX FEATURES

### 11.1 Components
- **AnimatedBackground**: Background động
- **CookieConsent**: Thông báo cookie
- **Charts**: 
  - SubsidenceChart (Line chart)
  - DistrictChart (Bar chart)
  - RiskDistributionChart (Pie chart)
  - AlertLevelChart
- **Maps**:
  - MonitoringMap (bản đồ cơ bản)
  - DeepAnalysisMap (bản đồ phân tích chuyên sâu)

### 11.2 Layout
- **MainLayout**: Layout chính với sidebar menu
- **Responsive**: Tự động collapse sidebar trên mobile
- **Header**: Hiển thị user info và logout

---

## 🔒 12. BẢO MẬT

### 12.1 Authentication
- JWT tokens
- Password hashing (bcryptjs)
- Refresh tokens
- Protected routes

### 12.2 Security Headers
- Helmet.js
- CORS configuration
- Input validation (express-validator)

---

## 📈 13. THỐNG KÊ TỔNG QUAN

### Tổng số chức năng: **13 nhóm chính**

1. ✅ Xác thực và Phân quyền (3 chức năng)
2. ✅ Dashboard/Trang chủ (1 chức năng)
3. ✅ Báo cáo (1 chức năng)
4. ✅ Tin tức (1 chức năng)
5. ✅ Chuẩn đoán (1 chức năng)
6. ✅ AI Dự đoán thiên tai (1 chức năng)
7. ✅ Phân tích chuyên sâu (1 chức năng - Analyst only)
8. ✅ Quản trị (2 chức năng - Admin only)
9. ✅ Backend API (9 nhóm API)
10. ✅ Database (10+ bảng)
11. ✅ UI/UX Components
12. ✅ Bảo mật
13. ✅ Scripts Seeder

### Tổng số Routes: **10 routes chính**
- `/` - Trang chủ
- `/login` - Đăng nhập
- `/register` - Đăng ký
- `/reports` - Báo cáo
- `/news` - Tin tức
- `/diagnosis` - Chuẩn đoán
- `/ai-prediction` - AI dự đoán
- `/analysis` - Phân tích chuyên sâu (Analyst)
- `/admin/users` - Quản lý users (Admin)
- `/admin/login-logs` - Log đăng nhập (Admin)

---

## 🎯 14. PHÂN QUYỀN CHI TIẾT

| Role | Trang chủ | Báo cáo | Tin tức | Chuẩn đoán | AI dự đoán | Phân tích chuyên sâu | Quản trị |
|------|-----------|---------|---------|------------|------------|---------------------|----------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Analyst** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Manager** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Operator** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Viewer** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 🚀 15. CÁCH SỬ DỤNG

### 15.1 Chạy Backend
```bash
cd backend
npm install
npm run dev
```

### 15.2 Chạy Frontend
```bash
cd frontend
npm install
npm run dev
```

### 15.3 Tạo Dữ Liệu Mẫu
```bash
cd backend
npm run seed:many
```

### 15.4 Đăng Nhập
- **Admin**: `admin` / `password123`
- **Analyst**: `analyst01` / `password123`
- **Manager**: `manager01` / `password123`

---

**📝 Lưu ý**: Tài liệu này được cập nhật lần cuối vào thời điểm hiện tại. Một số chức năng có thể được bổ sung hoặc cải thiện trong tương lai.

