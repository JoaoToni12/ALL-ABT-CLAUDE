# Framework Claude Code --- AI Builders

Setup padronizado de Claude Code para times de AI Builders / automação. Provê hooks de segurança, agentes, skills e regras que aceleram o desenvolvimento de workflows n8n + Snowflake/data + Linear/Notion/GitLab sem comprometer disciplina de PII, secrets e revisão.

**v3.0.0** — terceira major. Consolida 5 skills n8n em `n8n-build`, integra RTK token proxy, adiciona plugin `understand-anything`, e ativa todos os plugins por padrão.

## Visão Geral

Framework configura Claude Code com um conjunto integrado de **regras, hooks, agentes, skills e plugins** que garantem qualidade, segurança e produtividade. Tudo vive em `~/.claude/` e é compartilhado entre todos os projetos.

**Números do setup atual (v3.0.0):**
- **13 arquivos de regras** contextuais (rules/) com glob scoping
- **14 hooks** de segurança e qualidade (incluindo SessionStart, UserPromptSubmit, guards MCP)
- **3 agentes custom** com model selection (built-ins do Claude Code cobrem code-reviewer/security-reviewer/general-purpose)
- **24 skills** domain-specific
- **10 slash commands**
- **4 profiles de hook**: `minimal`, `standard`, `strict`, `paranoid`
- **4 plugins ativos** por padrão: `frontend-design`, `slidev`, `n8n-as-code`, `understand-anything`
- **RTK** (Rust Token Killer) — proxy de token optimization (60-90% savings em dev ops)
- Sistema de memória persistente entre sessões

## Estrutura

```
~/.claude/
├── CLAUDE.md                          # Regras globais (código, git, segurança, testes, n8nac vs MCP)
├── settings.json                      # Hooks, permissions (allow/deny), plugins, MCP
├── rules/                             # 13 regras contextuais ativadas por glob pattern
├── hooks/                             # 14 hooks de segurança/qualidade
├── commands/                          # 10 slash commands
├── agents/                            # 3 agentes custom (planner, build-error-resolver, verify-automation)
├── RTK.md                             # RTK token proxy documentation
├── skills/                            # 24 skills domain-specific
├── plugins/                           # 3 plugins via marketplace (n8nac v2, slidev, frontend-design)
└── projects/<projeto>/memory/         # Memória persistente por projeto
```

### Mudanças v2 → v3 (resumo)

**Adicionado:**
- `RTK.md` — Rust Token Killer documentation; `@RTK.md` include no CLAUDE.md; hook `rtk hook claude` no PreToolUse(Bash)
- Skill `n8n-build` — node discovery + configuration + validation loop consolidados em um único skill
- Plugin `understand-anything` (Egonex-AI/Understand-Anything) no settings template
- Fable 5 no model routing table; model IDs específicos para todos os tiers
- Settings: `skipWorkflowUsageWarning`, `showTurnDuration`, `skipAutoPermissionPrompt: true`

**Removido:**
- Skills consolidadas em `n8n-build`: `n8n-expression-syntax`, `n8n-mcp-tools-expert`, `n8n-node-configuration`, `n8n-validation-expert`, `linear-sub-issues`

**Atualizado:**
- Todos os 4 plugins agora `enabled: true` por padrão (era `false` em v2)
- Quick Start inclui passo de instalação do RTK e plugin `understand-anything`

## Quick Start

### 1. Instalar Claude Code CLI

```bash
npm install -g @anthropic-ai/claude-code
```

### 2. Instalar n8nac v2 (para projetos n8n)

```bash
npm install -g n8nac@latest    # v2.2.1+
```

### 3. Instalar o framework

```powershell
# Windows PowerShell
git clone https://github.com/JoaoToni12/ALL-ABT-CLAUDE.git $env:TEMP\claude-framework
cd $env:TEMP\claude-framework
.\install.ps1
```

```bash
# macOS / Linux / Git Bash
git clone https://github.com/JoaoToni12/ALL-ABT-CLAUDE.git /tmp/claude-framework
cd /tmp/claude-framework
./install.sh
```

O script copia `CLAUDE.md`, `rules/`, `hooks/`, `commands/`, `agents/`, `skills/` para `~/.claude/` e renderiza `settings.json.template` → `~/.claude/settings.json` com seus paths. Cria backup de qualquer config existente em `~/.claude/<file>.bak.<timestamp>`.

### 4. Instalar RTK (token optimization)

```bash
# Instalar Rust Token Killer — ver README do projeto para instruções completas
# https://github.com/JoaoToni12/rtk
```

RTK reescreve comandos automaticamente via hook. Após instalar, o hook `rtk hook claude` já está configurado no `settings.json`.

### 5. Instalar plugins

```
/plugin marketplace add EtienneLescot/n8n-as-code
/plugin install n8n-as-code@n8nac-marketplace
/plugin install frontend-design@claude-plugins-official
/plugin install slidev@slidev-dev-marketplace
/plugin marketplace add Egonex-AI/Understand-Anything
/plugin install understand-anything@understand-anything
```

### 6. Configurar MCP Servers

Ver seção [Configuração de MCP Servers](#configuração-de-mcp-servers).

### 7. Ativar profile paranoid (se tocar PII)

```powershell
$env:CLAUDE_HOOK_PROFILE = "paranoid"
```
```bash
export CLAUDE_HOOK_PROFILE=paranoid
```

---

## Componentes

### Regras (CLAUDE.md + rules/)

O `CLAUDE.md` global define padrões sempre ativos:

| Tópico | O que define |
|---|---|
| Code Style | Imutabilidade, 200-400 linhas/arquivo, funções <50 linhas, max 4 níveis nesting |
| Error Handling | Fail fast, validação de input, sem falhas silenciosas |
| Git Workflow | Formato `<type>: <description>`, atômicos, nunca push direto main |
| Testing | TDD, bug fix = failing test primeiro |
| Security | Sem secrets, PII never published to ticket systems |
| Diagnosis | Root cause primeiro, surface hipótese antes de mudar |
| Token Discipline | Subagent routing, model routing por task character |
| n8nac vs MCP | Deploy → n8nac, inspect/runtime → MCP |

Rules contextuais (`~/.claude/rules/`) carregam via glob:

| Arquivo | Glob/Escopo | Quando ativa |
|---|---|---|
| `snowflake-python.md` | `**/*.py` | Editando Python |
| `n8n-mcp-editing.md` | `**/workflows/**`, `**/*n8n*` | MCP edits |
| `n8n-as-code.md` | `**/workflows/**`, `**/*.workflow.ts` | n8nac v2 |
| `notion-api.md` | `**/*notion*` | Integração Notion |
| `bash-json-safety.md` | JSON/TS/Py | Escrevendo arquivos texto |
| `pii-handling.md` | `**/*` | Sempre — PII rules |
| `linear-mcp.md` | `**/*` | Linear MCP rules |
| `gitlab-mcp.md` | `**/*` | GitLab MCP rules |
| `slack-safety.md` | `**/*` | Slack messages |
| `live-first-verification.md` | `**/*` | Verificação de estado |
| `output-budgeting.md` | `**/*` | Outputs longos vão pra arquivo |
| `communication-protocol.md` | `**/*` | Estilo de comunicação |
| `debugging.md` | (manual) | Debugging |

### Hooks

| Hook | Evento | Função | Profile mín. |
|---|---|---|---|
| `pre-git-push-guard.js` | PreToolUse(Bash) | Bloqueia force push variants + push a protected branches | always |
| `pre-destructive-git.js` | PreToolUse(Bash) | Bloqueia `git reset --hard`, `clean -f`, `branch -D` | always |
| `pre-git-commit-n8n.js` | PreToolUse(Bash) | Detecta PII/secrets em workflow JSON staged | always |
| `pre-sensitive-files.js` | PreToolUse(Write,Edit) | Bloqueia escrita em credentials/.env/certs; scan content para 16+ vendor keys | always |
| `validate-json.js` | PostToolUse | Valida JSON após escrita | always |
| `pre-file-size-limit.js` | PreToolUse(Write) | Avisa >500 linhas | standard |
| `pre-mcp-destructive.js` | PreToolUse(mcp__.*) | Escala destrutivos MCP via `permissionDecision: "ask"` | standard |
| `session-context-inject.js` | SessionStart | Injeta branch/commits/stash no contexto inicial | standard |
| `post-auto-format.js` | PostToolUse(Write,Edit) | Prettier (lazy — só roda se projeto usa prettier) | standard |
| `post-debug-statements.js` | PostToolUse(Write,Edit) | Detecta `console.log`/`debugger`/`print()` | standard |
| `stop-notification.js` | Stop | Desktop notification | standard |
| `pre-mcp-pii-warn.js` | PreToolUse(mcp__.*) | Avisa PII brasileira em MCP writes | **paranoid** |
| `pre-user-prompt-pii.js` | UserPromptSubmit | Bloqueia prompt com PII brasileira (CPF/CNPJ checksum, phone, email) | **paranoid** |

**Utility:** `hook-profile-check.js` — sistema de profiles (minimal=0, standard=1, strict=2, paranoid=3).

### Comandos (/slash)

| Comando | Descrição |
|---|---|
| `/plan` | Planejamento estruturado antes de implementar |
| `/dev` | Modo dev — pragmático, code-first |
| `/research` | Modo pesquisa — exploração primeiro |
| `/review` | Modo review — análise completa |
| `/tdd` | Guia TDD |
| `/refactor-clean` | Refactor + remove dead code |
| `/quality-gate` | Checks de qualidade nos arquivos alterados |
| `/checkpoint` | Cria/verifica checkpoints de progresso |
| `/orchestrate` | Encadeia planner (custom) + code-reviewer + security-reviewer (built-ins) + tdd |
| `/hook-profile` | Alterna profile (minimal/standard/strict/paranoid) |

### Agentes (custom)

| Agente | Função |
|---|---|
| `planner` | Planejamento com contexto domain-specific (n8n, data warehouse) |
| `build-error-resolver` | Diagnostica erros build/test/runtime com regras de domínio |
| `verify-automation` (opus) | E2E verification de workflows n8n: lê PRD → extrai critérios → valida → testa → verifica outputs |

**Built-ins do Claude Code usados sem override:** `code-reviewer`, `security-reviewer`, `Plan`, `Explore`, `general-purpose`.

### Skills (24 packages)

| Categoria | Skills |
|---|---|
| **Workflow** | `close-project`, `compact-memory`, `onboard`, `prd-writer`, `repo-initialize`, `cost-report` |
| **n8n build** | `n8n-build` (node discovery + configuration + validation — consolida 5 skills anteriores) |
| **n8n autoria** | `deploy-n8n-workflow`, `rollback-n8n-workflow`, `safe-update-n8n`, `sync-n8n-workflow`, `n8n-code-javascript`, `n8n-code-python`, `n8n-workflow-patterns` |
| **n8n diagnostics** | `n8n-execution-debug` |
| **n8n testing** | `n8n-workflow-testing-fundamentals`, `n8n-integration-testing-patterns`, `n8n-trigger-testing-strategies` |
| **QA** | `context-driven-testing`, `qe-iterative-loop`, `qe-quality-assessment`, `qe-requirements-validation` |
| **MCP writes** | `linear-issue-create`, `snowflake-query` |

### Plugins

| Plugin | Marketplace | Função |
|---|---|---|
| `frontend-design` | claude-plugins-official | Interfaces frontend production-grade |
| `slidev` | slidev-dev-marketplace | Apresentações Slidev |
| `n8n-as-code` | n8nac-marketplace (GitHub: EtienneLescot/n8n-as-code) | n8nac v2 + schema completo de 537+ nós n8n |
| `understand-anything` | understand-anything (GitHub: Egonex-AI/Understand-Anything) | Análise e knowledge graph de codebases |

Todos os 4 plugins ficam `enabled: true` no template. Requer instalação manual via `/plugin marketplace add` (ver Quick Start).

---

## Profiles de Hook

| Profile | Hooks adicionais | Uso |
|---|---|---|
| `minimal` | Apenas always-on (push-guard, destructive-git, sensitive-files, validate-json, git-commit-n8n) | Debug rápido, POCs |
| `standard` (default) | + file-size, debug-statements, auto-format (lazy), session-context, mcp-destructive | Trabalho diário |
| `strict` | + warnings extras | Pre-deploy, code review |
| **`paranoid`** | + PII scan no prompt + PII warn em MCP writes | **Sessões que tocam PII / dados regulados (LGPD)** |

Hooks "always-on" sempre rodam — proteção contra perda de dados e leak de secrets.

---

## Configuração de MCP Servers

Configurar manualmente em `~/.claude/settings.json` na seção `mcpServers`:

### n8n-mcp

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["-y", "@czlonkowski/n8n-mcp"],
      "env": {
        "N8N_BASE_URL": "https://<your-n8n-host>",
        "N8N_API_KEY": "<via env var ou secret manager>"
      }
    }
  }
}
```

### Linear (oficial)

```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.linear.app/mcp"]
    }
  }
}
```

OAuth no primeiro uso. Ver `rules/linear-mcp.md` para naming `save_*` e Priority mapping.

### GitLab (oficial)

```bash
claude mcp add --transport http GitLab https://gitlab.com/api/v4/mcp
```

OAuth via `mcp__gitlab__authenticate`. Ver `rules/gitlab-mcp.md`.

### Notion

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@anthropic/notion-mcp-server"],
      "env": { "NOTION_API_KEY": "<via env var>" }
    }
  }
}
```

---

## Sistema de Memória

Claude Code mantém contexto entre sessões via Markdown em `~/.claude/projects/<projeto-sanitizado>/memory/`:

```
memory/
├── MEMORY.md              # Índice
├── user_profile.md
├── project_*.md
└── reference_*.md
```

Manutenção: `/compact-memory` periodicamente; `autoMemoryEnabled: true` cria entradas automaticamente; entradas são lidas no início de cada sessão.

---

## FAQ

**P: Preciso copiar tudo ou posso escolher partes?**
R: Modular. Mínimo: `CLAUDE.md`, `settings.json` (ajustando paths), hooks always-on. Skills, rules de domínio e agentes são opt-in.

**P: Os hooks bloqueiam ou só avisam?**
R: Segurança (push-guard, destructive-git, sensitive-files) **bloqueiam**. PII em prompt **bloqueia**, PII em MCP write **escala via "ask"**. Quality (file-size, debug) **avisam**.

**P: Como adicionar uma regra nova?**
R: `.md` em `~/.claude/rules/` com frontmatter `description` e `globs`.

**P: Como criar novo agent?**
R: `.md` em `~/.claude/agents/`. Built-ins (code-reviewer, security-reviewer, Plan, Explore) não são overridáveis — criar com nome diferente.

**P: Como criar nova skill?**
R: Diretório `~/.claude/skills/<nome>/` com `SKILL.md`. Triggers vivem na `description` (multilíngue).

**P: macOS/Linux?**
R: Sim. Hooks Node.js cross-platform. Ajustar paths em `settings.json` (`C:\\Users\\...` → `~/`).

**P: Atualizar o framework?**
R: Pull + re-run install. Backup automático de configs locais. `settings.json` requer merge manual (MCP keys são locais).
