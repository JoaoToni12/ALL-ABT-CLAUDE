// PreToolUse hook: Warns when creating files > 500 lines
const { shouldRun } = require(require('path').join(__dirname, 'hook-profile-check'));

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);

    // Skip in minimal profile — file size is a warning, not a blocker
    if (!shouldRun('file-size-limit', 'standard').shouldRun) {
      process.stdout.write(data);
      return;
    }

    const content = (input.tool_input && input.tool_input.content) || '';

    if (content) {
      const lineCount = content.split('\n').length;
      if (lineCount > 500) {
        process.stderr.write(`[WARNING] Writing a file with ${lineCount} lines. Consider splitting into smaller modules.\n`);
      }
    }

    process.stdout.write(data);
  } catch (e) {
    process.stdout.write(data);
  }
});
