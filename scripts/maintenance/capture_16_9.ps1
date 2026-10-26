Add-Type -AssemblyName System.Drawing

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Get-Item "$scriptDir\..\..").FullName
$outDir = Join-Path $repoRoot "audit\screenshots"

$pages = @(
    @{ name = "01_overview.png"; url = "http://127.0.0.1:5173/?tab=overview" },
    @{ name = "02_alerts.png"; url = "http://127.0.0.1:5173/?tab=alerts" },
    @{ name = "03_evidence_modal.png"; url = "http://127.0.0.1:5173/?tab=alerts&modal=evidence" },
    @{ name = "04_tamper_verification.png"; url = "http://127.0.0.1:5173/?tab=alerts&modal=tamper" },
    @{ name = "05_baselines.png"; url = "http://127.0.0.1:5173/?tab=routes" },
    @{ name = "06_scenarios.png"; url = "http://127.0.0.1:5173/?tab=scenarios" },
    @{ name = "07_audit_ledger.png"; url = "http://127.0.0.1:5173/?tab=evidence" },
    @{ name = "08_rpki_inspector.png"; url = "http://127.0.0.1:5173/?tab=rpki" },
    @{ name = "09_inject_route.png"; url = "http://127.0.0.1:5173/?tab=inject" },
    @{ name = "10_settings.png"; url = "http://127.0.0.1:5173/?tab=settings" }
)

foreach ($p in $pages) {
    $outFile = Join-Path $outDir $p.name
    $targetUrl = $p.url
    Write-Host "Capturing 16:9 full desktop screenshot for $($p.name)..."
    
    Start-Process -FilePath $edgePath -ArgumentList "--headless", "--screenshot=$outFile", "--window-size=1920,1080", "--hide-scrollbars", "--virtual-time-budget=3500", "$targetUrl" -Wait
    
    if (Test-Path $outFile) {
        $img = [System.Drawing.Image]::FromFile($outFile)
        $w = $img.Width
        $h = $img.Height
        $ratio = [math]::Round($w / $h, 2)
        Write-Host "  -> Saved: $w x $h (Ratio: $ratio - 16:9: $(($w * 9) -eq ($h * 16))) [File: $outFile]"
        $img.Dispose()
    } else {
        Write-Warning "  -> Failed to capture $outFile"
    }
}

Write-Host "All 16:9 screenshots captured successfully."
