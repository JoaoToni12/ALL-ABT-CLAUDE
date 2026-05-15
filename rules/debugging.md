---
description: Root cause verification and common misdiagnosis patterns
globs: ["**/*"]
---

# Debugging Guidelines

## Processo obrigatório antes de propor qualquer fix

1. **Verificar root cause antes de propor fix.** Checar execution data (`n8n_executions`), logs de erro, ou respostas HTTP reais — citar a mensagem de erro específica. Não adivinhar.
2. **Nunca implementar um fix sem confirmação explícita do usuário.** Quando múltiplas hipóteses existirem: listar com evidências, ordenar por probabilidade, e **aguardar o usuário confirmar qual é a correta antes de codar qualquer coisa**.
3. **Nunca afirmar números, contagens ou percentuais sem tê-los buscado da fonte de verdade nesta sessão.** Se não tiver certeza de um número, consultar Snowflake, n8n execution logs, ou os arquivos reais — nunca estimar ou recordar de sessões anteriores.
4. Se o usuário corrigir um diagnóstico, **abandonar completamente a hipótese anterior** — não tentar reconciliar com a nova.

## Misdiagnoses comuns

- 429 rate limits reportados como sucesso
- empty string vs NULL
- IDs stale de execuções anteriores
- Nomes de coluna divergentes entre SQL views e JS nodes
- Segunda-feira: janela de 7 dias pode capturar semana anterior inesperadamente (date logic bugs)
- PII vazando através de campos "inocentes" como `contextSummary` ou `reasoning_final`

## n8n webhook 404 com workflow ativo

Após restart do n8n (deploy, update, reboot de infra), webhooks somem do registro em memória mas o workflow continua `active: true` no banco. Sintoma: Slack/Linear retorna "app não respondeu" ou 404, zero execuções no histórico. Fix: desativar e reativar o workflow (toggle off/on). Verificar **todos** os workflows com webhook após qualquer restart conhecido.
