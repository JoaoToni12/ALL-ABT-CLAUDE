---
name: linear-issue-create
description: Create a Linear issue from a PRD, brief, or quick request — scaffolds title, description, priority (A-RICE compatible), labels, teamId, and sub-issues. Use when user wants to create a Linear ticket, sub-issue, ou bug report. Trigger on /linear-issue-create, "criar issue no Linear", "abrir ticket", "novo issue", "criar sub-issue".
allowed-tools: Read, Glob, Grep, mcp__linear__list_teams, mcp__linear__list_issue_statuses, mcp__linear__list_issue_labels, mcp__linear__list_projects, mcp__linear__save_issue, mcp__linear__get_issue, mcp__linear__create_issue_label
---

# Linear Issue Create

Wrapper que codifica as regras de `rules/linear-mcp.md` para criação de issues novos.

## Quando invocar

- "Criar issue / ticket no Linear"
- "Abrir bug" / "abrir tarefa"
- "Sub-issue de XYZ"
- "Criar issue a partir desse PRD"
- `/linear-issue-create`

## Quando NÃO invocar

- Atualizar issue existente → usar `mcp__linear__save_issue` direto com `id`
- Bulk import → outro flow
- Priorização de backlog em batch → usar skill dedicada de priorização (A-RICE/RICE), se houver

## Protocolo

### 1. Coletar inputs

Perguntar (uma pergunta por vez, 4 max via AskUserQuestion):

1. **Team** — qual team Linear? Default sugerido: o team mais recente do projeto atual. Se ambíguo, listar teams com `mcp__linear__list_teams` e perguntar.
2. **Tipo** — feature / bug / task / sub-issue (se sub, qual parent).
3. **Título** — uma linha clara, imperativa ("Adicionar filtro de status no dashboard", não "Bug no dashboard").
4. **Descrição** — multi-linha, formato:
   ```
   ## Contexto
   ...
   ## O que fazer
   ...
   ## Critério de aceite
   - [ ] ...
   ```

### 2. Priority (A-RICE compatible)

Mapping numérico de `rules/linear-mcp.md`:

| Linear value | Label | Quando usar |
|---|---|---|
| 0 | No priority | Sem prioridade clara — não usar para issue novo |
| 1 | Urgent | Bug crítico em produção, blocker hoje |
| 2 | High | Feature/bug com SLA esta semana |
| 3 | Medium | Padrão para feature work |
| 4 | Low | Ideia, nice-to-have |

Default: `3` (Medium) se não especificado.

Se o usuário está rodando um framework de priorização (A-RICE, RICE, ICE), o mapping já vem pronto — usar o número que o framework indicar.

### 3. Labels e milestones

- Labels: listar disponíveis com `mcp__linear__list_issue_labels(teamId)`, escolher os relevantes. Não inventar labels novos sem perguntar.
- Project: se pertencer a um project, anexar `projectId` via `mcp__linear__list_projects(teamId)`.
- Milestone: anexar via `mcp__linear__list_milestones(projectId)` se aplicável.

### 4. Criar

```
mcp__linear__save_issue({
  teamId: "<team>",
  title: "<title>",
  description: "<markdown>",   // ATENÇÃO: use \n real, não \\n. Ver rules/linear-mcp.md
  priority: <0-4>,
  labelIds: [...],
  projectId: "<opcional>",
  parentId: "<opcional para sub-issue>",
  // Sem id = create. Com id = update.
})
```

### 5. Verificar

Após save, **sempre** `mcp__linear__get_issue(id)` e:
- Conferir que a descrição renderiza com quebras de linha (pitfall `\n`).
- Confirmar priority, labels, project.
- Mostrar URL final ao usuário.

## PII discipline

Antes do save:
- Scan título + descrição → não deve conter CPF, nome, telefone, email.
- Se a investigação é sobre caso específico, usar `tx_id`/`customer_id`.
- O hook `pre-mcp-pii-warn.js` escala para confirmação quando detecta.

## Erros comuns

| Erro | Fix |
|---|---|
| `teamId required` | Sempre passar teamId explícito |
| Descrição em uma linha só | Pitfall `\n` — re-save com LF real |
| Labels não existem | Listar com `list_issue_labels(teamId)` antes |
| Priority 0 em issue novo | Forçar default 3 |
| Issue criado em team errado | Confirmar teamId no save (não confiar em default) |

## Referências

- `rules/linear-mcp.md` (regras de uso da MCP)
- `rules/pii-handling.md` (PII em descrições)
- Skill de priorização em batch (A-RICE/RICE), se o projeto tiver uma
