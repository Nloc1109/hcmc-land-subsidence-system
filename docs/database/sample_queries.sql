-- =============================================
-- SAMPLE QUERIES VÀ TEST CASES
-- Hệ thống Quản lý Sụt lún Đất TPHCM
-- =============================================

USE HCMC_LandSubsidence;
GO

-- =============================================
-- 1. QUERIES CƠ BẢN
-- =============================================

-- Lấy danh sách tất cả khu vực giám sát với thông tin quận
SELECT 
    ma.AreaCode,
    ma.AreaName,
    d.DistrictName,
    w.WardName,
    ma.RiskLevel,
    ma.Latitude,
    ma.Longitude
FROM MonitoringAreas ma
INNER JOIN Districts d ON ma.DistrictId = d.DistrictId
LEFT JOIN Wards w ON ma.WardId = w.WardId
WHERE ma.IsActive = 1
ORDER BY ma.RiskLevel DESC, ma.AreaName;
GO

-- Lấy danh sách thiết bị cần hiệu chuẩn trong 30 ngày tới
SELECT 
    d.DeviceCode,
    d.DeviceName,
    dt.TypeName AS DeviceType,
    d.NextCalibrationDate,
    DATEDIFF(DAY, GETDATE(), d.NextCalibrationDate) AS DaysUntilCalibration,
    ma.AreaName
FROM Devices d
INNER JOIN DeviceTypes dt ON d.DeviceTypeId = dt.DeviceTypeId
LEFT JOIN MonitoringAreas ma ON d.AreaId = ma.AreaId
WHERE d.IsActive = 1
    AND d.NextCalibrationDate <= DATEADD(DAY, 30, GETDATE())
    AND d.NextCalibrationDate >= GETDATE()
ORDER BY d.NextCalibrationDate;
GO

-- Thống kê số lượng thiết bị theo trạng thái
SELECT 
    Status,
    COUNT(*) AS DeviceCount
FROM Devices
WHERE IsActive = 1
GROUP BY Status
ORDER BY DeviceCount DESC;
GO

-- =============================================
-- 2. QUERIES DỮ LIỆU SỤT LÚN
-- =============================================

-- Lấy dữ liệu sụt lún mới nhất cho mỗi khu vực
SELECT 
    ma.AreaName,
    sr.RecordDate,
    sr.SubsidenceValue,
    sr.CumulativeSubsidence,
    sr.SubsidenceRate,
    sr.QualityRating
FROM SubsidenceRecords sr
INNER JOIN MonitoringAreas ma ON sr.AreaId = ma.AreaId
INNER JOIN (
    SELECT AreaId, MAX(RecordDate) AS MaxDate
    FROM SubsidenceRecords
    GROUP BY AreaId
) latest ON sr.AreaId = latest.AreaId AND sr.RecordDate = latest.MaxDate
WHERE sr.IsVerified = 1
ORDER BY sr.SubsidenceRate DESC;
GO

-- Tính tốc độ sụt lún trung bình theo quận trong 3 tháng gần nhất
SELECT 
    d.DistrictName,
    COUNT(DISTINCT ma.AreaId) AS NumberOfAreas,
    AVG(sr.SubsidenceRate) AS AvgSubsidenceRate,
    MAX(sr.SubsidenceRate) AS MaxSubsidenceRate,
    MIN(sr.SubsidenceRate) AS MinSubsidenceRate
FROM SubsidenceRecords sr
INNER JOIN MonitoringAreas ma ON sr.AreaId = ma.AreaId
INNER JOIN Districts d ON ma.DistrictId = d.DistrictId
WHERE sr.RecordDate >= DATEADD(MONTH, -3, GETDATE())
    AND sr.IsVerified = 1
GROUP BY d.DistrictName
ORDER BY AvgSubsidenceRate DESC;
GO

-- Xác định khu vực có tốc độ sụt lún tăng nhanh nhất
SELECT TOP 10
    ma.AreaName,
    d.DistrictName,
    sr.RecordDate,
    sr.SubsidenceRate,
    sr.CumulativeSubsidence,
    CASE 
        WHEN sr.SubsidenceRate >= 10 THEN 'Critical'
        WHEN sr.SubsidenceRate >= 5 THEN 'High'
        ELSE 'Normal'
    END AS RiskCategory
FROM SubsidenceRecords sr
INNER JOIN MonitoringAreas ma ON sr.AreaId = ma.AreaId
INNER JOIN Districts d ON ma.DistrictId = d.DistrictId
WHERE sr.RecordDate >= DATEADD(MONTH, -1, GETDATE())
    AND sr.IsVerified = 1
ORDER BY sr.SubsidenceRate DESC;
GO

-- =============================================
-- 3. QUERIES CẢNH BÁO
-- =============================================

-- Lấy tất cả cảnh báo đang mở, sắp xếp theo mức độ nghiêm trọng
SELECT 
    a.AlertCode,
    a.Severity,
    a.Title,
    a.Message,
    a.AlertTime,
    ma.AreaName,
    d.DistrictName,
    u.FullName AS AcknowledgedBy,
    a.Status
FROM Alerts a
INNER JOIN MonitoringAreas ma ON a.AreaId = ma.AreaId
INNER JOIN Districts d ON ma.DistrictId = d.DistrictId
LEFT JOIN Users u ON a.AcknowledgedBy = u.UserId
WHERE a.Status IN ('Open', 'Acknowledged')
    AND a.IsActive = 1
ORDER BY 
    CASE a.Severity
        WHEN 'Emergency' THEN 1
        WHEN 'Critical' THEN 2
        WHEN 'Warning' THEN 3
        WHEN 'Info' THEN 4
    END,
    a.AlertTime DESC;
GO

-- Thống kê cảnh báo theo loại và mức độ
SELECT 
    AlertType,
    Severity,
    COUNT(*) AS AlertCount,
    AVG(DATEDIFF(HOUR, AlertTime, ISNULL(AcknowledgedAt, GETDATE()))) AS AvgResponseTimeHours
FROM Alerts
WHERE IsActive = 1
    AND AlertTime >= DATEADD(MONTH, -1, GETDATE())
GROUP BY AlertType, Severity
ORDER BY AlertType, 
    CASE Severity
        WHEN 'Emergency' THEN 1
        WHEN 'Critical' THEN 2
        WHEN 'Warning' THEN 3
        WHEN 'Info' THEN 4
    END;
GO

-- =============================================
-- 4. QUERIES BÁO CÁO
-- =============================================

-- Sử dụng View để lấy tổng hợp sụt lún
SELECT * FROM vw_SubsidenceSummary
WHERE RiskLevel IN ('High', 'Critical')
ORDER BY MaxSubsidenceRate DESC;
GO

-- Lấy trạng thái thiết bị
SELECT 
    DeviceCode,
    DeviceName,
    DeviceType,
    Status,
    BatteryLevel,
    SignalStrength,
    CalibrationStatus,
    AreaName
FROM vw_DeviceStatus
WHERE Status = 'Active'
ORDER BY CalibrationStatus, BatteryLevel;
GO

-- =============================================
-- 5. STORED PROCEDURE EXAMPLES
-- =============================================

-- Gọi stored procedure để lấy dữ liệu sụt lún
EXEC sp_GetSubsidenceData 
    @AreaId = 1,
    @StartDate = '2024-01-01',
    @EndDate = '2024-03-31';
GO

-- Tính toán thống kê sụt lún
EXEC sp_CalculateSubsidenceStats 
    @AreaId = 1,
    @StartDate = '2024-01-01',
    @EndDate = '2024-03-31';
GO

-- =============================================
-- 6. QUERIES PHÂN TÍCH
-- =============================================

-- So sánh tốc độ sụt lún giữa các khu vực
SELECT 
    ma1.AreaName AS Area1,
    AVG(sr1.SubsidenceRate) AS AvgRate1,
    ma2.AreaName AS Area2,
    AVG(sr2.SubsidenceRate) AS AvgRate2,
    ABS(AVG(sr1.SubsidenceRate) - AVG(sr2.SubsidenceRate)) AS RateDifference
FROM SubsidenceRecords sr1
INNER JOIN MonitoringAreas ma1 ON sr1.AreaId = ma1.AreaId
CROSS JOIN (
    SELECT AreaId, AVG(SubsidenceRate) AS AvgRate
    FROM SubsidenceRecords
    WHERE RecordDate >= DATEADD(MONTH, -6, GETDATE())
    GROUP BY AreaId
) sr2
INNER JOIN MonitoringAreas ma2 ON sr2.AreaId = ma2.AreaId
WHERE sr1.RecordDate >= DATEADD(MONTH, -6, GETDATE())
    AND sr1.IsVerified = 1
GROUP BY ma1.AreaName, ma2.AreaName
HAVING ABS(AVG(sr1.SubsidenceRate) - sr2.AvgRate) > 2
ORDER BY RateDifference DESC;
GO

-- Tìm xu hướng sụt lún (tăng/giảm/ổn định)
WITH MonthlyData AS (
    SELECT 
        AreaId,
        YEAR(RecordDate) AS Year,
        MONTH(RecordDate) AS Month,
        AVG(SubsidenceRate) AS AvgRate
    FROM SubsidenceRecords
    WHERE RecordDate >= DATEADD(MONTH, -12, GETDATE())
        AND IsVerified = 1
    GROUP BY AreaId, YEAR(RecordDate), MONTH(RecordDate)
),
TrendAnalysis AS (
    SELECT 
        AreaId,
        AVG(CASE WHEN Month <= 6 THEN AvgRate END) AS FirstHalfAvg,
        AVG(CASE WHEN Month > 6 THEN AvgRate END) AS SecondHalfAvg
    FROM MonthlyData
    GROUP BY AreaId
)
SELECT 
    ma.AreaName,
    ta.FirstHalfAvg,
    ta.SecondHalfAvg,
    (ta.SecondHalfAvg - ta.FirstHalfAvg) AS Change,
    CASE 
        WHEN (ta.SecondHalfAvg - ta.FirstHalfAvg) > 1 THEN 'Increasing'
        WHEN (ta.SecondHalfAvg - ta.FirstHalfAvg) < -1 THEN 'Decreasing'
        ELSE 'Stable'
    END AS Trend
FROM TrendAnalysis ta
INNER JOIN MonitoringAreas ma ON ta.AreaId = ma.AreaId
WHERE ta.FirstHalfAvg IS NOT NULL AND ta.SecondHalfAvg IS NOT NULL
ORDER BY ABS(Change) DESC;
GO

-- =============================================
-- 7. QUERIES BẢO TRÌ
-- =============================================

-- Lịch bảo trì sắp tới
SELECT 
    ms.ScheduleId,
    d.DeviceCode,
    d.DeviceName,
    ms.ScheduleType,
    ms.ScheduledDate,
    DATEDIFF(DAY, GETDATE(), ms.ScheduledDate) AS DaysUntil,
    u.FullName AS AssignedTo,
    ms.Status
FROM MaintenanceSchedules ms
LEFT JOIN Devices d ON ms.DeviceId = d.DeviceId
LEFT JOIN Users u ON ms.AssignedTo = u.UserId
WHERE ms.Status IN ('Scheduled', 'InProgress')
    AND ms.ScheduledDate >= GETDATE()
ORDER BY ms.ScheduledDate;
GO

-- Chi phí bảo trì theo tháng
SELECT 
    YEAR(CompletedDate) AS Year,
    MONTH(CompletedDate) AS Month,
    COUNT(*) AS MaintenanceCount,
    SUM(Cost) AS TotalCost,
    AVG(Cost) AS AvgCost
FROM MaintenanceSchedules
WHERE Status = 'Completed'
    AND CompletedDate >= DATEADD(MONTH, -12, GETDATE())
    AND Cost IS NOT NULL
GROUP BY YEAR(CompletedDate), MONTH(CompletedDate)
ORDER BY Year DESC, Month DESC;
GO

-- =============================================
-- 8. QUERIES AUDIT VÀ LOGS
-- =============================================

-- Lịch sử hoạt động của người dùng
SELECT 
    u.Username,
    u.FullName,
    al.ActionType,
    al.EntityType,
    al.CreatedAt,
    al.IpAddress
FROM AuditLogs al
INNER JOIN Users u ON al.UserId = u.UserId
WHERE al.CreatedAt >= DATEADD(DAY, -7, GETDATE())
ORDER BY al.CreatedAt DESC;
GO

-- Thống kê hoạt động theo loại
SELECT 
    ActionType,
    EntityType,
    COUNT(*) AS ActionCount
FROM AuditLogs
WHERE CreatedAt >= DATEADD(DAY, -30, GETDATE())
GROUP BY ActionType, EntityType
ORDER BY ActionCount DESC;
GO

-- =============================================
-- 9. TEST QUERIES - VALIDATION
-- =============================================

-- Kiểm tra dữ liệu không hợp lệ
-- 1. Measurements với giá trị âm không hợp lý
SELECT 
    MeasurementId,
    DeviceId,
    MeasurementTime,
    Value,
    Unit
FROM Measurements
WHERE Value < 0
    AND Unit IN ('mm', 'cm', 'm'); -- Sụt lún không thể âm (trừ khi nâng lên)
GO

-- 2. SubsidenceRecords với tốc độ quá cao (có thể là lỗi)
SELECT 
    RecordId,
    AreaId,
    RecordDate,
    SubsidenceRate,
    QualityRating
FROM SubsidenceRecords
WHERE SubsidenceRate > 50 -- Tốc độ > 50mm/year có thể là lỗi
    AND QualityRating = 'Good'
ORDER BY SubsidenceRate DESC;
GO

-- 3. Devices với pin thấp nhưng vẫn Active
SELECT 
    DeviceId,
    DeviceCode,
    DeviceName,
    BatteryLevel,
    Status,
    LastCalibrationDate
FROM Devices
WHERE Status = 'Active'
    AND BatteryLevel < 20
    AND IsActive = 1;
GO

-- 4. Alerts chưa được xử lý trong thời gian dài
SELECT 
    AlertId,
    AlertCode,
    Severity,
    Title,
    AlertTime,
    DATEDIFF(DAY, AlertTime, GETDATE()) AS DaysOpen
FROM Alerts
WHERE Status = 'Open'
    AND AlertTime < DATEADD(DAY, -7, GETDATE())
ORDER BY DaysOpen DESC;
GO

-- =============================================
-- 10. PERFORMANCE TEST QUERIES
-- =============================================

-- Test query với dữ liệu lớn (giả sử có nhiều records)
-- Đếm số lượng measurements trong 1 năm
SELECT 
    COUNT(*) AS TotalMeasurements,
    COUNT(DISTINCT DeviceId) AS UniqueDevices,
    MIN(MeasurementTime) AS FirstMeasurement,
    MAX(MeasurementTime) AS LastMeasurement
FROM Measurements
WHERE MeasurementTime >= DATEADD(YEAR, -1, GETDATE());
GO

-- Test join phức tạp
SELECT 
    d.DistrictName,
    COUNT(DISTINCT ma.AreaId) AS AreaCount,
    COUNT(DISTINCT ms.StationId) AS StationCount,
    COUNT(DISTINCT dev.DeviceId) AS DeviceCount,
    COUNT(sr.RecordId) AS RecordCount,
    AVG(sr.SubsidenceRate) AS AvgSubsidenceRate
FROM Districts d
LEFT JOIN MonitoringAreas ma ON d.DistrictId = ma.DistrictId
LEFT JOIN MonitoringStations ms ON ma.AreaId = ms.AreaId
LEFT JOIN Devices dev ON ma.AreaId = dev.AreaId
LEFT JOIN SubsidenceRecords sr ON ma.AreaId = sr.AreaId
WHERE d.IsActive = 1
GROUP BY d.DistrictName
ORDER BY RecordCount DESC;
GO

-- =============================================
-- 11. DATA INTEGRITY CHECKS
-- =============================================

-- Kiểm tra Foreign Key integrity
-- Tìm SubsidenceRecords với AreaId không tồn tại (không nên có)
SELECT sr.RecordId, sr.AreaId
FROM SubsidenceRecords sr
LEFT JOIN MonitoringAreas ma ON sr.AreaId = ma.AreaId
WHERE ma.AreaId IS NULL;
GO

-- Kiểm tra dữ liệu trùng lặp
SELECT 
    AreaId,
    RecordDate,
    COUNT(*) AS DuplicateCount
FROM SubsidenceRecords
GROUP BY AreaId, RecordDate
HAVING COUNT(*) > 1;
GO

-- Kiểm tra dữ liệu thiếu (Missing data)
SELECT 
    d.DeviceId,
    d.DeviceCode,
    d.DeviceName,
    MAX(m.MeasurementTime) AS LastMeasurement,
    DATEDIFF(HOUR, MAX(m.MeasurementTime), GETDATE()) AS HoursSinceLastMeasurement
FROM Devices d
LEFT JOIN Measurements m ON d.DeviceId = m.DeviceId
WHERE d.Status = 'Active'
    AND d.IsActive = 1
GROUP BY d.DeviceId, d.DeviceCode, d.DeviceName
HAVING MAX(m.MeasurementTime) < DATEADD(DAY, -1, GETDATE())
    OR MAX(m.MeasurementTime) IS NULL
ORDER BY HoursSinceLastMeasurement DESC;
GO

-- =============================================
-- KẾT THÚC
-- =============================================

PRINT N'Đã hoàn thành các sample queries và test cases!';
