// Hook profile gate — include at the top of any hook that should respect profiles.
// Reads CLAUDE_HOOK_PROFILE env var:
//   "minimal"  — only critical hooks run (security + data integrity)
//   "standard" — run all hooks (default)
//   "strict"   — run all hooks + extra verbose warnings
// Reads CLAUDE_DISABLED_HOOKS env var (comma-separated hook names to skip):
//   e.g. CLAUDE_DISABLED_HOOKS=debug-statements,file-size-limit
//
// Usage in other hooks:
//   const { shouldRun, profile } = require('./hook-profile-check');
//   if (!shouldRun('my-hook-name', 'standard')) { process.stdout.write(data); return; }

const VALID_PROFILES = ['minimal', 'standard', 'strict'];

function getProfile() {
  const env = (process.env.CLAUDE_HOOK_PROFILE || 'standard').toLowerCase().trim();
  return VALID_PROFILES.includes(env) ? env : 'standard';
}

function isDisabled(hookName) {
  const disabled = (process.env.CLAUDE_DISABLED_HOOKS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  return disabled.includes(hookName.toLowerCase());
}

/**
 * Determine if a hook should run based on profile and disabled list.
 * @param {string} hookName — identifier for this hook (e.g. 'debug-statements')
 * @param {string} minProfile — minimum profile level to run: 'minimal', 'standard', or 'strict'
 * @returns {{ shouldRun: boolean, profile: string }}
 */
function shouldRun(hookName, minProfile = 'standard') {
  const profile = getProfile();

  if (isDisabled(hookName)) {
    return { shouldRun: false, profile };
  }

  const levels = { minimal: 0, standard: 1, strict: 2 };
  const currentLevel = levels[profile] ?? 1;
  if (!(minProfile in levels)) {
    process.stderr.write(`[HOOK WARNING] Unknown minProfile "${minProfile}" in shouldRun() — defaulting to "standard"\n`);
  }
  const requiredLevel = levels[minProfile] ?? 1;

  return { shouldRun: currentLevel >= requiredLevel, profile };
}

module.exports = { shouldRun, getProfile, isDisabled };
