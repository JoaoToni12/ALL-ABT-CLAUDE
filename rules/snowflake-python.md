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

## Sintaxes SQL que o Snowflake não suporta (ou tem pegadinhas)

- **ALTER TABLE com múltiplas colunas é suportado desde 2024.** `ALTER TABLE t ADD COLUMN a STRING, b INT` funciona. Em versões muito antigas do conector ou em compatibility mode antigo, pode falhar — fallback é um `ALTER TABLE` por coluna.
- **VIEWs rejeitam certos padrões de subquery aninhada.** Sempre testar a query como `SELECT` standalone antes de envolver em `CREATE OR REPLACE VIEW`.
- **QUALIFY requer window function** — não pode usar `QUALIFY ROW_NUMBER() OVER (...)` sem o `ORDER BY` completo dentro do `OVER()`.
- **LISTAGG sem WITHIN GROUP falha** — sempre usar `LISTAGG(col, ',') WITHIN GROUP (ORDER BY col)`.
- **Quando em dúvida sobre sintaxe Snowflake**, escrever a query e testá-la diretamente antes de embeddar em um Code node — nunca assumir que sintaxe PostgreSQL/MySQL equivalente funciona.
