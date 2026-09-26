# Deployment & Packaging Guide

This guide details the steps required to compile the React frontend, publish the self-contained C# backend, and build the final distributable Windows installer (`YTTV_Setup_x64.exe`).

---

## 1. Quick Start: One-Click Build

To automate the entire compilation and packaging pipeline, run the PowerShell script at the root of the workspace:

```powershell
.\build-installer.ps1
```

This script will sequentially:
1. Build the React frontend production assets.
2. Compile and publish the C# WPF application as a self-contained 64-bit release.
3. Invoke the Inno Setup compiler to output `YTTV_Setup_x64.exe` in the root folder.

---

## 2. Step-by-Step Manual Guide

If you prefer to run the steps manually or debug individual stages, follow this workflow:

### Step A: Compile React Frontend
Build the frontend files into standard HTML, CSS, and JS assets:
```bash
npm run build
```
* **Output Folder:** `/dist`
* **Configuration:** Output files are automatically copied next to the compiled WPF executable during the C# build process via the MSBuild rules in `YTTV.csproj`.

### Step B: Publish Self-Contained C# Build
Publish the WPF application. This step bundles the .NET 8 Runtime and all dependencies so the user needs no pre-installed dependencies.
```powershell
dotnet publish src-csharp/YTTV/YTTV.csproj -c Release -r win-x64 --self-contained true
```
* **Output Folder:** `src-csharp/YTTV/bin/Release/net8.0-windows/win-x64/publish/`

### Step C: Compile Installer using Inno Setup
Compile the script using Inno Setup Compiler (`ISCC.exe`):
```powershell
& "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe" setup.iss
```
* **Output File:** `YTTV_Setup_x64.exe` in the root workspace folder.

---

## 3. Key Files Reference

* **[setup.iss](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/setup.iss)**: Inno Setup script that maps files to install paths.
* **[YTTV.csproj](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src-csharp/YTTV/YTTV.csproj)**: C# project configuration file containing the copy-on-build rules for `/dist`.
* **[MainWindow.xaml.cs](file:///c:/Users/jodyn/Desktop/yttv%20april%20port/src-csharp/YTTV/MainWindow.xaml.cs)**: Defines the conditional WebView2 routing (Debug server vs. production `https://app.local`).
