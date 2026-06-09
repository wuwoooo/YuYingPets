param(
    [string]$Version = "patch",
    [string]$DistScript = "dist:win:cn"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$DisplayAppDir = Join-Path $ProjectRoot "display-app"
$DesktopDir = Join-Path $DisplayAppDir "desktop"
$DesktopPackageJson = Join-Path $DesktopDir "package.json"
$ReleaseDir = Join-Path $DesktopDir "release"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message"
}

function Require-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Command not found: $Name"
    }
}

function Get-DesktopVersion {
    $version = node -e "const fs=require('fs'); const pkg=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); process.stdout.write(String(pkg.version || ''));" $DesktopPackageJson
    if (-not $version) {
        throw "Failed to read desktop package version from: $DesktopPackageJson"
    }
    return [string]$version
}

function Ensure-WorkspaceDependencies {
    Write-Step "Check desktop workspace dependencies"

    Push-Location $DisplayAppDir
    try {
        npm ls electron-updater --workspace desktop --depth=0 *> $null
        if ($LASTEXITCODE -ne 0) {
            Write-Step "Missing dependency detected, run npm install"
            npm install
        }
    }
    finally {
        Pop-Location
    }
}

function Set-DesktopVersion {
    param([string]$RequestedVersion)

    $oldVersion = Get-DesktopVersion

    if ($RequestedVersion -eq "current") {
        Write-Step "Keep current desktop version: $oldVersion"
        return $oldVersion
    }

    Push-Location $DisplayAppDir
    try {
        if ($RequestedVersion -match '^\d+\.\d+\.\d+$') {
            Write-Step "Set desktop version: $oldVersion -> $RequestedVersion"
            npm version $RequestedVersion --workspace desktop --no-git-tag-version --allow-same-version | Out-Null
        }
        else {
            Write-Step "Bump desktop version ($RequestedVersion): $oldVersion"
            npm version $RequestedVersion --workspace desktop --no-git-tag-version | Out-Null
        }
    }
    finally {
        Pop-Location
    }

    return Get-DesktopVersion
}

function Build-DesktopInstaller {
    param([string]$ScriptName)

    Write-Step "Run Windows packaging script: npm run $ScriptName --workspace desktop"
    Push-Location $DisplayAppDir
    try {
        npm run $ScriptName --workspace desktop
    }
    finally {
        Pop-Location
    }
}

function Resolve-ReleaseFiles {
    param([string]$ResolvedVersion)

    $installer = Join-Path $ReleaseDir "YuYingPets-Display-$ResolvedVersion-Setup.exe"
    $blockmap = "$installer.blockmap"
    $latestYml = Join-Path $ReleaseDir "latest.yml"

    if (-not (Test-Path -LiteralPath $installer)) {
        throw "Installer not found: $installer"
    }
    if (-not (Test-Path -LiteralPath $blockmap)) {
        throw "Blockmap not found: $blockmap"
    }
    if (-not (Test-Path -LiteralPath $latestYml)) {
        throw "Update metadata not found: $latestYml"
    }

    return @{
        LatestYml = $latestYml
        Installer = $installer
        Blockmap = $blockmap
    }
}

Require-Command "npm"
Require-Command "node"

$resolvedVersion = Set-DesktopVersion -RequestedVersion $Version
Ensure-WorkspaceDependencies
Build-DesktopInstaller -ScriptName $DistScript
$releaseFiles = Resolve-ReleaseFiles -ResolvedVersion $resolvedVersion

Write-Step "Windows packaging completed"
Write-Host "Version: $resolvedVersion"
Write-Host "latest.yml: $($releaseFiles.LatestYml)"
Write-Host "Installer: $($releaseFiles.Installer)"
Write-Host "blockmap: $($releaseFiles.Blockmap)"
Write-Host ""
Write-Host "Next: copy these three files back to Mac, then run:"
Write-Host "SKIP_BUILD=1 ./deploy-display-desktop.sh current"
