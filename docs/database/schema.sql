-- =============================================
-- HỆ THỐNG QUẢN LÝ SỤT LÚN ĐẤT TPHCM
-- Database Schema Design
-- SQL Server Database
-- =============================================

USE master;
GO

-- Tạo database nếu chưa tồn tại
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'HCMC_LandSubsidence')
BEGIN
    CREATE DATABASE HCMC_LandSubsidence;
END
GO

USE HCMC_LandSubsidence;
GO

-- =============================================
-- XÓA CÁC ĐỐI TƯỢNG CŨ (NẾU CẦN CHẠY LẠI)
-- =============================================

-- Xóa Views
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_DeviceStatus') DROP VIEW vw_DeviceStatus;
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_ActiveAlerts') DROP VIEW vw_ActiveAlerts;
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_SubsidenceSummary') DROP VIEW vw_SubsidenceSummary;
GO

-- Xóa Stored Procedures
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_CalculateSubsidenceStats') DROP PROCEDURE sp_CalculateSubsidenceStats;
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetSubsidenceData') DROP PROCEDURE sp_GetSubsidenceData;
GO

-- Xóa Triggers
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_SubsidenceRecords_CheckThreshold') DROP TRIGGER TR_SubsidenceRecords_CheckThreshold;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_SubsidenceRecords_UpdateTime') DROP TRIGGER TR_SubsidenceRecords_UpdateTime;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_MonitoringAreas_UpdateTime') DROP TRIGGER TR_MonitoringAreas_UpdateTime;
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Users_UpdateTime') DROP TRIGGER TR_Users_UpdateTime;
GO

-- Xóa Tables (theo thứ tự ngược lại với Foreign Keys)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLogs') DROP TABLE AuditLogs;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'MaintenanceSchedules') DROP TABLE MaintenanceSchedules;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'DataAnalysis') DROP TABLE DataAnalysis;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Reports') DROP TABLE Reports;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications') DROP TABLE Notifications;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Alerts') DROP TABLE Alerts;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'AlertThresholds') DROP TABLE AlertThresholds;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SubsidenceHistory') DROP TABLE SubsidenceHistory;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SubsidenceRecords') DROP TABLE SubsidenceRecords;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Measurements') DROP TABLE Measurements;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'StationDevices') DROP TABLE StationDevices;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'MonitoringStations') DROP TABLE MonitoringStations;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Devices') DROP TABLE Devices;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Manufacturers') DROP TABLE Manufacturers;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'DeviceTypes') DROP TABLE DeviceTypes;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'MonitoringAreas') DROP TABLE MonitoringAreas;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Wards') DROP TABLE Wards;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Districts') DROP TABLE Districts;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'RefreshTokens') DROP TABLE RefreshTokens;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Users') DROP TABLE Users;
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles') DROP TABLE Roles;
GO

-- =============================================
-- 1. BẢNG QUẢN LÝ NGƯỜI DÙNG VÀ PHÂN QUYỀN
-- =============================================

-- Bảng vai trò (Roles)
CREATE TABLE Roles (
    RoleId INT PRIMARY KEY IDENTITY(1,1),
    RoleName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT CK_RoleName CHECK (LEN(RoleName) >= 2)
);
GO

-- Bảng người dùng (Users)
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    PhoneNumber NVARCHAR(20),
    RoleId INT NOT NULL,
    IsActive BIT DEFAULT 1,
    LastLoginAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy INT,
    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES Roles(RoleId),
    CONSTRAINT FK_Users_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
    CONSTRAINT CK_Email CHECK (Email LIKE '%@%.%'),
    CONSTRAINT CK_PhoneNumber CHECK (PhoneNumber IS NULL OR LEN(PhoneNumber) >= 10)
);
GO

-- Bảng refresh tokens cho JWT
CREATE TABLE RefreshTokens (
    TokenId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    Token NVARCHAR(500) NOT NULL UNIQUE,
    ExpiresAt DATETIME2 NOT NULL,
    IsRevoked BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_RefreshTokens_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
);
GO

-- =============================================
-- 2. BẢNG QUẢN LÝ ĐỊA LÝ VÀ KHU VỰC
-- =============================================

-- Bảng quận/huyện
CREATE TABLE Districts (
    DistrictId INT PRIMARY KEY IDENTITY(1,1),
    DistrictCode NVARCHAR(10) NOT NULL UNIQUE,
    DistrictName NVARCHAR(100) NOT NULL,
    AreaKm2 DECIMAL(10,2),
    Population INT,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT CK_DistrictCode CHECK (LEN(DistrictCode) >= 2)
);
GO

-- Bảng phường/xã
CREATE TABLE Wards (
    WardId INT PRIMARY KEY IDENTITY(1,1),
    WardCode NVARCHAR(10) NOT NULL UNIQUE,
    WardName NVARCHAR(100) NOT NULL,
    DistrictId INT NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Wards_Districts FOREIGN KEY (DistrictId) REFERENCES Districts(DistrictId),
    CONSTRAINT CK_WardCode CHECK (LEN(WardCode) >= 2)
);
GO

-- Bảng khu vực giám sát (Monitoring Areas)
CREATE TABLE MonitoringAreas (
    AreaId INT PRIMARY KEY IDENTITY(1,1),
    AreaCode NVARCHAR(20) NOT NULL UNIQUE,
    AreaName NVARCHAR(200) NOT NULL,
    WardId INT,
    DistrictId INT NOT NULL,
    Latitude DECIMAL(10,8) NOT NULL,
    Longitude DECIMAL(11,8) NOT NULL,
    Elevation DECIMAL(8,2), -- Độ cao so với mực nước biển (m)
    AreaType NVARCHAR(50), -- 'Urban', 'Industrial', 'Residential', 'Agricultural'
    RiskLevel NVARCHAR(20) DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
    Description NVARCHAR(500),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy INT,
    CONSTRAINT FK_MonitoringAreas_Wards FOREIGN KEY (WardId) REFERENCES Wards(WardId),
    CONSTRAINT FK_MonitoringAreas_Districts FOREIGN KEY (DistrictId) REFERENCES Districts(DistrictId),
    CONSTRAINT FK_MonitoringAreas_Users FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
    CONSTRAINT CK_Latitude CHECK (Latitude BETWEEN -90 AND 90),
    CONSTRAINT CK_Longitude CHECK (Longitude BETWEEN -180 AND 180),
    CONSTRAINT CK_RiskLevel CHECK (RiskLevel IN ('Low', 'Medium', 'High', 'Critical'))
);
GO

-- =============================================
-- 3. BẢNG QUẢN LÝ THIẾT BỊ VÀ TRẠM GIÁM SÁT
-- =============================================

-- Bảng loại thiết bị
CREATE TABLE DeviceTypes (
    DeviceTypeId INT PRIMARY KEY IDENTITY(1,1),
    TypeName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255),
    MeasurementUnit NVARCHAR(20), -- 'mm', 'cm', 'm', 'degree'
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);
GO

-- Bảng nhà sản xuất thiết bị
CREATE TABLE Manufacturers (
    ManufacturerId INT PRIMARY KEY IDENTITY(1,1),
    ManufacturerName NVARCHAR(100) NOT NULL UNIQUE,
    Country NVARCHAR(50),
    ContactInfo NVARCHAR(255),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);
GO

-- Bảng thiết bị cảm biến (Sensors/Devices)
CREATE TABLE Devices (
    DeviceId INT PRIMARY KEY IDENTITY(1,1),
    DeviceCode NVARCHAR(50) NOT NULL UNIQUE,
    DeviceName NVARCHAR(200) NOT NULL,
    DeviceTypeId INT NOT NULL,
    ManufacturerId INT,
    SerialNumber NVARCHAR(100),
    Model NVARCHAR(100),
    InstallationDate DATE,
    LastCalibrationDate DATE,
    NextCalibrationDate DATE,
    Status NVARCHAR(20) DEFAULT 'Active', -- 'Active', 'Inactive', 'Maintenance', 'Faulty'
    BatteryLevel INT, -- 0-100
    SignalStrength INT, -- 0-100
    Latitude DECIMAL(10,8),
    Longitude DECIMAL(11,8),
    Elevation DECIMAL(8,2),
    AreaId INT,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Devices_DeviceTypes FOREIGN KEY (DeviceTypeId) REFERENCES DeviceTypes(DeviceTypeId),
    CONSTRAINT FK_Devices_Manufacturers FOREIGN KEY (ManufacturerId) REFERENCES Manufacturers(ManufacturerId),
    CONSTRAINT FK_Devices_MonitoringAreas FOREIGN KEY (AreaId) REFERENCES MonitoringAreas(AreaId),
    CONSTRAINT CK_DeviceStatus CHECK (Status IN ('Active', 'Inactive', 'Maintenance', 'Faulty')),
    CONSTRAINT CK_BatteryLevel CHECK (BatteryLevel IS NULL OR (BatteryLevel >= 0 AND BatteryLevel <= 100)),
    CONSTRAINT CK_SignalStrength CHECK (SignalStrength IS NULL OR (SignalStrength >= 0 AND SignalStrength <= 100))
);
GO

-- Bảng trạm giám sát (Monitoring Stations)
CREATE TABLE MonitoringStations (
    StationId INT PRIMARY KEY IDENTITY(1,1),
    StationCode NVARCHAR(20) NOT NULL UNIQUE,
    StationName NVARCHAR(200) NOT NULL,
    AreaId INT NOT NULL,
    Latitude DECIMAL(10,8) NOT NULL,
    Longitude DECIMAL(11,8) NOT NULL,
    Elevation DECIMAL(8,2),
    StationType NVARCHAR(50), -- 'Automatic', 'Manual', 'Hybrid'
    InstallationDate DATE,
    Status NVARCHAR(20) DEFAULT 'Active',
    Description NVARCHAR(500),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy INT,
    CONSTRAINT FK_MonitoringStations_Areas FOREIGN KEY (AreaId) REFERENCES MonitoringAreas(AreaId),
    CONSTRAINT FK_MonitoringStations_Users FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
    CONSTRAINT CK_StationStatus CHECK (Status IN ('Active', 'Inactive', 'Maintenance', 'Decommissioned'))
);
GO

-- Bảng liên kết thiết bị với trạm
CREATE TABLE StationDevices (
    StationDeviceId INT PRIMARY KEY IDENTITY(1,1),
    StationId INT NOT NULL,
    DeviceId INT NOT NULL,
    InstalledDate DATE,
    RemovedDate DATE,
    IsActive BIT DEFAULT 1,
    CONSTRAINT FK_StationDevices_Stations FOREIGN KEY (StationId) REFERENCES MonitoringStations(StationId),
    CONSTRAINT FK_StationDevices_Devices FOREIGN KEY (DeviceId) REFERENCES Devices(DeviceId),
    CONSTRAINT UQ_StationDevice UNIQUE (StationId, DeviceId, InstalledDate)
);
GO

-- =============================================
-- 4. BẢNG DỮ LIỆU ĐO LƯỜNG VÀ SỤT LÚN
-- =============================================

-- Bảng dữ liệu đo lường (Measurement Data)
CREATE TABLE Measurements (
    MeasurementId BIGINT PRIMARY KEY IDENTITY(1,1),
    DeviceId INT NOT NULL,
    StationId INT,
    MeasurementTime DATETIME2 NOT NULL,
    Value DECIMAL(12,4) NOT NULL,
    Unit NVARCHAR(20),
    DataQuality NVARCHAR(20) DEFAULT 'Good', -- 'Good', 'Fair', 'Poor', 'Invalid'
    Temperature DECIMAL(6,2), -- Nhiệt độ môi trường
    Humidity DECIMAL(5,2), -- Độ ẩm (%)
    Pressure DECIMAL(8,2), -- Áp suất (hPa)
    RawData NVARCHAR(500), -- Dữ liệu thô từ thiết bị
    IsProcessed BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Measurements_Devices FOREIGN KEY (DeviceId) REFERENCES Devices(DeviceId),
    CONSTRAINT FK_Measurements_Stations FOREIGN KEY (StationId) REFERENCES MonitoringStations(StationId),
    CONSTRAINT CK_DataQuality CHECK (DataQuality IN ('Good', 'Fair', 'Poor', 'Invalid')),
    CONSTRAINT CK_MeasurementTime CHECK (MeasurementTime <= GETDATE())
);
GO

-- Bảng bản ghi sụt lún (Subsidence Records)
CREATE TABLE SubsidenceRecords (
    RecordId BIGINT PRIMARY KEY IDENTITY(1,1),
    AreaId INT NOT NULL,
    StationId INT,
    RecordDate DATE NOT NULL,
    SubsidenceValue DECIMAL(10,4) NOT NULL, -- Giá trị sụt lún (mm)
    CumulativeSubsidence DECIMAL(10,4), -- Sụt lún tích lũy (mm)
    SubsidenceRate DECIMAL(8,4), -- Tốc độ sụt lún (mm/year)
    MeasurementMethod NVARCHAR(50), -- 'GPS', 'InSAR', 'Leveling', 'Sensor'
    DataSource NVARCHAR(50), -- 'Automatic', 'Manual', 'Satellite'
    QualityRating NVARCHAR(20) DEFAULT 'Good',
    Notes NVARCHAR(1000),
    VerifiedBy INT,
    VerifiedAt DATETIME2,
    IsVerified BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy INT,
    CONSTRAINT FK_SubsidenceRecords_Areas FOREIGN KEY (AreaId) REFERENCES MonitoringAreas(AreaId),
    CONSTRAINT FK_SubsidenceRecords_Stations FOREIGN KEY (StationId) REFERENCES MonitoringStations(StationId),
    CONSTRAINT FK_SubsidenceRecords_VerifiedBy FOREIGN KEY (VerifiedBy) REFERENCES Users(UserId),
    CONSTRAINT FK_SubsidenceRecords_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
    CONSTRAINT CK_QualityRating CHECK (QualityRating IN ('Excellent', 'Good', 'Fair', 'Poor'))
);
GO

-- Bảng lịch sử thay đổi sụt lún (để theo dõi xu hướng)
CREATE TABLE SubsidenceHistory (
    HistoryId BIGINT PRIMARY KEY IDENTITY(1,1),
    AreaId INT NOT NULL,
    PeriodStart DATE NOT NULL,
    PeriodEnd DATE NOT NULL,
    AverageSubsidence DECIMAL(10,4),
    MaxSubsidence DECIMAL(10,4),
    MinSubsidence DECIMAL(10,4),
    RecordCount INT,
    Trend NVARCHAR(20), -- 'Increasing', 'Decreasing', 'Stable', 'Fluctuating'
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_SubsidenceHistory_Areas FOREIGN KEY (AreaId) REFERENCES MonitoringAreas(AreaId),
    CONSTRAINT CK_Period CHECK (PeriodEnd >= PeriodStart),
    CONSTRAINT CK_Trend CHECK (Trend IN ('Increasing', 'Decreasing', 'Stable', 'Fluctuating'))
);
GO

-- =============================================
-- 5. BẢNG CẢNH BÁO VÀ THÔNG BÁO
-- =============================================

-- Bảng cấu hình ngưỡng cảnh báo
CREATE TABLE AlertThresholds (
    ThresholdId INT PRIMARY KEY IDENTITY(1,1),
    AreaId INT,
    DeviceTypeId INT,
    ThresholdType NVARCHAR(50) NOT NULL, -- 'SubsidenceRate', 'CumulativeSubsidence', 'MeasurementValue'
    WarningLevel DECIMAL(10,4) NOT NULL,
    CriticalLevel DECIMAL(10,4) NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_AlertThresholds_Areas FOREIGN KEY (AreaId) REFERENCES MonitoringAreas(AreaId),
    CONSTRAINT FK_AlertThresholds_DeviceTypes FOREIGN KEY (DeviceTypeId) REFERENCES DeviceTypes(DeviceTypeId),
    CONSTRAINT CK_CriticalLevel CHECK (CriticalLevel >= WarningLevel)
);
GO

-- Bảng cảnh báo (Alerts)
CREATE TABLE Alerts (
    AlertId BIGINT PRIMARY KEY IDENTITY(1,1),
    AlertCode NVARCHAR(50) NOT NULL UNIQUE,
    AreaId INT,
    StationId INT,
    DeviceId INT,
    AlertType NVARCHAR(50) NOT NULL, -- 'Subsidence', 'DeviceFault', 'DataQuality', 'ThresholdExceeded'
    Severity NVARCHAR(20) NOT NULL, -- 'Info', 'Warning', 'Critical', 'Emergency'
    Title NVARCHAR(200) NOT NULL,
    Message NVARCHAR(1000),
    AlertValue DECIMAL(12,4),
    ThresholdValue DECIMAL(12,4),
    AlertTime DATETIME2 NOT NULL DEFAULT GETDATE(),
    AcknowledgedBy INT,
    AcknowledgedAt DATETIME2,
    ResolvedBy INT,
    ResolvedAt DATETIME2,
    ResolutionNotes NVARCHAR(1000),
    Status NVARCHAR(20) DEFAULT 'Open', -- 'Open', 'Acknowledged', 'Resolved', 'Closed'
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Alerts_Areas FOREIGN KEY (AreaId) REFERENCES MonitoringAreas(AreaId),
    CONSTRAINT FK_Alerts_Stations FOREIGN KEY (StationId) REFERENCES MonitoringStations(StationId),
    CONSTRAINT FK_Alerts_Devices FOREIGN KEY (DeviceId) REFERENCES Devices(DeviceId),
    CONSTRAINT FK_Alerts_AcknowledgedBy FOREIGN KEY (AcknowledgedBy) REFERENCES Users(UserId),
    CONSTRAINT FK_Alerts_ResolvedBy FOREIGN KEY (ResolvedBy) REFERENCES Users(UserId),
    CONSTRAINT CK_AlertSeverity CHECK (Severity IN ('Info', 'Warning', 'Critical', 'Emergency')),
    CONSTRAINT CK_AlertStatus CHECK (Status IN ('Open', 'Acknowledged', 'Resolved', 'Closed'))
);
GO

-- Bảng thông báo cho người dùng
CREATE TABLE Notifications (
    NotificationId BIGINT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    AlertId BIGINT,
    Title NVARCHAR(200) NOT NULL,
    Message NVARCHAR(1000),
    NotificationType NVARCHAR(50), -- 'Alert', 'System', 'Report', 'Maintenance'
    IsRead BIT DEFAULT 0,
    ReadAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
    CONSTRAINT FK_Notifications_Alerts FOREIGN KEY (AlertId) REFERENCES Alerts(AlertId)
);
GO

-- =============================================
-- 6. BẢNG BÁO CÁO VÀ PHÂN TÍCH
-- =============================================

-- Bảng báo cáo (Reports)
CREATE TABLE Reports (
    ReportId INT PRIMARY KEY IDENTITY(1,1),
    ReportCode NVARCHAR(50) NOT NULL UNIQUE,
    ReportType NVARCHAR(50) NOT NULL, -- 'Daily', 'Weekly', 'Monthly', 'Annual', 'Custom'
    ReportTitle NVARCHAR(200) NOT NULL,
    ReportPeriodStart DATE,
    ReportPeriodEnd DATE,
    AreaId INT,
    DistrictId INT,
    ReportData NVARCHAR(MAX), -- JSON hoặc XML data
    FilePath NVARCHAR(500), -- Đường dẫn file PDF/Excel
    Status NVARCHAR(20) DEFAULT 'Draft', -- 'Draft', 'Pending', 'Approved', 'Published'
    ApprovedBy INT,
    ApprovedAt DATETIME2,
    PublishedAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy INT NOT NULL,
    CONSTRAINT FK_Reports_Areas FOREIGN KEY (AreaId) REFERENCES MonitoringAreas(AreaId),
    CONSTRAINT FK_Reports_Districts FOREIGN KEY (DistrictId) REFERENCES Districts(DistrictId),
    CONSTRAINT FK_Reports_ApprovedBy FOREIGN KEY (ApprovedBy) REFERENCES Users(UserId),
    CONSTRAINT FK_Reports_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
    CONSTRAINT CK_ReportStatus CHECK (Status IN ('Draft', 'Pending', 'Approved', 'Published'))
);
GO

-- Bảng phân tích dữ liệu (Data Analysis)
CREATE TABLE DataAnalysis (
    AnalysisId INT PRIMARY KEY IDENTITY(1,1),
    AnalysisType NVARCHAR(50) NOT NULL, -- 'Trend', 'Correlation', 'Prediction', 'Anomaly'
    AreaId INT,
    AnalysisPeriodStart DATE,
    AnalysisPeriodEnd DATE,
    AnalysisResult NVARCHAR(MAX), -- JSON data
    ConfidenceLevel DECIMAL(5,2), -- 0-100
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy INT,
    CONSTRAINT FK_DataAnalysis_Areas FOREIGN KEY (AreaId) REFERENCES MonitoringAreas(AreaId),
    CONSTRAINT FK_DataAnalysis_Users FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
    CONSTRAINT CK_ConfidenceLevel CHECK (ConfidenceLevel >= 0 AND ConfidenceLevel <= 100)
);
GO

-- =============================================
-- 7. BẢNG BẢO TRÌ VÀ LỊCH SỬ
-- =============================================

-- Bảng lịch bảo trì
CREATE TABLE MaintenanceSchedules (
    ScheduleId INT PRIMARY KEY IDENTITY(1,1),
    DeviceId INT,
    StationId INT,
    ScheduleType NVARCHAR(50), -- 'Preventive', 'Corrective', 'Calibration'
    ScheduledDate DATE NOT NULL,
    CompletedDate DATE,
    MaintenanceNotes NVARCHAR(1000),
    Cost DECIMAL(12,2),
    Status NVARCHAR(20) DEFAULT 'Scheduled', -- 'Scheduled', 'InProgress', 'Completed', 'Cancelled'
    AssignedTo INT,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy INT,
    CONSTRAINT FK_MaintenanceSchedules_Devices FOREIGN KEY (DeviceId) REFERENCES Devices(DeviceId),
    CONSTRAINT FK_MaintenanceSchedules_Stations FOREIGN KEY (StationId) REFERENCES MonitoringStations(StationId),
    CONSTRAINT FK_MaintenanceSchedules_AssignedTo FOREIGN KEY (AssignedTo) REFERENCES Users(UserId),
    CONSTRAINT FK_MaintenanceSchedules_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
    CONSTRAINT CK_MaintenanceStatus CHECK (Status IN ('Scheduled', 'InProgress', 'Completed', 'Cancelled'))
);
GO

-- Bảng lịch sử hoạt động (Audit Log)
CREATE TABLE AuditLogs (
    LogId BIGINT PRIMARY KEY IDENTITY(1,1),
    UserId INT,
    ActionType NVARCHAR(50) NOT NULL, -- 'Create', 'Update', 'Delete', 'Login', 'Logout'
    EntityType NVARCHAR(50), -- Tên bảng
    EntityId INT, -- ID của bản ghi
    OldValues NVARCHAR(MAX), -- JSON
    NewValues NVARCHAR(MAX), -- JSON
    IpAddress NVARCHAR(45),
    UserAgent NVARCHAR(500),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_AuditLogs_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
);
GO

-- =============================================
-- 8. TẠO INDEXES ĐỂ TỐI ƯU HIỆU SUẤT
-- =============================================

-- Indexes cho Users
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_RoleId ON Users(RoleId);
CREATE INDEX IX_Users_IsActive ON Users(IsActive);

-- Indexes cho MonitoringAreas
CREATE INDEX IX_MonitoringAreas_DistrictId ON MonitoringAreas(DistrictId);
CREATE INDEX IX_MonitoringAreas_WardId ON MonitoringAreas(WardId);
CREATE INDEX IX_MonitoringAreas_RiskLevel ON MonitoringAreas(RiskLevel);
CREATE INDEX IX_MonitoringAreas_Location ON MonitoringAreas(Latitude, Longitude);

-- Indexes cho Devices
CREATE INDEX IX_Devices_AreaId ON Devices(AreaId);
CREATE INDEX IX_Devices_DeviceTypeId ON Devices(DeviceTypeId);
CREATE INDEX IX_Devices_Status ON Devices(Status);

-- Indexes cho Measurements
CREATE INDEX IX_Measurements_DeviceId ON Measurements(DeviceId);
CREATE INDEX IX_Measurements_StationId ON Measurements(StationId);
CREATE INDEX IX_Measurements_MeasurementTime ON Measurements(MeasurementTime);
CREATE INDEX IX_Measurements_DeviceId_Time ON Measurements(DeviceId, MeasurementTime);

-- Indexes cho SubsidenceRecords
CREATE INDEX IX_SubsidenceRecords_AreaId ON SubsidenceRecords(AreaId);
CREATE INDEX IX_SubsidenceRecords_StationId ON SubsidenceRecords(StationId);
CREATE INDEX IX_SubsidenceRecords_RecordDate ON SubsidenceRecords(RecordDate);
CREATE INDEX IX_SubsidenceRecords_AreaId_Date ON SubsidenceRecords(AreaId, RecordDate);

-- Indexes cho Alerts
CREATE INDEX IX_Alerts_AreaId ON Alerts(AreaId);
CREATE INDEX IX_Alerts_Status ON Alerts(Status);
CREATE INDEX IX_Alerts_Severity ON Alerts(Severity);
CREATE INDEX IX_Alerts_AlertTime ON Alerts(AlertTime);
CREATE INDEX IX_Alerts_Status_Time ON Alerts(Status, AlertTime);

-- Indexes cho Notifications
CREATE INDEX IX_Notifications_UserId ON Notifications(UserId);
CREATE INDEX IX_Notifications_IsRead ON Notifications(IsRead);
CREATE INDEX IX_Notifications_CreatedAt ON Notifications(CreatedAt);

-- Indexes cho Reports
CREATE INDEX IX_Reports_ReportType ON Reports(ReportType);
CREATE INDEX IX_Reports_Status ON Reports(Status);
CREATE INDEX IX_Reports_CreatedBy ON Reports(CreatedBy);

-- Indexes cho AuditLogs
CREATE INDEX IX_AuditLogs_UserId ON AuditLogs(UserId);
CREATE INDEX IX_AuditLogs_EntityType ON AuditLogs(EntityType);
CREATE INDEX IX_AuditLogs_CreatedAt ON AuditLogs(CreatedAt);

GO

-- =============================================
-- 9. TẠO TRIGGERS
-- =============================================

-- Trigger tự động cập nhật UpdatedAt
CREATE TRIGGER TR_Users_UpdateTime ON Users
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users
    SET UpdatedAt = GETDATE()
    FROM Users u
    INNER JOIN inserted i ON u.UserId = i.UserId;
END;
GO

CREATE TRIGGER TR_MonitoringAreas_UpdateTime ON MonitoringAreas
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE MonitoringAreas
    SET UpdatedAt = GETDATE()
    FROM MonitoringAreas ma
    INNER JOIN inserted i ON ma.AreaId = i.AreaId;
END;
GO

CREATE TRIGGER TR_SubsidenceRecords_UpdateTime ON SubsidenceRecords
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE SubsidenceRecords
    SET UpdatedAt = GETDATE()
    FROM SubsidenceRecords sr
    INNER JOIN inserted i ON sr.RecordId = i.RecordId;
END;
GO

-- Trigger tự động tạo cảnh báo khi vượt ngưỡng
CREATE TRIGGER TR_SubsidenceRecords_CheckThreshold ON SubsidenceRecords
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @AreaId INT;
    DECLARE @SubsidenceRate DECIMAL(8,4);
    DECLARE @CumulativeSubsidence DECIMAL(10,4);
    DECLARE @WarningLevel DECIMAL(10,4);
    DECLARE @CriticalLevel DECIMAL(10,4);
    DECLARE @Severity NVARCHAR(20);
    DECLARE @AlertCode NVARCHAR(50);
    
    DECLARE threshold_cursor CURSOR FOR
    SELECT 
        i.AreaId,
        i.SubsidenceRate,
        i.CumulativeSubsidence,
        at.WarningLevel,
        at.CriticalLevel
    FROM inserted i
    INNER JOIN AlertThresholds at ON i.AreaId = at.AreaId
    WHERE at.ThresholdType = 'SubsidenceRate' AND at.IsActive = 1;
    
    OPEN threshold_cursor;
    FETCH NEXT FROM threshold_cursor INTO @AreaId, @SubsidenceRate, @CumulativeSubsidence, @WarningLevel, @CriticalLevel;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF @SubsidenceRate >= @CriticalLevel
        BEGIN
            SET @Severity = 'Critical';
            SET @AlertCode = 'SUB-CRIT-' + CAST(NEWID() AS NVARCHAR(36));
            
            INSERT INTO Alerts (AlertCode, AreaId, AlertType, Severity, Title, Message, AlertValue, ThresholdValue)
            VALUES (
                @AlertCode,
                @AreaId,
                'Subsidence',
                @Severity,
                N'Cảnh báo sụt lún nghiêm trọng',
                N'Tốc độ sụt lún đã vượt ngưỡng nghiêm trọng: ' + CAST(@SubsidenceRate AS NVARCHAR(20)) + ' mm/year',
                @SubsidenceRate,
                @CriticalLevel
            );
        END
        ELSE IF @SubsidenceRate >= @WarningLevel
        BEGIN
            SET @Severity = 'Warning';
            SET @AlertCode = 'SUB-WARN-' + CAST(NEWID() AS NVARCHAR(36));
            
            INSERT INTO Alerts (AlertCode, AreaId, AlertType, Severity, Title, Message, AlertValue, ThresholdValue)
            VALUES (
                @AlertCode,
                @AreaId,
                'Subsidence',
                @Severity,
                N'Cảnh báo sụt lún',
                N'Tốc độ sụt lún đã vượt ngưỡng cảnh báo: ' + CAST(@SubsidenceRate AS NVARCHAR(20)) + ' mm/year',
                @SubsidenceRate,
                @WarningLevel
            );
        END
        
        FETCH NEXT FROM threshold_cursor INTO @AreaId, @SubsidenceRate, @CumulativeSubsidence, @WarningLevel, @CriticalLevel;
    END
    
    CLOSE threshold_cursor;
    DEALLOCATE threshold_cursor;
END;
GO

-- =============================================
-- 10. TẠO VIEWS HỮU ÍCH
-- =============================================

-- View tổng hợp dữ liệu sụt lún theo khu vực
CREATE VIEW vw_SubsidenceSummary AS
SELECT 
    ma.AreaId,
    ma.AreaCode,
    ma.AreaName,
    d.DistrictName,
    w.WardName,
    COUNT(sr.RecordId) AS TotalRecords,
    MAX(sr.RecordDate) AS LastRecordDate,
    AVG(sr.SubsidenceRate) AS AvgSubsidenceRate,
    MAX(sr.SubsidenceRate) AS MaxSubsidenceRate,
    MAX(sr.CumulativeSubsidence) AS MaxCumulativeSubsidence,
    ma.RiskLevel
FROM MonitoringAreas ma
LEFT JOIN Districts d ON ma.DistrictId = d.DistrictId
LEFT JOIN Wards w ON ma.WardId = w.WardId
LEFT JOIN SubsidenceRecords sr ON ma.AreaId = sr.AreaId
WHERE ma.IsActive = 1
GROUP BY ma.AreaId, ma.AreaCode, ma.AreaName, d.DistrictName, w.WardName, ma.RiskLevel;
GO

-- View cảnh báo đang mở
CREATE VIEW vw_ActiveAlerts AS
SELECT 
    a.AlertId,
    a.AlertCode,
    a.AlertType,
    a.Severity,
    a.Title,
    a.Message,
    a.AlertTime,
    ma.AreaName,
    d.DistrictName,
    u.FullName AS AcknowledgedByName,
    a.Status
FROM Alerts a
LEFT JOIN MonitoringAreas ma ON a.AreaId = ma.AreaId
LEFT JOIN Districts d ON ma.DistrictId = d.DistrictId
LEFT JOIN Users u ON a.AcknowledgedBy = u.UserId
WHERE a.Status IN ('Open', 'Acknowledged') AND a.IsActive = 1;
GO

-- View thống kê thiết bị
CREATE VIEW vw_DeviceStatus AS
SELECT 
    d.DeviceId,
    d.DeviceCode,
    d.DeviceName,
    dt.TypeName AS DeviceType,
    d.Status,
    d.BatteryLevel,
    d.SignalStrength,
    ma.AreaName,
    d.LastCalibrationDate,
    d.NextCalibrationDate,
    CASE 
        WHEN d.NextCalibrationDate < GETDATE() THEN 'Overdue'
        WHEN d.NextCalibrationDate <= DATEADD(DAY, 30, GETDATE()) THEN 'Due Soon'
        ELSE 'OK'
    END AS CalibrationStatus
FROM Devices d
LEFT JOIN DeviceTypes dt ON d.DeviceTypeId = dt.DeviceTypeId
LEFT JOIN MonitoringAreas ma ON d.AreaId = ma.AreaId
WHERE d.IsActive = 1;
GO

-- =============================================
-- 11. STORED PROCEDURES
-- =============================================

-- Stored Procedure: Lấy dữ liệu sụt lún theo khu vực và khoảng thời gian
CREATE PROCEDURE sp_GetSubsidenceData
    @AreaId INT = NULL,
    @StartDate DATE = NULL,
    @EndDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        sr.RecordId,
        sr.RecordDate,
        sr.SubsidenceValue,
        sr.CumulativeSubsidence,
        sr.SubsidenceRate,
        ma.AreaName,
        d.DistrictName,
        ms.StationName
    FROM SubsidenceRecords sr
    INNER JOIN MonitoringAreas ma ON sr.AreaId = ma.AreaId
    LEFT JOIN Districts d ON ma.DistrictId = d.DistrictId
    LEFT JOIN MonitoringStations ms ON sr.StationId = ms.StationId
    WHERE 
        (@AreaId IS NULL OR sr.AreaId = @AreaId)
        AND (@StartDate IS NULL OR sr.RecordDate >= @StartDate)
        AND (@EndDate IS NULL OR sr.RecordDate <= @EndDate)
    ORDER BY sr.RecordDate DESC;
END;
GO

-- Stored Procedure: Tính toán thống kê sụt lún
CREATE PROCEDURE sp_CalculateSubsidenceStats
    @AreaId INT,
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        COUNT(*) AS TotalRecords,
        AVG(SubsidenceRate) AS AvgRate,
        MAX(SubsidenceRate) AS MaxRate,
        MIN(SubsidenceRate) AS MinRate,
        STDEV(SubsidenceRate) AS StdDevRate,
        MAX(CumulativeSubsidence) AS MaxCumulative,
        MIN(CumulativeSubsidence) AS MinCumulative
    FROM SubsidenceRecords
    WHERE 
        AreaId = @AreaId
        AND RecordDate BETWEEN @StartDate AND @EndDate;
END;
GO

-- =============================================
-- 12. INSERT DỮ LIỆU MẪU (SEED DATA)
-- =============================================

-- Insert Roles (chỉ insert nếu chưa có)
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = N'Admin')
BEGIN
    INSERT INTO Roles (RoleName, Description) VALUES
    (N'Admin', N'Quản trị viên hệ thống'),
    (N'Manager', N'Quản lý'),
    (N'Analyst', N'Chuyên viên phân tích'),
    (N'Operator', N'Người vận hành'),
    (N'Viewer', N'Người xem');
END
GO

-- Insert Users (cần có trước khi insert các bảng có foreign key đến Users)
-- Password hash mẫu (trong thực tế sẽ được hash bằng bcryptjs trong application)
-- Mật khẩu mặc định: "password123"
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = N'admin')
BEGIN
    DECLARE @DefaultPassword NVARCHAR(255) = N'$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq'; -- Mẫu, cần hash thật

    INSERT INTO Users (Username, Email, PasswordHash, FullName, PhoneNumber, RoleId, IsActive, CreatedAt) VALUES
    (N'admin', N'admin@hcmc-subsidence.gov.vn', @DefaultPassword, N'Nguyễn Văn Admin', N'0901234567', 1, 1, '2020-01-01'),
    (N'manager01', N'manager01@hcmc-subsidence.gov.vn', @DefaultPassword, N'Trần Thị Quản Lý', N'0901234568', 2, 1, '2020-01-01'),
    (N'analyst01', N'analyst01@hcmc-subsidence.gov.vn', @DefaultPassword, N'Lê Văn Phân Tích', N'0901234569', 3, 1, '2020-01-01'),
    (N'operator01', N'operator01@hcmc-subsidence.gov.vn', @DefaultPassword, N'Hoàng Văn Vận Hành', N'0901234571', 4, 1, '2020-01-01');
END
GO

-- Insert Districts (Một số quận tại TPHCM) - chỉ insert nếu chưa có
IF NOT EXISTS (SELECT 1 FROM Districts WHERE DistrictCode = N'Q1')
BEGIN
    INSERT INTO Districts (DistrictCode, DistrictName, AreaKm2, Population) VALUES
    (N'Q1', N'Quận 1', 7.72, 142625),
    (N'Q2', N'Quận 2', 49.74, 147168),
    (N'Q3', N'Quận 3', 4.92, 190552),
    (N'Q4', N'Quận 4', 4.18, 183261),
    (N'Q5', N'Quận 5', 4.27, 159073),
    (N'Q7', N'Quận 7', 35.69, 360155),
    (N'Q9', N'Quận 9', 113.97, 397569),
    (N'Q12', N'Quận 12', 52.78, 620146),
    (N'BTH', N'Quận Bình Thạnh', 20.76, 499164),
    (N'TP', N'Quận Tân Phú', 16.06, 485348),
    (N'TB', N'Quận Tân Bình', 22.38, 474792);
END
GO

-- Insert Wards (Một số phường mẫu) - chỉ insert nếu chưa có
IF NOT EXISTS (SELECT 1 FROM Wards WHERE WardCode = N'Q1-P1')
BEGIN
    INSERT INTO Wards (WardCode, WardName, DistrictId) VALUES
    (N'Q1-P1', N'Phường Bến Nghé', 1),
    (N'Q1-P2', N'Phường Đa Kao', 1),
    (N'Q2-P1', N'Phường An Phú', 2),
    (N'Q2-P2', N'Phường Thảo Điền', 2),
    (N'Q7-P1', N'Phường Tân Phong', 6),
    (N'Q7-P2', N'Phường Tân Phú', 6);
END
GO

-- Insert Device Types - chỉ insert nếu chưa có
IF NOT EXISTS (SELECT 1 FROM DeviceTypes WHERE TypeName = N'GPS Receiver')
BEGIN
    INSERT INTO DeviceTypes (TypeName, Description, MeasurementUnit) VALUES
    (N'GPS Receiver', N'Thiết bị GPS đo vị trí chính xác', N'mm'),
    (N'Inclinometer', N'Máy đo độ nghiêng', N'degree'),
    (N'Piezometer', N'Máy đo áp suất nước ngầm', N'kPa'),
    (N'Strain Gauge', N'Cảm biến đo biến dạng', N'μm'),
    (N'Leveling Equipment', N'Thiết bị đo cao độ', N'mm');
END
GO

-- Insert Manufacturers - chỉ insert nếu chưa có
IF NOT EXISTS (SELECT 1 FROM Manufacturers WHERE ManufacturerName = N'Trimble')
BEGIN
    INSERT INTO Manufacturers (ManufacturerName, Country, ContactInfo) VALUES
    (N'Trimble', N'USA', N'www.trimble.com'),
    (N'Leica Geosystems', N'Switzerland', N'www.leica-geosystems.com'),
    (N'Sokkia', N'Japan', N'www.sokkia.com'),
    (N'Topcon', N'Japan', N'www.topcon.com');
END
GO

-- Insert Monitoring Areas (Khu vực giám sát mẫu) - chỉ insert nếu chưa có
IF NOT EXISTS (SELECT 1 FROM MonitoringAreas WHERE AreaCode = N'AREA-001')
BEGIN
    INSERT INTO MonitoringAreas (AreaCode, AreaName, DistrictId, WardId, Latitude, Longitude, Elevation, AreaType, RiskLevel, Description, CreatedBy) VALUES
    (N'AREA-001', N'Khu vực Quận 1 - Trung tâm', 1, 1, 10.7769, 106.7009, 5.2, N'Urban', N'High', N'Khu vực trung tâm thành phố, mật độ xây dựng cao', 1),
    (N'AREA-002', N'Khu vực Quận 2 - Thảo Điền', 2, 4, 10.8019, 106.7419, 3.8, N'Residential', N'Medium', N'Khu dân cư cao cấp', 1),
    (N'AREA-003', N'Khu vực Quận 7 - Tân Phong', 6, 5, 10.7297, 106.7172, 2.5, N'Urban', N'High', N'Khu đô thị mới, đang phát triển', 1),
    (N'AREA-004', N'Khu vực Quận 12 - Tân Chánh Hiệp', 8, NULL, 10.8631, 106.6297, 4.1, N'Industrial', N'Critical', N'Khu công nghiệp, có nhiều hoạt động khai thác nước ngầm', 1);
END
GO

-- Insert Monitoring Stations - chỉ insert nếu chưa có
IF NOT EXISTS (SELECT 1 FROM MonitoringStations WHERE StationCode = N'STN-001')
BEGIN
    INSERT INTO MonitoringStations (StationCode, StationName, AreaId, Latitude, Longitude, Elevation, StationType, InstallationDate, Status, Description, CreatedBy) VALUES
    (N'STN-001', N'Trạm giám sát Q1-01', 1, 10.7769, 106.7009, 5.2, N'Automatic', '2020-01-15', N'Active', N'Trạm tự động tại trung tâm Quận 1', 1),
    (N'STN-002', N'Trạm giám sát Q2-01', 2, 10.8019, 106.7419, 3.8, N'Automatic', '2020-03-20', N'Active', N'Trạm tự động tại Thảo Điền', 1),
    (N'STN-003', N'Trạm giám sát Q7-01', 3, 10.7297, 106.7172, 2.5, N'Hybrid', '2021-05-10', N'Active', N'Trạm hỗn hợp tại Quận 7', 1),
    (N'STN-004', N'Trạm giám sát Q12-01', 4, 10.8631, 106.6297, 4.1, N'Automatic', '2019-11-05', N'Active', N'Trạm tự động tại khu công nghiệp Q12', 1);
END
GO

-- Insert Devices - chỉ insert nếu chưa có
IF NOT EXISTS (SELECT 1 FROM Devices WHERE DeviceCode = N'DEV-001')
BEGIN
    INSERT INTO Devices (DeviceCode, DeviceName, DeviceTypeId, ManufacturerId, SerialNumber, Model, InstallationDate, LastCalibrationDate, NextCalibrationDate, Status, BatteryLevel, SignalStrength, Latitude, Longitude, Elevation, AreaId) VALUES
    (N'DEV-001', N'GPS Receiver Q1-01', 1, 1, N'TRM-2020-001', N'Trimble R10', '2020-01-15', '2023-01-15', '2024-01-15', N'Active', 85, 92, 10.7769, 106.7009, 5.2, 1),
    (N'DEV-002', N'Inclinometer Q1-01', 2, 2, N'LEI-2020-001', N'Leica LS15', '2020-01-15', '2023-06-15', '2024-06-15', N'Active', 78, 88, 10.7770, 106.7010, 5.2, 1),
    (N'DEV-003', N'GPS Receiver Q2-01', 1, 1, N'TRM-2020-002', N'Trimble R10', '2020-03-20', '2023-03-20', '2024-03-20', N'Active', 90, 95, 10.8019, 106.7419, 3.8, 2),
    (N'DEV-004', N'Piezometer Q12-01', 3, 3, N'SOP-2019-001', N'Sokkia PZ-100', '2019-11-05', '2023-11-05', '2024-11-05', N'Active', 65, 75, 10.8631, 106.6297, 4.1, 4);
END
GO

-- Insert Alert Thresholds - chỉ insert nếu chưa có
IF NOT EXISTS (SELECT 1 FROM AlertThresholds WHERE AreaId = 1 AND ThresholdType = N'SubsidenceRate')
BEGIN
    INSERT INTO AlertThresholds (AreaId, ThresholdType, WarningLevel, CriticalLevel, IsActive) VALUES
    (1, N'SubsidenceRate', 5.0, 10.0, 1),
    (2, N'SubsidenceRate', 5.0, 10.0, 1),
    (3, N'SubsidenceRate', 5.0, 10.0, 1),
    (4, N'SubsidenceRate', 3.0, 7.0, 1), -- Ngưỡng thấp hơn cho khu công nghiệp
    (1, N'CumulativeSubsidence', 50.0, 100.0, 1),
    (2, N'CumulativeSubsidence', 50.0, 100.0, 1),
    (3, N'CumulativeSubsidence', 50.0, 100.0, 1),
    (4, N'CumulativeSubsidence', 30.0, 70.0, 1);
END
GO

-- Insert Sample Subsidence Records (Dữ liệu mẫu) - chỉ insert nếu chưa có
IF NOT EXISTS (SELECT 1 FROM SubsidenceRecords WHERE AreaId = 1 AND RecordDate = '2024-01-15')
BEGIN
    INSERT INTO SubsidenceRecords (AreaId, StationId, RecordDate, SubsidenceValue, CumulativeSubsidence, SubsidenceRate, MeasurementMethod, DataSource, QualityRating, IsVerified, VerifiedBy, CreatedBy) VALUES
    (1, 1, '2024-01-15', 2.5, 2.5, 3.2, N'GPS', N'Automatic', N'Good', 1, 3, 4),
    (1, 1, '2024-02-15', 2.8, 5.3, 3.5, N'GPS', N'Automatic', N'Good', 1, 3, 4),
    (1, 1, '2024-03-15', 3.1, 8.4, 4.1, N'GPS', N'Automatic', N'Good', 1, 3, 4),
    (2, 2, '2024-01-15', 1.8, 1.8, 2.3, N'GPS', N'Automatic', N'Good', 1, 3, 4),
    (2, 2, '2024-02-15', 2.0, 3.8, 2.5, N'GPS', N'Automatic', N'Good', 1, 3, 4),
    (4, 4, '2024-01-15', 4.5, 4.5, 6.2, N'GPS', N'Automatic', N'Good', 1, 3, 4),
    (4, 4, '2024-02-15', 5.2, 9.7, 7.1, N'GPS', N'Automatic', N'Good', 1, 3, 4),
    (4, 4, '2024-03-15', 6.1, 15.8, 8.5, N'GPS', N'Automatic', N'Good', 1, 3, 4); -- Vượt ngưỡng cảnh báo
END
GO

-- =============================================
-- KẾT THÚC TẠO SCHEMA
-- =============================================

DECLARE @TableCount INT;
DECLARE @ViewCount INT;
DECLARE @ProcCount INT;

SELECT @TableCount = COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';
SELECT @ViewCount = COUNT(*) FROM INFORMATION_SCHEMA.VIEWS;
SELECT @ProcCount = COUNT(*) FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE = 'PROCEDURE';

PRINT N'Database schema đã được tạo thành công!';
PRINT N'Tổng số bảng: ' + CAST(@TableCount AS NVARCHAR(10));
PRINT N'Tổng số views: ' + CAST(@ViewCount AS NVARCHAR(10));
PRINT N'Tổng số stored procedures: ' + CAST(@ProcCount AS NVARCHAR(10));
