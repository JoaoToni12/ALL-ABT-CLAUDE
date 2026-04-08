// PreToolUse hook: Injects git context as a warning on first Bash/Read/Write call
// Triggered on: any tool use (matcher ".*")
// Provides: current branch, recent commits, uncommitted changes summary
// Only fires once per session using a temp file marker
const { shouldRun } = require(require('path').join(__dirname, 'hook-profile-check'));
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);

    // Skip in minimal profile
    if (!shouldRun('session-context', 'standard').shouldRun) {
      process.stdout.write(data);
      return;
    }

    // Only fire once per session — use a temp marker keyed to parent PID
    const ppid = process.ppid || 'unknown';
    const marker = path.join(os.tmpdir(), `.claude-session-context-${ppid}`);

    if (fs.existsSync(marker)) {
      process.stdout.write(data);
      return;
    }

    // Create marker (auto-cleaned on reboot since it's in tmp)
    fs.writeFileSync(marker, String(Date.now()));

    // Gather git context
    const parts = [];

    try {
      const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
        encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
      parts.push(`Branch: ${branch}`);
    } catch {}

    try {
      const log = execFileSync('git', ['log', '--oneline', '-5'], {
        encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
      if (log) parts.push(`Recent commits:\n${log}`);
    } catch {}

    try {
      const diff = execFileSync('git', ['diff', '--stat', 'HEAD'], {
        encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
      if (diff) parts.push(`Uncommitted changes:\n${diff}`);
    } catch {}

    try {
      const stash = execFileSync('git', ['stash', 'list'], {
        encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
      if (stash) parts.push(`Stashes:\n${stash}`);
    } catch {}

    if (parts.length > 0) {
      process.stderr.write(`[SESSION CONTEXT]\n${parts.join('\n\n')}\n`);
    }

    process.stdout.write(data);
  } catch (e) {
    process.stdout.write(data);
  }
});
