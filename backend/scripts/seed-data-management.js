/**
 * Script tạo dữ liệu mẫu cho chức năng Quản lý Dữ liệu
 * Chạy: node backend/scripts/seed-data-management.js
 * Hoặc: npm run seed:data-management
 */

import dotenv from 'dotenv';
import { getPool } from '../src/db/mssql.js';

dotenv.config();

// Danh sách nguồn dữ liệu mẫu
const DATA_SOURCES = [
  {
    sourceCode: 'GOV-HCMC',
    sourceName: 'Sở Tài nguyên và Môi trường TP.HCM',
    sourceType: 'Government',
    organization: 'UBND TP.HCM',
    contactInfo: 'contact@stnmt.hochiminhcity.gov.vn',
    description: 'Nguồn dữ liệu chính thức từ cơ quan nhà nước về sụt lún đất',
  },
  {
    sourceCode: 'RESEARCH-VNU',
    sourceName: 'Viện Nghiên cứu Địa chất - ĐHQG',
    sourceType: 'Research',
    organization: 'Đại học Quốc gia TP.HCM',
    contactInfo: 'research@vnuhcm.edu.vn',
    description: 'Dữ liệu từ nghiên cứu khoa học về địa chất và sụt lún',
  },
  {
    sourceCode: 'SENSOR-AUTO',
    sourceName: 'Hệ thống cảm biến tự động',
    sourceType: 'Sensor',
    organization: 'Trung tâm Giám sát',
    contactInfo: 'sensor@monitoring.gov.vn',
    description: 'Dữ liệu từ hệ thống cảm biến tự động theo dõi sụt lún',
  },
  {
    sourceCode: 'MANUAL-INPUT',
    sourceName: 'Nhập liệu thủ công',
    sourceType: 'Manual',
    organization: 'Nội bộ',
    contactInfo: 'admin@system.gov.vn',
    description: 'Dữ liệu được nhập thủ công bởi nhân viên',
  },
  {
    sourceCode: 'GOV-CENTRAL',
    sourceName: 'Bộ Tài nguyên và Môi trường',
    sourceType: 'Government',
    organization: 'Bộ TN&MT',
    contactInfo: 'data@monre.gov.vn',
    description: 'Dữ liệu từ cơ quan trung ương',
  },
  {
    sourceCode: 'RESEARCH-IGS',
    sourceName: 'Viện Khoa học Địa chất',
    sourceType: 'Research',
    organization: 'Viện Hàn lâm Khoa học',
    contactInfo: 'igs@vast.vn',
    description: 'Nghiên cứu về địa chất và biến đổi địa hình',
  },
  {
    sourceCode: 'SENSOR-GPS',
    sourceName: 'Mạng lưới GPS Quốc gia',
    sourceType: 'Sensor',
    organization: 'Cục Đo đạc và Bản đồ',
    contactInfo: 'gps@dosm.gov.vn',
    description: 'Dữ liệu từ mạng lưới trạm GPS quốc gia',
  },
  {
    sourceCode: 'EXTERNAL-UN',
    sourceName: 'UNESCO - Chương trình Địa chất',
    sourceType: 'External',
    organization: 'UNESCO',
    contactInfo: 'geology@unesco.org',
    description: 'Dữ liệu từ tổ chức quốc tế',
  },
  {
    sourceCode: 'RESEARCH-HCMUT',
    sourceName: 'Đại học Bách Khoa TP.HCM',
    sourceType: 'Research',
    organization: 'ĐHBK TP.HCM',
    contactInfo: 'research@hcmut.edu.vn',
    description: 'Nghiên cứu về kỹ thuật địa chất và xây dựng',
  },
  {
    sourceCode: 'SENSOR-SATELLITE',
    sourceName: 'Dữ liệu Vệ tinh InSAR',
    sourceType: 'Sensor',
    organization: 'Trung tâm Vũ trụ Việt Nam',
    contactInfo: 'insar@vnsc.org.vn',
    description: 'Dữ liệu từ vệ tinh InSAR đo lường sụt lún',
  },
  {
    sourceCode: 'GOV-DISTRICT-1',
    sourceName: 'UBND Quận 1',
    sourceType: 'Government',
    organization: 'UBND Quận 1',
    contactInfo: 'contact@quan1.hochiminhcity.gov.vn',
    description: 'Dữ liệu từ quận 1',
  },
  {
    sourceCode: 'GOV-DISTRICT-7',
    sourceName: 'UBND Quận 7',
    sourceType: 'Government',
    organization: 'UBND Quận 7',
    contactInfo: 'contact@quan7.hochiminhcity.gov.vn',
    description: 'Dữ liệu từ quận 7',
  },
  {
    sourceCode: 'RESEARCH-UT',
    sourceName: 'Đại học Công nghệ TP.HCM',
    sourceType: 'Research',
    organization: 'ĐH Công nghệ TP.HCM',
    contactInfo: 'research@hutech.edu.vn',
    description: 'Nghiên cứu về địa chất và môi trường',
  },
  {
    sourceCode: 'SENSOR-IOT',
    sourceName: 'Hệ thống IoT cảm biến',
    sourceType: 'Sensor',
    organization: 'Công ty Công nghệ',
    contactInfo: 'iot@sensor-tech.vn',
    description: 'Dữ liệu từ mạng lưới IoT',
  },
  {
    sourceCode: 'EXTERNAL-JICA',
    sourceName: 'JICA - Cơ quan Hợp tác Quốc tế Nhật Bản',
    sourceType: 'External',
    organization: 'JICA',
    contactInfo: 'jica@jica.go.jp',
    description: 'Dữ liệu từ dự án hợp tác quốc tế',
  },
  {
    sourceCode: 'GOV-WATER',
    sourceName: 'Sở Cấp nước TP.HCM',
    sourceType: 'Government',
    organization: 'SAWACO',
    contactInfo: 'data@sawaco.com.vn',
    description: 'Dữ liệu về nước ngầm và sụt lún',
  },
  {
    sourceCode: 'RESEARCH-IGS-HCM',
    sourceName: 'Viện Địa chất TP.HCM',
    sourceType: 'Research',
    organization: 'Viện Địa chất',
    contactInfo: 'research@igs-hcm.vn',
    description: 'Nghiên cứu địa chất khu vực TP.HCM',
  },
  {
    sourceCode: 'SENSOR-DRONE',
    sourceName: 'Dữ liệu từ Drone',
    sourceType: 'Sensor',
    organization: 'Trung tâm Khảo sát',
    contactInfo: 'drone@survey.vn',
    description: 'Dữ liệu khảo sát từ drone',
  },
  {
    sourceCode: 'EXTERNAL-WB',
    sourceName: 'Ngân hàng Thế giới',
    sourceType: 'External',
    organization: 'World Bank',
    contactInfo: 'data@worldbank.org',
    description: 'Dữ liệu từ dự án WB',
  },
  {
    sourceCode: 'GOV-PLANNING',
    sourceName: 'Sở Quy hoạch Kiến trúc',
    sourceType: 'Government',
    organization: 'Sở QHKT TP.HCM',
    contactInfo: 'data@qhkt.hochiminhcity.gov.vn',
    description: 'Dữ liệu quy hoạch và xây dựng',
  },
  {
    sourceCode: 'RESEARCH-UT-HCM',
    sourceName: 'Đại học Tôn Đức Thắng',
    sourceType: 'Research',
    organization: 'ĐH TDT',
    contactInfo: 'research@tdtu.edu.vn',
    description: 'Nghiên cứu về môi trường và địa chất',
  },
  {
    sourceCode: 'SENSOR-GROUND',
    sourceName: 'Cảm biến mặt đất',
    sourceType: 'Sensor',
    organization: 'Trung tâm Giám sát',
    contactInfo: 'ground@sensor.vn',
    description: 'Dữ liệu từ cảm biến đặt tại mặt đất',
  },
  {
    sourceCode: 'EXTERNAL-ADB',
    sourceName: 'Ngân hàng Phát triển Châu Á',
    sourceType: 'External',
    organization: 'ADB',
    contactInfo: 'data@adb.org',
    description: 'Dữ liệu từ dự án ADB',
  },
  {
    sourceCode: 'GOV-TRANSPORT',
    sourceName: 'Sở Giao thông Vận tải',
    sourceType: 'Government',
    organization: 'Sở GTVT TP.HCM',
    contactInfo: 'data@gtvt.hochiminhcity.gov.vn',
    description: 'Dữ liệu về giao thông và hạ tầng',
  },
  {
    sourceCode: 'RESEARCH-VAST',
    sourceName: 'Viện Hàn lâm Khoa học',
    sourceType: 'Research',
    organization: 'VAST',
    contactInfo: 'research@vast.vn',
    description: 'Nghiên cứu khoa học về địa chất',
  },
  {
    sourceCode: 'SENSOR-UNDERGROUND',
    sourceName: 'Cảm biến ngầm',
    sourceType: 'Sensor',
    organization: 'Công ty Đo đạc',
    contactInfo: 'underground@sensor.vn',
    description: 'Dữ liệu từ cảm biến đặt ngầm',
  },
  {
    sourceCode: 'EXTERNAL-UNDP',
    sourceName: 'Chương trình Phát triển Liên Hợp Quốc',
    sourceType: 'External',
    organization: 'UNDP',
    contactInfo: 'data@undp.org',
    description: 'Dữ liệu từ dự án UNDP',
  },
  {
    sourceCode: 'GOV-ENVIRONMENT',
    sourceName: 'Sở Tài nguyên Môi trường',
    sourceType: 'Government',
    organization: 'Sở TNMT TP.HCM',
    contactInfo: 'data@stnmt.hochiminhcity.gov.vn',
    description: 'Dữ liệu môi trường chính thức',
  },
  {
    sourceCode: 'RESEARCH-IGS-VN',
    sourceName: 'Viện Địa chất Việt Nam',
    sourceType: 'Research',
    organization: 'IGS Vietnam',
    contactInfo: 'research@igs-vn.vn',
    description: 'Nghiên cứu địa chất toàn quốc',
  },
  {
    sourceCode: 'SENSOR-MULTI',
    sourceName: 'Hệ thống cảm biến đa năng',
    sourceType: 'Sensor',
    organization: 'Công ty Công nghệ',
    contactInfo: 'multi@sensor-tech.vn',
    description: 'Dữ liệu từ nhiều loại cảm biến',
  },
];

// Các loại dữ liệu
const DATA_TYPES = ['SubsidenceRecords', 'MonitoringAreas', 'Measurements', 'Devices'];

// Các trạng thái import
const IMPORT_STATUSES = ['Pending', 'Processing', 'Completed', 'Failed', 'Approved', 'Rejected'];

// Các trạng thái phê duyệt
const APPROVAL_STATUSES = ['Pending', 'Approved', 'Rejected'];

// Tên file mẫu
const FILE_NAMES = [
  'subsidence_data_2024_q1.xlsx',
  'monitoring_areas_update.csv',
  'measurements_jan_2024.json',
  'device_status_report.xlsx',
  'subsidence_records_2024_02.csv',
  'area_coordinates_update.xlsx',
  'sensor_data_2024_03.json',
  'historical_data_2023.csv',
  'real_time_measurements.xlsx',
  'comprehensive_report_2024.csv',
  'district_1_data.xlsx',
  'district_7_measurements.csv',
  'binh_thanh_area.json',
  'tan_phu_records.xlsx',
  'quan_12_data.csv',
  'subsidence_2024_q2.xlsx',
  'monitoring_update_2024_04.csv',
  'measurements_feb_2024.json',
  'device_report_2024.xlsx',
  'subsidence_records_2024_03.csv',
  'area_data_update.xlsx',
  'sensor_data_2024_04.json',
  'historical_data_2022.csv',
  'real_time_2024.xlsx',
  'report_2024_q3.csv',
  'district_2_data.xlsx',
  'district_3_measurements.csv',
  'district_4_area.json',
  'district_5_records.xlsx',
  'district_6_data.csv',
  'district_8_data.xlsx',
  'district_9_measurements.csv',
  'district_10_area.json',
  'district_11_records.xlsx',
  'district_12_data.csv',
  'binh_tan_data.xlsx',
  'tan_binh_measurements.csv',
  'phu_nhuan_area.json',
  'go_vap_records.xlsx',
  'thu_duc_data.csv',
  'nha_be_data.xlsx',
  'can_gio_measurements.csv',
  'cu_chi_area.json',
  'hoc_mon_records.xlsx',
  'subsidence_2024_q4.xlsx',
  'monitoring_2024_05.csv',
  'measurements_mar_2024.json',
  'device_status_2024.xlsx',
  'subsidence_2024_06.csv',
  'area_update_2024.xlsx',
  'sensor_2024_07.json',
  'historical_2021.csv',
  'real_time_q2_2024.xlsx',
  'comprehensive_q3_2024.csv',
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateImportCode(index) {
  const prefix = 'IMP';
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const seq = String(index).padStart(4, '0');
  return `${prefix}-${year}${month}-${seq}`;
}

async function seedDataManagement() {
  try {
    console.log('🔌 Đang kết nối database...');
    const pool = await getPool();
    console.log('✅ Đã kết nối database thành công!\n');

    // 1. Tạo Data Sources
    console.log('📊 Đang tạo nguồn dữ liệu...');
    const sourceIds = [];
    
    for (const source of DATA_SOURCES) {
      try {
        // Kiểm tra xem source đã tồn tại chưa
        const checkResult = await pool.request()
          .input('SourceCode', source.sourceCode)
          .query('SELECT SourceId FROM DataSources WHERE SourceCode = @SourceCode');
        
        if (checkResult.recordset.length > 0) {
          sourceIds.push(checkResult.recordset[0].SourceId);
          console.log(`  ⚠️  Nguồn ${source.sourceCode} đã tồn tại`);
          continue;
        }

        // Lấy UserId đầu tiên làm CreatedBy
        const userResult = await pool.request()
          .query('SELECT TOP 1 UserId FROM Users ORDER BY UserId');
        
        const createdBy = userResult.recordset.length > 0 ? userResult.recordset[0].UserId : 1;

        const insertResult = await pool.request()
          .input('SourceCode', source.sourceCode)
          .input('SourceName', source.sourceName)
          .input('SourceType', source.sourceType)
          .input('Organization', source.organization)
          .input('ContactInfo', source.contactInfo)
          .input('Description', source.description)
          .input('CreatedBy', createdBy)
          .query(`
            INSERT INTO DataSources (SourceCode, SourceName, SourceType, Organization, ContactInfo, Description, CreatedBy)
            OUTPUT INSERTED.SourceId
            VALUES (@SourceCode, @SourceName, @SourceType, @Organization, @ContactInfo, @Description, @CreatedBy)
          `);
        
        sourceIds.push(insertResult.recordset[0].SourceId);
        console.log(`  ✅ Đã tạo nguồn: ${source.sourceName}`);
      } catch (error) {
        console.error(`  ❌ Lỗi khi tạo nguồn ${source.sourceCode}:`, error.message);
      }
    }

    console.log(`\n📦 Đã tạo ${sourceIds.length} nguồn dữ liệu\n`);

    // 2. Tạo Data Imports
    console.log('📥 Đang tạo dữ liệu import...');
    
    const fileTypes = ['CSV', 'Excel', 'JSON', 'XLSX'];
    const versions = ['v1', 'v2', 'v3', 'v4', 'v5'];
    const rejectionReasons = [
      'Dữ liệu không đầy đủ',
      'Format file không đúng',
      'Dữ liệu trùng lặp',
      'Thiếu thông tin bắt buộc',
      'Dữ liệu không hợp lệ',
    ];

    // Lấy danh sách UserId
    const usersResult = await pool.request()
      .query('SELECT UserId FROM Users');
    const userIds = usersResult.recordset.map(r => r.UserId);
    if (userIds.length === 0) userIds.push(1);

    const startDate = new Date(2024, 0, 1); // 1/1/2024
    const endDate = new Date(); // Hôm nay

    let importCount = 0;
    const totalImports = 10; // Tạo 10 imports

    for (let i = 1; i <= totalImports; i++) {
      try {
        const importCode = generateImportCode(i);
        const fileName = randomChoice(FILE_NAMES);
        const fileType = randomChoice(fileTypes);
        const fileSize = randomInt(10000, 5000000); // 10KB - 5MB
        const sourceId = randomChoice(sourceIds);
        const dataType = randomChoice(DATA_TYPES);
        const totalRows = randomInt(100, 10000);
        const importedRows = randomInt(50, totalRows);
        const failedRows = totalRows - importedRows;
        const importStatus = randomChoice(IMPORT_STATUSES);
        const approvalStatus = randomChoice(APPROVAL_STATUSES);
        const version = randomChoice(versions);
        const createdBy = randomChoice(userIds);
        
        let approvedBy = null;
        let approvedAt = null;
        let rejectionReason = null;
        
        if (approvalStatus === 'Approved') {
          approvedBy = randomChoice(userIds);
          approvedAt = randomDate(startDate, endDate);
        } else if (approvalStatus === 'Rejected') {
          approvedBy = randomChoice(userIds);
          approvedAt = randomDate(startDate, endDate);
          rejectionReason = randomChoice(rejectionReasons);
        }

        const createdAt = randomDate(startDate, endDate);
        const updatedAt = new Date(createdAt.getTime() + randomInt(0, 7 * 24 * 60 * 60 * 1000)); // Cập nhật trong vòng 7 ngày

        const filePath = `uploads/data-imports/${Date.now()}-${fileName}`;
        const importSummary = JSON.stringify({
          totalRows,
          importedRows,
          failedRows,
          dataType,
          sourceId,
        });

        await pool.request()
          .input('ImportCode', importCode)
          .input('FileName', fileName)
          .input('FileType', fileType)
          .input('FileSize', fileSize)
          .input('FilePath', filePath)
          .input('SourceId', sourceId)
          .input('DataType', dataType)
          .input('TotalRows', totalRows)
          .input('ImportedRows', importedRows)
          .input('FailedRows', failedRows)
          .input('ImportStatus', importStatus)
          .input('ApprovalStatus', approvalStatus)
          .input('Version', version)
          .input('ApprovedBy', approvedBy)
          .input('ApprovedAt', approvedAt)
          .input('RejectionReason', rejectionReason)
          .input('ImportSummary', importSummary)
          .input('CreatedBy', createdBy)
          .input('CreatedAt', createdAt)
          .input('UpdatedAt', updatedAt)
          .query(`
            INSERT INTO DataImports (
              ImportCode, FileName, FileType, FileSize, FilePath,
              SourceId, DataType, TotalRows, ImportedRows, FailedRows,
              ImportStatus, ApprovalStatus, Version,
              ApprovedBy, ApprovedAt, RejectionReason,
              ImportSummary, CreatedBy, CreatedAt, UpdatedAt
            )
            VALUES (
              @ImportCode, @FileName, @FileType, @FileSize, @FilePath,
              @SourceId, @DataType, @TotalRows, @ImportedRows, @FailedRows,
              @ImportStatus, @ApprovalStatus, @Version,
              @ApprovedBy, @ApprovedAt, @RejectionReason,
              @ImportSummary, @CreatedBy, @CreatedAt, @UpdatedAt
            )
          `);

        importCount++;
        if (i % 10 === 0) {
          console.log(`  ✅ Đã tạo ${i}/${totalImports} imports...`);
        }
      } catch (error) {
        console.error(`  ❌ Lỗi khi tạo import ${i}:`, error.message);
      }
    }

    console.log(`\n📦 Đã tạo ${importCount} imports\n`);

    // 3. Tạo một số Data Import Details (chi tiết import)
    console.log('📋 Đang tạo chi tiết import...');
    
    // Tạo chi tiết cho tất cả 10 imports
    const importsResult = await pool.request()
      .query('SELECT TOP 10 ImportId FROM DataImports ORDER BY ImportId');
    
    let detailCount = 0;
    for (const importRow of importsResult.recordset) {
      const importId = importRow.ImportId;
      const detailRows = randomInt(20, 100); // 20-100 chi tiết mỗi import (tăng từ 10-50)
      
      for (let j = 1; j <= detailRows; j++) {
        try {
          const recordId = randomInt(1, 10000);
          const recordType = randomChoice(['SubsidenceRecord', 'MonitoringArea', 'Measurement', 'Device']);
          const status = randomChoice(['Pending', 'Imported', 'Failed', 'Skipped']);
          const errorMessage = status === 'Failed' ? 'Lỗi validation dữ liệu' : null;
          
          const originalData = JSON.stringify({
            row: j,
            data: `Sample data for row ${j}`,
          });
          
          const processedData = JSON.stringify({
            row: j,
            processed: true,
            recordId,
          });

          await pool.request()
            .input('ImportId', importId)
            .input('RowNumber', j)
            .input('RecordId', recordId)
            .input('RecordType', recordType)
            .input('OriginalData', originalData)
            .input('ProcessedData', processedData)
            .input('Status', status)
            .input('ErrorMessage', errorMessage)
            .query(`
              INSERT INTO DataImportDetails (
                ImportId, RowNumber, RecordId, RecordType,
                OriginalData, ProcessedData, Status, ErrorMessage
              )
              VALUES (
                @ImportId, @RowNumber, @RecordId, @RecordType,
                @OriginalData, @ProcessedData, @Status, @ErrorMessage
              )
            `);

          detailCount++;
        } catch (error) {
          // Bỏ qua lỗi nếu có
        }
      }
    }

    console.log(`📦 Đã tạo ${detailCount} chi tiết import\n`);

    console.log('='.repeat(50));
    console.log('🎉 Hoàn thành tạo dữ liệu mẫu!');
    console.log(`   📊 Nguồn dữ liệu: ${sourceIds.length}`);
    console.log(`   📥 Imports: ${importCount}`);
    console.log(`   📋 Chi tiết: ${detailCount}`);
    console.log('='.repeat(50));

    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi tạo dữ liệu:', error);
    process.exit(1);
  }
}

seedDataManagement();

