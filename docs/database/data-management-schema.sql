-- =============================================
-- BẢNG QUẢN LÝ DỮ LIỆU (DATA MANAGEMENT)
-- Dành cho Admin: Import, Kiểm duyệt, Phiên bản hóa
-- =============================================

-- Bảng nguồn dữ liệu (Data Sources)
CREATE TABLE DataSources (
    SourceId INT PRIMARY KEY IDENTITY(1,1),
    SourceCode NVARCHAR(50) NOT NULL UNIQUE,
    SourceName NVARCHAR(200) NOT NULL,
    SourceType NVARCHAR(50), -- 'Government', 'Research', 'Sensor', 'Manual', 'External'
    Organization NVARCHAR(200), -- Tổ chức cung cấp
    ContactInfo NVARCHAR(500), -- Thông tin liên hệ
    Description NVARCHAR(1000),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy INT,
    CONSTRAINT FK_DataSources_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(UserId)
);
GO

-- Bảng import dữ liệu (Data Imports)
CREATE TABLE DataImports (
    ImportId INT PRIMARY KEY IDENTITY(1,1),
    ImportCode NVARCHAR(50) NOT NULL UNIQUE,
    FileName NVARCHAR(255) NOT NULL,
    FileType NVARCHAR(20), -- 'CSV', 'Excel', 'JSON', 'XML'
    FileSize BIGINT, -- Kích thước file (bytes)
    FilePath NVARCHAR(500), -- Đường dẫn lưu file
    SourceId INT,
    DataType NVARCHAR(50), -- 'SubsidenceRecords', 'MonitoringAreas', 'Measurements', 'Devices'
    TotalRows INT, -- Tổng số dòng trong file
    ImportedRows INT, -- Số dòng đã import thành công
    FailedRows INT, -- Số dòng import thất bại
    ImportStatus NVARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Processing', 'Completed', 'Failed', 'Approved', 'Rejected'
    ApprovalStatus NVARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    ApprovedBy INT,
    ApprovedAt DATETIME2,
    RejectionReason NVARCHAR(1000),
    Version NVARCHAR(20) DEFAULT 'v1', -- Phiên bản dữ liệu
    PreviousVersionId INT, -- Link đến version trước
    ImportSummary NVARCHAR(MAX), -- JSON summary của dữ liệu import
    ErrorLog NVARCHAR(MAX), -- Log lỗi nếu có
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CreatedBy INT NOT NULL,
    CONSTRAINT FK_DataImports_Source FOREIGN KEY (SourceId) REFERENCES DataSources(SourceId),
    CONSTRAINT FK_DataImports_ApprovedBy FOREIGN KEY (ApprovedBy) REFERENCES Users(UserId),
    CONSTRAINT FK_DataImports_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
    CONSTRAINT FK_DataImports_PreviousVersion FOREIGN KEY (PreviousVersionId) REFERENCES DataImports(ImportId),
    CONSTRAINT CK_ImportStatus CHECK (ImportStatus IN ('Pending', 'Processing', 'Completed', 'Failed', 'Approved', 'Rejected')),
    CONSTRAINT CK_ApprovalStatus CHECK (ApprovalStatus IN ('Pending', 'Approved', 'Rejected'))
);
GO

-- Bảng chi tiết import (Import Details) - Lưu từng dòng dữ liệu đã import
CREATE TABLE DataImportDetails (
    DetailId BIGINT PRIMARY KEY IDENTITY(1,1),
    ImportId INT NOT NULL,
    RowNumber INT NOT NULL, -- Số thứ tự dòng trong file
    RecordId BIGINT, -- ID của record đã được tạo (tùy theo DataType)
    RecordType NVARCHAR(50), -- Loại record: 'SubsidenceRecord', 'MonitoringArea', etc.
    OriginalData NVARCHAR(MAX), -- Dữ liệu gốc từ file (JSON)
    ProcessedData NVARCHAR(MAX), -- Dữ liệu đã xử lý (JSON)
    Status NVARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Imported', 'Failed', 'Skipped'
    ErrorMessage NVARCHAR(1000),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_ImportDetails_Import FOREIGN KEY (ImportId) REFERENCES DataImports(ImportId) ON DELETE CASCADE,
    CONSTRAINT CK_DetailStatus CHECK (Status IN ('Pending', 'Imported', 'Failed', 'Skipped'))
);
GO

-- Index để tối ưu query
CREATE INDEX IX_DataImports_SourceId ON DataImports(SourceId);
CREATE INDEX IX_DataImports_Status ON DataImports(ImportStatus, ApprovalStatus);
CREATE INDEX IX_DataImports_Version ON DataImports(Version);
CREATE INDEX IX_DataImports_CreatedBy ON DataImports(CreatedBy);
CREATE INDEX IX_DataImportDetails_ImportId ON DataImportDetails(ImportId);
CREATE INDEX IX_DataImportDetails_RecordId ON DataImportDetails(RecordId, RecordType);
GO

-- Insert mẫu nguồn dữ liệu
IF NOT EXISTS (SELECT 1 FROM DataSources WHERE SourceCode = 'GOV-HCMC')
BEGIN
    INSERT INTO DataSources (SourceCode, SourceName, SourceType, Organization, ContactInfo, Description, CreatedBy) VALUES
    (N'GOV-HCMC', N'Sở Tài nguyên và Môi trường TP.HCM', N'Government', N'UBND TP.HCM', N'contact@stnmt.hochiminhcity.gov.vn', N'Nguồn dữ liệu chính thức từ cơ quan nhà nước', 1),
    (N'RESEARCH-VNU', N'Viện Nghiên cứu Địa chất - ĐHQG', N'Research', N'Đại học Quốc gia TP.HCM', N'research@vnuhcm.edu.vn', N'Dữ liệu từ nghiên cứu khoa học', 1),
    (N'SENSOR-AUTO', N'Hệ thống cảm biến tự động', N'Sensor', N'Trung tâm Giám sát', N'sensor@monitoring.gov.vn', N'Dữ liệu từ hệ thống cảm biến tự động', 1),
    (N'MANUAL-INPUT', N'Nhập liệu thủ công', N'Manual', N'Nội bộ', N'admin@system.gov.vn', N'Dữ liệu được nhập thủ công bởi nhân viên', 1);
END
GO

