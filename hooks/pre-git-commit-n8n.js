// PreToolUse hook: Validates n8n workflow JSONs staged for git commit
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const cmd = (input.tool_input && input.tool_input.command) || '';

    // Only intercept git commit commands
    if (!/git\s+commit/.test(cmd)) {
      process.stdout.write(data);
      return;
    }

    // Get staged workflow JSON files
    let stagedFiles;
    try {
      const raw = execSync('git diff --cached --name-only', {
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      stagedFiles = raw
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.match(/workflows[\\/].*\.json$/i));
    } catch (_e) {
      // git not available or no staged files — pass through
      process.stdout.write(data);
      return;
    }

    if (stagedFiles.length === 0) {
      process.stdout.write(data);
      return;
    }

    const issues = [];
    const warnings = [];

    for (const file of stagedFiles) {
      const absPath = path.resolve(process.cwd(), file);

      let content;
      try {
        content = fs.readFileSync(absPath, 'utf8');
      } catch (_e) {
        warnings.push(`${file}: could not read for validation`);
        continue;
      }

      // 1. Parse JSON
      let wf;
      try {
        wf = JSON.parse(content);
      } catch (e) {
        issues.push(`${file}: invalid JSON — ${e.message}`);
        continue;
      }

      // 2. Basic n8n structure
      if (!Array.isArray(wf.nodes)) {
        issues.push(`${file}: missing 'nodes' array — is this a valid n8n workflow?`);
      }
      if (typeof wf.connections !== 'object' || wf.connections === null) {
        issues.push(`${file}: missing 'connections' object — is this a valid n8n workflow?`);
      }

      // 3. {{ $env. }} anti-pattern — should use credential manager
      if (/\{\{\s*\$env\s*\./.test(content)) {
        issues.push(`${file}: found {{ $env. }} pattern — use n8n Credential Manager, not $env in node fields (values end up in execution logs)`);
      }

      // 4. PII: CPF pattern
      if (/\d{3}\.\d{3}\.\d{3}-\d{2}/.test(content)) {
        issues.push(`${file}: CPF pattern detected in workflow JSON — remove before committing`);
      }

      // 5. Hardcoded Snowflake account URL
      if (/[a-z0-9]+-[a-z0-9]+\.snowflakecomputing\.com/i.test(content)) {
        warnings.push(`${file}: hardcoded Snowflake account URL — prefer credential manager`);
      }

      // 6. Warn if Python code node uses os.environ without try/except (auth safety)
      const codeNodes = (wf.nodes || []).filter(n =>
        n.type === 'n8n-nodes-base.code' &&
        n.parameters &&
        n.parameters.language === 'python' &&
        typeof n.parameters.pythonCode === 'string'
      );
      for (const node of codeNodes) {
        const code = node.parameters.pythonCode;
        if (/snowflake/i.test(code) && !/try\s*:/i.test(code)) {
          warnings.push(`${file} → node "${node.name}": Snowflake code without try/except — auth failures won't be caught cleanly`);
        }
      }

      // 7. Warn if no error trigger and workflow has meaningful size
      const hasErrorHandling = (wf.nodes || []).some(n =>
        n.type === 'n8n-nodes-base.errorTrigger' ||
        n.type === 'n8n-nodes-base.stopAndError'
      );
      if (!hasErrorHandling && (wf.nodes || []).length > 4) {
        warnings.push(`${file}: no error trigger or Stop And Error node found — consider adding error handling`);
      }
    }

    if (issues.length > 0) {
      process.stderr.write('[BLOCKED] n8n workflow validation failed:\n');
      for (const i of issues) process.stderr.write(`  ✗ ${i}\n`);
      if (warnings.length > 0) {
        process.stderr.write('Warnings (non-blocking):\n');
        for (const w of warnings) process.stderr.write(`  ⚠ ${w}\n`);
      }
      process.exit(2);
    }

    if (warnings.length > 0) {
      process.stderr.write(`[n8n-commit] ${stagedFiles.length} workflow(s) validated with warnings:\n`);
      for (const w of warnings) process.stderr.write(`  ⚠ ${w}\n`);
    } else {
      process.stderr.write(`[n8n-commit] ${stagedFiles.length} workflow JSON(s) validated OK\n`);
    }

    process.stdout.write(data);
  } catch (_e) {
    // Never block on hook errors
    process.stdout.write(data);
  }
});
