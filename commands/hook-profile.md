---
description: Toggle hook profile — control which hooks run during this session.
allowed-tools: Bash
user-invocable: true
---

You manage hook execution profiles. Hooks check the `CLAUDE_HOOK_PROFILE` environment variable to decide whether to run.

## Syntax

`/hook-profile` — Show current profile and hook matrix
`/hook-profile minimal` — Only critical hooks (blocks destructive git, sensitive files, JSON validation)
`/hook-profile standard` — All hooks enabled (default)
`/hook-profile strict` — All hooks + verbose warnings
`/hook-profile disable <hook-name>` — Disable a specific hook (e.g., `debug-statements`)
`/hook-profile reset` — Reset to standard, clear disabled list

## Profile Matrix

| Hook | minimal | standard | strict |
|---|---|---|---|
| pre-git-push-guard | ALWAYS | ALWAYS | ALWAYS |
| pre-destructive-git | ALWAYS | ALWAYS | ALWAYS |
| pre-sensitive-files | ALWAYS | ALWAYS | ALWAYS |
| validate-json | ALWAYS | ALWAYS | ALWAYS |
| pre-file-size-limit | skip | ON | ON + stricter |
| post-debug-statements | skip | ON | ON + stricter |

"ALWAYS" hooks cannot be disabled — they prevent data loss or security incidents.

## Actions

### Show current
```bash
echo "Profile: ${CLAUDE_HOOK_PROFILE:-standard}"
echo "Disabled: ${CLAUDE_DISABLED_HOOKS:-none}"
```

### Set profile
Tell the user to run the following command themselves (hooks are read from environment, not from a file):
```
! export CLAUDE_HOOK_PROFILE=<profile>
```

### Disable specific hook
```
! export CLAUDE_DISABLED_HOOKS="${CLAUDE_DISABLED_HOOKS:+$CLAUDE_DISABLED_HOOKS,}<hook-name>"
```

### Reset
```
! unset CLAUDE_HOOK_PROFILE CLAUDE_DISABLED_HOOKS
```

## Important
- Environment variables only persist for the current session
- The `!` prefix runs the command in the current shell so the env var is visible to hooks
- Critical hooks (git-push-guard, destructive-git, sensitive-files, validate-json) ALWAYS run regardless of profile
- Use `minimal` when doing bulk exploratory work where warnings slow you down
- Use `strict` before a deploy or commit for maximum safety

Arguments: $ARGUMENTS
