---
name: repo-initialize
description: Initialize a new CoE automation project repository. Use when the user
  wants to set up a new GitLab repo from scratch, connect to an existing one, scaffold
  the standard file structure, or convert a Notion PRD into project files. Trigger
  on /repo-initialize or when asked to "inicializar o repo", "criar scaffold do projeto",
  or "conectar ao repositório e inicializar".
---

# Repo Initialize — CoE Standard

Conecta ao repositório GitLab, inicializa a branch `dev`, busca o PRD no Notion e cria o scaffold completo de arquivos seguindo o Git Project Standard do CoE.

---

## Overview

**Input:** URL do repositório GitLab + URL ou nome da automação no Notion (com PRD completo)
**Process:** Conecta ao repo → configura branches → lê PRD do Notion → gera todos os arquivos do scaffold
**Output:** Repositório local pronto para desenvolvimento com `PRD.md`, `CLAUDE.md`, `.cursorrules`, `README.md`, `CHANGELOG.md`, `.gitignore`, `.env.example` e estrutura de pastas

**Key resources:**
- [GIT_PROJECT_STANDARD.md](GIT_PROJECT_STANDARD.md) — Estrutura de pastas, templates de arquivos e convenções

---

## Phase 1 — Connect to Repository

### Step 1.1: Collect inputs
Ask the user (if not already provided):
> "Qual é a URL do repositório GitLab e a URL do PRD no Notion?"

### Step 1.2: Initialize git and connect remote
```bash
git init
git remote add origin [gitlab_url]
git fetch origin
```

### Step 1.3: Setup branches
Check existing remote branches. The project must have only `main` and `dev` — never `master`.

```bash
git branch -a
```

- If local `master` was auto-created by `git init`: checkout `dev` from remote and delete `master`
```bash
git checkout -b dev origin/dev
git branch -D master
```
- If `dev` doesn't exist on remote yet: create and push it
```bash
git checkout -b dev
git push -u origin dev
```

### Step 1.4: Confirm to user
```
✅ Repositório conectado: [url]
✅ Branch ativa: dev (tracking origin/dev)
```

---

## Phase 2 — Read PRD from Notion

### Step 2.1: Fetch the PRD page
```
notion-fetch: { id: "[PRD page URL or ID]" }
```

If only the automation name was given (no URL), use `notion-search` first:
```
notion-search: { query: "[automation name]" }
```
Confirm it's a PRD subpage inside `automacoes_master` (database ID: `2ff4457c-7167-80ed-af89-d5589e336633`).

### Step 2.2: Extract key project data
From the PRD content, identify and note:
- **Nome da Automação** — for file titles and README
- **O que faz em uma frase** — for README description
- **Problema atual** — for README Problem section
- **Arquitetura** — trigger, tools, integrations, IDs, credentials
- **Dependências** — blockers and statuses
- **Usa Snowflake?** — determines if `sql/` directory is needed
- **Usa LLM?** — relevant for CLAUDE.md security section

> **IMPORTANTE:** Nunca edite ou modifique a página do PRD no Notion. É somente leitura neste processo.

---

## Phase 3 — Generate Scaffold Files

Create all files below. Each must be **populated with data from the PRD** — never use generic placeholders where real information is available.

### Step 3.1: PRD.md
Convert the full Notion PRD content to Markdown, preserving all 9 sections. Tables, checkboxes and callouts must be converted to valid GitHub-flavored Markdown.

### Step 3.2: CLAUDE.md
Follow the template in [GIT_PROJECT_STANDARD.md](GIT_PROJECT_STANDARD.md) — section `CLAUDE.md template`.

Populate with:
- Descrição do projeto (da seção 2 do PRD)
- Diagrama ASCII do fluxo de dados (da seção 3)
- IDs e referências críticas (teamId Linear, collection Notion, canais Slack, etc.)
- Credenciais necessárias listadas por nome de env var
- Mandatos de segurança relevantes (marcar N/A para Snowflake se não usar)
- Convenções de código específicas do projeto

### Step 3.3: .cursorrules
Follow the template in [GIT_PROJECT_STANDARD.md](GIT_PROJECT_STANDARD.md) — section `.cursorrules template`.

Populate with contexto, integrações, IDs, regras de segurança e localização de arquivos específicas do projeto.

### Step 3.4: README.md
Replace any existing generic README (ex: template padrão do GitLab) with o template do CoE.

Populate with nome, descrição de uma linha, problema, solução, stack real do projeto e instruções de setup específicas.

### Step 3.5: CHANGELOG.md
```markdown
# Changelog

## [Unreleased]

## [1.0.0] - TBD
### Added
- Deploy inicial em produção
```

### Step 3.6: .gitignore
```
.env
*.log
__pycache__/
.DS_Store
node_modules/
*.tmp
.venv/
```

### Step 3.7: .env.example
Listar APENAS as variáveis relevantes para o projeto (extraídas da seção 3 do PRD — integrações). Não incluir variáveis de ferramentas não usadas (ex: omitir SNOWFLAKE_* se projeto não usa Snowflake).

Formato:
```bash
# [Tool]
VAR_NAME=
```

### Step 3.8: Directory structure
Criar pastas com `.gitkeep`. Incluir `sql/` apenas se o projeto usar Snowflake.

```
docs/workflows/
docs/decisions/
n8n/nodes/
n8n/workflows/
src/functions/
sql/views/          ← somente se usar Snowflake
sql/staging/        ← somente se usar Snowflake
sql/validation/     ← somente se usar Snowflake
```

---

## Phase 4 — Confirm and Next Steps

### Step 4.1: Show summary
```
✅ Scaffold criado com sucesso!

Arquivos gerados:
  README.md        ✅
  CLAUDE.md        ✅
  PRD.md           ✅
  CHANGELOG.md     ✅
  .gitignore       ✅
  .env.example     ✅
  .cursorrules     ✅
  docs/workflows/  ✅
  docs/decisions/  ✅
  n8n/nodes/       ✅
  n8n/workflows/   ✅
  src/functions/   ✅

Próximos passos:
1. Criar o .env a partir do .env.example e preencher os valores
2. Fazer o primeiro commit: chore: project scaffold
3. Criar branch de trabalho: workflow/OPEX-{N}-{slug}
```

### Step 4.2: Offer to commit
Perguntar ao usuário se deseja fazer o primeiro commit agora:
> "Quer que eu faça o commit `chore: project scaffold` agora?"

Se sim, staged todos os arquivos gerados (exceto `.env`) e commitar:
```bash
git add README.md CLAUDE.md PRD.md CHANGELOG.md .gitignore .env.example .cursorrules docs/ n8n/ src/
git commit -m "chore: project scaffold"
```

---

## Reference: Tools Used

| Tool | When |
|---|---|
| `Bash` | git init, remote add, fetch, checkout, branch |
| `mcp__notion__notion-fetch` | Ler PRD do Notion |
| `mcp__notion__notion-search` | Encontrar página se não tiver URL |
| `Write` | Criar cada arquivo do scaffold |
