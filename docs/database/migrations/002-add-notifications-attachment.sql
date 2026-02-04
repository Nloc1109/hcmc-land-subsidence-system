-- Đính kèm file báo cáo (PDF/Excel) cho Notifications.
-- File do hệ thống tạo, chứa thông tin người gửi, người nhận và nội dung báo cáo.

USE HCMC_LandSubsidence;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('Notifications') AND name = 'AttachmentPath'
)
BEGIN
  ALTER TABLE Notifications
  ADD AttachmentPath NVARCHAR(500) NULL,
      AttachmentFileName NVARCHAR(255) NULL,
      AttachmentMimeType NVARCHAR(100) NULL;

  PRINT N'Đã thêm cột đính kèm (AttachmentPath, AttachmentFileName, AttachmentMimeType) vào Notifications.';
END
ELSE
  PRINT N'Các cột đính kèm đã tồn tại.';
GO
