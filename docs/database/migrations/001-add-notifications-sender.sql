-- Thêm SenderId vào Notifications để biết ai gửi (Analyst → Operator, Manager → Analyst, ...)
-- Chạy sau schema.sql, trước hoặc sau seed-test-users đều được.

USE HCMC_LandSubsidence;
GO

IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID('Notifications') AND name = 'SenderId'
)
BEGIN
  ALTER TABLE Notifications
  ADD SenderId INT NULL;

  ALTER TABLE Notifications
  ADD CONSTRAINT FK_Notifications_Sender
  FOREIGN KEY (SenderId) REFERENCES Users(UserId);

  CREATE INDEX IX_Notifications_SenderId ON Notifications(SenderId);
  PRINT N'Đã thêm cột SenderId vào bảng Notifications.';
END
ELSE
  PRINT N'Cột SenderId đã tồn tại.';
GO
