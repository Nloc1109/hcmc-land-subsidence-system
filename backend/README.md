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

