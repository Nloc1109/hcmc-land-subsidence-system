# Hướng dẫn chạy Dashboard

## Bước 1: Kiểm tra Node.js và npm

Đảm bảo Node.js đã được cài đặt:
```powershell
node --version
npm --version
```

Nếu chưa có, cài đặt Node.js từ: https://nodejs.org

## Bước 2: Cài đặt dependencies (nếu chưa cài)

```powershell
cd frontend
npm install
```

## Bước 3: Tạo file .env (tùy chọn)

Tạo file `.env` trong thư mục `frontend/` với nội dung:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

Hoặc sử dụng file `.env.example` có sẵn.

## Bước 4: Chạy Frontend Development Server

```powershell
cd frontend
npm run dev
```

Server sẽ chạy tại: **http://localhost:5173**

## Bước 5: Truy cập Dashboard

1. Mở trình duyệt và truy cập: **http://localhost:5173**
2. Click vào menu **"Dashboard"** ở header
3. Hoặc truy cập trực tiếp: **http://localhost:5173/dashboard**

## Lưu ý

- **Backend chưa chạy?** Không sao! Dashboard sẽ sử dụng mock data để hiển thị
- **Port 5173 bị chiếm?** Vite sẽ tự động tìm port khác (5174, 5175, ...)
- **Lỗi npm?** Xem lại phần fix npm trong `scripts/setup/README.md`

## Các trang có sẵn

- `/` - Trang chủ
- `/dashboard` - Dashboard giám sát
- `/login` - Đăng nhập
- `/register` - Đăng ký

## Troubleshooting

### Lỗi: "npm is not recognized"
- Restart PowerShell hoặc chạy: `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`

### Lỗi: "Port already in use"
- Đóng ứng dụng đang dùng port 5173
- Hoặc thay đổi port trong `vite.config.js`

### Lỗi: "Cannot find module"
- Chạy lại: `npm install` trong thư mục `frontend`

