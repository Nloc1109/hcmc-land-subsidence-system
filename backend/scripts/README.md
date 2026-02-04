# Scripts Seeder

## Tạo dữ liệu mẫu cho Phân tích Chuyên sâu

Script này sẽ tạo dữ liệu mẫu phong phú để test chức năng **Phân tích Chuyên sâu**:

- **30+ khu vực giám sát** phân bố các quận TPHCM
- **Chuỗi thời gian sụt lún** (12 tháng gần đây) cho mỗi khu vực
- **Dữ liệu phân tích AI** với độ tin cậy mô hình

### Cách chạy:

```bash
# Từ thư mục backend
npm run seed:analysis

# Hoặc chạy trực tiếp
node scripts/seed-analysis-data.js
```

### Dữ liệu được tạo:

1. **MonitoringAreas**: ~30 khu vực với tọa độ thực tế TPHCM
2. **SubsidenceRecords**: ~300-500 bản ghi sụt lún (12 tháng gần đây)
3. **DataAnalysis**: ~30-60 bản phân tích AI với confidence level

### Lưu ý:

- Script sẽ **không ghi đè** dữ liệu đã tồn tại (dùng `IF NOT EXISTS`)
- Có thể chạy nhiều lần an toàn
- Đảm bảo database đã có schema và các bảng cần thiết

