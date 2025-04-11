$envVars = Get-Content -Path ".env"
foreach ($line in $envVars) {
    if ($line -match "^\s*([^=]+)\s*=\s*(.+)\s*$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Item -Path "env:$key" -Value $value
    }
}