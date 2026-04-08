// PostToolUse hook: validates JSON files after Write/Edit
// ALWAYS runs — JSON corruption is critical, cannot be disabled via profile
const fs = require('fs');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = (input.tool_input && input.tool_input.file_path) || '';

    if (filePath.endsWith('.json')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        JSON.parse(content);
      } catch (err) {
        process.stderr.write(`HOOK_ERROR: Invalid JSON syntax in ${filePath}\n`);
        process.stderr.write(`${err.message}\n`);
      }
    }
  } catch {
    // Parse error on stdin — skip silently
  }

  // Always passthrough stdin to stdout
  process.stdout.write(data);
});
