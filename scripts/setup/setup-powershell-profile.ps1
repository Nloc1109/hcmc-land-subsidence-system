# Script để thiết lập PowerShell profile với npm functions
# Chạy với quyền admin: . .\scripts\setup\setup-powershell-profile.ps1

$profilePath = $PROFILE.CurrentUserAllHosts
$profileDir = Split-Path $profilePath -Parent

# Tạo thư mục nếu chưa có
if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    Write-Host "Đã tạo thư mục profile: $profileDir" -ForegroundColor Green
}

# Nội dung để thêm vào profile
$npmFunctions = @"

# Functions để fix npm với PowerShell Execution Policy
function npm {
    & "C:\Program Files\nodejs\npm.cmd" `$args
}

function node {
    & "C:\Program Files\nodejs\node.exe" `$args
}
"@

# Kiểm tra xem đã có chưa
$profileContent = ""
if (Test-Path $profilePath) {
    $profileContent = Get-Content $profilePath -Raw
}

if ($profileContent -notlike "*function npm*") {
    # Thêm vào profile
    Add-Content -Path $profilePath -Value $npmFunctions
    Write-Host "✅ Đã thêm npm functions vào PowerShell profile!" -ForegroundColor Green
    Write-Host "   Profile location: $profilePath" -ForegroundColor Cyan
    Write-Host "`n⚠️  Vui lòng restart PowerShell để áp dụng thay đổi." -ForegroundColor Yellow
} else {
    Write-Host "✅ npm functions đã có trong profile!" -ForegroundColor Green
}

