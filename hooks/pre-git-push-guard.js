// PreToolUse hook: Warns before git push, blocks force push
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const cmd = (input.tool_input && input.tool_input.command) || '';

    if (/git\s+push\s+.*--force/.test(cmd) || /git\s+push\s+-f\b/.test(cmd)) {
      process.stderr.write('[BLOCKED] Force push detected. This is destructive and not allowed by default.\n');
      process.exit(2);
    }

    if (/git\s+push/.test(cmd)) {
      process.stderr.write('[HOOK] git push detected — make sure changes are reviewed and tested before pushing.\n');
    }

    process.stdout.write(data);
  } catch (e) {
    process.stdout.write(data);
  }
});
