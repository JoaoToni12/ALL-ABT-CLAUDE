#!/usr/bin/env bash
# Claude Code Framework — Unix installer
# Idempotent: safe to run multiple times.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
TEMP_DIR="${TMPDIR:-/tmp}"

# --- Prerequisites -----------------------------------------------------------
for cmd in node git claude; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "ERROR: '$cmd' not found. Install it first."; exit 1; }
done
echo "[ok] Prerequisites: node, git, claude"

# --- Backup existing config --------------------------------------------------
if [ -f "$CLAUDE_DIR/settings.json" ] || [ -f "$CLAUDE_DIR/CLAUDE.md" ]; then
  BACKUP="$CLAUDE_DIR/backup-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$BACKUP"
  [ -f "$CLAUDE_DIR/settings.json" ] && cp "$CLAUDE_DIR/settings.json" "$BACKUP/"
  [ -f "$CLAUDE_DIR/CLAUDE.md" ]     && cp "$CLAUDE_DIR/CLAUDE.md"     "$BACKUP/"
  echo "[ok] Backup saved to $BACKUP"
fi

# --- Create directory structure -----------------------------------------------
for dir in hooks rules commands agents skills; do
  mkdir -p "$CLAUDE_DIR/$dir"
done
echo "[ok] Directory structure ready"

# --- Copy framework files (overwrite hooks/rules/commands/agents) -------------
for dir in hooks rules commands agents skills; do
  if [ -d "$SCRIPT_DIR/$dir" ]; then
    cp -r "$SCRIPT_DIR/$dir/." "$CLAUDE_DIR/$dir/"
  fi
done
echo "[ok] Framework files copied"

# --- Preserve user-customizable files (no clobber) ----------------------------
[ -f "$SCRIPT_DIR/CLAUDE.md" ] && cp -n "$SCRIPT_DIR/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null || true
echo "[ok] CLAUDE.md preserved (not overwritten if exists)"

# --- Generate settings.json from template -------------------------------------
CLAUDE_FWD="${CLAUDE_DIR}"                                    # forward slashes
CLAUDE_WIN="$(echo "$CLAUDE_DIR" | sed 's|/|\\\\|g')"        # double-backslash for JSON
TEMP_WIN="$(echo "$TEMP_DIR" | sed 's|/|\\\\|g')"

sed \
  -e "s|{{CLAUDE_DIR_WIN}}|${CLAUDE_WIN}|g" \
  -e "s|{{CLAUDE_DIR}}|${CLAUDE_FWD}|g" \
  -e "s|{{TEMP_DIR_WIN}}|${TEMP_WIN}|g" \
  "$SCRIPT_DIR/settings.json.template" > "$CLAUDE_DIR/settings.json"
echo "[ok] settings.json generated"

# --- Make hooks executable ----------------------------------------------------
chmod +x "$CLAUDE_DIR/hooks/"*.js 2>/dev/null || true
echo "[ok] Hooks marked executable"

# --- Manual steps -------------------------------------------------------------
echo ""
echo "=== Manual steps remaining ==="
echo "1. Run 'claude auth' to authenticate with Anthropic"
echo "2. Configure MCP API keys (n8n, Linear, Notion) in ~/.claude/config.json"
echo "3. Install plugins:"
echo "     claude plugin marketplace add EtienneLescot/n8n-as-code"
echo "     claude plugin install n8n-as-code@n8nac-marketplace"
echo "4. Copy project-level CLAUDE.md to each repo as needed"
echo ""
echo "Done! Framework installed to $CLAUDE_DIR"
