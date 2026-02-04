-- Tin hệ thống: do Operator/Admin đăng, lưu trong DB, hiển thị trong tab "Tin hệ thống" trên trang Tin tức.
-- Nội dung là văn bản thuần (Content). File đính kèm lưu trong bảng SystemNewsAttachments (migration 004).

USE HCMC_LandSubsidence;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SystemNews')
BEGIN
  CREATE TABLE SystemNews (
    SystemNewsId INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(500) NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    AuthorId INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT FK_SystemNews_Author FOREIGN KEY (AuthorId) REFERENCES Users(UserId)
  );

  CREATE INDEX IX_SystemNews_AuthorId ON SystemNews(AuthorId);
  CREATE INDEX IX_SystemNews_CreatedAt ON SystemNews(CreatedAt DESC);

  PRINT N'Đã tạo bảng SystemNews.';
END
ELSE
  PRINT N'Bảng SystemNews đã tồn tại.';
GO
