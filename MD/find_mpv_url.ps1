$ErrorActionPreference = "Stop"
try {
    $url = "https://api.github.com/repos/zhongfly/mpv-winbuild/releases/latest"
    # GitHub API requires User-Agent
    $release = Invoke-RestMethod -Uri $url -Headers @{ "User-Agent" = "PowerShell" }
    
    $asset = $release.assets | Where-Object { $_.name -match "\.7z$" -or $_.name -match "\.zip$" } | Select-Object -First 1
    
    if ($asset) {
        Write-Host "URL: $($asset.browser_download_url)"
        Write-Host "Name: $($asset.name)"
    }
    else {
        Write-Host "No asset found in latest release."
        # Dump assets for debugging
        $release.assets | ForEach-Object { Write-Host "Asset: $($_.name)" }
    }
}
catch {
    Write-Host "Error: $($_.Exception.Message)"
}
