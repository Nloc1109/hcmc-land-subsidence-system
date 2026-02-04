-- =============================================
-- BẢNG QUẢN LÝ YÊU CẦU (REQUESTS/TASKS)
-- Admin gửi yêu cầu cho các roles khác (trừ Viewer)
-- =============================================

USE HCMC_LandSubsidence;
GO

-- Bảng yêu cầu (Requests)
CREATE TABLE Requests (
    RequestId INT PRIMARY KEY IDENTITY(1,1),
    RequestCode NVARCHAR(50) UNIQUE,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    Priority NVARCHAR(20) NOT NULL DEFAULT 'Green', -- 'Green', 'Yellow', 'Red'
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Accepted', 'Rejected', 'Negotiating', 'InProgress', 'Completed', 'Cancelled'
    AssignedTo INT NOT NULL, -- UserId của người được giao
    CreatedBy INT NOT NULL, -- UserId của Admin tạo yêu cầu
    DueDate DATETIME2, -- Thời hạn ban đầu (Admin đặt)
    NegotiatedDueDate DATETIME2, -- Thời hạn sau khi thương lượng (chỉ cho mức Yellow)
    CompletedAt DATETIME2, -- Thời điểm hoàn thành
    RejectedAt DATETIME2, -- Thời điểm từ chối (chỉ cho mức Green)
    RejectionReason NVARCHAR(500), -- Lý do từ chối
    NegotiationMessage NVARCHAR(500), -- Thông điệp thương lượng (mức Yellow)
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_Requests_AssignedTo FOREIGN KEY (AssignedTo) REFERENCES Users(UserId),
    CONSTRAINT FK_Requests_CreatedBy FOREIGN KEY (CreatedBy) REFERENCES Users(UserId),
    CONSTRAINT CK_RequestPriority CHECK (Priority IN ('Green', 'Yellow', 'Red')),
    CONSTRAINT CK_RequestStatus CHECK (Status IN ('Pending', 'Accepted', 'Rejected', 'Negotiating', 'InProgress', 'Completed', 'Cancelled'))
);
GO

-- Index để tìm kiếm nhanh
CREATE INDEX IX_Requests_AssignedTo ON Requests(AssignedTo);
CREATE INDEX IX_Requests_CreatedBy ON Requests(CreatedBy);
CREATE INDEX IX_Requests_Status ON Requests(Status);
CREATE INDEX IX_Requests_Priority ON Requests(Priority);
CREATE INDEX IX_Requests_CreatedAt ON Requests(CreatedAt DESC);
GO

-- Trigger để tự động tạo RequestCode
CREATE TRIGGER TR_Requests_GenerateCode
ON Requests
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Requests
    SET RequestCode = 'REQ-' + FORMAT(RequestId, '000000')
    WHERE RequestId IN (SELECT RequestId FROM inserted)
    AND (RequestCode IS NULL OR RequestCode = '');
END;
GO

-- Trigger để cập nhật UpdatedAt
CREATE TRIGGER TR_Requests_UpdateTime
ON Requests
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Requests
    SET UpdatedAt = GETDATE()
    WHERE RequestId IN (SELECT RequestId FROM inserted);
END;
GO

