# Backend environment example (Windows Authentication)

Tạo file `backend/.env` (không commit) với nội dung tương tự:

```env
PORT=3000

# SQL Server (Windows Authentication)
DB_HOST=21AK22-COM
DB_NAME=HCMC_LandSubsidence

# Nếu dùng named instance, ví dụ SQLEXPRESS:
# DB_INSTANCE=SQLEXPRESS

# Bật Windows Authentication (Integrated Security)
DB_WINDOWS_AUTH=true

# Dev/local: tin cậy certificate
DB_TRUST_SERVER_CERT=true
```


