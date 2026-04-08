// PreToolUse hook: Blocks writes to sensitive files (.env, credentials, secrets)
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = (input.tool_input && (input.tool_input.file_path || '')) .toLowerCase().replace(/\\/g, '/');

    const sensitivePatterns = [
      /\.env($|\.)/,
      /credentials/,
      /secrets?\.(json|ya?ml|toml|ini|cfg)$/,
      /\.pem$/,
      /\.key$/,
      /id_rsa/,
      /\.netrc/,
      /token.*\.(json|ya?ml|txt)$/,
      /service.account.*\.json$/
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(filePath)) {
        process.stderr.write(`[BLOCKED] Attempted write to sensitive file: ${input.tool_input.file_path}\nThis file likely contains secrets. Confirm with the user before proceeding.\n`);
        process.exit(2);
      }
    }

    // Also check content for hardcoded secrets
    const content = (input.tool_input && (input.tool_input.content || input.tool_input.new_string || ''));
    const secretPatterns = [
      /(?:api[_-]?key|api[_-]?secret|access[_-]?token|auth[_-]?token|secret[_-]?key)\s*[:=]\s*["'][A-Za-z0-9+/=_-]{20,}["']/i,
      /(?:sk|pk)[-_](?:live|test)[-_][A-Za-z0-9]{20,}/,
      /xox[bpas]-[A-Za-z0-9-]+/,
      /ghp_[A-Za-z0-9]{36,}/,
      /glpat-[A-Za-z0-9_-]{20,}/,
      /AKIA[0-9A-Z]{16}/,
      /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
      /npm_[A-Za-z0-9]{36,}/
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(content)) {
        process.stderr.write('[BLOCKED] Content appears to contain hardcoded secrets/tokens. Use environment variables instead.\n');
        process.exit(2);
      }
    }

    process.stdout.write(data);
  } catch (e) {
    process.stdout.write(data);
  }
});
