# Template de Projeto --- Claude Code CoE

Estrutura minima e checklist para inicializar um novo projeto de automacao com o framework Claude Code.

## Estrutura de Diretorio

```
meu-projeto/
├── .claude/
│   └── CLAUDE.md              # Regras especificas do projeto
├── workflows/                  # Arquivos JSON de workflows n8n (se aplicavel)
│   └── .gitkeep
├── src/                        # Codigo-fonte
├── tests/                      # Testes
├── docs/                       # Documentacao do projeto
├── AGENTS.md                   # (auto-gerado) Schema de nos n8n via n8nac
├── n8nac-config.json           # (auto-gerado) Configuracao n8nac
└── .gitignore
```

## Arquivo: .claude/CLAUDE.md (template)

```markdown
# <Nome do Projeto> --- Instrucoes Claude Code

## Contexto
- **Projeto:** <nome>
- **Objetivo:** <descricao em 1-2 linhas>
- **Stack:** <tecnologias usadas>
- **Repo:** <URL do repositorio>

## Regras do Projeto

### Convencoes
- <regras especificas deste projeto>
- <padroes de naming, estrutura, etc>

### Integrancoes
- n8n: workflow ID <ID> em producao
- Notion: database <ID> para tracking
- Linear: projeto <nome> para issues
- Snowflake: schema <SCHEMA.TABLE> como fonte de dados

### Deploy
- Ambiente de producao: <URL/descricao>
- Processo de deploy: <passos>
- Rollback: <processo>

## Arquivos Importantes
| Arquivo | Descricao |
|---|---|
| `workflows/<nome>.json` | Workflow principal |
| `src/<arquivo>` | <descricao> |

## n8n (se aplicavel)
Para qualquer tarefa n8n neste repositorio:
1. Leia `./AGENTS.md` antes de planejar, codificar ou revisar.
2. Trate `./AGENTS.md` como autoritativo e obrigatorio.
```

## Arquivo: settings.local.json (template)

O `settings.local.json` fica na raiz do projeto e configura permissoes e comportamento especificos.

```json
{
  "permissions": {
    "allow": [
      "Read(src/**)",
      "Read(tests/**)",
      "Read(workflows/**)",
      "Read(docs/**)"
    ]
  }
}
```

> **Nota:** Permissoes globais ja estao no `~/.claude/settings.json`. O `settings.local.json` do projeto adiciona permissoes extras ou restringe para o escopo local.

## Memoria do Projeto

A memoria e criada automaticamente em `~/.claude/projects/<projeto-hash>/memory/`.

### Estrutura inicial recomendada

Ao criar um projeto, inclua pelo menos estas entradas de memoria:

**MEMORY.md** (indice):
```markdown
# Memory Index

## Project
- [Contexto do Projeto](project_context.md) --- <descricao curta>

## Reference
- [Workflow IDs](reference_workflows.md) --- IDs de workflows n8n em producao
- [Databases](reference_databases.md) --- Tabelas Snowflake e databases Notion
```

**project_context.md:**
```markdown
# Contexto do Projeto

- **Nome:** <nome>
- **Objetivo:** <objetivo>
- **Status:** em desenvolvimento / em producao / em manutencao
- **Decisoes-chave:**
  - <data> --- <decisao e motivo>
```

**reference_workflows.md** (se usa n8n):
```markdown
# Workflow IDs

| Workflow | ID | Ambiente | Status |
|---|---|---|---|
| <nome> | <id> | producao | ativo |
```

---

## Checklist de Inicializacao

### 1. Criar repositorio

```bash
# Usando a skill /repo-initialize (recomendado):
# No Claude Code, rode:
/repo-initialize

# Ou manualmente:
mkdir meu-projeto && cd meu-projeto
git init
```

### 2. Criar estrutura base

```bash
mkdir -p .claude workflows src tests docs
touch workflows/.gitkeep
```

### 3. Criar CLAUDE.md do projeto

```bash
# Copiar template acima e adaptar para o projeto
# Arquivo: .claude/CLAUDE.md
```

### 4. Configurar .gitignore

```gitignore
# Ambiente
.env
.env.*
*.pem
*.key
credentials.*

# Dependencias
node_modules/
__pycache__/
.venv/

# Build
dist/
build/

# n8nac (credenciais locais, nao o config)
n8nac-auth.json

# OS
.DS_Store
Thumbs.db
```

### 5. Configurar n8nac (se projeto usa n8n)

```bash
# Na raiz do projeto:
npx --yes n8nac init          # cria n8nac-config.json
npx --yes n8nac update-ai     # gera AGENTS.md com schema de nos

# Baixar workflow existente:
npx --yes n8nac pull <workflow-id>
```

### 6. Configurar MCP servers (se necessario)

Verificar que os MCP servers necessarios estao configurados no `~/.claude/settings.json`:
- `n8n-mcp` --- para projetos que usam n8n
- `linear` --- para projetos com tracking no Linear
- `notion` --- para projetos com documentacao no Notion

### 7. Criar memoria inicial

Na primeira sessao Claude Code no projeto, descrever o contexto:
```
Este projeto e <descricao>. Usa <stack>. O workflow principal tem ID <id>.
Os dados vem de <fonte>. O deploy e feito via <processo>.
```

Claude Code criara automaticamente as entradas de memoria (`autoMemoryEnabled: true`).

### 8. Primeiro commit

```bash
git add .claude/CLAUDE.md .gitignore workflows/ src/ tests/ docs/
git commit -m "chore: initialize project structure"
```

---

## Projetos de Referencia

Projetos existentes que seguem este template (dentro do setup atual):

| Projeto | Descricao | Usa n8n? | Usa Snowflake? |
|---|---|---|---|
| `coe-dashboard` | Dashboard React + docs de governanca | Nao | Nao |
| `alarmes-n8n-finops` | Alertas FinOps para workflows n8n | Sim | Sim |
| `faturamento-unico` | Automacao de faturamento | Sim | Sim |
| `slack-modal-automacao` | Modal Slack para solicitar automacoes | Sim | Nao |
| `ngenie` | Assistente IA interno | Sim | Sim |
| `onboarding` | Fluxo de onboarding automatizado | Sim | Nao |

---

## Dicas

- **Nao duplique regras globais.** O `.claude/CLAUDE.md` do projeto deve conter apenas regras ESPECIFICAS do projeto. Regras globais (estilo, git, seguranca) ja estao no `~/.claude/CLAUDE.md`.

- **Use `/plan` antes de implementar.** Para tarefas complexas, rode `/plan` primeiro. O planner agent conhece o contexto de n8n, Snowflake e FinOps.

- **Use `/orchestrate` para tarefas criticas.** Encadeia planner + code-reviewer + security-reviewer + TDD para cobertura maxima.

- **Mantenha workflows/ versionado.** Sempre faca `n8nac pull` antes de editar e commite o JSON atualizado. Isso permite diff, review e rollback via git.

- **Rode `/quality-gate` antes de cada commit.** Verifica lint, testes e padroes nos arquivos alterados.
