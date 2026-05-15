---
name: n8n-execution-debug
description: Debug a failing n8n workflow execution — covers webhook 404 after restart, stale execution IDs, PII in contextSummary, date-window bugs, Slack 403/auth. Use when a workflow is failing, returning 404, posting nothing to Slack/Notion/Linear, or showing wrong dates. Trigger on /debug-execution, "debugar execução n8n", "workflow tá falhando", "webhook 404", "nada chegou no Slack", "execution falhou".
allowed-tools: Read, Glob, Grep, Bash, mcp__n8n-mcp__n8n_get_workflow, mcp__n8n-mcp__n8n_validate_workflow, mcp__n8n-mcp__n8n_executions, mcp__n8n-mcp__n8n_list_workflows, mcp__n8n-mcp__n8n_workflow_versions, mcp__notion__notion-fetch, mcp__notion__notion-search, mcp__linear__get_issue, mcp__linear__list_comments
---

# n8n Execution Debug

Codifica gotchas de `rules/debugging.md` num skill invocável. Antes de propor fix, **sempre** confirmar root cause via execution data.

## Quando invocar

- "Workflow X tá falhando"
- "Webhook não responde" / "404"
- "Nada chegou no Slack/Notion/Linear"
- "Execução com erro"
- `/debug-execution`

## Quando NÃO invocar

- Bug de código novo (workflow ainda não rodou) → usar `verify-workflow` skill
- Falha de credencial → escalar para usuário diretamente (não tem nada pra debugar via execution)

## Protocolo

### 1. Diagnóstico — coletar evidência primeiro

**Não propor fix antes de ter pelo menos uma destas:**
- Execution ID falhando (com erro real)
- Logs do Slack app (se 403)
- Resposta HTTP real (curl no webhook)
- Schema atual da tabela Snowflake (se erro de column)

```
mcp__n8n-mcp__n8n_executions(workflowId, limit=20, status="error")
# pegar execution_id de uma falha recente
mcp__n8n-mcp__n8n_get_workflow(workflowId, mode="full")
```

### 2. Hipóteses ranqueadas (não codar nada até user confirmar qual aplica)

#### Hipótese A: Webhook 404 com workflow `active: true`

**Sintoma:** Slack/Linear retorna "app não respondeu" ou 404. Zero execuções no histórico recentes.

**Causa:** Após restart do n8n (deploy, update, reboot infra), webhooks somem do registro em memória mas workflow continua `active: true` no banco.

**Fix:** Desativar e reativar o workflow (toggle off/on). Verificar **todos** os workflows com webhook após qualquer restart conhecido.

**Confirmar antes de aplicar:** `n8n_list_workflows()` mostra `active: true` mas execution history vazio? → Hipótese A.

#### Hipótese B: Date logic bug (Segunda-feira)

**Sintoma:** Workflow scheduled-trigger retorna dados da semana anterior em vez da atual; só falha às segundas-feiras.

**Causa:** Janela de 7 dias com `now() - INTERVAL '7 day'` em segunda-feira de manhã pega `domingo - sábado` da semana passada.

**Fix:** Usar `date_trunc('week', now())` ou ancorar em `weekday`.

**Confirmar:** O bug só apareceu na segunda? Logs mostram timestamps da semana anterior? → Hipótese B.

#### Hipótese C: PII em campo inocente

**Sintoma:** Execução completa mas auditoria interna encontra CPF/email em `contextSummary`, `reasoning_final`, ou outro campo livre exportado para Snowflake.

**Causa:** Node que constrói summary recebe `$json` cru e concatena.

**Fix:** Inserir node de redaction entre source e summary; usar regex de `rules/pii-handling.md`.

**Confirmar:** Query Snowflake na tabela de audit do n8n revela campos com CPF? → Hipótese C.

#### Hipótese D: Schema drift — coluna renomeada

**Sintoma:** Erro `NoSuchColumn` ou retorna NULL em produção mas dev tava ok.

**Causa:** View do warehouse renomeou coluna (`OLD_COL` virou `NEW_COL`) e o workflow não foi atualizado.

**Fix:** `DESCRIBE VIEW <name>` → atualizar nome no node + re-deploy.

**Confirmar:** Schema da view tem nome diferente do esperado? → Hipótese D.

#### Hipótese E: Stale execution ID / wrong workflow

**Sintoma:** Você "debuga" execução mas as mudanças não fazem efeito; user diz "ainda tá falhando".

**Causa:** Você está olhando execução antiga; o workflow ativo é outro arquivo/ID.

**Fix:** Confirmar via `n8nac list` ou `n8n_get_workflow(activeId)` qual é o ID realmente em produção. Pegar execution mais recente.

**Confirmar:** Execution ID timestamp é > 1 hora atrás? → Re-fetch.

#### Hipótese F: Slack 403 / app reinstalled

**Sintoma:** Slack node retorna 403; user diz "Slack tá quebrado".

**Causa:** Quase sempre é mismatch entre webhook path/ID e Slack app interactivity URL — não credencial.

**Fix:** Conferir Slack app config (Event Subscriptions, Interactivity & Shortcuts URL) bate com path do webhook. Não trocar credencial antes de confirmar isso.

**Confirmar:** Slack app dashboard mostra URL do webhook correta? → Caso contrário, Hipótese F.

### 3. Apresentar hipóteses ao user

```
Encontrei N execuções falhando. 3 hipóteses por ordem de probabilidade:

1. Hipótese A (webhook 404 após restart): evidência X, Y, Z. Fix: toggle off/on.
2. Hipótese D (schema drift): evidência ... Fix: re-fetch schema.
3. Hipótese B (date bug): só relevante se hoje for segunda.

Qual confirma?
```

**Aguardar resposta do usuário antes de aplicar qualquer fix.**

### 4. Aplicar fix com verificação

Após user confirmar a hipótese:
1. Aplicar mudança mínima (não refatorar nada além)
2. Trigger workflow de novo (se possível com `n8n_test_workflow`)
3. Re-verificar via `n8n_executions(limit=5)` que a nova execução passou
4. Reportar evidência: "Execução XYZ rodou com sucesso após fix"

## Regras críticas

- **Nunca trocar credenciais ao debugar.** Confirmar a falha real primeiro.
- **Se 2 tentativas de fix não funcionarem, STOP** e revisitar hipóteses, não continuar variando.
- **Nunca afirmar números/contagens** sem ter buscado da fonte real nesta sessão.
- **Se user corrigir o diagnóstico, abandonar a hipótese anterior** — não tentar reconciliar.

## Referências

- `rules/debugging.md` (regras canônicas)
- `rules/pii-handling.md` (Hipótese C)
- `rules/snowflake-python.md` (Hipótese D)
- `rules/n8n-mcp-editing.md` (re-fetch após updates)
