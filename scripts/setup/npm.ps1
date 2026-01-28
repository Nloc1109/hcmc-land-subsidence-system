# Wrapper script để chạy npm với đường dẫn đầy đủ
param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Arguments
)

$npmPath = "C:\Program Files\nodejs\npm.cmd"
if (Test-Path $npmPath) {
    & $npmPath $Arguments
} else {
    Write-Host "npm không tìm thấy tại: $npmPath" -ForegroundColor Red
    exit 1
}

