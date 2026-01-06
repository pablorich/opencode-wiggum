#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"

# Get version from package.json
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$version = $packageJson.version

Write-Host "Building Wiggum v$version" -ForegroundColor Green

# Build binaries
Write-Host "Building binaries..." -ForegroundColor Yellow
bun run build

# Create release directory
$releaseDir = "release"
if (Test-Path $releaseDir) {
    Remove-Item -Recurse -Force $releaseDir
}
New-Item -ItemType Directory -Path $releaseDir | Out-Null

# Create archive for Windows x64
Write-Host "Creating Windows x64 archive..." -ForegroundColor Yellow
Compress-Archive -Path "bin\wiggum.exe", "bin\task.exe" -DestinationPath "$releaseDir\wiggum-windows-x64.zip" -Force

# Create archive for Linux x64 (using bun to cross-compile would require separate build)
# For now, just copy the install script
Copy-Item "install.sh" -Destination "$releaseDir\"

Write-Host "`nRelease files created in $releaseDir:" -ForegroundColor Green
Get-ChildItem -Path $releaseDir | ForEach-Object { Write-Host "  - $($_.Name)" }

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Review the files in $releaseDir"
Write-Host "  2. Create a GitHub tag: git tag v$version"
Write-Host "  3. Push the tag: git push --tags"
Write-Host "  4. Upload the files to GitHub releases"
