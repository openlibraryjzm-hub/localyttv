# PowerShell script to automate building and compiling YTTV Installer
$ErrorActionPreference = "Stop"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "         YTTV Packaging Pipeline Started      " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Step 1: React build
Write-Host "`n[1/3] Compiling React Frontend..." -ForegroundColor Yellow
npm run build

# Step 2: C# Publish
Write-Host "`n[2/3] Publishing C# Self-Contained Release..." -ForegroundColor Yellow
dotnet publish src-csharp/YTTV/YTTV.csproj -c Release -r win-x64 --self-contained true

# Step 3: Inno Setup Compilation
Write-Host "`n[3/3] Compiling Installer via Inno Setup..." -ForegroundColor Yellow
$isccPath = "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe"

if (Test-Path $isccPath) {
    & $isccPath setup.iss
    Write-Host "`n==============================================" -ForegroundColor Green
    Write-Host " Success! Installer generated: YTTV_Setup_x64.exe" -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Green
} else {
    Write-Host "Warning: Inno Setup Compiler not found at: $isccPath" -ForegroundColor Red
    Write-Host "Please compile setup.iss manually using Inno Setup." -ForegroundColor Yellow
}
