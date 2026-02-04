# Tài khoản test (mỗi role 1 tài khoản)

**Mật khẩu chung cho tất cả:** `123456`

| Role     | Username | Mật khẩu |
|----------|----------|----------|
| Admin    | admin    | 123456   |
| Manager  | manager  | 123456   |
| Analyst  | analyst  | 123456   |
| Operator | operator | 123456   |
| Viewer   | viewer   | 123456   |

## Cách tạo tài khoản test

Chọn **một trong hai**:

### 1. Chạy SQL (không cần Node)

1. Mở **SQL Server Management Studio** hoặc **Azure Data Studio**.
2. Kết nối tới server, chọn database **HCMC_LandSubsidence**.
3. Mở file `docs/database/seed-test-users.sql` và **Execute**.

### 2. Chạy script Node (cần backend .env đã cấu hình DB)

Từ thư mục gốc dự án:

```bash
node backend/scripts/seed-test-users.js
```

- Nếu username đã tồn tại (ví dụ `admin` từ schema.sql), script sẽ **đặt lại mật khẩu** thành `123456`.
- Nếu chưa có, script sẽ **tạo mới** tài khoản tương ứng.

**Lưu ý:** Đảm bảo đã chạy `schema.sql` trước (có bảng Roles, Users và dữ liệu Roles).
