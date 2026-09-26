$ErrorActionPreference = "Stop"
$sevenZip = "C:\Program Files\7-Zip\7z.exe"
$url = "https://sourceforge.net/projects/mpv-player-windows/files/latest/download"
$destPath = "src-tauri/bin/mpv.7z"
$extractPath = "src-tauri/bin/mpv-bin"

New-Item -ItemType Directory -Force -Path "src-tauri/bin" | Out-Null
if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force }
New-Item -ItemType Directory -Force -Path $extractPath | Out-Null

Write-Host "Downloading mpv.7z from SourceForge..."
Invoke-WebRequest -Uri $url -OutFile $destPath -UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

Write-Host "Extracting using 7-Zip..."
& $sevenZip x $destPath -o"$extractPath" -y | Out-Null

# Find mpv.exe
$mpvExe = Get-ChildItem -Path $extractPath -Filter "mpv.exe" -Recurse | Select-Object -First 1

if ($mpvExe) {
    Write-Host "Found mpv.exe at $($mpvExe.FullName)"
    if ($mpvExe.Directory.FullName -ne (Resolve-Path $extractPath).Path) {
        Write-Host "Moving contents to $extractPath..."
        Get-ChildItem $mpvExe.Directory.FullName | Move-Item -Destination $extractPath -Force
    }
    Write-Host "MPV installed successfully to $extractPath"
}
else {
    Throw "mpv.exe not found after extraction."
}

Remove-Item $destPath -Force
