---
name: onboard
description: Guia interativo de onboarding no framework Claude Code do CoE. Use quando
  um novo dev quer configurar o Claude Code com o setup padronizado da empresa. Trigger
  em /onboard ou quando pedirem "configurar claude code", "setup do framework", "onboarding
  claude code", ou "quero usar o framework do CoE".
---

# Onboarding — Framework Claude Code CoE

Você é um guia de onboarding. Conduza o usuário pelos passos de configuração do framework Claude Code padronizado do CoE NG.Cash. Seja direto, explique o que cada componente faz, e nunca sobrescreva configuração existente sem perguntar.

---

## Overview

**Input:** Dev novo querendo configurar o Claude Code com o framework do CoE
**Process:** Diagnóstico → Instalação Base → Skills & Plugins → Memória → Verificação
**Output:** Setup completo e funcional, pronto para uso em projetos

---

## Fase 1 — Diagnóstico

Verifique o estado atual do setup do usuário antes de qualquer instalação.

### Step 1.1: Claude Code instalado?
```bash
claude --version
```
Se não estiver instalado, parar aqui e orientar:
> "Instale o Claude Code primeiro: `npm install -g @anthropic-ai/claude-code`"

### Step 1.2: Verificar componentes existentes
Checar cada um destes caminhos:

```bash
# CLAUDE.md global (regras de código, git, segurança)
ls ~/.claude/CLAUDE.md

# Rules domain-specific
ls ~/.claude/rules/

# Hooks de segurança e qualidade
ls ~/.claude/hooks/

# Configuração de MCP servers
ls ~/.claude/settings.json

# Skills disponíveis
ls ~/.claude/skills/
```

### Step 1.3: Reportar estado
Apresentar ao usuário uma tabela com o status de cada componente:

```
Componente            Status
─────────────────────────────
CLAUDE.md             [OK / FALTA]
rules/                [OK / FALTA]  (n8n-mcp-editing.md, snowflake-python.md)
hooks/                [OK / FALTA]  (10 hooks esperados)
settings.json         [OK / FALTA]
skills/               [OK / FALTA]  (X de Y skills instalados)
memory/               [OK / FALTA]
```

Perguntar: "Quer que eu instale os componentes faltantes?"

---

## Fase 2 — Instalação Base

Para cada componente faltante, guiar a instalação. **Nunca sobrescrever sem perguntar.**

### Step 2.1: CLAUDE.md (Regras Globais)

Arquivo: `~/.claude/CLAUDE.md`

Contém as regras padronizadas do CoE:
- **Code Style**: imutabilidade, tamanho de arquivo (200-400 linhas), funções <50 linhas, max 4 níveis de nesting
- **Error Handling**: sem falhas silenciosas, validar input em boundaries, fail fast
- **Git Workflow**: commits atômicos `<type>: <description>`, nunca direto na main
- **Testing**: TDD quando possível, reproduzir bug antes de corrigir
- **Security**: sem secrets hardcoded, inputs validados, queries parametrizadas
- **Snowflake**: uma tentativa de auth, LIMIT obrigatório, fechar sessão
- **n8n MCP**: fetch antes de update, batch >5 nós, re-fetch após cada batch
- **Notion API**: verificar formato de rich text, não misturar page properties com block children

Se o arquivo já existir, perguntar se quer manter a versão atual ou atualizar.

### Step 2.2: Rules (Regras Domain-Specific)

Diretório: `~/.claude/rules/`

Regras automáticas carregadas por contexto:
- `n8n-mcp-editing.md` — regras para edição de workflows via MCP
- `snowflake-python.md` — regras para acesso Snowflake via Python

Copiar do setup de referência do CoE.

### Step 2.3: Hooks (Guardrails de Segurança e Qualidade)

Diretório: `~/.claude/hooks/`

**Hooks de segurança (pré-ação):**
| Hook | O que faz |
|---|---|
| `pre-git-push-guard.js` | Bloqueia push direto para main/master |
| `pre-destructive-git.js` | Pede confirmação antes de reset --hard, checkout --, etc. |
| `pre-sensitive-files.js` | Impede commit de .env, credentials, tokens |

**Hooks de qualidade (pós-ação):**
| Hook | O que faz |
|---|---|
| `validate-json.js` | Valida JSON antes de salvar |
| `post-debug-statements.js` | Alerta sobre console.log/print deixados no código |
| `post-auto-format.js` | Formata código automaticamente |
| `pre-file-size-limit.js` | Bloqueia arquivos acima do limite configurado |
| `session-context-inject.js` | Injeta contexto git (branch, commits) na primeira tool call da sessao |
| `stop-notification.js` | Notificacao desktop quando Claude termina |

**Hook de controle:**
| Hook | O que faz |
|---|---|
| `hook-profile-check.js` | Controla quais hooks rodam por profile/contexto |

Copiar todos os 10 hooks para `~/.claude/hooks/`.
Registrar os hooks em `~/.claude/settings.json` conforme configuração do CoE.

> **IMPORTANTE:** Explique ao dev o que cada hook faz antes de instalar. Nunca instalar hooks silenciosamente.

### Step 2.4: MCP Servers

Configuração em `~/.claude/settings.json` (seção `mcpServers`).

Guiar configuração de cada server usado no CoE:

**n8n MCP** (automação de workflows):
- URL da instância: pedir ao dev
- API key: pedir ao dev (gerar em n8n > Settings > API)
- Lembrar: credencial via env var, nunca hardcoded

**Linear MCP** (gestão de projetos):
- API token: pedir ao dev (gerar em Linear > Settings > API)
- Permissões necessárias: read/write issues, read teams

**Notion MCP** (documentação):
- Integration token: pedir ao dev (criar em notion.so/my-integrations)
- Compartilhar páginas relevantes com a integration

> **REGRA:** Credenciais são responsabilidade do dev. Apenas orientar onde criar e onde configurar. Nunca pedir para o dev colar tokens no chat.

---

## Fase 3 — Skills & Plugins

### Step 3.1: Listar skills disponíveis por categoria

**Core (gestão de projeto):**
- `compact-memory` — Compacta e deduplica memória do projeto
- `repo-initialize` — Scaffold de novo repositório com padrão CoE
- `prd-writer` — Escreve PRD no Notion a partir de entrevista

**n8n (automação):**
- `n8n-code-javascript` — JavaScript em Code nodes
- `n8n-code-python` — Python em Code nodes
- `n8n-expression-syntax` — Sintaxe de expressões n8n
- `n8n-mcp-tools-expert` — Guia de uso das tools MCP do n8n
- `n8n-node-configuration` — Configuração de nós por tipo
- `n8n-validation-expert` — Interpretar erros de validação
- `n8n-workflow-patterns` — Padrões arquiteturais de workflows
- `n8n-workflow-testing-fundamentals` — Testes de workflow
- `n8n-integration-testing-patterns` — Testes de integração
- `n8n-trigger-testing-strategies` — Testes de triggers

**Deploy n8n:**
- `deploy-n8n-workflow` — Deploy com diff, validação e canary
- `rollback-n8n-workflow` — Rollback seguro com preview
- `safe-update-n8n` — Update com padrão fetch-diff-apply-verify
- `sync-n8n-workflow` — Sincroniza JSON local com estado deployed

**QA (qualidade):**
- `context-driven-testing` — Testes adaptados ao contexto
- `qe-iterative-loop` — Ciclos de correção autônoma
- `qe-quality-assessment` — Quality gates e deployment readiness
- `qe-requirements-validation` — Rastreabilidade de requisitos

**FinOps:**
- `cost-report` — Relatório de custos de API dos workflows

**Apresentações:**
- `slidev:*` — Suite completa para criação de slides com Slidev

**Frontend:**
- `frontend-design` — Interfaces frontend com qualidade de produção

### Step 3.2: Plugins (instalação manual)

Plugins precisam ser instalados pelo dev via CLI:

```bash
# Slidev (apresentações)
/plugin marketplace add cc-slidev
/plugin install cc-slidev

# Frontend Design
/plugin marketplace add frontend-design
/plugin install frontend-design
```

### Step 3.3: Skills mais usados para começar

Recomendar ao dev testar esses primeiro:
1. `/plan` — Planejamento estruturado antes de implementar
2. `/dev` — Modo desenvolvimento pragmático
3. `/review` — Revisão com foco em segurança e qualidade
4. `/compact-memory` — Manutenção de memória

---

## Fase 4 — Inicialização de Memória

### Step 4.1: Criar estrutura de memória do projeto

Se o dev já tem um projeto ativo, inicializar memória:

```
~/.claude/projects/<project-slug>/memory/
├── MEMORY.md          # Index (max 200 linhas)
├── user_profile.md    # Perfil do dev
└── (outros conforme necessidade)
```

### Step 4.2: Criar user_profile.md

Perguntar ao dev:
- Nome completo
- Papel/função na empresa
- Ferramentas que usa no dia a dia (n8n, Snowflake, Linear, Notion, etc.)
- Projetos atuais

Criar o arquivo no formato:

```markdown
# User Profile

- **Nome:** [nome]
- **Papel:** [papel] at NG.Cash
- **Ferramentas diárias:** [lista]
- **Projetos atuais:** [lista]
```

### Step 4.3: Criar MEMORY.md index

```markdown
# Memory Index

## User
- [User Profile](user_profile.md) — [nome], [papel]

## Project
(será preenchido conforme o dev trabalhar em projetos)

## Reference
(será preenchido conforme necessidade)
```

### Step 4.4: Explicar tipos de memória

- **user** — Perfil e preferências do dev (persiste entre projetos)
- **feedback** — Correções e ajustes feitos pelo dev durante uso
- **project** — Contexto específico de cada projeto
- **reference** — IDs, URLs, configs que são consultados frequentemente

---

## Fase 5 — Verificação Final

### Step 5.1: Rodar checklist

Executar cada verificação e reportar:

```bash
# 1. CLAUDE.md existe e tem conteúdo
test -s ~/.claude/CLAUDE.md && echo "OK" || echo "FALTA"

# 2. Rules existem
ls ~/.claude/rules/*.md 2>/dev/null | wc -l

# 3. Hooks existem e estão registrados
ls ~/.claude/hooks/ | wc -l

# 4. Settings.json existe
test -f ~/.claude/settings.json && echo "OK" || echo "FALTA"

# 5. Skills estão acessíveis
ls ~/.claude/skills/ | wc -l
```

### Step 5.2: Teste rápido de hooks

Rodar um teste simples para confirmar que hooks estão funcionando:
```bash
# Testar se o hook de push guard responde
node ~/.claude/hooks/pre-git-push-guard.js --test 2>/dev/null
```

### Step 5.3: Teste de MCP (se configurado)

Se MCP servers foram configurados, testar conexão:
- n8n: listar workflows (`n8n_list_workflows`)
- Linear: listar teams (`list_teams`)
- Notion: buscar uma página (`notion-search`)

### Step 5.4: Reportar status final

```
Onboarding — Resultado Final
═════════════════════════════

  CLAUDE.md global          [OK / PENDENTE]
  rules/ domain-specific    [OK / PENDENTE]
  Hooks instalados          [X/10]
  Hooks registrados         [OK / PENDENTE]
  MCP n8n                   [OK / PENDENTE / N/A]
  MCP Linear                [OK / PENDENTE / N/A]
  MCP Notion                [OK / PENDENTE / N/A]
  Skills acessíveis         [X skills]
  Memória inicializada      [OK / PENDENTE]

Status: READY / PARTIAL
```

Se PARTIAL, listar pendências e orientar como resolver cada uma.

---

## Regras de Execução

- **Sempre verificar antes de sobrescrever** — perguntar se já existe configuração prévia
- **Nunca instalar hooks sem explicar** o que cada um faz
- **Credenciais são responsabilidade do dev** — apenas guiar onde configurar
- **Se algo falhar, diagnosticar** e sugerir fix antes de prosseguir
- **Respeitar o ritmo do dev** — se quiser parar no meio, salvar progresso e listar pendências
- **Não assumir ambiente** — sempre checar OS, shell e paths antes de rodar comandos

---

## Reference: Tools Used

| Tool | Quando |
|---|---|
| `Bash` | Verificar paths, instalar hooks, testar setup |
| `Read` | Ler configurações existentes |
| `Write` | Criar CLAUDE.md, hooks, memory files |
| `Edit` | Atualizar settings.json com MCP configs |
