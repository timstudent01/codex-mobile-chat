$ErrorActionPreference = "SilentlyContinue"

$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object -First 1
if ($null -ne $conn) {
  Stop-Process -Id $conn.OwningProcess -Force
}

exit 0
