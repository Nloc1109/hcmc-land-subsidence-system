# Hướng Dẫn Kết Nối Database

## 🔌 Connection String cho Windows Authentication

### Thông tin SQL Server
- **Server Name**: `DESKTOP-QH7JC2G\LOC1109`
- **Database**: `HCMC_LandSubsidence`
- **Authentication**: Windows Authentication
- **SQL Server Version**: 16.0.1165

## 📝 Cấu Hình

### 1. File `.env` trong `backend/`

Tạo file `.env` từ `.env.example`:

```bash
cd backend
cp .env.example .env
```

Nội dung file `.env`:

```env
# Database Configuration
DB_HOST=DESKTOP-QH7JC2G\LOC1109
DB_NAME=HCMC_LandSubsidence
DB_USERNAME=
DB_PASSWORD=
DB_LOGGING=false

# Application
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
```

### 2. Connection String Format

#### Cho Sequelize (Node.js)
```javascript
{
  host: 'DESKTOP-QH7JC2G\\LOC1109',
  database: 'HCMC_LandSubsidence',
  dialect: 'mssql',
  dialectOptions: {
    options: {
      trustedConnection: true,  // Windows Authentication
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
      instanceName: 'LOC1109'
    }
  }
}
```

#### Connection String URL
```
mssql://@DESKTOP-QH7JC2G\LOC1109/HCMC_LandSubsidence?trustedConnection=true&encrypt=false&trustServerCertificate=true
```

#### ADO.NET Connection String
```
Server=DESKTOP-QH7JC2G\LOC1109;Database=HCMC_LandSubsidence;Integrated Security=true;TrustServerCertificate=true;
```

#### SQL Server Management Studio (SSMS)
- **Server name**: `DESKTOP-QH7JC2G\LOC1109`
- **Authentication**: Windows Authentication
- **Database**: `HCMC_LandSubsidence`

## 🔧 Kiểm Tra Kết Nối

### 1. Test Connection trong Node.js

```javascript
const { testConnection } = require('./src/db/connection');

testConnection().then(connected => {
  if (connected) {
    console.log('Kết nối thành công!');
  }
});
```

### 2. Test bằng SQL Server Management Studio

1. Mở SQL Server Management Studio
2. Nhập Server name: `DESKTOP-QH7JC2G\LOC1109`
3. Chọn **Windows Authentication**
4. Click **Connect**
5. Mở rộng **Databases** và tìm `HCMC_LandSubsidence`

### 3. Test bằng sqlcmd

```bash
sqlcmd -S "DESKTOP-QH7JC2G\LOC1109" -E -d HCMC_LandSubsidence -Q "SELECT @@VERSION"
```

## ⚠️ Troubleshooting

### Lỗi: "Cannot connect to server"

**Nguyên nhân:**
- SQL Server chưa khởi động
- Tên server/instance sai
- Firewall chặn kết nối

**Giải pháp:**
1. Kiểm tra SQL Server đang chạy:
   ```bash
   # Windows Services
   services.msc
   # Tìm "SQL Server (LOC1109)" và đảm bảo đang chạy
   ```

2. Kiểm tra SQL Server Browser đang chạy (cho named instance)

3. Kiểm tra firewall:
   ```bash
   # Cho phép SQL Server qua firewall
   # Port 1433 (default) hoặc dynamic port
   ```

### Lỗi: "Login failed for user"

**Nguyên nhân:**
- Tài khoản Windows không có quyền truy cập SQL Server

**Giải pháp:**
1. Mở SQL Server Management Studio
2. Connect với quyền admin
3. Security > Logins > New Login
4. Chọn Windows Authentication
5. Chọn tài khoản Windows của bạn
6. Server Roles: `sysadmin` hoặc `db_datareader` + `db_datawriter`

### Lỗi: "Database does not exist"

**Nguyên nhân:**
- Database chưa được tạo

**Giải pháp:**
1. Chạy file `docs/database/schema.sql` để tạo database
2. Hoặc tạo database thủ công trong SSMS

## 🔐 Chuyển Đổi Giữa Windows Auth và SQL Auth

### Windows Authentication (Hiện tại)
```env
DB_USERNAME=
DB_PASSWORD=
# Trong database.js: trustedConnection: true
```

### SQL Server Authentication
```env
DB_USERNAME=sa
DB_PASSWORD=your_password
# Trong database.js: trustedConnection: false
```

## 📚 Tài Liệu Tham Khảo

- [Sequelize MSSQL Documentation](https://sequelize.org/docs/v6/getting-started/)
- [Node MSSQL Driver](https://github.com/tediousjs/node-mssql)
- [SQL Server Connection Strings](https://www.connectionstrings.com/sql-server/)
