# Script để chạy frontend với PATH đã refresh
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Set-Location "$PSScriptRoot\..\..\frontend"
npm run dev

