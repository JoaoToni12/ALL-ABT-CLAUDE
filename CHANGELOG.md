# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-05-15

Segunda major release. Foco em três eixos: **segurança PII para domínios regulados (LGPD)**, **guardrails MCP** para escritas destrutivas/com PII, e **alinhamento com built-ins do Claude Code** (remover redundâncias).

### Added

#### Hooks (4 novos, total agora 14)
- `pre-user-prompt-pii.js` — UserPromptSubmit hook que bloqueia prompts com PII brasileira (CPF com checksum, CNPJ com checksum, telefone BR, email). Ativo no profile `paranoid`.
- `pre-mcp-pii-warn.js` — PreToolUse hook em `mcp__.*` que detecta PII em escritas Linear/Notion/Slack e escala para confirmação (`permissionDecision: "ask"`). Ativo no profile `paranoid`.
- `pre-mcp-destructive.js` — PreToolUse hook em `mcp__.*` que escala destrutivos (delete, update_full_workflow, merge, notion-update-data-source) para confirmação. Ativo no profile `standard`.
- `pre-git-commit-n8n.js` — PreToolUse hook em `Bash` que detecta PII e secrets em workflow JSON staged para commit. Always-on.

#### Rules (8 novos, total agora 13)
- `pii-handling.md` — Regras de PII handling para domínios regulados (LGPD). Regex para CPF/CNPJ/phone BR/email. Princípio: PII vive no warehouse, fora dele só por ID estável.
- `linear-mcp.md` — Linear MCP rules: naming `save_*` (não `create_*`), pitfall do `\n` literal (#31639), Priority mapping (0-4), `teamId` mandatório.
- `gitlab-mcp.md` — GitLab MCP rules: OAuth flow, branch protection não-preempted, quando preferir `glab` CLI.
- `slack-safety.md` — Slack message safety: sem `@channel`/`@here` em automação, sem payload bruto, test channels primeiro, webhook URLs são secret.
- `bash-json-safety.md` — Bash variable interpolation safety, regex special chars, encoding UTF-8 no Windows.
- `communication-protocol.md` — Estilo de comunicação direto, interpretar "fix"/"update" como execução imediata, fontes explícitas.
- `live-first-verification.md` — Verificar live source antes de reportar status; ordem de verificação por domínio.
- `output-budgeting.md` — Outputs longos vão pra arquivo; lista de critérios de quando arquivar vs inline.

#### Skills (5 novas, total agora 28)
- `close-project` — End-of-session ritual (absorveu `session-close`). Flags: `--sync-n8n`, `--pause`, `--draft`, `--no-slack`, `--linear`.
- `linear-issue-create` — Criação de issue Linear scaffold (A-RICE compatible, `teamId` mandatório, PII discipline).
- `linear-sub-issues` — Popula sub-issues de uma parent: default Backlog status, estimativas ajustadas a 1.5x produtividade AI Builder (baseline ÷ 1.5), regra de granularidade 3-7 sub-issues, herança de priority/labels/project do parent, verificação pós-criação. Aborda os 3 erros recorrentes: excesso de sub-issues, estimativas mal definidas, status criados errados.
- `n8n-execution-debug` — Debug de execução n8n com 6 hipóteses ranqueadas (webhook 404 pós-restart, date bug segunda-feira, PII em contextSummary, schema drift, stale execution ID, Slack 403).
- `snowflake-query` — Wrapper one-off de Snowflake query com session/auth/LIMIT discipline.

#### Outros
- Profile `paranoid` no `hook-profile-check.js` — quarto nível (minimal=0, standard=1, strict=2, paranoid=3). Ativa hooks de PII em prompt e MCP writes.
- `permissions.deny` em `settings.json.template` — Read bloqueado para `.env`, `.ssh`, `.aws/credentials`, `.npmrc`, `.git-credentials`, certs, keystores. Bash bloqueado para `cat **/.env*`, `cat **/credentials*`.
- Suporte n8nac v2.x na rule `n8n-as-code.md`: comandos `setup`, `env add/auth set/use`, `workspace migrate`, `promote`. Tabela de breaking changes v1 → v2.
- `paths:` frontmatter em rules para scope correto (alguns sempre-on, outros por glob).

### Changed

- `pre-sensitive-files.js`: regex de secrets expandido — Anthropic (`sk-ant-`), OpenAI (`sk-proj-`), Linear (`lin_api_`), Notion (`secret_`, `ntn_`), Slack webhook (`hooks.slack.com/services/...`), GitHub fine-grained (`github_pat_`), GitLab (`glpat-`), AWS, Google API. JWT regex ancorada com length real para reduzir falsos positivos. Extensões adicionadas: `.p12`, `.pfx`, `.jks`, `.keystore`, `.kdbx`, `.gpg`, `.asc`, `kubeconfig`, `.aws/credentials`, `.npmrc`, `.git-credentials`, etc.
- `pre-git-push-guard.js`: agora bloqueia `--force-with-lease`, refspec `+branch`, `--mirror`, `--delete`. Branches protegidos expandidos: `main\|master\|production\|prod\|release\|staging`. Bypass via `# user-approved` na linha do comando.
- `session-context-inject.js`: migrado de matcher `PreToolUse .*` com marker via `process.ppid` (bugado no Windows) para evento nativo `SessionStart`. Recebe `source: startup|resume|clear|compact`. Skip em compact. Não dispara mais 4 git subprocesses em primeira tool call.
- `post-auto-format.js`: agora lazy — walks up o tree procurando `.prettierrc` ou `prettier` em `package.json` antes de invocar `npx prettier`. Em projetos sem prettier, skip silencioso (economia de 3-8s por Write/Edit).
- `hook-profile-check.js`: adicionado nível `paranoid` (level=3).
- `commands/hook-profile.md`: documenta nova matriz de hook profiles com `paranoid`.
- `commands/orchestrate.md`: chains atualizadas para usar built-ins do Claude Code (`code-reviewer`, `security-reviewer`) em vez dos custom agents removidos.
- `CLAUDE.md`: adicionada seção "Token & Context Discipline" (subagent routing, model routing por task character) e "n8nac vs n8n MCP — boundary canônico".
- `rules/snowflake-python.md`: removido claim outdated de "ALTER TABLE multi-coluna não suportado" (Snowflake adicionou suporte em 2024).
- `rules/n8n-as-code.md`: reescrito para n8nac v2.x. Inclui tabela de breaking changes v1 → v2, comandos `env`/`workspace`/`promote`, novo comando `n8nac mcp` (MCP server interno).

### Removed

- **Agents custom redundantes com built-ins do Claude Code**:
  - `code-reviewer.md` — usar built-in `code-reviewer`
  - `security-reviewer.md` — usar built-in `security-reviewer`
  - `doc-updater.md` — trivial, `Edit` direto resolve
- **Commands redundantes**:
  - `build-fix.md` — usar agent `build-error-resolver` direto
  - `verify-workflow.md` — usar agent `verify-automation` direto
- **Skills absorvidas**:
  - `session-close` — absorvido em `close-project --pause` / `--sync-n8n`
- **Hardcoded references** (workflow IDs, Snowflake tables, Notion DB IDs, channel names) substituídos por placeholders `{{...}}` ou exemplos genéricos para portabilidade entre times.

### Migration Guide (v1 → v2)

1. **Re-run install script** — `./install.sh` ou `.\install.ps1`. Backup automático de configs locais em `~/.claude/<file>.bak.<timestamp>`.
2. **Upgrade n8nac**: `npm i -g n8nac@latest` (v1.5.3 → v2.2.1+).
3. **Migrar projetos n8n existentes**: em cada repo com `n8nac-config.json` v1, rodar `n8nac workspace migrate --json` (dry-run) → `--write`.
4. **Atualizar plugin marketplace**: `/plugin marketplace update && /plugin update n8n-as-code`.
5. **Settings merge manual**: se você tem `~/.claude/settings.json` local, fazer merge das novas seções `SessionStart`, `UserPromptSubmit`, e o matcher `mcp__.*` em `PreToolUse`. Adicionar bloco `permissions.deny`. Ver `settings.json.template` para referência completa.
6. **Ativar profile paranoid** se você tocar PII / dados regulados: `export CLAUDE_HOOK_PROFILE=paranoid` (bash) ou `$env:CLAUDE_HOOK_PROFILE = "paranoid"` (PowerShell).
7. **Configurar placeholders**: skills `prd-writer`, `repo-initialize`, `cost-report` agora usam placeholders `{{AUTOMACOES_MASTER_DB_ID}}`, `{{YOUR_DATABASE}}.{{YOUR_SCHEMA}}.{{YOUR_*_TABLE}}` — substituir pelos valores do seu projeto no CLAUDE.md ou em uma skill de contexto.

### Breaking Changes

- Custom agents `code-reviewer`, `security-reviewer`, `doc-updater` removidos. Se `~/.claude/agents/` tem esses arquivos da v1, podem ser deletados — built-ins do Claude Code cobrem.
- Custom commands `build-fix`, `verify-workflow` removidos. Skills/agents equivalentes (`build-error-resolver`, `verify-automation`) continuam disponíveis.
- Skill `session-close` removida — funcionalidade absorvida em `close-project --pause` / `--sync-n8n`.
- `session-context-inject.js` agora roda em evento `SessionStart`, não em `PreToolUse .*`. Se você tem settings.json v1 customizada, mover esse hook para a seção `SessionStart`.
- n8nac v1 commands `init`, `switch`, `init-auth`, `init-project` foram removidos — substituídos por `setup`, `env add`, `env auth set`, `env use`.

---

## [1.0.0] - 2026-04-08

### Added
- CLAUDE.md with universal coding standards (code style, error handling, git, testing, security)
- 5 contextual rules with glob scoping (Snowflake, n8n MCP, n8nac, Notion, debugging)
- 10 hooks: security guards (push, destructive git, sensitive files), quality gates (auto-format, debug statements, JSON validation, file size), session context injection, stop notification
- Hook profile system (minimal/standard/strict) via `CLAUDE_HOOK_PROFILE` env var
- 12 slash commands: plan, dev, research, review, tdd, build-fix, refactor-clean, quality-gate, checkpoint, orchestrate, verify-workflow, hook-profile
- 6 specialized agents with model selection: planner (sonnet), code-reviewer (sonnet), security-reviewer (sonnet), build-error-resolver (sonnet), doc-updater (haiku), verify-automation (opus)
- 23 domain skills: n8n (11), QA (5), deploy (4), core tools (3)
- /onboard skill for guided framework setup
- Cross-platform install scripts (install.sh + install.ps1)
- settings.json.template with placeholder substitution
- Documentation: README, BOUNDARIES decision guide, PROJECT-TEMPLATE
