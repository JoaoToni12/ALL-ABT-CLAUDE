# Framework Claude Code --- CoE NG.Cash

Setup padronizado de Claude Code para o time de automacao do CoE.

## Visao Geral

Este framework configura Claude Code com um conjunto integrado de regras, hooks, agentes, skills e plugins que garantem qualidade, seguranca e produtividade no desenvolvimento de automacoes. Tudo vive em `~/.claude/` e e compartilhado entre todos os projetos.

**Numeros do setup atual:**
- 5 arquivos de regras contextuais (rules/)
- 10 hooks de seguranca e qualidade
- 6 agentes especializados com model selection
- 25 skills domain-specific
- 3 plugins instalados
- Sistema de memoria persistente entre sessoes

## Estrutura

```
~/.claude/
├── CLAUDE.md                          # Regras globais (codigo, git, seguranca, testes)
├── settings.json                      # Hooks, plugins, permissoes, MCP servers
├── rules/                             # Regras contextuais ativadas por glob pattern
│   ├── snowflake-python.md            #   *.py → sessao e query Snowflake
│   ├── n8n-mcp-editing.md             #   workflows/** → seguranca de edicao n8n via MCP
│   ├── n8n-as-code.md                 #   workflows/** → regras do n8nac CLI
│   ├── notion-api.md                  #   *notion* → payloads Notion
│   └── debugging.md                   #   * → root cause verification
├── hooks/                             # Scripts executados automaticamente
│   ├── hook-profile-check.js          #   Utility: sistema de profiles (minimal/standard/strict)
│   ├── pre-git-push-guard.js          #   Bloqueia force push
│   ├── pre-destructive-git.js         #   Bloqueia git reset --hard, clean -f, branch -D
│   ├── pre-sensitive-files.js         #   Bloqueia escrita em .env, credentials
│   ├── pre-file-size-limit.js         #   Avisa arquivos >500 linhas
│   ├── post-auto-format.js            #   Auto-format com prettier apos Write/Edit
│   ├── post-debug-statements.js       #   Detecta console.log, debugger
│   ├── validate-json.js               #   Valida JSON apos escrita
│   ├── session-context-inject.js      #   Injeta contexto git na primeira tool call da sessao
│   └── stop-notification.js           #   Notificacao desktop quando Claude termina
├── commands/                          # Slash commands (/comando)
│   ├── plan.md                        ├── dev.md
│   ├── research.md                    ├── review.md
│   ├── tdd.md                         ├── build-fix.md
│   ├── refactor-clean.md              ├── quality-gate.md
│   ├── checkpoint.md                  ├── orchestrate.md
│   ├── verify-workflow.md             └── hook-profile.md
├── agents/                            # Agentes autonomos com model selection
│   ├── planner.md                     ├── code-reviewer.md
│   ├── security-reviewer.md           ├── build-error-resolver.md
│   ├── doc-updater.md                 └── verify-automation.md
├── skills/                            # Packages com conhecimento domain-specific
│   ├── onboard/                       ├── compact-memory/
│   ├── cost-report/                   ├── prd-writer/
│   ├── repo-initialize/               ├── deploy-n8n-workflow/
│   ├── rollback-n8n-workflow/         ├── safe-update-n8n/
│   ├── sync-n8n-workflow/             ├── n8n-code-javascript/
│   ├── n8n-code-python/               ├── n8n-expression-syntax/
│   ├── n8n-mcp-tools-expert/          ├── n8n-node-configuration/
│   ├── n8n-validation-expert/         ├── n8n-workflow-patterns/
│   ├── n8n-workflow-testing-fundamentals/
│   ├── n8n-integration-testing-patterns/
│   ├── n8n-trigger-testing-strategies/
│   ├── context-driven-testing/        ├── qe-iterative-loop/
│   ├── qe-quality-assessment/         ├── qe-requirements-validation/
│   └── cc-slidev/                     # Plugin Slidev (marketplace local)
├── plugins/                           # Plugins de terceiros
│   └── installed_plugins.json
└── projects/                          # Memoria por projeto
    └── <projeto>/
        └── memory/
            ├── MEMORY.md              # Indice de memoria
            └── *.md                   # Entradas de contexto persistente
```

## Quick Start

### 1. Instalar Claude Code CLI

```bash
npm install -g @anthropic-ai/claude-code
```

### 2. Copiar o framework

> **Nota:** Scripts de instalacao automatizada estao disponiveis: `install.sh` (Linux/macOS) e `install.ps1` (Windows). Eles copiam todos os componentes e ajustam paths automaticamente.

```bash
# Clonar o repo com os arquivos do framework
git clone <repo-url> ~/.claude-framework

# Copiar para ~/.claude/
cp -r ~/.claude-framework/CLAUDE.md ~/.claude/
cp -r ~/.claude-framework/rules/ ~/.claude/
cp -r ~/.claude-framework/hooks/ ~/.claude/
cp -r ~/.claude-framework/commands/ ~/.claude/
cp -r ~/.claude-framework/agents/ ~/.claude/
cp -r ~/.claude-framework/skills/ ~/.claude/

# Copiar settings.json (revisar antes — contem paths locais)
cp ~/.claude-framework/settings.json ~/.claude/settings.json
```

### 3. Instalar plugins

```bash
# Dentro do Claude Code CLI:
/plugin marketplace add EtienneLescot/n8n-as-code
/plugin install n8n-as-code@n8nac-marketplace

# O Slidev e o frontend-design sao instalados via marketplace oficial
/plugin install frontend-design@claude-plugins-official
/plugin install slidev@slidev-dev-marketplace
```

### 4. Configurar MCP Servers

Ver secao [Configuracao de MCP Servers](#configuracao-de-mcp-servers).

---

## Componentes

### Regras (CLAUDE.md + rules/)

O `CLAUDE.md` global define padroes que se aplicam a TODA sessao Claude Code:

| Topico | O que define |
|---|---|
| Code Style | Imutabilidade, tamanho de arquivo (200-400 linhas), funcoes <50 linhas, max 4 niveis nesting |
| Error Handling | Fail fast, validacao de input, sem falhas silenciosas |
| Git Workflow | Formato `<type>: <description>`, commits atomicos, nunca push direto na main |
| Testing | TDD (Red/Green/Refactor), bug fix = failing test primeiro |
| Security | Sem secrets hardcoded, inputs validados, queries parametrizadas |
| Snowflake | Uma tentativa de auth, LIMIT obrigatorio, sessao unica, fechar apos uso |
| n8n MCP | Fetch antes de update, batch 3-5 nos, re-fetch apos cada batch |
| n8nac | Pull antes de editar, verify antes de push, push = deploy |
| Notion API | Estrutura de rich text, escaping em mermaid code blocks |
| Debugging | Root cause primeiro, nunca adivinhar, verificar hipotese mais provavel |

As **rules contextuais** (`~/.claude/rules/`) sao ativadas automaticamente por glob pattern:

| Arquivo | Glob | Ativado quando |
|---|---|---|
| `snowflake-python.md` | `**/*.py` | Editando qualquer arquivo Python |
| `n8n-mcp-editing.md` | `**/workflows/**`, `**/*n8n*` | Trabalhando com workflows n8n |
| `n8n-as-code.md` | `**/workflows/**`, `**/*n8n*`, `**/AGENTS.md` | Usando n8nac |
| `notion-api.md` | `**/*notion*`, `**/*prd*` | Integracao com Notion |
| `debugging.md` | `[]` (manual) | Debugging (sem glob, ativada manualmente) |

### Hooks

Hooks sao scripts que executam automaticamente antes ou depois de acoes do Claude Code.

| Hook | Evento | Matcher | Funcao |
|---|---|---|---|
| `pre-git-push-guard.js` | PreToolUse | Bash | Bloqueia `git push --force` / `-f`. Avisa em push normal |
| `pre-destructive-git.js` | PreToolUse | Bash | Bloqueia `git reset --hard`, `git clean -f`, `git checkout .`, `git branch -D` |
| `pre-sensitive-files.js` | PreToolUse | Write, Edit | Bloqueia escrita em `.env`, `credentials.*`, `*.pem`, `*.key` |
| `pre-file-size-limit.js` | PreToolUse | Write | Avisa se arquivo resultante tera >500 linhas |
| `post-auto-format.js` | PostToolUse | Write, Edit | Roda `prettier` automaticamente apos escrita (se instalado) |
| `post-debug-statements.js` | PostToolUse | Write, Edit | Detecta `console.log`, `debugger`, `print()` em codigo commitavel |
| `validate-json.js` | PostToolUse | Write, Edit | Valida sintaxe JSON apos escrita de arquivos `.json` |
| `session-context-inject.js` | PreToolUse | .* | Injeta branch atual e commits recentes na primeira tool call |
| `stop-notification.js` | Stop | "" | Envia notificacao desktop quando Claude termina (Windows/Mac/Linux) |

**Utility:**
- `hook-profile-check.js` --- Modulo compartilhado que implementa o sistema de profiles. Usado via `require()` por outros hooks.

### Comandos (/slash)

Invocados pelo usuario com `/nome` no prompt.

| Comando | Descricao |
|---|---|
| `/plan` | Planejamento estruturado antes de implementar. Quebra tarefas, identifica riscos |
| `/dev` | Modo desenvolvimento --- pragmatico, code-first, iterativo |
| `/research` | Modo pesquisa --- exploracao primeiro, entender antes de agir |
| `/review` | Modo review --- analise completa, foco em seguranca e qualidade |
| `/tdd` | Guia TDD --- escrever testes primeiro, depois implementar |
| `/build-fix` | Diagnostica e corrige erros de build/runtime sistematicamente |
| `/refactor-clean` | Analisa e refatora codigo para clareza, remove dead code |
| `/quality-gate` | Roda checks de qualidade nos arquivos alterados antes de commit |
| `/checkpoint` | Cria/verifica/lista checkpoints de progresso em tarefas complexas |
| `/orchestrate` | Encadeia planner + reviewer + security + TDD agents sequencialmente |
| `/verify-workflow` | Verifica workflow n8n end-to-end (estrutura, conexoes, validacao, teste) |
| `/hook-profile` | Alterna profile de hooks (minimal/standard/strict) |

### Agentes

Agentes sao instancias autonomas com model selection por complexidade.

| Agente | Model | Funcao |
|---|---|---|
| `planner` | sonnet | Planejamento com contexto domain-specific (n8n, Snowflake, FinOps). Usado pelo `/orchestrate` |
| `code-reviewer` | sonnet | Review isolado de codigo sem poluir contexto da conversa principal |
| `security-reviewer` | sonnet | Review focado em seguranca: auth flows, credentials, user input, APIs |
| `build-error-resolver` | sonnet | Diagnostica e corrige erros de compilacao, testes e runtime |
| `doc-updater` | haiku | Atualiza documentacao (README, CLAUDE.md, inline docs) apos refactors |
| `verify-automation` | opus | Verificacao E2E de automacoes n8n: le PRD, extrai criterios de aceite, valida estrutura, executa testes, verifica outputs em sistemas destino (Slack, Notion, Linear, Snowflake) |

### Skills (por categoria)

Skills sao pacotes de conhecimento domain-specific que Claude Code carrega sob demanda.

**Core:**
| Skill | Descricao |
|---|---|
| `onboard` | Setup guiado para novos usuarios |
| `compact-memory` | Compacta e deduplica arquivos de memoria do projeto |
| `cost-report` | Relatorio de custo de API para workflows n8n (uso real vs budget) |
| `prd-writer` | Escreve PRD no Notion para uma automacao (entrevista + template) |
| `repo-initialize` | Inicializa repositorio de projeto com estrutura padrao |

**n8n (11 skills):**
| Skill | Descricao |
|---|---|
| `deploy-n8n-workflow` | Deploy de workflow local para producao com diff, validacao e canary |
| `rollback-n8n-workflow` | Rollback seguro para versao anterior com preview e audit trail |
| `safe-update-n8n` | Update seguro com pattern fetch-diff-apply-verify |
| `sync-n8n-workflow` | Sincroniza JSON local com estado deployed |
| `n8n-code-javascript` | Escrita de JavaScript em Code nodes n8n |
| `n8n-code-python` | Escrita de Python em Code nodes n8n |
| `n8n-expression-syntax` | Validacao de expressoes n8n e correcao de erros comuns |
| `n8n-mcp-tools-expert` | Guia expert para uso das tools n8n-mcp |
| `n8n-node-configuration` | Configuracao de nos com awareness de dependencias entre propriedades |
| `n8n-validation-expert` | Interpretacao de erros de validacao e false positives |
| `n8n-workflow-patterns` | Padroes arquiteturais provados (webhook, HTTP API, scheduled, AI agent, DB ops) |

**QA (5 skills):**
| Skill | Descricao |
|---|---|
| `context-driven-testing` | Principios de teste context-driven (praticas escolhidas pelo contexto do projeto) |
| `n8n-workflow-testing-fundamentals` | Fundamentos de teste de workflows n8n |
| `n8n-integration-testing-patterns` | Testes de contrato de API, auth flows, rate limits |
| `n8n-trigger-testing-strategies` | Testes de webhooks, schedules, event-driven triggers |
| `qe-iterative-loop` | Ciclos autonomos de qualidade auto-corretivos |
| `qe-quality-assessment` | Quality gates, metricas e avaliacao de deployment readiness |
| `qe-requirements-validation` | Rastreabilidade de requisitos, validacao de criterios de aceite, BDD |

**Apresentacoes:**
| Skill | Descricao |
|---|---|
| `cc-slidev` | Plugin completo Slidev com 15+ sub-skills (init, generate, edit, export, diagrams, handouts LaTeX) |

### Plugins

Plugins sao extensoes de terceiros que adicionam skills e tools.

| Plugin | Marketplace | Versao | Funcao |
|---|---|---|---|
| `frontend-design` | claude-plugins-official | - | Interfaces frontend production-grade com alto design |
| `slidev` | slidev-dev-marketplace (local) | 0.1.0 | Criacao de apresentacoes Slidev |
| `n8n-as-code` | n8nac-marketplace (GitHub) | 0.2.0 | Gerenciamento de workflows n8n como codigo + schema de 537 nos |

**Instalar plugins:**
```bash
# No CLI do Claude Code:
/plugin install frontend-design@claude-plugins-official
/plugin install slidev@slidev-dev-marketplace
/plugin marketplace add EtienneLescot/n8n-as-code
/plugin install n8n-as-code@n8nac-marketplace
```

---

## Profiles de Hook

O sistema de profiles permite controlar quais hooks rodam durante a sessao.

| Profile | Hooks ativos | Uso recomendado |
|---|---|---|
| `minimal` | Apenas seguranca (push-guard, destructive-git, sensitive-files) | Debug rapido, POCs, exploracao |
| `standard` | Todos os hooks | Trabalho diario (padrao) |
| `strict` | Todos + warnings extras de tamanho e debug | Code review, pre-deploy, producao |

**Ativar:**
```bash
# Via slash command:
/hook-profile minimal

# Via variavel de ambiente:
export CLAUDE_HOOK_PROFILE=strict

# Desativar hooks individuais:
export CLAUDE_DISABLED_HOOKS=debug-statements,file-size-limit
```

---

## Configuracao de MCP Servers

O framework utiliza 3 MCP servers configurados em `settings.json`:

### n8n-mcp

Acesso direto a instancia n8n de producao. Permite criar, editar, validar, testar e monitorar workflows.

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["-y", "@czlonkowski/n8n-mcp"],
      "env": {
        "N8N_BASE_URL": "https://<your-n8n-instance-url>",
        "N8N_API_KEY": "<via env var ou secret manager>"
      }
    }
  }
}
```

**Tools disponiveis:** `n8n_get_workflow`, `n8n_list_workflows`, `n8n_validate_workflow`, `n8n_test_workflow`, `n8n_executions`, `n8n_update_partial_workflow`, `n8n_update_full_workflow`, `n8n_create_workflow`, `n8n_delete_workflow`, `search_nodes`, `get_node`, `validate_node`, entre outros.

### Linear

Acesso ao Linear para gestao de issues, projetos e documentacao.

```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "@anthropic/linear-mcp-server"],
      "env": {
        "LINEAR_API_KEY": "<via env var>"
      }
    }
  }
}
```

**Tools disponiveis:** `get_issue`, `save_issue`, `list_issues`, `list_projects`, `get_project`, `create_document`, `list_documents`, entre outros.

### Notion

Acesso ao Notion para gestao de paginas, databases e documentacao.

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@anthropic/notion-mcp-server"],
      "env": {
        "NOTION_API_KEY": "<via env var>"
      }
    }
  }
}
```

**Tools disponiveis:** `notion-search`, `notion-fetch`, `notion-create-pages`, `notion-update-page`, `notion-create-database`, `notion-get-comments`, entre outros.

---

## Sistema de Memoria

Claude Code mantem contexto persistente entre sessoes via arquivos Markdown em `~/.claude/projects/<projeto>/memory/`.

**Estrutura:**
```
memory/
├── MEMORY.md              # Indice principal com links para entradas
├── user_profile.md        # Perfil do usuario (nome, role, ferramentas)
├── project_*.md           # Contexto de projetos
└── reference_*.md         # Referencias (instancias, URLs, IDs)
```

**Manutencao:**
- Usar `/compact-memory` periodicamente para dedupliar e limpar
- `autoMemoryEnabled: true` no settings.json habilita criacao automatica de entradas
- Entradas sao lidas automaticamente no inicio de cada sessao

---

## FAQ

**P: Preciso copiar tudo ou posso escolher partes?**
R: O framework e modular. No minimo, copie `CLAUDE.md`, `settings.json` (ajustando paths) e os hooks de seguranca (`pre-git-push-guard.js`, `pre-destructive-git.js`, `pre-sensitive-files.js`). Skills e agentes sao opcionais por funcao.

**P: Os hooks bloqueiam operacoes ou apenas avisam?**
R: Depende. Hooks de seguranca (push-guard, destructive-git, sensitive-files) **bloqueiam** (exit code 2). Hooks de qualidade (file-size-limit, debug-statements) **avisam** (stderr) mas permitem continuar.

**P: Como adicionar uma regra nova?**
R: Crie um arquivo `.md` em `~/.claude/rules/` com frontmatter `description` e `globs`. Claude Code carrega automaticamente quando o glob pattern casa com os arquivos do contexto.

**P: Como criar um novo agent?**
R: Crie um arquivo `.md` em `~/.claude/agents/` com frontmatter `name`, `description`, `model` e `tools`. Referencia: ver `agents/code-reviewer.md` como exemplo.

**P: Como criar uma nova skill?**
R: Crie um diretorio em `~/.claude/skills/<nome>/` com pelo menos um `SKILL.md`. O arquivo SKILL.md contem frontmatter com `name`, `description` e triggers. Referencia: ver `skills/cost-report/SKILL.md`.

**P: O framework funciona no macOS/Linux?**
R: Sim. Os hooks usam Node.js e bash, ambos cross-platform. Ajustar os paths no `settings.json` (trocar `C:\\Users\\...` por `~/`).

**P: Como atualizar o framework?**
R: Pull do repo do framework e copiar arquivos atualizados. O `settings.json` requer merge manual (contem configuracoes locais como MCP keys).
