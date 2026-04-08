---
name: prd-writer
description: Write a CoE PRD on Notion for an automation. Use when the user wants to
  create a PRD (Product Requirements Document), run a PRD elaboration interview, fill
  in the CoE PRD template, or create a PRD page on Notion inside automacoes_master.
  Trigger on /prd-writer or when asked to "escrever o PRD" for an automation.
---

# PRD Writer — CoE Standard

Transforma um simplified PRD existente em um PRD completo e buildável no Notion, via entrevista de elaboração no terminal.

---

## Overview

**Input:** URL ou nome de uma automação no `automacoes_master` (já tem simplified PRD na página)
**Process:** Lê o simplified PRD → entrevista de gaps → cria subpage PRD no Notion
**Output:** Página `PRD - [Nome]` criada como subpage da entrada no `automacoes_master`

**Key resources:**
- [INTERVIEW.md](INTERVIEW.md) — Guia de elaboração com rounds A-F
- [PRD_TEMPLATE.md](PRD_TEMPLATE.md) — Template 9 seções do CoE

---

## Phase 1 — Read Simplified PRD from Notion

### Step 1.1: Get the target page
Ask the user:
> "Qual é a URL ou nome da automação no automacoes_master para este PRD?"

If no URL is given, use `mcp__notion__notion-search` to find the page:
```
notion-search: { query: "[automation name]" }
```
Confirm the result is a page inside `automacoes_master` (database ID: `2ff4457c-7167-80ed-af89-d5589e336633`).

### Step 1.2: Fetch and extract
```
notion-fetch: { id: "[page URL or ID]" }
```

Extract what's already defined. Look for:
- **Nome da Automação** (page title or property)
- **Problema Atual / Dor** — described or implied
- **Objetivo** — what the automation does
- **Trigger / Frequência** — how/when it runs
- **Integrações** — systems mentioned (Slack, Snowflake, APIs)
- **Métricas** — hours saved, cost avoided, SLA
- **Dependências** — blockers mentioned
- **Solicitante / Área**

### Step 1.3: Present summary to user
Output a brief summary:
```
📋 Simplified PRD lido. Aqui está o que já temos:

✅ Definido: [list items already clear]
⚠️  Precisa elaborar: [list gaps/decisions needed]

Vou fazer perguntas focadas nos gaps. Pode responder livremente — não precisa ser formal.
```

---

## Phase 2 — Elaboration Interview

Follow [INTERVIEW.md](INTERVIEW.md) for the full guide.

### Key principles:
1. **Skip what's already answered** — never re-ask information clearly stated in the simplified PRD
2. **Offer options** — always present 2-4 concrete choices via `AskUserQuestion`, let the user pick or type "outro"
3. **Group by topic** — max 3-4 questions per `AskUserQuestion` round
4. **Cover all 6 rounds** (A-F), but skip individual questions that are already answered
5. **Sections 7, 8, 9** — use CoE standard defaults, no interview needed

### Typical interview flow (adapt based on gaps):
- **Round A** — Contexto: volume numbers, risk of inaction
- **Round B** — Objetivo: one-sentence description, concrete output, metrics
- **Round C** — Arquitetura: trigger, data flow, Snowflake views, tools
- **Round D** — Dependências: APIs, views to create, approvals needed
- **Round E** — Segurança: PII handling, LLM usage (only if relevant)
- **Round F** — Erros: alert channel, retry policy, known failure scenarios

---

## Phase 3 — Create Notion PRD Page

### Step 3.1: Compose the PRD
Using [PRD_TEMPLATE.md](PRD_TEMPLATE.md) as the base structure, populate all 9 sections:
- **Sections 1-6:** merge data from simplified PRD (Phase 1) + interview answers (Phase 2)
- **Sections 7, 8, 9:** use standard CoE template defaults verbatim — do NOT customize

For Section 4 (Dependencies), build a table with one row per dependency identified.
For Section 5 (Security), mark checkboxes based on interview answers — checked if confirmed compliant, unchecked if to be resolved.

### Step 3.2: Create the Notion subpage
```
notion-create-pages: {
  parent: "[automation entry page ID from Phase 1]",
  title: "PRD - [Nome da Automação]",
  content: "[full 9-section PRD in Notion Enhanced Markdown]"
}
```

**Title convention:** Always `PRD - [Nome da Automação]`
**Parent:** The automation entry page in `automacoes_master` (NOT the database root)

> **IMPORTANTE:** Nunca edite ou modifique a página do Simplified PRD existente no `automacoes_master`. Apenas crie a subpage do PRD final. A página de origem é somente leitura neste processo.

### Step 3.3: Confirm to user
```
✅ PRD criado com sucesso!
🔗 [page URL]

Próximos passos:
1. Revise o PRD no Notion e ajuste detalhes se necessário
2. Compartilhe com o solicitante para validar a Seção 7 (Critérios de Aceite)
3. Quando o build iniciar, use o PRD como contexto para o Claude Code
```

---

## Reference: Notion Resources

| Resource | ID / URL |
|---|---|
| `automacoes_master` database | `2ff4457c-7167-80ed-af89-d5589e336633` |
| PRD template page | `30d4457c7167819d9890c284886531e2` |
| Existing PRD example | `3124457c-7167-807c-9e4f-daa09d6dc397` |

## Reference: Notion MCP Tools

| Tool | When to use |
|---|---|
| `mcp__notion__notion-search` | Find automation page by name |
| `mcp__notion__notion-fetch` | Read page content (simplified PRD) |
| `mcp__notion__notion-create-pages` | Create the PRD subpage |
