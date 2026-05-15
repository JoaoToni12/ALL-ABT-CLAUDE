// PreToolUse hook: Blocks writes to sensitive files (.env, credentials, secrets, certs, keystores).
// Also scans content for hardcoded secrets across many vendor formats.
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
      /service.account.*\.json$/,
      /\.p12$/,
      /\.pfx$/,
      /\.jks$/,
      /\.keystore$/,
      /\.kdbx$/,
      /\.gpg$/,
      /\.asc$/,
      /kubeconfig($|\.)/,
      /\.aws\/credentials/,
      /\.aws\/config/,
      /\.npmrc$/,
      /\.git-credentials/,
      /\.docker\/config\.json/,
      /\.kube\/config/,
      /\.ssh\/(id_|authorized_keys|known_hosts)/
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(filePath)) {
        process.stderr.write(`[BLOCKED] Attempted write to sensitive file: ${input.tool_input.file_path}\nThis file likely contains secrets. Confirm with the user before proceeding.\n`);
        process.exit(2);
      }
    }

    // Scan content for hardcoded secrets across many vendor formats.
    const content = (input.tool_input && (input.tool_input.content || input.tool_input.new_string || ''));
    const secretPatterns = [
      // Anthropic
      { name: 'Anthropic API key', re: /sk-ant-api03-[A-Za-z0-9_-]{40,}/ },
      // OpenAI (legacy + project keys)
      { name: 'OpenAI key', re: /sk-(?:proj-)?[A-Za-z0-9_-]{40,}/ },
      // Generic API/secret/token assignment
      { name: 'API key/secret assignment', re: /(?:api[_-]?key|api[_-]?secret|access[_-]?token|auth[_-]?token|secret[_-]?key)\s*[:=]\s*["'][A-Za-z0-9+/=_-]{20,}["']/i },
      // Stripe live/test
      { name: 'Stripe key', re: /(?:sk|pk|rk)[-_](?:live|test)[-_][A-Za-z0-9]{20,}/ },
      // Slack tokens (bot/user/legacy/app)
      { name: 'Slack token', re: /xox[bpasr]-[A-Za-z0-9-]+/ },
      // Slack webhook URL
      { name: 'Slack webhook', re: /hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[A-Za-z0-9]+/ },
      // GitHub PAT
      { name: 'GitHub PAT', re: /ghp_[A-Za-z0-9]{36,}/ },
      // GitHub fine-grained PAT
      { name: 'GitHub fine-grained PAT', re: /github_pat_[A-Za-z0-9_]{60,}/ },
      // GitLab PAT
      { name: 'GitLab PAT', re: /glpat-[A-Za-z0-9_-]{20,}/ },
      // AWS access key
      { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/ },
      // AWS secret access key (heuristic)
      { name: 'AWS secret', re: /aws[_-]?secret[_-]?access[_-]?key\s*[:=]\s*["'][A-Za-z0-9+/]{40}["']/i },
      // Google API key
      { name: 'Google API key', re: /AIza[0-9A-Za-z_-]{35}/ },
      // JWT (three-part base64url, length-guarded to reduce false positives)
      { name: 'JWT', re: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/ },
      // npm token
      { name: 'npm token', re: /npm_[A-Za-z0-9]{36,}/ },
      // Linear API key
      { name: 'Linear API key', re: /lin_api_[A-Za-z0-9]{32,}/ },
      // Linear OAuth secret
      { name: 'Linear OAuth secret', re: /lin_oauth_[A-Za-z0-9]{32,}/ },
      // Notion integration secret
      { name: 'Notion secret', re: /\bsecret_[A-Za-z0-9]{43}\b/ },
      // Notion ntn token (newer format)
      { name: 'Notion ntn token', re: /\bntn_[A-Za-z0-9]{40,}/ },
      // PEM private key block
      { name: 'PEM private key', re: /-----BEGIN (?:RSA |DSA |EC |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/ }
    ];

    for (const p of secretPatterns) {
      if (p.re.test(content)) {
        process.stderr.write(`[BLOCKED] Content appears to contain hardcoded secret (${p.name}). Use environment variables or a secret manager instead.\n`);
        process.exit(2);
      }
    }

    process.stdout.write(data);
  } catch (e) {
    process.stdout.write(data);
  }
});
