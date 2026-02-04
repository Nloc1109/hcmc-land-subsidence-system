-- =============================================
-- BẢNG QUẢN LÝ YÊU CẦU (REQUESTS)
-- Chạy script này trong SSMS hoặc sqlcmd khi thiếu bảng Requests.
-- Database: HCMC_LandSubsidence (phải có sẵn bảng Users, Roles).
-- =============================================

USE HCMC_LandSubsidence;
GO

-- Chỉ tạo khi bảng chưa tồn tại
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Requests')
BEGIN
    CREATE TABLE Requests (
        RequestId INT PRIMARY KEY IDENTITY(1,1),
        RequestCode NVARCHAR(50) UNIQUE,
        Title NVARCHAR(200) NOT NULL,
        Description NVARCHAR(MAX),
        Priority NVARCHAR(20) NOT NULL DEFAULT 'Green',
        Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        AssignedTo INT NOT NULL,
        CreatedBy INT NOT NULL,
        DueDate DATETIME2,
        NegotiatedDueDate DATETIME2,
        CompletedAt DATETIME2,
        RejectedAt DATETIME2,
        RejectionReason NVARCHAR(500),
        NegotiationMessage NVARCHAR(500),
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_Requests_AssignedTo FOREIGN KEY (AssignedTo) REFERENCES Users(UserId),
        CONSTRAINT FK_Requests_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
        CONSTRAINT CK_RequestPriority CHECK (Priority IN ('Green', 'Yellow', 'Red')),
        CONSTRAINT CK_RequestStatus CHECK (Status IN ('Pending', 'Accepted', 'Rejected', 'Negotiating', 'InProgress', 'Completed', 'Cancelled'))
    );
    PRINT 'Created table Requests.';
END
ELSE
    PRINT 'Table Requests already exists.';
GO

-- Index (bỏ qua nếu đã có)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Requests_AssignedTo' AND object_id = OBJECT_ID('Requests'))
    CREATE INDEX IX_Requests_AssignedTo ON Requests(AssignedTo);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Requests_CreatedBy' AND object_id = OBJECT_ID('Requests'))
    CREATE INDEX IX_Requests_CreatedBy ON Requests(CreatedBy);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Requests_Status' AND object_id = OBJECT_ID('Requests'))
    CREATE INDEX IX_Requests_Status ON Requests(Status);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Requests_Priority' AND object_id = OBJECT_ID('Requests'))
    CREATE INDEX IX_Requests_Priority ON Requests(Priority);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Requests_CreatedAt' AND object_id = OBJECT_ID('Requests'))
    CREATE INDEX IX_Requests_CreatedAt ON Requests(CreatedAt DESC);
GO

-- Trigger tạo RequestCode
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Requests_GenerateCode')
BEGIN
    EXEC('
    CREATE TRIGGER TR_Requests_GenerateCode ON Requests AFTER INSERT AS
    BEGIN SET NOCOUNT ON;
        UPDATE Requests SET RequestCode = ''REQ-'' + FORMAT(RequestId, ''000000'')
        WHERE RequestId IN (SELECT RequestId FROM inserted) AND (RequestCode IS NULL OR RequestCode = '''');
    END');
    PRINT 'Created trigger TR_Requests_GenerateCode.';
END
GO

-- Trigger cập nhật UpdatedAt
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Requests_UpdateTime')
BEGIN
    EXEC('
    CREATE TRIGGER TR_Requests_UpdateTime ON Requests AFTER UPDATE AS
    BEGIN SET NOCOUNT ON;
        UPDATE Requests SET UpdatedAt = GETDATE() WHERE RequestId IN (SELECT RequestId FROM inserted);
    END');
    PRINT 'Created trigger TR_Requests_UpdateTime.';
END
GO

PRINT 'Done. Requests table ready.';
