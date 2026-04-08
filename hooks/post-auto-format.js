// PostToolUse hook: Auto-formats files after Write/Edit using prettier
// Triggered on: Write, Edit tool completions
// Skips unsupported file types gracefully
const { shouldRun } = require(require('path').join(__dirname, 'hook-profile-check'));
const { execFileSync } = require('child_process');
const path = require('path');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);

    // Skip in minimal profile — formatting is nice-to-have, not critical
    if (!shouldRun('auto-format', 'standard').shouldRun) {
      process.stdout.write(data);
      return;
    }

    const filePath = input.tool_input && (input.tool_input.file_path || '');
    if (!filePath) {
      process.stdout.write(data);
      return;
    }

    // Only format file types prettier supports well
    const ext = path.extname(filePath).toLowerCase();
    const FORMATTABLE = new Set([
      '.js', '.jsx', '.ts', '.tsx', '.json',
      '.css', '.scss', '.less', '.html',
      '.md', '.yaml', '.yml', '.graphql', '.gql',
    ]);

    if (!FORMATTABLE.has(ext)) {
      process.stdout.write(data);
      return;
    }

    // Run prettier — fail silently if not installed or config issues
    try {
      execFileSync('npx', ['prettier', '--write', filePath], {
        encoding: 'utf8',
        timeout: 15000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      process.stderr.write(`[FORMAT] prettier applied to ${path.basename(filePath)}\n`);
    } catch {
      // prettier not available or failed — skip silently
    }

    process.stdout.write(data);
  } catch (e) {
    process.stdout.write(data);
  }
});
