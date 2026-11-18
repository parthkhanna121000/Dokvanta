<#
.SYNOPSIS
  Creates the approved EMPTY folders/files for one Dokvanta module.
  Never overwrites, never deletes, never touches .git, never changes branches.
.EXAMPLE
  .\setup-module.ps1 -Module foundation -DryRun
  .\setup-module.ps1 -Module foundation
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('foundation', 'auth', 'documents', 'revisions', 'pdf-eval')]
  [string]$Module,
  [switch]$DryRun,
  [string]$ExpectedBranch = 'feature/dokvanta'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$manifest = @{
  'foundation' = @{
    Dirs = @(
      'docs', 'backend/src', 'backend/src/config', 'backend/src/middleware',
      'backend/src/utils', 'backend/src/routes', 'backend/tests', 'backend/tests/helpers'
    )
    Files = @(
      'docs/system-architecture.md', 'docs/implementation-roadmap.md', 'docs/decisions.md',
      'backend/LEGACY.md', 'backend/tsconfig.json', 'backend/vitest.config.ts', 'backend/.env.example',
      'backend/src/app.ts', 'backend/src/server.ts',
      'backend/src/config/env.ts', 'backend/src/config/database.ts',
      'backend/src/middleware/request-id.ts', 'backend/src/middleware/error-handler.ts',
      'backend/src/middleware/validate.ts',
      'backend/src/utils/app-error.ts', 'backend/src/utils/logger.ts',
      'backend/src/routes/index.ts', 'backend/src/routes/health.routes.ts',
      'backend/tests/health.test.ts', 'backend/tests/helpers/test-app.ts'
    )
  }
  'auth' = @{
    Dirs = @('backend/src/modules', 'backend/src/modules/auth', 'backend/src/modules/users')
    Files = @(
      'backend/src/modules/auth/auth.routes.ts', 'backend/src/modules/auth/auth.controller.ts',
      'backend/src/modules/auth/auth.service.ts', 'backend/src/modules/auth/auth.schemas.ts',
      'backend/src/modules/users/user.model.ts', 'backend/src/modules/users/user.service.ts',
      'backend/src/middleware/authenticate.ts',
      'backend/src/utils/password.ts', 'backend/src/utils/tokens.ts',
      'backend/tests/auth.test.ts'
    )
  }
  'documents' = @{
    Dirs = @('backend/src/modules/documents', 'backend/src/adapters', 'backend/src/adapters/storage')
    Files = @(
      'backend/src/modules/documents/document.model.ts', 'backend/src/modules/documents/document.routes.ts',
      'backend/src/modules/documents/document.controller.ts', 'backend/src/modules/documents/document.service.ts',
      'backend/src/modules/documents/document.schemas.ts',
      'backend/src/adapters/storage/storage.adapter.ts', 'backend/src/adapters/storage/local-storage.adapter.ts',
      'backend/src/middleware/upload.ts', 'backend/src/utils/pdf-validation.ts',
      'backend/tests/documents.test.ts'
    )
  }
  'revisions' = @{
    Dirs = @('backend/src/modules/revisions', 'backend/src/modules/artifacts')
    Files = @(
      'backend/src/modules/artifacts/artifact.model.ts', 'backend/src/modules/artifacts/artifact.service.ts',
      'backend/src/modules/revisions/revision.model.ts', 'backend/src/modules/revisions/revision.service.ts',
      'backend/src/modules/revisions/revision.routes.ts', 'backend/src/modules/revisions/revision.controller.ts',
      'backend/tests/revisions.test.ts'
    )
  }
  'pdf-eval' = @{
    Dirs = @('tools', 'tools/pdf-eval', 'tools/pdf-eval/samples', 'tools/pdf-eval/scripts')
    Files = @(
      'tools/pdf-eval/README.md', 'tools/pdf-eval/criteria.md', 'tools/pdf-eval/results.md',
      'tools/pdf-eval/samples/.gitkeep', 'tools/pdf-eval/scripts/.gitkeep'
    )
  }
}

# ---- Safety checks ----
$root = (Get-Location).Path.TrimEnd('\', '/')
foreach ($required in '.git', 'frontend', 'backend') {
  if (-not (Test-Path (Join-Path $root $required))) {
    Write-Host "ERROR: '$required' not found. Run this from the Dokvanta repository root." -ForegroundColor Red
    exit 1
  }
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host 'ERROR: git not found on PATH.' -ForegroundColor Red
  exit 1
}
$branch = (& git --no-pager branch --show-current).Trim()
if ($branch -ne $ExpectedBranch) {
  Write-Host "ERROR: on branch '$branch', expected '$ExpectedBranch'. This script never changes branches." -ForegroundColor Red
  exit 1
}

function Resolve-SafePath([string]$Relative) {
  $full = [System.IO.Path]::GetFullPath((Join-Path $root $Relative))
  if (-not $full.StartsWith($root + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Path escapes repository root: $Relative"
  }
  if ($full -match '[\\/]\.git([\\/]|$)') { throw "Refusing to touch .git: $Relative" }
  return $full
}

$created = 0; $skipped = 0; $errors = 0
$plan = $manifest[$Module]
Write-Host "Module: $Module | Branch: $branch | DryRun: $($DryRun.IsPresent)" -ForegroundColor Cyan

# ---- Directories ----
foreach ($rel in $plan.Dirs) {
  try {
    $path = Resolve-SafePath $rel
    if (Test-Path -LiteralPath $path -PathType Container) {
      Write-Host "[SKIP] $rel (exists)" -ForegroundColor DarkGray; $skipped++
    }
    elseif (Test-Path -LiteralPath $path) {
      throw "A file already exists where a directory is needed: $rel"
    }
    elseif ($DryRun) {
      Write-Host "[DRY ] would create dir  $rel" -ForegroundColor Yellow
    }
    else {
      New-Item -ItemType Directory -Path $path | Out-Null
      Write-Host "[DIR+] $rel" -ForegroundColor Green; $created++
    }
  }
  catch { Write-Host "[ERR ] $rel : $($_.Exception.Message)" -ForegroundColor Red; $errors++ }
}

# ---- Files (empty; never overwritten) ----
foreach ($rel in $plan.Files) {
  try {
    $path = Resolve-SafePath $rel
    if (Test-Path -LiteralPath $path) {
      Write-Host "[SKIP] $rel (exists)" -ForegroundColor DarkGray; $skipped++
      continue
    }
    $parent = Split-Path -Parent $path
    if (-not (Test-Path -LiteralPath $parent -PathType Container)) {
      if ($DryRun) { Write-Host "[DRY ] would create dir  $parent" -ForegroundColor Yellow }
      else {
        New-Item -ItemType Directory -Path $parent | Out-Null
        Write-Host "[DIR+] $($parent.Substring($root.Length + 1))" -ForegroundColor Green; $created++
      }
    }
    if ($DryRun) {
      Write-Host "[DRY ] would create file $rel" -ForegroundColor Yellow
    }
    else {
      New-Item -ItemType File -Path $path | Out-Null
      Write-Host "[FILE+] $rel" -ForegroundColor Green; $created++
    }
  }
  catch { Write-Host "[ERR ] $rel : $($_.Exception.Message)" -ForegroundColor Red; $errors++ }
}

Write-Host "`nDone. Created: $created | Skipped (already existed): $skipped | Errors: $errors" -ForegroundColor Cyan
if ($errors -gt 0) { exit 1 }