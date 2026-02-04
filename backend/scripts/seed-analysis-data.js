/**
 * Script tạo dữ liệu mẫu cho chức năng Phân tích Chuyên sâu
 * Chạy: node backend/scripts/seed-analysis-data.js
 */

import dotenv from 'dotenv';
import { getPool } from '../src/db/mssql.js';

dotenv.config();

// Tọa độ thực tế các quận TPHCM
const DISTRICT_COORDS = [
  { code: 'Q1', name: 'Quận 1', lat: 10.7769, lng: 106.7009, areas: 5 },
  { code: 'Q2', name: 'Quận 2', lat: 10.8019, lng: 106.7419, areas: 4 },
  { code: 'Q3', name: 'Quận 3', lat: 10.7833, lng: 106.6944, areas: 3 },
  { code: 'Q7', name: 'Quận 7', lat: 10.7297, lng: 106.7172, areas: 5 },
  { code: 'Q12', name: 'Quận 12', lat: 10.8631, lng: 106.6297, areas: 4 },
  { code: 'BTH', name: 'Quận Bình Thạnh', lat: 10.8106, lng: 106.7092, areas: 4 },
  { code: 'TP', name: 'Quận Tân Phú', lat: 10.7714, lng: 106.6181, areas: 3 },
  { code: 'TB', name: 'Quận Tân Bình', lat: 10.8014, lng: 106.6522, areas: 3 },
];

const AREA_TYPES = ['Urban', 'Residential', 'Industrial', 'Agricultural'];
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const ANALYSIS_TYPES = ['Trend', 'Correlation', 'Prediction', 'Anomaly'];

// Tên khu vực mẫu
const AREA_NAMES = [
  'Trung tâm', 'Khu đô thị mới', 'Khu công nghiệp', 'Khu dân cư', 
  'Khu thương mại', 'Khu ven sông', 'Khu ven biển', 'Khu ngoại thành',
  'Khu đô thị cao cấp', 'Khu tập trung dân cư', 'Khu đang phát triển'
];

function randomFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(4));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function ensureDistricts(pool) {
  console.log('🏙️  Đang đảm bảo Districts tồn tại...');
  
  for (const district of DISTRICT_COORDS) {
    try {
      const request = pool.request();
      request.input('DistrictCode', district.code);
      request.input('DistrictName', district.name);
      
      await request.query(`
        IF NOT EXISTS (SELECT 1 FROM Districts WHERE DistrictCode = @DistrictCode)
        BEGIN
          INSERT INTO Districts (DistrictCode, DistrictName, AreaKm2, Population)
          VALUES (@DistrictCode, @DistrictName, 20.0, 100000)
        END
      `);
    } catch (error) {
      console.error(`Lỗi khi tạo District ${district.name}:`, error.message);
    }
  }
}

async function getDistrictId(pool, districtCode) {
  const result = await pool.request()
    .input('DistrictCode', districtCode)
    .query('SELECT DistrictId FROM Districts WHERE DistrictCode = @DistrictCode');
  
  if (result.recordset.length > 0) {
    return result.recordset[0].DistrictId;
  }
  return null;
}

async function seedMonitoringAreas(pool) {
  console.log('🌍 Đang tạo khu vực giám sát...');
  
  // Đảm bảo Districts tồn tại trước
  await ensureDistricts(pool);
  
  // Lấy số khu vực hiện có để tiếp tục đánh số
  const existingCount = await pool.request()
    .query('SELECT COUNT(*) AS count FROM MonitoringAreas');
  const startAreaId = existingCount.recordset[0].count + 1;
  
  let areaId = startAreaId;
  const areas = [];
  let insertedCount = 0;
  
  for (const district of DISTRICT_COORDS) {
    const districtId = await getDistrictId(pool, district.code);
    if (!districtId) {
      console.warn(`⚠️  Không tìm thấy DistrictId cho ${district.name}, bỏ qua...`);
      continue;
    }
    
    for (let i = 1; i <= district.areas; i++) {
      const latOffset = randomFloat(-0.05, 0.05);
      const lngOffset = randomFloat(-0.05, 0.05);
      
      const areaCode = `AREA-${String(areaId).padStart(3, '0')}`;
      const areaName = `Khu vực ${district.name} - ${randomChoice(AREA_NAMES)} ${i}`;
      
      const area = {
        areaCode,
        areaName,
        districtId,
        latitude: district.lat + latOffset,
        longitude: district.lng + lngOffset,
        elevation: randomFloat(1.5, 8.0),
        areaType: randomChoice(AREA_TYPES),
        riskLevel: randomChoice(RISK_LEVELS),
        description: `Khu vực giám sát tại ${district.name}`,
      };
      
      areas.push(area);
      areaId++;
      
      // Insert vào database
      try {
        const request = pool.request();
        request.input('AreaCode', area.areaCode);
        request.input('AreaName', area.areaName);
        request.input('DistrictId', area.districtId);
        request.input('Latitude', area.latitude);
        request.input('Longitude', area.longitude);
        request.input('Elevation', area.elevation);
        request.input('AreaType', area.areaType);
        request.input('RiskLevel', area.riskLevel);
        request.input('Description', area.description);
        request.input('CreatedBy', 1);
        
        const result = await request.query(`
          IF NOT EXISTS (SELECT 1 FROM MonitoringAreas WHERE AreaCode = @AreaCode)
          BEGIN
            INSERT INTO MonitoringAreas (AreaCode, AreaName, DistrictId, Latitude, Longitude, Elevation, AreaType, RiskLevel, Description, CreatedBy)
            VALUES (@AreaCode, @AreaName, @DistrictId, @Latitude, @Longitude, @Elevation, @AreaType, @RiskLevel, @Description, @CreatedBy)
            SELECT 1 AS inserted
          END
          ELSE
          BEGIN
            SELECT 0 AS inserted
          END
        `);
        
        if (result.recordset[0]?.inserted === 1) {
          insertedCount++;
        }
      } catch (error) {
        console.error(`❌ Lỗi khi insert ${area.areaCode}:`, error.message);
      }
    }
  }
  
  console.log(`✅ Đã tạo ${insertedCount} khu vực giám sát mới (tổng ${areas.length} khu vực)`);
  return areas;
}

async function seedSubsidenceRecords(pool, areas) {
  console.log('📊 Đang tạo dữ liệu sụt lún (chuỗi thời gian)...');
  
  let totalRecords = 0;
  const today = new Date();
  
  for (const area of areas) {
    // Lấy AreaId từ database
    const areaResult = await pool.request()
      .input('AreaCode', area.areaCode)
      .query('SELECT AreaId FROM MonitoringAreas WHERE AreaCode = @AreaCode');
    
    if (areaResult.recordset.length === 0) continue;
    
    const areaId = areaResult.recordset[0].AreaId;
    
    // Tạo dữ liệu 12 tháng gần đây (mỗi tháng 1-2 bản ghi)
    let cumulative = randomFloat(10, 50);
    const baseRate = area.riskLevel === 'Critical' ? randomFloat(6, 10) :
                     area.riskLevel === 'High' ? randomFloat(4, 7) :
                     area.riskLevel === 'Medium' ? randomFloat(2, 5) :
                     randomFloat(1, 3);
    
    for (let month = 11; month >= 0; month--) {
      const recordDate = new Date(today);
      recordDate.setMonth(recordDate.getMonth() - month);
      
      // Mỗi tháng có 1-2 bản ghi
      const recordsPerMonth = randomInt(1, 2);
      
      for (let r = 0; r < recordsPerMonth; r++) {
        const dayOffset = r === 0 ? 0 : randomInt(10, 20);
        const date = new Date(recordDate);
        date.setDate(date.getDate() + dayOffset);
        
        if (date > today) continue;
        
        // Tính giá trị sụt lún với biến động ngẫu nhiên
        const variation = randomFloat(-0.5, 0.5);
        const subsidenceValue = Math.max(0, baseRate * 0.3 + variation);
        const subsidenceRate = Math.max(0, baseRate + randomFloat(-1, 1));
        cumulative += subsidenceValue;
        
        try {
          const request = pool.request();
          request.input('AreaId', areaId);
          request.input('RecordDate', date.toISOString().split('T')[0]);
          request.input('SubsidenceValue', subsidenceValue);
          request.input('CumulativeSubsidence', cumulative);
          request.input('SubsidenceRate', subsidenceRate);
          request.input('MeasurementMethod', randomChoice(['GPS', 'InSAR', 'Leveling', 'Sensor']));
          request.input('QualityRating', randomChoice(['Excellent', 'Good', 'Fair']));
          request.input('IsVerified', 1);
          request.input('VerifiedBy', randomInt(1, 3));
          request.input('CreatedBy', 1);
          
          await request.query(`
            IF NOT EXISTS (SELECT 1 FROM SubsidenceRecords WHERE AreaId = @AreaId AND RecordDate = @RecordDate)
            BEGIN
              INSERT INTO SubsidenceRecords (AreaId, RecordDate, SubsidenceValue, CumulativeSubsidence, SubsidenceRate, MeasurementMethod, QualityRating, IsVerified, VerifiedBy, CreatedBy)
              VALUES (@AreaId, @RecordDate, @SubsidenceValue, @CumulativeSubsidence, @SubsidenceRate, @MeasurementMethod, @QualityRating, @IsVerified, @VerifiedBy, @CreatedBy)
            END
          `);
          
          totalRecords++;
        } catch (error) {
          console.error(`Lỗi khi insert record cho ${area.areaCode}:`, error.message);
        }
      }
    }
  }
  
  console.log(`✅ Đã tạo ${totalRecords} bản ghi sụt lún`);
}

async function seedDataAnalysis(pool, areas) {
  console.log('🤖 Đang tạo dữ liệu phân tích AI...');
  
  let totalAnalysis = 0;
  const today = new Date();
  
  for (const area of areas) {
    const areaResult = await pool.request()
      .input('AreaCode', area.areaCode)
      .query('SELECT AreaId FROM MonitoringAreas WHERE AreaCode = @AreaCode');
    
    if (areaResult.recordset.length === 0) continue;
    
    const areaId = areaResult.recordset[0].AreaId;
    
    // Tạo 1-2 phân tích cho mỗi khu vực
    const numAnalysis = randomInt(1, 2);
    
    for (let i = 0; i < numAnalysis; i++) {
      const analysisType = randomChoice(ANALYSIS_TYPES);
      const daysBack = randomInt(30, 180);
      const periodStart = new Date(today);
      periodStart.setDate(periodStart.getDate() - daysBack - 30);
      const periodEnd = new Date(today);
      periodEnd.setDate(periodEnd.getDate() - daysBack);
      
      const confidenceLevel = area.riskLevel === 'Critical' ? randomFloat(75, 95) :
                             area.riskLevel === 'High' ? randomFloat(70, 90) :
                             area.riskLevel === 'Medium' ? randomFloat(65, 85) :
                             randomFloat(60, 80);
      
      const analysisResult = JSON.stringify({
        summary: `Phân tích ${analysisType} cho khu vực ${area.areaName}`,
        trend: area.riskLevel === 'Critical' ? 'Increasing' : randomChoice(['Increasing', 'Stable', 'Decreasing']),
        factors: ['Groundwater extraction', 'Urban development', 'Soil composition'],
        recommendations: [
          'Tăng cường giám sát',
          'Kiểm tra nguồn nước ngầm',
          'Đánh giá tác động xây dựng'
        ]
      });
      
      try {
        const request = pool.request();
        request.input('AnalysisType', analysisType);
        request.input('AreaId', areaId);
        request.input('PeriodStart', periodStart.toISOString().split('T')[0]);
        request.input('PeriodEnd', periodEnd.toISOString().split('T')[0]);
        request.input('AnalysisResult', analysisResult);
        request.input('ConfidenceLevel', confidenceLevel);
        request.input('CreatedBy', 1);
        
        await request.query(`
          INSERT INTO DataAnalysis (AnalysisType, AreaId, AnalysisPeriodStart, AnalysisPeriodEnd, AnalysisResult, ConfidenceLevel, CreatedBy)
          VALUES (@AnalysisType, @AreaId, @PeriodStart, @PeriodEnd, @AnalysisResult, @ConfidenceLevel, @CreatedBy)
        `);
        
        totalAnalysis++;
      } catch (error) {
        console.error(`Lỗi khi insert analysis cho ${area.areaCode}:`, error.message);
      }
    }
  }
  
  console.log(`✅ Đã tạo ${totalAnalysis} bản phân tích AI`);
}

async function main() {
  try {
    console.log('🚀 Bắt đầu tạo dữ liệu mẫu cho Phân tích Chuyên sâu...\n');
    
    const pool = await getPool();
    console.log('✅ Kết nối database thành công\n');
    
    // 1. Tạo khu vực giám sát
    const areas = await seedMonitoringAreas(pool);
    console.log('');
    
    // 2. Tạo dữ liệu sụt lún (chuỗi thời gian)
    await seedSubsidenceRecords(pool, areas);
    console.log('');
    
    // 3. Tạo dữ liệu phân tích AI
    await seedDataAnalysis(pool, areas);
    console.log('');
    
    console.log('🎉 Hoàn thành! Dữ liệu đã được tạo thành công.');
    console.log('\nBây giờ bạn có thể:');
    console.log('  - Xem nhiều khu vực trên bản đồ phân tích chuyên sâu');
    console.log('  - Click vào khu vực để xem chuỗi thời gian sụt lún');
    console.log('  - Xem độ tin cậy mô hình AI');
    console.log('  - Test chức năng tìm kiếm với nhiều khu vực');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

main();

