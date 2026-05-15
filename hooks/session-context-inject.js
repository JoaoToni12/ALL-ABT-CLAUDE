// SessionStart hook: Injects git context once at session start.
// Replaces the older PreToolUse-with-ppid-marker pattern with the native SessionStart event.
// Source schema fields: session_id, hook_event_name, source ("startup"|"resume"|"clear"|"compact"), cwd, model.
const { shouldRun } = require(require('path').join(__dirname, 'hook-profile-check'));
const { execFileSync } = require('child_process');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const source = input.source || 'startup';
    const cwd = input.cwd || process.cwd();

    // Skip in minimal profile
    if (!shouldRun('session-context', 'standard').shouldRun) {
      process.stdout.write(JSON.stringify({ continue: true }));
      return;
    }

    // On compaction we don't need the context dump (it just compressed everything).
    if (source === 'compact') {
      process.stdout.write(JSON.stringify({ continue: true }));
      return;
    }

    const runGit = (args) => {
      try {
        return execFileSync('git', args, {
          cwd, encoding: 'utf8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();
      } catch {
        return '';
      }
    };

    // Verify we're in a git repo before spawning multiple subprocesses.
    const inRepo = runGit(['rev-parse', '--is-inside-work-tree']);
    if (inRepo !== 'true') {
      process.stdout.write(JSON.stringify({ continue: true }));
      return;
    }

    const parts = [];
    const sourceLabel = source === 'resume' ? '↻ resumed' : source === 'clear' ? '🧹 cleared' : '▶ startup';
    parts.push(`Session ${sourceLabel}`);

    const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
    if (branch) parts.push(`Branch: ${branch}`);

    const log = runGit(['log', '--oneline', '-5']);
    if (log) parts.push(`Recent commits:\n${log}`);

    const diff = runGit(['diff', '--stat', 'HEAD']);
    if (diff) parts.push(`Uncommitted changes:\n${diff}`);

    const stash = runGit(['stash', 'list']);
    if (stash) parts.push(`Stashes:\n${stash}`);

    const additionalContext = parts.join('\n\n');

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext,
      },
    }));
  } catch (e) {
    process.stdout.write(JSON.stringify({ continue: true }));
  }
});
