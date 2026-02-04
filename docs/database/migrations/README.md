# Migrations

Chạy các file trong thư mục này **sau** khi đã chạy `schema.sql`.

- **001-add-notifications-sender.sql** — Thêm cột `SenderId` vào bảng `Notifications` (để biết ai gửi thông báo trong Hộp thư). Cần chạy trước khi dùng tính năng gửi thông báo giữa các role.
- **002-add-notifications-attachment.sql** — Thêm cột AttachmentPath, AttachmentFileName, AttachmentMimeType vào Notifications. Cần chạy để người nhận thấy file đính kèm (PDF/Excel).
