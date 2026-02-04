# Tài khoản test đăng nhập (mỗi role 1 tài khoản)

Sau khi tạo database bằng `schema.sql`, chọn **một trong hai cách** sau.

## Cách 1: Chạy script SQL (dễ, không cần Node)

Mở file **`docs/database/seed-test-users.sql`** trong SSMS hoặc Azure Data Studio, chọn database `HCMC_LandSubsidence`, rồi **Execute**. Không cần cấu hình `.env` hay chạy Node.

## Cách 2: Chạy script Node

```bash
# Từ thư mục gốc dự án (cần .env kết nối DB đúng)
node backend/scripts/seed-test-users.js
```

**Mật khẩu chung cho tất cả:** `123456`

| Username  | Role    | Mô tả           |
|-----------|--------|-----------------|
| admin     | Admin  | Quản trị viên   |
| manager   | Manager| Quản lý         |
| analyst   | Analyst| Chuyên viên phân tích |
| operator  | Operator | Người vận hành |
| viewer    | Viewer | Người xem (chỉ đọc) |

- Nếu user đã tồn tại (ví dụ `admin` từ seed trong schema), script sẽ **cập nhật mật khẩu** thành `123456` để đăng nhập được.
- Nếu role chưa có user, script sẽ **tạo mới** với username tương ứng.
