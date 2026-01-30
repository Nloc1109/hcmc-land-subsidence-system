# Kết nối SQL Server không được – Xử lý nhanh

## Đã đổi trong .env

- **DB_HOST=localhost** (thay vì tên máy) – kết nối từ chính máy chạy backend.
- **DB_INSTANCE=SQLEXPRESS** – tên instance phổ biến trên Windows. Nếu máy bạn dùng instance khác thì sửa lại.

---

## Nếu vẫn không kết nối được

### 1. Kiểm tra tên instance đúng chưa

PowerShell:

```powershell
Get-Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'MSSQL*' } | ForEach-Object { $n = $_.Name; $i = if ($n -eq 'MSSQLSERVER') { 'default' } else { $n -replace 'MSSQL\$','' }; Write-Host "Service: $n  ->  Instance: $i" }
```

- Nếu thấy **MSSQLSERVER** → instance **default**: trong `.env` **xóa dòng** `DB_INSTANCE=SQLEXPRESS` và thêm **DB_PORT=1433**.
- Nếu thấy **MSSQL$SQLEXPRESS** → giữ **DB_INSTANCE=SQLEXPRESS**.
- Nếu thấy **MSSQL$TÊNKHÁC** → trong `.env` đặt **DB_INSTANCE=TÊNKHÁC** (ví dụ LOC1109).

### 2. SQL Server có đang chạy không

PowerShell:

```powershell
Get-Service MSSQL* | Select-Object Name, Status
```

Nếu **Stopped** → mở **Services** (services.msc), tìm service SQL Server (MSSQL$SQLEXPRESS hoặc SQL Server (MSSQLSERVER)), bấm **Start**.

### 3. Cho phép SQL Server Authentication (user `sa`)

- Mở **SQL Server Management Studio** (SSMS), kết nối bằng **Windows Authentication**.
- Chuột phải vào server → **Properties** → **Security**.
- Chọn **SQL Server and Windows Authentication mode** → OK, rồi **Restart** service SQL Server.
- Kiểm tra login **sa**: **Security** → **Logins** → **sa** → **Properties** → đặt password (vd: 10062005), bỏ **Enforce password policy** nếu chỉ dùng dev.

### 4. TCP/IP có bật không

- Mở **SQL Server Configuration Manager** (tìm trong Start Menu).
- **SQL Server Network Configuration** → **Protocols for [instance]** (vd SQLEXPRESS).
- **TCP/IP** → **Enabled**. Restart service SQL Server.

### 5. Firewall

Trên máy cài SQL Server: cho phép port **1433** (default instance) hoặc port của named instance (xem trong Configuration Manager → TCP/IP → IP Addresses).

### 6. Đã tạo database chưa

Trong SSMS chạy (hoặc tạo thủ công):

```sql
CREATE DATABASE HCMC_LandSubsidence;
```

---

## Các cấu hình .env thường dùng

**Cùng máy, instance mặc định (MSSQLSERVER):**

```env
DB_HOST=localhost
DB_PORT=1433
# Không dùng DB_INSTANCE
DB_NAME=HCMC_LandSubsidence
DB_USER=sa
DB_PASSWORD=10062005
```

**Cùng máy, named instance SQLEXPRESS:**

```env
DB_HOST=localhost
DB_INSTANCE=SQLEXPRESS
DB_NAME=HCMC_LandSubsidence
DB_USER=sa
DB_PASSWORD=10062005
```

**Cùng máy, named instance khác (vd LOC1109):**

```env
DB_HOST=localhost
DB_INSTANCE=LOC1109
DB_NAME=HCMC_LandSubsidence
DB_USER=sa
DB_PASSWORD=10062005
```

Sau khi sửa `.env`, **restart backend** (Ctrl+C rồi `npm run dev` lại) và chạy:

```powershell
cd D:\hcmc-land-subsidence-system\backend
node src/test-db-connection.js
```
