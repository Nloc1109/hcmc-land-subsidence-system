# Script để fix vấn đề npm với PowerShell Execution Policy
# Chạy: . .\scripts\setup\fix-npm.ps1

Write-Host "Đang kiểm tra và sửa lỗi npm..." -ForegroundColor Yellow

# Kiểm tra npm.cmd
$npmCmd = "C:\Program Files\nodejs\npm.cmd"
if (-not (Test-Path $npmCmd)) {
    Write-Host "Lỗi: npm.cmd không tìm thấy!" -ForegroundColor Red
    exit 1
}

# Tạo function npm để gọi npm.cmd
function npm {
    & "C:\Program Files\nodejs\npm.cmd" $args
}

# Tạo function node để gọi node.exe
function node {
    & "C:\Program Files\nodejs\node.exe" $args
}

# Export functions để sử dụng trong session hiện tại
Export-ModuleMember -Function npm, node

Write-Host "`n✅ Đã tạo functions npm và node!" -ForegroundColor Green
Write-Host "Bây giờ bạn có thể sử dụng 'npm' và 'node' bình thường." -ForegroundColor Cyan
Write-Host "`nKiểm tra:" -ForegroundColor Yellow
Write-Host "  npm --version" -ForegroundColor White
Write-Host "  node --version" -ForegroundColor White

