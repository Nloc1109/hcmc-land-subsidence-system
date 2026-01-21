# Frontend - Hệ thống Quản lý Sụt lún Đất TPHCM

## Cài đặt

```bash
npm install
```

## Cấu hình

1. Copy file `.env.example` thành `.env`
2. Điều chỉnh các biến môi trường nếu cần

## Chạy ứng dụng

### Development
```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

### Build Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Cấu trúc thư mục

- `src/api/` - API client
- `src/components/` - Components tái sử dụng
- `src/features/` - Feature modules
- `src/pages/` - Page components
- `src/routes/` - Route configuration
- `src/store/` - State management (Zustand)
- `src/utils/` - Utility functions

