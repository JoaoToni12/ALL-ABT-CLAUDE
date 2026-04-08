---
description: Snowflake session management and query safety rules for Python code
globs: ["**/*.py"]
---

# Snowflake via Python — Regras de Uso

Ao escrever ou executar código Python que acessa Snowflake:

## Autenticação
- **Uma tentativa só.** Nunca fazer retry automático de login — conta pode ser bloqueada (locked) após falhas repetidas.
- Sempre usar `try/except` com `raise SystemExit(1)` em caso de falha de auth, sem relançar para o caller.

## Consumo de Warehouse
- Sempre incluir `LIMIT` nas queries exploratórias — padrão máximo `LIMIT 1000` salvo instrução explícita.
- Preferir `COUNT(*)` antes de fazer `SELECT *` em tabelas desconhecidas.
- Fechar a sessão (`session.close()`) assim que terminar — nunca deixar sessão aberta desnecessariamente.
- Não criar múltiplas sessões simultâneas.
- Usar `max_connection_pool=1` no `Session.builder`.

## Queries Eficientes
- Sempre filtrar por partição/cluster quando disponível (ex: colunas de data de partição, timestamps de ingestão).
- Evitar `SELECT *` em produção — listar colunas explicitamente.
- Evitar subqueries correlacionadas desnecessárias — preferir CTEs ou JOINs.
- Não rodar a mesma query mais de uma vez na mesma sessão sem necessidade — cachear resultado em variável/DataFrame.

## Rate Limit
- Não disparar múltiplas queries em paralelo (threads/asyncio) sem necessidade explícita.
- Entre execuções de scripts, aguardar confirmação do usuário antes de rodar novamente.
- Se receber erro `390100` (locked) ou `250001` (auth fail): parar imediatamente, não tentar de novo.
