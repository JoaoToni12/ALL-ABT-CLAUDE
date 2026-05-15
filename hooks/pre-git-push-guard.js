// PreToolUse hook: blocks destructive git push variants and unauthorized pushes
// to protected branches.
// Bypass marker for protected branches: append "# user-approved" to the command
// after explicit user confirmation.
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const cmd = (input.tool_input && input.tool_input.command) || '';

    if (!/git\s+push\b/.test(cmd)) {
      process.stdout.write(data);
      return;
    }

    const userApproved = /#\s*user-approved\b/.test(cmd);

    // Block hard force push (no recovery, overwrites remote).
    if (/git\s+push\b[^#]*\s(--force|-f)\b/.test(cmd)) {
      process.stderr.write(
        '[BLOCKED] Hard force push detected (--force / -f).\n' +
        'This overwrites remote history with no recovery. If you genuinely need to overwrite,\n' +
        'use --force-with-lease (which detects unexpected upstream changes).\n'
      );
      process.exit(2);
    }

    // Block force-with-lease unless user-approved (safer but still destructive).
    if (/--force-with-lease\b/.test(cmd) && !userApproved) {
      process.stderr.write(
        '[BLOCKED] --force-with-lease detected.\n' +
        'Safer than --force but still rewrites remote history. Confirm with the user,\n' +
        'then re-run with `# user-approved` appended.\n'
      );
      process.exit(2);
    }

    // Block refspec with leading "+" (force-push refspec form).
    if (/git\s+push\b[^#]*\s\+[^\s]/.test(cmd) && !userApproved) {
      process.stderr.write(
        '[BLOCKED] Force-push refspec detected (leading "+" on a refspec means force).\n' +
        'Re-run with `# user-approved` if intentional.\n'
      );
      process.exit(2);
    }

    // Block --mirror (overwrites all refs on remote, very destructive).
    if (/--mirror\b/.test(cmd) && !userApproved) {
      process.stderr.write(
        '[BLOCKED] git push --mirror overwrites all remote refs. Confirm with user and add `# user-approved`.\n'
      );
      process.exit(2);
    }

    // Block --delete (remote branch deletion).
    if (/--delete\b/.test(cmd) && !userApproved) {
      process.stderr.write(
        '[BLOCKED] Remote branch deletion detected (--delete). Confirm with user and add `# user-approved`.\n'
      );
      process.exit(2);
    }

    // Block pushes to protected branches unless explicitly user-approved.
    // Matches: `git push origin main`, `git push origin HEAD:main`, `git push origin main:main`, etc.
    const protectedBranchRe = /\b(main|master|production|prod|release|staging)\b/;
    // Strip the user-approved suffix before matching to avoid the bypass tag itself matching a branch.
    const cmdCore = cmd.replace(/#\s*user-approved.*$/, '');
    if (protectedBranchRe.test(cmdCore) && !userApproved) {
      process.stderr.write(
        '[BLOCKED] Push to protected branch (main/master/production/prod/release/staging) detected.\n' +
        'Ask the user to confirm explicitly. If approved, re-run with `# user-approved` appended\n' +
        '(example: `git push origin main # user-approved`).\n'
      );
      process.exit(2);
    }

    // Soft warning for any non-blocked push.
    process.stderr.write('[HOOK] git push detected — make sure changes are reviewed and tested before pushing.\n');

    process.stdout.write(data);
  } catch (e) {
    process.stdout.write(data);
  }
});
