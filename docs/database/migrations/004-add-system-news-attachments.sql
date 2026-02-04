-- Tin hệ thống: nội dung là văn bản thuần (không HTML), có thể đính kèm nhiều file.
-- Bảng SystemNewsAttachments lưu từng file đính kèm của mỗi tin.

USE HCMC_LandSubsidence;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SystemNewsAttachments')
BEGIN
  CREATE TABLE SystemNewsAttachments (
    AttachmentId INT PRIMARY KEY IDENTITY(1,1),
    SystemNewsId INT NOT NULL,
    FilePath NVARCHAR(1000) NOT NULL,
    FileName NVARCHAR(500) NOT NULL,
    MimeType NVARCHAR(200) NULL,
    SortOrder INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_SystemNewsAttachments_SystemNews
      FOREIGN KEY (SystemNewsId) REFERENCES SystemNews(SystemNewsId) ON DELETE CASCADE
  );

  CREATE INDEX IX_SystemNewsAttachments_SystemNewsId ON SystemNewsAttachments(SystemNewsId);

  PRINT N'Đã tạo bảng SystemNewsAttachments.';
END
ELSE
  PRINT N'Bảng SystemNewsAttachments đã tồn tại.';
GO
