---
description: Toggle hook profile — control which hooks run during this session. Profiles: minimal, standard, strict, paranoid.
allowed-tools: Bash
user-invocable: true
---

You manage hook execution profiles. Hooks check the `CLAUDE_HOOK_PROFILE` environment variable to decide whether to run.

## Syntax

`/hook-profile` — Show current profile and hook matrix
`/hook-profile minimal` — Only critical hooks (blocks destructive git, sensitive files, JSON validation)
`/hook-profile standard` — All base hooks enabled (default)
`/hook-profile strict` — All hooks + verbose warnings
`/hook-profile paranoid` — Strict + PII scan on prompts + PII/MCP-write warnings (for fraud-domain sessions)
`/hook-profile disable <hook-name>` — Disable a specific hook (e.g., `debug-statements`)
`/hook-profile reset` — Reset to standard, clear disabled list

## Profile Matrix

| Hook | minimal | standard | strict | paranoid |
|---|---|---|---|---|
| pre-git-push-guard | ALWAYS | ALWAYS | ALWAYS | ALWAYS |
| pre-destructive-git | ALWAYS | ALWAYS | ALWAYS | ALWAYS |
| pre-sensitive-files | ALWAYS | ALWAYS | ALWAYS | ALWAYS |
| validate-json | ALWAYS | ALWAYS | ALWAYS | ALWAYS |
| pre-git-commit-n8n | ALWAYS | ALWAYS | ALWAYS | ALWAYS |
| pre-file-size-limit | skip | ON | ON | ON |
| post-debug-statements | skip | ON | ON + stricter | ON + stricter |
| post-auto-format | skip | ON (lazy) | ON | ON |
| session-context-inject | skip | ON | ON | ON |
| pre-mcp-destructive | skip | ON | ON | ON |
| **pre-user-prompt-pii** (UserPromptSubmit) | skip | skip | skip | **ON** |
| **pre-mcp-pii-warn** (PreToolUse on MCP writes) | skip | skip | skip | **ON** |

"ALWAYS" hooks cannot be disabled — they prevent data loss or security incidents.

**`paranoid` é o profile recomendado** ao trabalhar com dados de fraude (sessões que vão tocar CPF, nomes, telefones reais). Ele bloqueia prompt submits com PII detectada e escala MCP writes (Linear/Notion/Slack) com PII para confirmação manual.

## Actions

### Show current
```bash
echo "Profile: ${CLAUDE_HOOK_PROFILE:-standard}"
echo "Disabled: ${CLAUDE_DISABLED_HOOKS:-none}"
```

### Set profile
Tell the user to run the following command themselves (hooks are read from environment, not from a file):
```
! export CLAUDE_HOOK_PROFILE=<profile>     # bash / Git Bash
! $env:CLAUDE_HOOK_PROFILE = "<profile>"   # PowerShell
```

### Disable specific hook
```
! export CLAUDE_DISABLED_HOOKS="${CLAUDE_DISABLED_HOOKS:+$CLAUDE_DISABLED_HOOKS,}<hook-name>"
```

### Reset
```
! unset CLAUDE_HOOK_PROFILE CLAUDE_DISABLED_HOOKS                          # bash
! Remove-Item env:CLAUDE_HOOK_PROFILE, env:CLAUDE_DISABLED_HOOKS -ErrorAction SilentlyContinue   # PowerShell
```

## Important

- Environment variables only persist for the current session — set them at session start.
- The `!` prefix runs the command in the current shell so the env var is visible to hooks.
- Critical hooks (git-push-guard, destructive-git, sensitive-files, validate-json, pre-git-commit-n8n) ALWAYS run regardless of profile.
- Use `minimal` para bulk exploratory work onde warnings atrapalham.
- Use `paranoid` em sessões que tocam dados de fraude (PII).
- Use `strict` antes de deploy ou commit grande.

Arguments: $ARGUMENTS
