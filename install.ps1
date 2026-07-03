# Claude Code Framework — Windows (PowerShell) installer
# Idempotent: safe to run multiple times.
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ClaudeDir = "$env:USERPROFILE\.claude"
$TempDir   = $env:TEMP

# --- Prerequisites -----------------------------------------------------------
foreach ($cmd in @("node", "git", "claude")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error "ERROR: '$cmd' not found. Install it first."
        exit 1
    }
}
Write-Host "[ok] Prerequisites: node, git, claude"

# --- Backup existing config --------------------------------------------------
if ((Test-Path "$ClaudeDir\settings.json") -or (Test-Path "$ClaudeDir\CLAUDE.md")) {
    $Backup = "$ClaudeDir\backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    New-Item -ItemType Directory -Path $Backup -Force | Out-Null
    if (Test-Path "$ClaudeDir\settings.json") { Copy-Item "$ClaudeDir\settings.json" $Backup }
    if (Test-Path "$ClaudeDir\CLAUDE.md")     { Copy-Item "$ClaudeDir\CLAUDE.md"     $Backup }
    Write-Host "[ok] Backup saved to $Backup"
}

# --- Create directory structure -----------------------------------------------
foreach ($dir in @("hooks", "rules", "commands", "agents", "skills")) {
    New-Item -ItemType Directory -Path "$ClaudeDir\$dir" -Force | Out-Null
}
Write-Host "[ok] Directory structure ready"

# --- Copy framework files (overwrite hooks/rules/commands/agents) -------------
foreach ($dir in @("hooks", "rules", "commands", "agents", "skills")) {
    $src = "$ScriptDir\$dir"
    if (Test-Path $src) {
        Copy-Item "$src\*" "$ClaudeDir\$dir\" -Recurse -Force
    }
}
Write-Host "[ok] Framework files copied"

# --- Preserve user-customizable files (no clobber) ----------------------------
$claudeMd = "$ClaudeDir\CLAUDE.md"
if ((Test-Path "$ScriptDir\CLAUDE.md") -and -not (Test-Path $claudeMd)) {
    Copy-Item "$ScriptDir\CLAUDE.md" $claudeMd
}
Write-Host "[ok] CLAUDE.md preserved (not overwritten if exists)"

# --- Copy RTK.md (overwrite — it's framework-owned, not user-customized) ------
if (Test-Path "$ScriptDir\RTK.md") {
    Copy-Item "$ScriptDir\RTK.md" "$ClaudeDir\RTK.md" -Force
    Write-Host "[ok] RTK.md copied"
}

# --- Generate settings.json from template -------------------------------------
$ClaudeFwd = $ClaudeDir -replace '\\', '/'          # forward slashes for hook commands
$ClaudeWin = $ClaudeDir -replace '\\', '\\\\'        # double-backslash for JSON strings
$TempWin   = $TempDir   -replace '\\', '\\\\'

$template = Get-Content "$ScriptDir\settings.json.template" -Raw
$template = $template -replace '\{\{CLAUDE_DIR_WIN\}\}', $ClaudeWin
$template = $template -replace '\{\{CLAUDE_DIR\}\}',     $ClaudeFwd
$template = $template -replace '\{\{TEMP_DIR_WIN\}\}',   $TempWin
Set-Content -Path "$ClaudeDir\settings.json" -Value $template -Encoding UTF8
Write-Host "[ok] settings.json generated"

# --- Manual steps -------------------------------------------------------------
Write-Host ""
Write-Host "=== Manual steps remaining ==="
Write-Host "1. Run 'claude auth' to authenticate with Anthropic"
Write-Host "2. Configure MCP API keys (n8n, Linear, Notion) in ~\.claude\config.json"
Write-Host "3. Install RTK (Rust Token Killer) for token optimization:"
Write-Host "     https://github.com/JoaoToni12/rtk — follow install instructions"
Write-Host "4. Install plugins:"
Write-Host "     claude plugin marketplace add EtienneLescot/n8n-as-code"
Write-Host "     claude plugin install n8n-as-code@n8nac-marketplace"
Write-Host "     claude plugin marketplace add Egonex-AI/Understand-Anything"
Write-Host "     claude plugin install understand-anything@understand-anything"
Write-Host "5. Copy project-level CLAUDE.md to each repo as needed"
Write-Host ""
Write-Host "Done! Framework installed to $ClaudeDir"
