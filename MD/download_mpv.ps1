$ErrorActionPreference = "Stop"
$repo = "zhongfly/mpv-winbuild"
$url = "https://api.github.com/repos/$repo/releases/latest"
Write-Host "Fetching latest release from $repo..."

try {
    $release = Invoke-RestMethod -Uri $url
} catch {
    Write-Warning "GitHub API failed. Falling back to hardcoded URL."
    # Fallback to a known working version if API fails
    $url = "https://github.com/zhongfly/mpv-winbuild/releases/download/v2024-09-22/mpv-x86_64-v3-20240922-git-10491fb.zip"
    $release = @{ assets = @( @{ browser_download_url = $url; name = "mpv-fallback.zip" } ) }
}

$asset = $release.assets | Where-Object { $_.name -like "*.zip" -and $_.name -notlike "*pdb*" } | Select-Object -First 1

if (-not $asset) {
    Throw "No .zip asset found in latest release."
}

$downloadUrl = $asset.browser_download_url
$destPath = "src-tauri/bin/mpv.zip"
$extractPath = "src-tauri/bin/mpv-bin"

New-Item -ItemType Directory -Force -Path "src-tauri/bin" | Out-Null
New-Item -ItemType Directory -Force -Path $extractPath | Out-Null

Write-Host "Downloading $($asset.name) from $downloadUrl..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $destPath

Write-Host "Extracting to $extractPath..."
Expand-Archive -Path $destPath -DestinationPath $extractPath -Force

# Verify mpv.exe exists
if (Test-Path "$extractPath/mpv.exe") {
    Write-Host "Success! mpv.exe found at $extractPath/mpv.exe"
} else {
    Throw "Extraction failed or mpv.exe not found."
}

Remove-Item $destPath -Force
