# Script to find SQL Server named instance port
# Run: powershell -ExecutionPolicy Bypass -File .\scripts\find-sql-port.ps1

Write-Host "Finding SQL Server instance port..." -ForegroundColor Cyan
Write-Host ""

$instanceName = $env:DB_INSTANCE
if (-not $instanceName) {
    $instanceName = Read-Host "Enter instance name (e.g., LOC1109, SQLEXPRESS) or press Enter to find all"
}

if ($instanceName) {
    Write-Host "Looking for instance: $instanceName" -ForegroundColor Yellow
} else {
    Write-Host "Looking for all SQL Server instances..." -ForegroundColor Yellow
}

Write-Host ""

# Find SQL Server services
$services = Get-Service | Where-Object { 
    $_.Name -like "MSSQL*" -or $_.DisplayName -like "*SQL Server*"
}

if ($services.Count -eq 0) {
    Write-Host "ERROR: No SQL Server services found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "TIP: Make sure SQL Server is installed and running." -ForegroundColor Yellow
    exit 1
}

Write-Host "Found SQL Server services:" -ForegroundColor Green
Write-Host ""

foreach ($service in $services) {
    $instance = ""
    if ($service.Name -match 'MSSQL\$(.+)') {
        $instance = $matches[1]
    } elseif ($service.Name -eq "MSSQLSERVER") {
        $instance = "DEFAULT"
    }
    
    if ($instanceName -and $instance -ne $instanceName) {
        continue
    }
    
    Write-Host "  Service: $($service.DisplayName)" -ForegroundColor White
    Write-Host "    Name: $($service.Name)" -ForegroundColor Gray
    Write-Host "    Status: $($service.Status)" -ForegroundColor $(if ($service.Status -eq "Running") { "Green" } else { "Red" })
    
    if ($instance) {
        Write-Host "    Instance: $instance" -ForegroundColor Cyan
    }
    
    Write-Host ""
}

Write-Host "Finding port from SQL Server Configuration Manager..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Manual method to find port:" -ForegroundColor Yellow
Write-Host "   1. Open SQL Server Configuration Manager" -ForegroundColor White
Write-Host "   2. SQL Server Network Configuration > Protocols for [INSTANCE_NAME]" -ForegroundColor White
Write-Host "   3. Right-click TCP/IP > Properties" -ForegroundColor White
Write-Host "   4. IP Addresses tab > Scroll to bottom > Check port in 'IPAll' section" -ForegroundColor White
Write-Host ""

# Try connecting to common ports
$commonPorts = @(1433, 1434, 1435, 1436, 1437, 1438, 1439, 1440, 1441, 1442, 1443, 1444, 1445)

Write-Host "Trying to connect to common ports..." -ForegroundColor Cyan
Write-Host ""

$foundPorts = @()

foreach ($port in $commonPorts) {
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.ReceiveTimeout = 1000
        $connection.SendTimeout = 1000
        $result = $connection.BeginConnect("localhost", $port, $null, $null)
        $wait = $result.AsyncWaitHandle.WaitOne(500, $false)
        
        if ($wait) {
            $connection.EndConnect($result)
            $foundPorts += $port
            Write-Host "  OK Port $port - Can connect" -ForegroundColor Green
            $connection.Close()
        } else {
            $connection.Close()
        }
    } catch {
        # Port not open or not SQL Server
    }
}

if ($foundPorts.Count -gt 0) {
    Write-Host ""
    Write-Host "Found connectable ports:" -ForegroundColor Green
    foreach ($port in $foundPorts) {
        Write-Host "   Port: $port" -ForegroundColor Cyan
    }
    Write-Host ""
    Write-Host "Try adding to .env:" -ForegroundColor Yellow
    Write-Host "   DB_PORT=$($foundPorts[0])" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "WARNING: No ports found in common list." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "TIP: Check SQL Server Configuration Manager to find the exact port." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Notes:" -ForegroundColor Cyan
Write-Host "   - Named instances usually use dynamic ports (not 1433)" -ForegroundColor White
Write-Host "   - Make sure SQL Server Browser service is running" -ForegroundColor White
Write-Host "   - If still can't connect, try using localhost instead of computer name" -ForegroundColor White
