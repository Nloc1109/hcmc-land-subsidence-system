# 🚀 Hướng dẫn nhanh - Chạy Dashboard

## Cách 1: Chạy trực tiếp (Khuyến nghị)

Mở PowerShell và chạy:

```powershell
cd D:\hcmc-land-subsidence-system\frontend
npm run dev
```

Sau đó mở trình duyệt và truy cập:
- **http://localhost:5173** - Trang chủ
- **http://localhost:5173/dashboard** - Dashboard

## Cách 2: Sử dụng script helper

```powershell
.\scripts\setup\dev-frontend.ps1
```

## ⚠️ Nếu gặp lỗi npm

Chạy lệnh này trước:
```powershell
function npm { & "C:\Program Files\nodejs\npm.cmd" $args }
function node { & "C:\Program Files\nodejs\node.exe" $args }
```

Sau đó chạy: `npm run dev`

## 📝 Lưu ý

- Dashboard sẽ hiển thị **mock data** nếu backend chưa chạy
- Tất cả dữ liệu đều được tạo tự động để demo
- Có thể refresh dữ liệu bằng nút "Làm mới" trên dashboard

## 🎯 Các tính năng Dashboard

✅ Thống kê tổng quan (4 cards)
✅ Biểu đồ xu hướng sụt lún 30 ngày
✅ Bản đồ khu vực giám sát
✅ Bảng cảnh báo mới nhất
✅ Top khu vực có nguy cơ cao
✅ Bản ghi sụt lún mới nhất
✅ Biểu đồ phân bố theo quận
✅ Trạng thái thiết bị

