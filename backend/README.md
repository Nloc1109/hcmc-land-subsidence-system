# Backend API - Hệ thống Quản lý Sụt lún Đất TPHCM

## Cài đặt

```bash
npm install
```

## Cấu hình

1. Copy file `.env.example` thành `.env`
2. Điền thông tin kết nối SQL Server vào file `.env`

## Chạy ứng dụng

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Database

### Kiểm tra kết nối
```bash
npm run test:db
```

### Không kết nối được Database
1. **SQL Server đang chạy** – Mở Services, kiểm tra dịch vụ "SQL Server (SQLEXPRESS)" hoặc instance của bạn đang Running.
2. **Dùng localhost** – Trong `.env` dùng `DB_HOST=localhost\SQLEXPRESS` (cùng máy) thay vì tên máy `DESKTOP-...`.
3. **Tìm port** – Nếu dùng named instance vẫn lỗi, chạy:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\find-sql-port.ps1
   ```
   Rồi trong `.env` set `DB_HOST=localhost` và `DB_PORT=<port tìm được>`.
4. **SQL Server Browser** – Với named instance, dịch vụ "SQL Server Browser" nên đang chạy.
5. **Tạo database** – Đảm bảo đã tạo database `HCMC_LandSubsidence` trong SQL Server (SSMS).
6. **Xác thực** – `.env` dùng SQL Authentication: `DB_USER=sa`, `DB_PASSWORD=...`; SQL Server phải bật chế độ "SQL Server and Windows Authentication".

### Chạy migrations
```bash
npm run migrate
```

### Rollback migrations
```bash
npm run migrate:undo
```

### Seed dữ liệu mẫu
```bash
npm run seed
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/register` - Đăng ký
- `GET /api/v1/auth/me` - Lấy thông tin user hiện tại

## Testing

```bash
npm test
```

