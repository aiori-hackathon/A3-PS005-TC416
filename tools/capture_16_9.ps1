param(
    [string]$BaseUrl = "http://localhost:5173",
    [string]$OutputDir = "",
    [string]$BrowserPath = ""
)

Add-Type -AssemblyName System.Drawing

# Determine browser path (configurable via param or env, with Edge/Chrome fallbacks)
if ([string]::IsNullOrWhiteSpace($BrowserPath)) {
    if (-not [string]::IsNullOrWhiteSpace($env:BROWSER_PATH) -and (Test-Path $env:BROWSER_PATH)) {
        $BrowserPath = $env:BROWSER_PATH
    } elseif (Test-Path "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") {
        $BrowserPath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    } elseif (Test-Path "C:\Program Files\Microsoft\Edge\Application\msedge.exe") {
        $BrowserPath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
    } elseif (Test-Path "C:\Program Files\Google\Chrome\Application\chrome.exe") {
        $BrowserPath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
    } else {
        Write-Error "No compatible Chromium browser found. Please specify -BrowserPath."
        exit 1
    }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Get-Item "$scriptDir\..").FullName

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
    $outDir = Join-Path $repoRoot "audit\screenshots"
} else {
    $outDir = $OutputDir
}

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$pages = @(
    @{ name = "01_overview.png"; url = "$BaseUrl/?tab=overview" },
    @{ name = "02_alerts.png"; url = "$BaseUrl/?tab=alerts" },
    @{ name = "03_evidence_modal.png"; url = "$BaseUrl/?tab=alerts&modal=evidence" },
    @{ name = "04_tamper_verification.png"; url = "$BaseUrl/?tab=alerts&modal=tamper" },
    @{ name = "05_baselines.png"; url = "$BaseUrl/?tab=routes" },
    @{ name = "06_scenarios.png"; url = "$BaseUrl/?tab=scenarios" },
    @{ name = "07_audit_ledger.png"; url = "$BaseUrl/?tab=evidence" },
    @{ name = "08_rpki_inspector.png"; url = "$BaseUrl/?tab=rpki" },
    @{ name = "09_inject_route.png"; url = "$BaseUrl/?tab=inject" },
    @{ name = "10_settings.png"; url = "$BaseUrl/?tab=settings" },
    @{ name = "11_forensic_drawer.png"; url = "$BaseUrl/?tab=alerts&modal=investigate" },
    @{ name = "12_baseline_timeline.png"; url = "$BaseUrl/?tab=routes&modal=timeline" }
)

foreach ($p in $pages) {
    $outFile = Join-Path $outDir $p.name
    $targetUrl = $p.url
    Write-Host "Capturing 16:9 full desktop screenshot for $($p.name)..."
    
    if (Test-Path $outFile) {
        Remove-Item -Force $outFile -ErrorAction SilentlyContinue
    }

    $argList = @(
        "--headless",
        "--screenshot=$outFile",
        "--window-size=1920,1080",
        "--hide-scrollbars",
        "--virtual-time-budget=5000",
        "$targetUrl"
    )
    
    $proc = Start-Process -FilePath $BrowserPath -ArgumentList $argList -Wait -NoNewWindow -PassThru
    
    if (Test-Path $outFile) {
        $img = [System.Drawing.Image]::FromFile($outFile)
        $w = $img.Width
        $h = $img.Height
        $ratio = [math]::Round($w / $h, 2)
        $is169 = (($w * 9) -eq ($h * 16))
        Write-Host "  -> Saved: ${w}x${h} (Ratio: $ratio - 16:9: $is169) [File: $outFile]"
        $img.Dispose()
    } else {
        Write-Warning "  -> Failed to capture $outFile (ExitCode: $($proc.ExitCode))"
    }
}

Write-Host "All 16:9 screenshots captured successfully."
