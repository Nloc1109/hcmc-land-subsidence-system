-- =============================================
-- Tài khoản test đăng nhập (mỗi role 1 tài khoản)
-- Mật khẩu chung: 123456
-- Chạy sau khi đã chạy schema.sql (có bảng Roles, Users)
-- Chạy trong SSMS / Azure Data Studio / sqlcmd
-- =============================================

USE HCMC_LandSubsidence;
GO

-- Hash bcrypt cho mật khẩu "123456"
DECLARE @PasswordHash NVARCHAR(255) = N'$2a$10$yoAQNi9PAEYw6bI5Jn7ngO7oRrjVR/nOEvGZY8pRTZrD1Aoqx.SoG';

-- 1. Cập nhật mật khẩu cho user đã tồn tại
UPDATE Users SET PasswordHash = @PasswordHash, UpdatedAt = GETDATE()
WHERE Username IN (N'admin', N'manager', N'analyst', N'operator', N'viewer');

-- 2. Thêm user mới cho từng role (nếu chưa có)
-- Admin (RoleId = 1)
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = N'admin')
BEGIN
    INSERT INTO Users (Username, Email, PasswordHash, FullName, RoleId, IsActive, CreatedAt)
    SELECT N'admin', N'admin@test.local', @PasswordHash, N'Nguyễn Văn Admin', RoleId, 1, GETDATE()
    FROM Roles WHERE RoleName = N'Admin' AND IsActive = 1;
END

-- Manager (RoleId = 2)
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = N'manager')
BEGIN
    INSERT INTO Users (Username, Email, PasswordHash, FullName, RoleId, IsActive, CreatedAt)
    SELECT N'manager', N'manager@test.local', @PasswordHash, N'Trần Thị Quản Lý', RoleId, 1, GETDATE()
    FROM Roles WHERE RoleName = N'Manager' AND IsActive = 1;
END

-- Analyst (RoleId = 3)
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = N'analyst')
BEGIN
    INSERT INTO Users (Username, Email, PasswordHash, FullName, RoleId, IsActive, CreatedAt)
    SELECT N'analyst', N'analyst@test.local', @PasswordHash, N'Lê Văn Phân Tích', RoleId, 1, GETDATE()
    FROM Roles WHERE RoleName = N'Analyst' AND IsActive = 1;
END

-- Operator (RoleId = 4)
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = N'operator')
BEGIN
    INSERT INTO Users (Username, Email, PasswordHash, FullName, RoleId, IsActive, CreatedAt)
    SELECT N'operator', N'operator@test.local', @PasswordHash, N'Hoàng Văn Vận Hành', RoleId, 1, GETDATE()
    FROM Roles WHERE RoleName = N'Operator' AND IsActive = 1;
END

-- Viewer (RoleId = 5)
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = N'viewer')
BEGIN
    INSERT INTO Users (Username, Email, PasswordHash, FullName, RoleId, IsActive, CreatedAt)
    SELECT N'viewer', N'viewer@test.local', @PasswordHash, N'Phạm Thị Xem Chỉ Đọc', RoleId, 1, GETDATE()
    FROM Roles WHERE RoleName = N'Viewer' AND IsActive = 1;
END

GO

PRINT N'Đã xong. Tài khoản test (mật khẩu: 123456): admin, manager, analyst, operator, viewer';
