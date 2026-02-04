# Migrations

Chạy các file trong thư mục này **sau** khi đã chạy `schema.sql`.

- **001-add-notifications-sender.sql** — Thêm cột `SenderId` vào bảng `Notifications` (để biết ai gửi thông báo trong Hộp thư). Cần chạy trước khi dùng tính năng gửi thông báo giữa các role.
- **002-add-notifications-attachment.sql** — Thêm cột AttachmentPath, AttachmentFileName, AttachmentMimeType vào Notifications. Cần chạy để người nhận thấy file đính kèm (PDF/Excel).
- **003-create-requests-table.sql** — Tạo bảng `Requests` (quản lý yêu cầu Admin giao cho các role). Cần chạy để trang "Yêu cầu của tôi" và API `/api/v1/requests` hoạt động.
- **004-add-requests-completion-attachment.sql** — Thêm cột đính kèm khi hoàn thành (CompletionAttachmentPath, FileName, MimeType). Cần chạy để cho phép gửi file khi nộp lại yêu cầu cho Admin.

## Chạy script SQL thủ công (copy vào SSMS / sqlcmd)

1. Mở **SQL Server Management Studio** (SSMS), kết nối tới server có database `HCMC_LandSubsidence`.
2. Mở file `docs/database/migrations/003-create-requests-table.sql`, copy toàn bộ nội dung.
3. Dán vào cửa sổ query và nhấn **Execute** (F5).

Script dùng `IF NOT EXISTS` nên chạy nhiều lần cũng không lỗi.

## Chạy bằng Node (PowerShell)

PowerShell không dùng `&&`. Chạy lần lượt:

```powershell
cd backend
npm run create:requests-table
```

Hoặc một dòng (dùng `;`):

```powershell
cd backend; npm run create:requests-table
```
