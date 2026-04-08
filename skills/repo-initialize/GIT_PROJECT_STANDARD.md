# Git Project Standard — CoE Reference

Fonte: https://www.notion.so/product-ngcash/Git-Project-Standard-30d4457c716781978d14f54d340375a3

---

## Directory Structure

```
projeto-nome/
├── README.md          # visão geral, stack, setup
├── CLAUDE.md          # contexto para Claude Code
├── PRD.md             # requisitos e critérios de aceite
├── CHANGELOG.md       # histórico de versões
├── .env.example       # variáveis de ambiente esperadas
├── .gitignore
├── .cursorrules       # regras para Cursor AI
├── docs/
│   ├── workflows/     # diagramas de fluxo
│   └── decisions/     # ADRs
├── n8n/
│   ├── nodes/         # código JS dos nós customizados
│   └── workflows/     # exports .json dos workflows
├── sql/               # somente se o projeto usar Snowflake
│   ├── views/         # Snowflake SEM_ views
│   ├── staging/       # DDLs de tabelas stage/raw
│   └── validation/    # queries de diagnóstico e teste
└── src/
    └── functions/     # utilitários compartilhados
```

---

## Branch Conventions

```
main                          # produção — nunca commitar direto
dev                           # integração — branch padrão
workflow/OPEX-{N}-{slug}      # desenvolvimento de automação
fix/OPEX-{N}-{slug}           # correções
docs/{slug}                   # documentação apenas
```

**Regras:**
- Nunca commitar direto em `main` ou `dev`
- `main` ← MR de `dev` apenas, após UAT aprovado
- Sempre criar branch a partir de `dev`, merge de volta para `dev`
- Deletar branch após merge

**Branches protegidas:**
| Branch | Push direto | Merge |
|---|---|---|
| `main` | Ninguém | Maintainers (via MR de `dev`) |
| `dev` | Ninguém | Developers (via MR de branch de trabalho) |

---

## Commit Format (Conventional Commits)

```
feat: add n8n ingestion workflow
fix: correct null handling in node3
docs: update README with setup instructions
refactor: extract CPF masking to shared function
chore: update .env.example with new Slack vars
```

---

## README.md template

```markdown
# [Nome do Projeto]

> [Uma linha: o que automatiza e para quem]

## Problema
[2-3 frases sobre o trabalho manual que está sendo eliminado]

## Solução
[Abordagem da automação]

## Stack
| Tool | Papel |
|---|---|
| n8n | Orquestração de workflow |
| [Tool] | [Papel] |

## Setup
1. Clonar repo
2. Copiar `.env.example` → `.env` e preencher valores
3. Importar `n8n/workflows/*.json` na instância n8n
4. [Passos específicos do projeto]

## Docs
- Arquitetura: `docs/workflows/`
- Requisitos: `PRD.md`
- Contexto para AI: `CLAUDE.md`

## Branches
```
main    # produção — nunca commitar direto
dev     # integração — branch padrão
workflow/OPEX-{N}-{slug}  # desenvolvimento
```
```

---

## CLAUDE.md template

```markdown
# [Nome do Projeto] — Claude Code Context

## Projeto
[Breve descrição do que essa automação faz — 2-3 frases]

## Arquitetura

```
[Diagrama ASCII do fluxo: Trigger → Processamento → Output]
```

## Paths Chave
- Nós n8n: `n8n/nodes/`
- Workflows: `n8n/workflows/`
- SQL views: `sql/views/`   ← remover se não usar Snowflake

## IDs e Referências Críticas
| Recurso | ID / Valor |
|---|---|
| [ex: Linear Team] | [teamId] |
| [ex: Notion database] | [collection ID] |

## Credenciais (via n8n Credential Manager)
- `VAR_NAME` — descrição

## Mandatos de Segurança (Sovereign Stack)
1. NUNCA enviar PII para APIs externas não autorizadas
2. Credenciais SEMPRE via `{{ $env.VAR_NAME }}` — nunca hardcoded
3. [Regras específicas do projeto]
4. N/A: Snowflake — este projeto não usa Snowflake  ← se aplicável

## Convenções de Código (n8n JS nodes)
- JS puro apenas — sem `require()`, sem `import`
- Acesso multi-item: `$input.all()`
- Sempre `try/catch`; incluir `$node.name` no contexto do erro
- [Regras específicas do projeto]

## Tratamento de Erros
- Falhas → alerta em `#[canal-alertas]` via n8n Error Trigger
- Retry: 3x com backoff de 5 minutos
- [Cenários específicos do projeto]

## Convenções de Branch e Commit
- Branch de trabalho: `workflow/OPEX-{N}-{slug}`
- Nunca commitar direto em `main` ou `dev`
- Commits: `feat:` / `fix:` / `docs:` / `refactor:` / `chore:`
```

---

## .cursorrules template

```
# OE Automations — Cursor Rules
# Projeto: [Nome] ([repo-slug])

## Contexto
[Descrição do projeto em 2-3 frases]
Stack: n8n (JS nodes) + [tools] + GitLab.
[Este projeto NÃO usa Snowflake.  ← se aplicável]

## Nós n8n (JS)
- JS puro apenas — sem require(), sem imports, sem node_modules
- Acesso multi-item: $input.all() | item único: $input.first()
- Sempre try/catch; incluir $node.name no contexto dos erros
- Nunca logar PII

## [Seção por integração — ex: Slack, Linear, Notion]
- [Regras e IDs específicos]

## Segurança
- Credenciais sempre como {{ $env.VAR_NAME }} em expressões n8n
- Nunca sugerir hardcode de tokens ou secrets

## Localização de Arquivos
- Código de nós n8n → n8n/nodes/{nome}.js
- Exports de workflow → n8n/workflows/*.json
- Diagramas de fluxo → docs/workflows/

## Convenções de Commit
- feat: / fix: / docs: / refactor: / chore:
- Branch de trabalho: workflow/OPEX-{N}-{slug}
- Nunca commitar direto em main ou dev
```

---

## Initialization Checklist

- [ ] Criar repo no Git hosting da equipe: `<org>/<team>/{nome}`
- [ ] Criar branch `dev` e definir como branch padrão no GitLab
- [ ] Proteger `main`: push bloqueado para todos, merge apenas via MR por Maintainers
- [ ] Proteger `dev`: push bloqueado para todos, merge apenas via MR por Developers
- [ ] Copiar estrutura de pastas padrão
- [ ] Preencher `README.md`, `CLAUDE.md` e `PRD.md`
- [ ] Configurar `.env` a partir do `.env.example`
- [ ] Adicionar `.gitignore` antes do primeiro commit
- [ ] Primeiro commit: `chore: project scaffold`
- [ ] Criar branch de trabalho: `workflow/OPEX-{N}-{slug}`
