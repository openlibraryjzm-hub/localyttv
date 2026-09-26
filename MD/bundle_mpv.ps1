$ErrorActionPreference = "Stop"
$sevenZip = "C:\Program Files\7-Zip\7z.exe"
# Using a specific known-good release URL to avoid scraping issues
$url = "https://github.com/shinchiro/mpv-winbuild-cmake/releases/download/v20240106/mpv-x86_64-20240106-git-7157828.7z"
$destPath = "src-tauri/bin/mpv.7z"
$debugPath = "src-tauri/target/debug"

Write-Host "Creating directories..."
New-Item -ItemType Directory -Force -Path "src-tauri/bin" | Out-Null
New-Item -ItemType Directory -Force -Path $debugPath | Out-Null

Write-Host "Downloading MPV from GitHub..."
# GitHub redirects, so we rely on Invoke-WebRequest following them (default in PS 5.1/Core for some cmds, but let's be safe)
$progressPreference = 'SilentlyContinue'
Invoke-WebRequest -Uri $url -OutFile $destPath

# Verify size
$filesize = (Get-Item $destPath).Length
Write-Host "Downloaded size: $($filesize / 1MB) MB"
if ($filesize -lt 10000000) {
    # Expecting > 10MB
    Throw "Download content too small ($filesize bytes). Likely failed."
}

Write-Host "Extracting mpv.exe directly to $debugPath..."
& $sevenZip e $destPath -o"$debugPath" mpv.exe -r -y | Out-Null

if (Test-Path "$debugPath/mpv.exe") {
    Write-Host "SUCCESS: mpv.exe is placed in $debugPath"
}
else {
    Throw "Failed to extract mpv.exe"
}
