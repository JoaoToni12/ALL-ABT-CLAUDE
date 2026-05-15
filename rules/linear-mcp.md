---
description: Linear MCP usage rules — save_* naming, Priority field mapping, escape pitfall, teamId discipline.
globs: ["**/*"]
---

# Linear MCP — Regras de Uso

Servidor oficial: `https://mcp.linear.app/mcp`. As ferramentas `mcp__linear__save_*` são consolidação idempotente — presença de `id` decide create vs update.

## Naming canônico (NÃO usar `create_*`)

Os endpoints `create_issue`, `create_milestone`, `create_project` foram deprecados em favor de `save_*`. Comunidade ainda expõe os antigos, mas no servidor oficial use:

- `mcp__linear__save_issue` (cria se `id` ausente)
- `mcp__linear__save_milestone`
- `mcp__linear__save_project`
- `mcp__linear__save_comment`
- `mcp__linear__save_document`
- `mcp__linear__save_initiative`
- `mcp__linear__save_status_update`

`create_issue_label` ainda existe e segue o nome legado — não há `save_issue_label`.

## Pitfall: literal `\n` em descrições / comentários

Bug documentado em [anthropics/claude-code#31639](https://github.com/anthropics/claude-code/issues/31639). Failure mode: Claude double-encode newlines, o servidor armazena `\\n` literal no markdown, e o issue/comentário renderiza como uma linha só.

**Regra**: ao passar `description`, `body`, ou `content` para qualquer Linear save, **usar quebra de linha real (LF/`\n` interpretado)**, nunca a string de dois chars `\\n`. Especialmente arriscado em:
- Python heredocs com `\\n` (substituir por `\n` literal ou usar `"""..."""`)
- Construção de JSON manual em `Bash(echo)` (sempre passar via Write tool ou here-doc com aspas simples)
- Concatenação de strings que já têm escape

Verificação rápida após save: chamar `mcp__linear__get_issue(id)` e ver se o campo renderiza com quebras de linha. Se aparecer "\\n" no texto, o issue precisa ser re-saved.

## Priority field mapping

Linear `priority` é numérico:

| Valor | Label Linear |
|---|---|
| 0 | No priority |
| 1 | Urgent |
| 2 | High |
| 3 | Medium (Normal) |
| 4 | Low |

Para rituais de priorização (A-RICE, RICE, ICE, MoSCoW), mapear o score final para esta escala — não inventar mapping novo. Issues sem priority explícito ficam em 0.

## `teamId` é mandatório

Sempre passar `teamId` explícito em `save_issue`. Se omitir, Linear pode rotear para o team default da API key (que pode não ser o que você quer, especialmente em workspaces multi-team).

Antes de qualquer issue novo:
```
mcp__linear__list_teams  → confirmar o teamId
mcp__linear__save_issue { teamId: "<id>", title, description, priority, ... }
```

## Bulk updates

Não existe `save_issues` em batch. Para >10 issues, disparar `save_issue` em paralelo (multiple tool_use blocks numa única mensagem do assistant) — rate-limit do Linear é generoso.

## Listing vs Saving

- `list_*` = read, sem efeito colateral, sempre seguro.
- `get_*` = read específico por id.
- `save_*` = write (create OR update — checagem por id).
- `delete_*` = irreversível, escalado para confirmação pelo `pre-mcp-destructive.js`.

## Por que essa regra existe

**Why:** Linear é daily-use em automações (sync de status, criação de issues a partir de PRDs, priorização de backlog); o pitfall `\n` apareceu em sessões reais e o naming `create_*` vs `save_*` ainda está em transição. Sem regra, fácil cometer o mesmo erro repetido.

**How to apply:** Em qualquer save com texto multi-linha, conferir o render após save. Em qualquer save novo, passar `teamId` explícito. Não usar `create_issue` / `create_milestone` — esses são stale.
