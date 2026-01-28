# Scripts Setup

Các script hỗ trợ cài đặt và chạy dự án.

## Vấn đề npm không được nhận diện

Sau khi cài đặt Node.js, PowerShell cần được refresh để nhận biến môi trường PATH mới.

### Giải pháp 1: Refresh PATH (Khuyến nghị)

Chạy lệnh này trong PowerShell:

```powershell
. .\scripts\setup\refresh-path.ps1
```

Hoặc chạy trực tiếp:

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

Sau đó kiểm tra:
```powershell
node --version
npm --version
```

### Giải pháp 2: Restart PowerShell

Đơn giản nhất: **Đóng và mở lại PowerShell**, sau đó npm sẽ hoạt động.

### Giải pháp 3: Sử dụng script wrapper

Chạy frontend:
```powershell
.\scripts\setup\dev-frontend.ps1
```

Chạy backend:
```powershell
.\scripts\setup\dev-backend.ps1
```

### Giải pháp 4: Sử dụng đường dẫn đầy đủ

Nếu vẫn không hoạt động, sử dụng đường dẫn đầy đủ:

```powershell
& "C:\Program Files\nodejs\npm.cmd" run dev
```

## Scripts có sẵn

- `refresh-path.ps1` - Refresh PATH trong PowerShell hiện tại
- `dev-frontend.ps1` - Chạy frontend dev server
- `dev-backend.ps1` - Chạy backend dev server
- `npm.ps1` - Wrapper để chạy npm với đường dẫn đầy đủ

