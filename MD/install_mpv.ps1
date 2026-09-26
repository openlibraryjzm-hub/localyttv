$ErrorActionPreference = "Stop"
$sevenZip = "C:\Program Files\7-Zip\7z.exe"
$destPath = "src-tauri/bin/mpv.7z"
$extractPath = "src-tauri/bin/mpv-bin"

# 1. Get URL
Write-Host "Resolving latest MPV release..."
try {
    $url = "https://api.github.com/repos/zhongfly/mpv-winbuild/releases/latest"
    $release = Invoke-RestMethod -Uri $url -Headers @{ "User-Agent" = "PowerShell" }
    # Filter for mpv binary (not ffmpeg, not debug, not libmpv dev)
    $asset = $release.assets | Where-Object { $_.name -match "^mpv-.*x86_64.*\.7z$" -and $_.name -notmatch "pdb" } | Select-Object -First 1
    
    if (-not $asset) {
        Throw "No matching MPV asset found in latest release."
    }
    $downloadUrl = $asset.browser_download_url
    Write-Host "Found: $($asset.name)"
}
catch {
    Throw "Failed to resolve URL: $($_.Exception.Message)"
}

# 2. Prepare Directory
New-Item -ItemType Directory -Force -Path "src-tauri/bin" | Out-Null
if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force }
New-Item -ItemType Directory -Force -Path $extractPath | Out-Null

# 3. Download
Write-Host "Downloading from $downloadUrl..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $destPath -UserAgent "Mozilla/5.0"

# 4. Extract
Write-Host "Extracting..."
& $sevenZip x $destPath -o"$extractPath" -y | Out-Null

# 5. Arrange
$mpvExe = Get-ChildItem -Path $extractPath -Filter "mpv.exe" -Recurse | Select-Object -First 1
if ($mpvExe) {
    Write-Host "Located mpv.exe at $($mpvExe.FullName)"
    if ($mpvExe.Directory.FullName -ne (Resolve-Path $extractPath).Path) {
        Write-Host "Flattening directory..."
        Get-ChildItem $mpvExe.Directory.FullName | Move-Item -Destination $extractPath -Force
    }
}
else {
    Throw "mpv.exe not found in extracted archive."
}

# 6. Cleanup
Remove-Item $destPath -Force
Write-Host "MPV Installed successfully to $extractPath"
Write-Host "Path to add: $(Resolve-Path $extractPath)"
