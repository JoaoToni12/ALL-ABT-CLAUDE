// PostToolUse hook: Detects debug statements left in edited/written code
const { shouldRun } = require(require('path').join(__dirname, 'hook-profile-check'));

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);

    // Skip in minimal profile — debug statements are a warning, not a blocker
    if (!shouldRun('debug-statements', 'standard').shouldRun) {
      process.stdout.write(data);
      return;
    }

    const filePath = (input.tool_input && (input.tool_input.file_path || '')).toLowerCase();
    const content = (input.tool_input && (input.tool_input.content || input.tool_input.new_string || ''));

    if (!content) {
      process.stdout.write(data);
      return;
    }

    // Skip test files, config files, and legitimate logging modules
    if (/\.(test|spec|config|log)\.[jt]sx?$/.test(filePath) ||
        /logging|logger/.test(filePath) ||
        /\.json$/.test(filePath) ||
        /\.md$/.test(filePath)) {
      process.stdout.write(data);
      return;
    }

    const warnings = [];

    // JavaScript/TypeScript
    if (/\.[jt]sx?$/.test(filePath)) {
      if (/\bconsole\.(log|debug|info)\b/.test(content)) {
        warnings.push('console.log/debug/info statement detected');
      }
      if (/\bdebugger\b/.test(content)) {
        warnings.push('debugger statement detected');
      }
    }

    // Python
    if (/\.py$/.test(filePath)) {
      if (/\bprint\s*\(/.test(content)) {
        warnings.push('print() statement detected — consider using logging instead');
      }
      if (/\bbreakpoint\s*\(/.test(content)) {
        warnings.push('breakpoint() detected');
      }
      if (/\bpdb\.set_trace\b/.test(content)) {
        warnings.push('pdb.set_trace() detected');
      }
    }

    if (warnings.length > 0) {
      process.stderr.write(`[DEBUG AUDIT] ${warnings.join('; ')}. Remove before committing.\n`);
    }

    process.stdout.write(data);
  } catch (e) {
    process.stdout.write(data);
  }
});
