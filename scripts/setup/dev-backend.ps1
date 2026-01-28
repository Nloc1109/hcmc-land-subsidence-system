# Script để chạy backend dev server
$npmPath = "C:\Program Files\nodejs\npm.cmd"
Set-Location "$PSScriptRoot\..\..\backend"

if (Test-Path $npmPath) {
    Write-Host "Đang khởi động backend dev server..." -ForegroundColor Green
    & $npmPath run dev
} else {
    Write-Host "Lỗi: npm không tìm thấy!" -ForegroundColor Red
    Write-Host "Vui lòng cài đặt Node.js từ https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

