---
description: Root cause verification and common misdiagnosis patterns
globs: ["**/*"]
---

# Debugging Guidelines

- **Verificar root cause antes de propor fix.** Checar execution data (`n8n_executions`), logs de erro, ou respostas HTTP reais — citar a mensagem de erro específica. Não adivinhar.
- Quando múltiplas hipóteses existirem, listar e verificar a mais provável primeiro.
- Misdiagnoses comuns: 429 rate limits reportados como sucesso, empty string vs NULL, IDs stale de execuções anteriores, nomes de coluna divergentes entre SQL views e JS nodes.
