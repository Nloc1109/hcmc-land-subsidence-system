# Font cho PDF báo cáo (tiếng Việt)

Để PDF báo cáo hiển thị đúng **chữ tiếng Việt có dấu** (ư, ơ, ă, â, ê, ô, ệ, ế...), backend cần font TTF hỗ trợ Unicode.

- **Windows:** Hệ thống tự dùng Arial từ `C:\Windows\Fonts\` (không cần cấu hình).
- **Linux / máy chủ:** Copy 2 file font vào thư mục này:
  - `arial.ttf` (chữ thường)
  - `arialbd.ttf` (chữ đậm)
  Hoặc đặt biến môi trường `PDF_FONT_PATH` trỏ tới đường dẫn file `.ttf` (ví dụ: `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`).

Nếu không có font phù hợp, PDF vẫn tạo được nhưng chữ Việt có thể hiển thị sai (ô vuông hoặc mất dấu).
