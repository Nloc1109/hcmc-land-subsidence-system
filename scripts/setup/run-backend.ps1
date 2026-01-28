# Script để chạy backend với PATH đã refresh
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Set-Location "$PSScriptRoot\..\..\backend"
npm run dev

