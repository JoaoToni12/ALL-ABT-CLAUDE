# Quando Usar Cada Mecanismo

Guia de decisao para escolher entre Rule, Hook, Command, Agent e Skill no framework Claude Code.

## Arvore de Decisao

```
Precisa executar automaticamente sem intervencao do usuario?
├── Sim → E antes/depois de uma acao do Claude Code?
│   ├── Sim → HOOK
│   │   Pre-tool: valida/bloqueia antes de executar
│   │   Post-tool: verifica/formata depois de executar
│   └── Nao → E uma regra/diretriz passiva que molda comportamento?
│       ├── Sim → RULE (arquivo em ~/.claude/rules/)
│       └── Nao → E recorrente/agendado?
│           ├── Sim → SCHEDULE (cron trigger)
│           └── Nao → Provavelmente nao precisa de automacao
└── Nao → E invocado pelo usuario?
    ├── Sim → E uma tarefa complexa multi-step?
    │   ├── Sim → Precisa de model dedicado ou tools especificas?
    │   │   ├── Sim → AGENT (instancia autonoma)
    │   │   └── Nao → SKILL (conhecimento carregado sob demanda)
    │   └── Nao → COMMAND (slash command simples)
    └── Nao → RULE (regra global no CLAUDE.md)
```

---

## Comparacao Detalhada

### Rule (CLAUDE.md + rules/)

**O que e:** Diretriz textual que Claude Code le e segue. Nao executa codigo.

**Quando usar:**
- Padroes de codigo (estilo, tamanho, nesting)
- Convencoes de git (formato de commit, branch naming)
- Regras de seguranca (sem secrets, queries parametrizadas)
- Instrucoes especificas de dominio (Snowflake, n8n, Notion)

**Quando NAO usar:**
- Precisa bloquear/validar uma acao concreta → Hook
- Precisa executar um script → Hook ou Command

**Onde vive:**
- `~/.claude/CLAUDE.md` --- regras globais, sempre ativas
- `~/.claude/rules/<nome>.md` --- regras contextuais, ativadas por glob pattern
- `.claude/CLAUDE.md` na raiz do projeto --- regras especificas do projeto

**Exemplo real:**
```markdown
# rules/snowflake-python.md
---
description: Snowflake session management and query safety rules
globs: ["**/*.py"]
---
- Sempre incluir LIMIT nas queries exploratorias
- Fechar a sessao apos uso
- Nunca fazer retry automatico de login
```

---

### Hook

**O que e:** Script (JS ou bash) executado automaticamente pelo harness antes ou depois de uma tool call.

**Quando usar:**
- Bloquear operacoes destrutivas (force push, reset --hard)
- Proteger arquivos sensiveis (.env, credentials)
- Validar output (JSON syntax, tamanho de arquivo)
- Formatar codigo automaticamente (prettier)
- Detectar problemas (debug statements)
- Injetar contexto (branch atual, commits recentes)

**Quando NAO usar:**
- Logica complexa que precisa de multiplos passos → Agent
- Interacao com o usuario → Command
- Conhecimento domain-specific → Skill ou Rule

**Eventos disponiveis:**

| Evento | Quando dispara | Input (stdin) | Pode bloquear? |
|---|---|---|---|
| `PreToolUse` | Antes de qualquer tool call (Bash/Write/Edit/`mcp__*`/...) | Tool name + input JSON | Sim (exit 2 ou `permissionDecision: "deny"`/`"ask"`) |
| `PostToolUse` | Apos tool call | Tool name + output JSON | Nao (mas pode comentar resultado) |
| `SessionStart` | Inicio de sessao | `source: startup\|resume\|clear\|compact` | Nao (injeta contexto via `additionalContext`) |
| `UserPromptSubmit` | Quando usuario envia prompt | Texto do prompt | Sim (bloquear ou anexar contexto — NAO reescreve) |
| `Stop` | Quando Claude termina | Conversa completa | Nao |

**Onde vive:** `~/.claude/hooks/` + registrado em `settings.json` na secao `hooks`.

**Exemplo real:**
```javascript
// hooks/pre-git-push-guard.js — PreToolUse, matcher: Bash
if (/git\s+push\s+.*--force/.test(cmd)) {
  process.stderr.write('[BLOCKED] Force push detected.\n');
  process.exit(2); // exit 2 = bloquear a acao
}
```

**Principio-chave:** Hooks devem ser rapidos (<5s timeout). Se precisa de logica pesada, use um Agent.

---

### Command (/slash)

**O que e:** Prompt pre-definido invocado pelo usuario com `/nome`. Pode restringir tools e definir instrucoes.

**Quando usar:**
- Mudar modo de trabalho (dev, research, review)
- Atalho para uma tarefa padronizada (quality-gate, checkpoint)
- Orquestrar agents (orchestrate)
- Tarefas de configuracao (hook-profile)

**Quando NAO usar:**
- Conhecimento tecnico profundo de um dominio → Skill
- Processamento autonomo longo → Agent
- Execucao automatica sem intervencao → Hook

**Onde vive:** `~/.claude/commands/<nome>.md`

**Frontmatter:**
```markdown
---
description: Descricao curta que aparece no autocomplete
allowed-tools: Bash, Read, Glob, Grep, Edit, Agent
user-invocable: true
---

[Instrucoes do prompt aqui]
```

**Diferenca entre Command e Skill:**
- Command = prompt curto que configura o Claude para trabalhar de um jeito
- Skill = pacote de conhecimento com multiplos arquivos de referencia

---

### Agent

**O que e:** Instancia autonoma de Claude com model especifico, tools restritas e prompt dedicado. Roda em sub-thread isolada.

**Quando usar:**
- Tarefa que precisa de model diferente (haiku para docs, opus para E2E)
- Review isolado sem poluir contexto da conversa principal
- Processamento que precisa de tools especificas (MCP tools)
- Verificacao end-to-end com multiplas integrancoes (n8n + Notion + Linear + Snowflake)

**Quando NAO usar:**
- Conhecimento de referencia sem processamento → Skill
- Tarefa simples que o model atual resolve → Command
- Validacao rapida → Hook

**Onde vive:** `~/.claude/agents/<nome>.md`

**Frontmatter:**
```markdown
---
name: planner
description: Planning subagent with n8n / data-warehouse / cost-control domain rules
model: sonnet
tools: Read, Glob, Grep, WebFetch
---

[System prompt do agent aqui]
```

**Models disponiveis e quando usar:**

| Model | Custo | Quando |
|---|---|---|
| `haiku` | Baixo | Documentacao, formatacao, tarefas simples, file renames |
| `sonnet` | Medio | Code review, planejamento, build fixes, seguranca |
| `opus` | Alto | Verificacao E2E, tarefas complexas multi-sistema, arquitetura |

**Importante**: built-ins `code-reviewer`, `security-reviewer`, `Plan`, `Explore`, `general-purpose` NAO sao overridaveis. Para customizar, crie agent com nome diferente. v2 do framework remove os custom redundantes (code-reviewer/security-reviewer/doc-updater) — usar built-ins direto.

---

### Skill

**O que e:** Pacote de conhecimento domain-specific com um ou mais arquivos Markdown. Carregado sob demanda quando o trigger casa com o prompt do usuario.

**Quando usar:**
- Conhecimento tecnico profundo de um dominio (n8n nodes, expressoes, patterns)
- Guia passo-a-passo para tarefas complexas (deploy, rollback, PRD)
- Catalogo de erros e solucoes (validation errors, false positives)
- Exemplos de referencia (workflow patterns, code patterns)

**Quando NAO usar:**
- Precisa executar automaticamente → Hook
- Precisa de model dedicado → Agent
- E um atalho para mudar modo de trabalho → Command
- E uma diretriz passiva → Rule

**Onde vive:** `~/.claude/skills/<nome>/SKILL.md` (+ arquivos auxiliares)

**Frontmatter do SKILL.md:**
```markdown
---
name: deploy-n8n-workflow
description: Deploy workflow com diff, validacao e canary. Trigger on /deploy-n8n-workflow, "deploy", "publicar workflow", "subir workflow".
allowed-tools: Read, Write, Bash, mcp__n8n-mcp__n8n_get_workflow
---

[Instrucoes detalhadas + referencias]
```

**Nota sobre triggers**: Claude faz pattern-match multilingue contra a `description`. Não há campo `triggers:` separado — listar palavras-chave/expressões diretamente na description é o canonical pattern.

---

## Tabela Resumo

| Mecanismo | Quem ativa | Executa codigo? | Autonomo? | Onde vive |
|---|---|---|---|---|
| **Rule** | Automatico (glob) | Nao | N/A | `CLAUDE.md`, `rules/` |
| **Hook** | Automatico (evento) | Sim (JS/bash) | Sim | `hooks/` + `settings.json` |
| **Command** | Usuario (`/nome`) | Nao (prompt) | Nao | `commands/` |
| **Agent** | Command ou outro Agent | Nao (prompt) | Sim (sub-thread) | `agents/` |
| **Skill** | Automatico (trigger) | Nao (prompt) | Nao | `skills/<nome>/` |
| **Plugin** | Registro global | Sim (instala skills+tools) | N/A | `plugins/` |

---

## Exemplos de Decisao

### "Quero que Claude sempre use LIMIT em queries Snowflake"
→ **Rule** em `rules/snowflake-python.md` com glob `**/*.py`

### "Quero bloquear force push"
→ **Hook** (`pre-git-push-guard.js`) com matcher `Bash` no evento `PreToolUse`

### "Quero um atalho para rodar checks de qualidade"
→ **Command** (`/quality-gate`) que instrui Claude a rodar linting, testes e verificacoes

### "Quero um review de seguranca isolado"
→ **Built-in agent** `security-reviewer` (Claude Code provê — nao precisa criar custom)

### "Quero bloquear PII em prompts/MCP writes"
→ **Hook** (`pre-user-prompt-pii.js` em UserPromptSubmit + `pre-mcp-pii-warn.js` em PreToolUse `mcp__.*`), ativos no profile `paranoid`

### "Quero proteger destrutivos MCP (delete workflow, etc.)"
→ **Hook** (`pre-mcp-destructive.js`) com matcher `mcp__.*` retornando `permissionDecision: "ask"`

### "Quero que Claude saiba configurar n8n nodes corretamente"
→ **Skill** (`n8n-node-configuration`) com documentacao de dependencias e patterns

### "Quero que JSON escrito pelo Claude seja sempre valido"
→ **Hook** (`validate-json.sh`) no evento `PostToolUse` com matcher `Write|Edit`

### "Quero fazer deploy de um workflow n8n com seguranca"
→ **Skill** (`deploy-n8n-workflow`) com guia passo-a-passo + **Hook** (pre-destructive) para proteger

### "Quero que o Claude planeje antes de implementar algo complexo"
→ **Command** (`/orchestrate`) que encadeia **Agents** (planner + reviewer + security + tdd)
