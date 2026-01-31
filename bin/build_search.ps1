<#
.SYNOPSIS
Builds the DocFind search index for the Hugo site.
.DESCRIPTION
This script automates the process of generating the search index.
It handles:
1. Downloading the DocFind binary if missing.
2. Generating the search.json from the Hugo site (either via running server or build).
3. Running DocFind to generate WASM/JS assets in static/docfind.
#>

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$BinDir = Join-Path $RootDir "bin"
$DocFindExe = Join-Path $BinDir "docfind.exe"
$StaticDir = Join-Path $RootDir "static/docfind"
$PublicDir = Join-Path $RootDir "public"

# Ensure directories exist
if (-not (Test-Path $BinDir)) { New-Item -ItemType Directory -Path $BinDir | Out-Null }
if (-not (Test-Path $StaticDir)) { New-Item -ItemType Directory -Path $StaticDir -Force | Out-Null }

# 1. Check/Download Binary
# 1. Check/Install Binary
if (-not (Test-Path $DocFindExe)) {
    # Check if docfind is in PATH first
    if (Get-Command "docfind" -ErrorAction SilentlyContinue) {
        $DocFindExe = "docfind"
        Write-Host "Using DocFind from PATH" -ForegroundColor Green
    }
    else {
        Write-Host "DocFind binary not found. Installing via official script..." -ForegroundColor Cyan
        try {
            # Official install command from https://github.com/microsoft/docfind
            irm https://microsoft.github.io/docfind/install.ps1 | iex
            
            # The script installs to ~/.docfind/bin
            $UserBin = Join-Path $Env:UserProfile ".docfind/bin/docfind.exe"
            if (Test-Path $UserBin) {
                $DocFindExe = $UserBin
                Write-Host "Installation complete. Using: $DocFindExe" -ForegroundColor Green
            }
            else {
                throw "Installation check failed. Binary not found at $UserBin"
            }
        }
        catch {
            Write-Error "Failed to install DocFind. Please install manually from https://github.com/microsoft/docfind"
        }
    }
}
else {
    Write-Host "Using local DocFind: $DocFindExe" -ForegroundColor Green
}

# 2. Get JSON Content
$JsonPath = Join-Path $RootDir "temp_search.json"
$UsedServer = $false

Write-Host "Checking for running Hugo server..." -ForegroundColor Cyan
try {
    # Try fetching from localhost
    $Response = Invoke-WebRequest -Uri "http://localhost:1313/search.json" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    if ($Response.StatusCode -eq 200) {
        $Response.Content | Out-File -FilePath $JsonPath -Encoding UTF8
        Write-Host "Successfully fetched search.json from Dev Server." -ForegroundColor Green
        $UsedServer = $true
    }
}
catch {
    Write-Host "Hugo server not detected or search.json not available. Falling back to static build." -ForegroundColor Yellow
}

if (-not $UsedServer) {
    Write-Host "Building Hugo site to generate JSON..." -ForegroundColor Cyan
    # Run Hugo to build (assuming hugo is in PATH)
    try {
        Set-Location $RootDir
        & hugo --minify
        $BuiltJson = Join-Path $PublicDir "search.json"
        if (Test-Path $BuiltJson) {
            Copy-Item $BuiltJson $JsonPath
            Write-Host "Static build complete." -ForegroundColor Green
        }
        else {
            Write-Error "Build failed: search.json not found in public/ directory."
        }
    }
    catch {
        Write-Error "Hugo build failed. Ensure 'hugo' is installed and in your PATH."
    }
}

# 3. Run DocFind
Write-Host "Generating Search Index..." -ForegroundColor Cyan
try {
    & $DocFindExe $JsonPath $StaticDir
    Write-Host "Search assets generated in $StaticDir" -ForegroundColor Green
}
catch {
    Write-Error "Failed to run DocFind."
} 
finally {
    if (Test-Path $JsonPath) { Remove-Item $JsonPath }
}
