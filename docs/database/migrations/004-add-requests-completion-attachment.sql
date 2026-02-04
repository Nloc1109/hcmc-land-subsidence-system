-- Đính kèm file khi người được giao nộp lại yêu cầu (hoàn thành) cho Admin.

USE HCMC_LandSubsidence;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('Requests') AND name = 'CompletionAttachmentPath'
)
BEGIN
  ALTER TABLE Requests
  ADD CompletionAttachmentPath NVARCHAR(500) NULL,
      CompletionAttachmentFileName NVARCHAR(255) NULL,
      CompletionAttachmentMimeType NVARCHAR(100) NULL;

  PRINT N'Đã thêm cột đính kèm hoàn thành (CompletionAttachmentPath, CompletionAttachmentFileName, CompletionAttachmentMimeType) vào Requests.';
END
ELSE
  PRINT N'Các cột đính kèm hoàn thành đã tồn tại.';
GO
