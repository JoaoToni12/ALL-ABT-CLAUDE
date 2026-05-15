---
description: Verify state from live sources before reporting status or deciding from external state — never trust stale docs as primary truth
globs: ["**/*"]
---

# Live-First Verification

Antes de reportar status ou tomar decisão baseada em estado externo, **buscar live source primeiro** — não confiar em docs, CHANGELOGs, READMEs, ou Notion como fonte primária. Sinalizar drift explicitamente quando docs divergirem do estado real.

## Por que essa regra existe

Reincidência: status reportado incorretamente baseado em doc desatualizado (ex: CHANGELOG dizia "TBD" quando a feature já estava E2E-validated; workflow JSON local editado quando o workflow ativo estava em outro arquivo). Doc reflete intenção passada; live source reflete realidade atual.

## Ordem de verificação por domínio

| Pergunta | Live source (1º) | Doc (2º, opcional) |
|---|---|---|
| "Esse workflow n8n está deployed?" | `mcp__n8n-mcp__n8n_get_workflow` ou `n8nac list` | README/CHANGELOG no repo |
| "Qual o estado atual desse projeto/feature?" | `git log -n 5`, branch HEAD, último commit | PRD/CHANGELOG/Notion |
| "Qual o status desse ticket?" | `mcp__linear__get_issue` | Notion/repo notes |
| "Qual o schema dessa tabela?" | `DESCRIBE TABLE` no Snowflake | Doc de schema |
| "Esse arquivo é o canônico?" | `mcp__n8n-mcp__n8n_get_workflow` se for workflow; `git status` + `git log` se for código | Filename / convenção |
| "Qual a versão atual desse pacote/dep?" | `package.json` no HEAD + `npm ls` | Doc |

## Como aplicar

1. **Pergunta de status chega** → primeira tool call busca live source, não Read em doc.
2. **Comparar com docs (se relevante)** → se houver divergência, **sinalizar explicitamente** ("CHANGELOG diz X, mas live state mostra Y — usando Y").
3. **Antes de editar workflow n8n** → confirmar com `n8n_get_workflow(mode="full")` ou `n8nac list` que o arquivo local bate com o deployed.
4. **Antes de afirmar números, percentuais, contagens** → buscar do source real (Snowflake/n8n executions/Linear API) nesta sessão. Nunca estimar ou recordar.

## Não se aplica quando

- Pergunta é explicitamente sobre histórico/intenção ("o que o PRD original previa?", "o que o CHANGELOG diz?").
- Live source não existe ainda (ex: planejamento de feature nova).
- Usuário já forneceu o estado atual na mensagem.
