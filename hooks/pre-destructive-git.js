// PreToolUse hook: Blocks destructive git operations
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const cmd = (input.tool_input && input.tool_input.command) || '';

    const destructivePatterns = [
      { pattern: /git\s+reset\s+--hard/, msg: 'git reset --hard discards all local changes' },
      { pattern: /git\s+clean\s+-f/, msg: 'git clean -f permanently deletes untracked files' },
      { pattern: /git\s+checkout\s+--?\s+\./, msg: 'git checkout -- . discards all unstaged changes' },
      { pattern: /git\s+branch\s+-D\b/, msg: 'git branch -D force-deletes a branch' },
      { pattern: /git\s+stash\s+clear/, msg: 'git stash clear deletes all stashes' },
      { pattern: /git\s+stash\s+drop/, msg: 'git stash drop deletes a specific stash' },
      { pattern: /rm\s+-rf\s+\.git/, msg: 'Deleting .git destroys repository history' },
    ];

    for (const { pattern, msg } of destructivePatterns) {
      if (pattern.test(cmd)) {
        process.stderr.write(`[BLOCKED] Destructive operation: ${msg}. Get explicit user confirmation first.\n`);
        process.exit(2);
      }
    }

    process.stdout.write(data);
  } catch (e) {
    process.stdout.write(data);
  }
});
