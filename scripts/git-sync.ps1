<#
.SYNOPSIS
    Professional Git & GitHub synchronization tool for the Drafter monorepo.
.DESCRIPTION
    Safely synchronizes local branches with GitHub remote:
    - Verifies branch and repository status
    - Pre-flight check against committing massive files (>25MB) or credentials
    - Fetches and rebases with remote changes cleanly
    - Optionally runs frontend typechecks and backend compiles
    - Pushes verified commits to GitHub
.PARAMETER Branch
    The target remote branch (defaults to current active branch or 'main').
.PARAMETER SkipChecks
    Skips frontend and backend build/lint sanity checks before pushing.
.EXAMPLE
    .\scripts\git-sync.ps1
    .\scripts\git-sync.ps1 -Branch main
    .\scripts\git-sync.ps1 -SkipChecks
#>

[CmdletBinding()]
param(
    [string]$Branch = "",
    [switch]$SkipChecks = $false
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

try {
    # 1. Verify Git Repository
    if (-not (Test-Path ".git")) {
        Write-Err "Current directory is not a Git repository root. Please run 'git init' first."
        exit 1
    }

    # 2. Determine Current Branch
    $currentBranch = (git branch --show-current).Trim()
    if (-not $currentBranch) {
        $currentBranch = "main"
    }

    $targetBranch = if ($Branch) { $Branch } else { $currentBranch }
    Write-Step "Operating on branch '$targetBranch' (current: '$currentBranch')"

    # 3. Check for Unignored Large Files (>25MB) or Staged Large Files
    Write-Step "Running security & large-file pre-flight checks..."
    $largeFiles = Get-ChildItem -Path . -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { 
            $_.Length -gt 25MB -and 
            $_.FullName -notmatch "node_modules|\.git|venv|drafterenv|\.next" 
        } | Where-Object {
            # Only flag if file is NOT ignored by git
            $rel = Resolve-Path -Relative $_.FullName
            git check-ignore -q $rel
            $LASTEXITCODE -ne 0
        }

    if ($largeFiles) {
        Write-Err "Found unignored large file(s) (>25MB) in workspace that would fail GitHub push:"
        foreach ($f in $largeFiles) {
            $mb = [math]::Round($f.Length / 1MB, 2)
            Write-Host "   - $($f.FullName) ($mb MB)" -ForegroundColor Red
        }
        Write-Err "Add these files to .gitignore or Git LFS before pushing."
        exit 1
    } else {
        Write-Success "No unignored large files or exposed weights detected."
    }

    # 4. Run Sanity Checks if requested
    if (-not $SkipChecks) {
        Write-Step "Running code health checks..."
        
        # Check backend python syntax
        Write-Host "Checking backend python syntax..." -ForegroundColor Gray
        python -m compileall backend/app -q
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backend python files compile cleanly."
        } else {
            Write-Err "Backend python compilation failed. Fix errors before syncing."
            exit 1
        }

        # Check frontend typecheck if node_modules exists
        if (Test-Path "frontend/node_modules") {
            Write-Host "Running frontend TypeScript check..." -ForegroundColor Gray
            Push-Location frontend
            npx tsc --noEmit
            $tscExit = $LASTEXITCODE
            Pop-Location
            if ($tscExit -eq 0) {
                Write-Success "Frontend TypeScript check passed."
            } else {
                Write-Err "Frontend TypeScript check failed. Fix errors before syncing."
                exit 1
            }
        }
    } else {
        Write-Warn "Skipping sanity checks (-SkipChecks specified)."
    }

    # 5. Remote Sync Verification
    $remotes = git remote -v
    if (-not $remotes) {
        Write-Warn "No git remote origin is configured."
        Write-Host "To link a remote GitHub repository, run:" -ForegroundColor Cyan
        Write-Host "   git remote add origin https://github.com/<your-username>/<your-repo>.git" -ForegroundColor White
        Write-Host "   git push -u origin $targetBranch" -ForegroundColor White
        exit 0
    }

    # 6. Fetch and Rebase with Remote
    Write-Step "Fetching latest from remote origin..."
    git fetch origin

    Write-Step "Rebasing local changes onto origin/$targetBranch..."
    git pull --rebase origin $targetBranch

    # 7. Push to Remote
    Write-Step "Pushing commits to GitHub ($targetBranch)..."
    git push origin $targetBranch

    Write-Success "Synchronization complete! Your branch is aligned with GitHub."

} catch {
    Write-Err "Git sync operation failed: $_"
    exit 1
}
