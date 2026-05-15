---
name: close-project
description: End-of-project / end-of-session close-out ritual. Optionally syncs n8n workflow JSONs, commits, pushes, opens PR, updates Linear, posts Slack summary. Use when wrapping up a feature/task or session and ready to commit and ship. Trigger on /close-project, /commit-and-close, /session-close, or when asked to "finalizar", "fechar projeto", "fechar sessão", "close out", "wrap up", "wrap up and ship", "session close".
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Edit, mcp__linear__get_issue, mcp__linear__save_issue, mcp__linear__list_issue_statuses, mcp__linear__save_comment, mcp__n8n-mcp__n8n_get_workflow, mcp__n8n-mcp__n8n_list_workflows
---

# /close-project — Ship a Feature or Close a Session

Um único ritual de close-out. Antes existiam dois skills (`close-project` para ship + `session-close` para pause). Consolidados aqui — use `--sync-n8n` quando a sessão tocou workflows n8n deployed.

## Syntax

```
/close-project                          # full ship: tests → commit → push → PR → Linear (Done) → Slack
/close-project --no-slack               # skip Slack summary
/close-project --linear <issue-id>      # explicit Linear issue
/close-project --draft                  # draft PR; Linear stays "In Review"
/close-project --sync-n8n               # also sync local workflow JSONs from n8n before commit
/close-project --pause                  # session pause: sync (if --sync-n8n) + commit + Linear comment, NO push/PR/Slack
```

## When to use which mode

| Cenário | Comando |
|---|---|
| Feature pronta, vou abrir PR | `/close-project` (default) |
| Sessão tocou workflow n8n deployed e quero atualizar JSONs locais | `/close-project --sync-n8n` |
| Vou pausar e voltar amanhã, ainda não é pra abrir PR | `/close-project --pause` |
| Sessão de docs/rules/skills puros (sem workflow) | `/close-project --pause --no-slack` |

## Protocol

### Step 0: Identify mode
- `--pause` → skipa Steps 4-8 (push, PR, Linear Done, Slack); só roda Steps 1-3 + Linear comment.
- `--sync-n8n` → adiciona Step 1.5 antes do commit.

### Step 1: Pre-flight Checks
- Confirm we are NOT on `main` or `master` — if so, STOP and ask for the feature branch name (exceção: `--pause` em branch principal pode commitar docs, mas perguntar antes).
- Run `git status` — confirm staged/unstaged changes exist. Working tree clean + zero unpushed = STOP, ask what to close out.
- Identify related Linear issue from branch name (e.g. `workflow/AB-108-reclame-aqui` → `AB-108`) or `--linear` flag.

### Step 1.5: Sync n8n workflows (only if --sync-n8n)
- Ask: quais workflow IDs foram modificados nesta sessão? Listar candidatos via `n8n_list_workflows` se ambíguo.
- Para cada ID confirmado, invocar skill `sync-n8n-workflow` (ou rodar manual: `n8nac pull <id>`).
- **Crítico**: só sincronizar workflows que foram *deployed* nesta sessão. Pull em workflow não tocado sobrescreve estado local não relacionado.
- Após sync, voltar ao Step 2.

### Step 2: Tests and Lint
- Detect test runner (package.json scripts, pytest, go test, etc.).
- Run tests and lint; if either fails, STOP and report — do not commit.
- Project sem test/lint setup: notar e continuar.

### Step 3: Commit
- Stage only files relevant to this task. Never `git add -A` sem confirmar.
- Do NOT stage: `.env`, credentials, temp files, `*.log`, `node_modules`, build artifacts.
- Conventional commit: `<type>: <description>` (feat/fix/refactor/docs/test/chore/perf/ci).
- Include Linear issue ID in message (e.g. `feat: add fraud context builder (AB-108)`).
- HEREDOC for multi-line, with footer:
  ```
  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```
- Always a NEW commit — never amend.

### Step 4: Push (skip if --pause)
- NEVER push to `main` or `master` — `pre-git-push-guard.js` blocks. Don't bypass.
- Push to feature branch with `-u` if not tracking.
- Push rejected (diverging remote)? STOP, ask user how to reconcile. No force push.

### Step 5: PR (skip if --pause)
- `gh pr create` with title ≤ 70 chars.
- Body: `## Summary` (1-3 bullets), `## Test plan` (checklist), `🤖 Generated with [Claude Code]` footer.
- `--draft` → draft PR.
- Return PR URL.

### Step 6: CI Wait (optional, skip if --pause)
- If user asked, poll `gh pr checks <url>` until green/red.
- Any check fails: STOP, report. No auto-merge.

### Step 7: Linear Update
- **Pause mode**: add a comment com snapshot do que foi feito + pendências. Manter status atual ("In Progress"). Sem Done.
- **Default mode**: status → `Done` SOMENTE se trabalho totalmente completo AND user explicitamente confirmou verificação end-to-end.
- Caso contrário, usar `In Review` (PR open) ou `Blocked` (com nota do que tá pendente).
- `--draft` → manter "In Progress".
- Sempre adicionar comment com link do PR.
- **Importante**: ao salvar `description`/`body`, usar LF real (`\n` interpretado), nunca `\\n` literal — pitfall documentado em `rules/linear-mcp.md`.

### Step 8: Slack Summary (skip if --no-slack or --pause)
- Draft summary curto: o que shipou, link PR, link Linear.
- **Mostrar ao user para aprovação antes de postar**.
- Sem `@channel` / `@here`. Sem payload bruto. PII redacted. Ver `rules/slack-safety.md`.
- Nunca postar sem autorização explícita do conteúdo E do canal.

## Final Summary (sempre)

```
## Close Summary

**Mode:** [ship|pause|draft]
**Workflows synced:** [list or "none"]
**Files committed:** [list + commit hash]
**PR:** [url or "skipped"]
**Linear:** [ticket → status, link]
**Slack:** [posted to channel or "skipped"]
**Pending (próxima sessão):** [loose ends]
```

## Guardrails

- Destructive ops (force-push, reset --hard, branch -D): OFF by default — ask.
- `--no-verify` / `--no-gpg-sign`: OFF by default — investigate hook failures, don't skip.
- Step falha: STOP, report. No silent retry.
- Linear Done só com sign-off explícito do user.
- PII em commit message, PR body, Slack: scan antes de submeter (regra: `rules/pii-handling.md`).

## Common Pitfalls

| Problem | Cause | Fix |
|---|---|---|
| Sync writes stale data | Wrong workflow ID | Confirmar via `n8n_list_workflows` primeiro |
| Commit blocked by hook | `{{ $env. }}` em workflow JSON ou secret detectado | Fix root cause; nunca `--no-verify` |
| Linear update fails | Wrong state ID | `list_issue_statuses(teamId)` |
| Descrição Linear em uma linha | Pitfall `\n` literal | Usar LF real; re-save após verificar render |
| `UnicodeDecodeError` durante sync | Faltou `encoding='utf-8'` | Sempre passar encoding em Python `open()` |
| Push blocked | Branch protegido (main/master/prod/release) | Confirmar branch correta; nunca bypass |
