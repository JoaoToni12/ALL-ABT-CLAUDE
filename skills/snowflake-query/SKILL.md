---
name: snowflake-query
description: Run a one-off Snowflake query safely from a Claude session — wraps session/auth/LIMIT/abort-on-fail discipline. Use when you need to run a SELECT against Snowflake interactively, validate a schema, or pull a small sample. Trigger on /snowflake-query, "consultar Snowflake", "rodar query no Snowflake", "consulta no warehouse", "schema de tabela X no Snowflake".
allowed-tools: Read, Write, Bash, Glob, Grep
---

# Snowflake Query — Safe One-Off

Codifica as regras de `rules/snowflake-python.md` num skill invocável. Foco: queries exploratórias / one-off / validation, não batch loads ou ETL.

## Quando invocar

- "Consulta no Snowflake" / "rodar query" / "Snowflake query"
- "Schema da tabela X" / "describe table"
- "Quantas linhas tem Y"
- "Sample de Z" / "amostra de"
- `/snowflake-query`

## Quando NÃO invocar

- ETL / batch load → não usar este skill, usar workflow n8n dedicado
- Múltiplas queries em paralelo → não usar (rule diz não)
- Query que vai consumir warehouse pesado sem LIMIT → exigir confirmação

## Protocolo

### 1. Pré-flight (sempre)

Antes de rodar qualquer query:
- Confirmar que `snowflake-connector-python` está instalado: `python -c "import snowflake.connector"`
- Confirmar que credenciais estão em env vars (`SF_USER`, `SF_PASSWORD`, `SF_ACCOUNT`, `SF_ROLE`, `SF_WAREHOUSE`, `SF_DATABASE`, `SF_SCHEMA`). Nunca hardcode.
- Confirmar que o usuário sabe qual warehouse/role está em uso — printar antes do connect.

### 2. Construir a query

- **Sempre LIMIT** em exploratória. Default: `LIMIT 100` para preview, `LIMIT 1000` se justificado.
- **Listar colunas** explicitamente (não `SELECT *` em prod).
- **Filtrar por partição/timestamp** se a tabela tiver. Snowflake clustering ajuda.
- **CTE > subquery correlacionada** quando possível.

### 3. Executar (script Python padrão)

```python
import os
import sys
import snowflake.connector

try:
    conn = snowflake.connector.connect(
        user=os.environ['SF_USER'],
        password=os.environ['SF_PASSWORD'],
        account=os.environ['SF_ACCOUNT'],
        role=os.environ.get('SF_ROLE'),
        warehouse=os.environ.get('SF_WAREHOUSE'),
        database=os.environ.get('SF_DATABASE'),
        schema=os.environ.get('SF_SCHEMA'),
        # Hard limit: no auto-retry on auth failure
        login_timeout=10,
    )
except snowflake.connector.errors.DatabaseError as e:
    # Codes 250001 (auth) and 390100 (locked) — abort immediately.
    print(f"[ABORT] Snowflake auth failed: {e}", file=sys.stderr)
    raise SystemExit(1)

cur = conn.cursor()
try:
    cur.execute("<YOUR QUERY HERE — must include LIMIT>")
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    # Format / print
finally:
    cur.close()
    conn.close()
```

### 4. PII discipline

Se a query retorna colunas com PII (CPF, telefone, email, nome):
- **Não printar no chat.** Salvar para arquivo local com nome explícito (`scratch/snowflake-pii-out-{ts}.csv`) e referenciar caminho.
- Avisar o usuário no resumo: "Resultado contém PII — salvo em `<path>`, não impresso no terminal."
- Se for só pra contar/agregar, fazer `COUNT(*)` ou `GROUP BY` no servidor — não trazer linhas.

### 5. Pós-query

- Fechar cursor + conexão sempre.
- Aguardar confirmação antes de rodar query nova (rule: não disparar múltiplas).
- Se erro 390100 (locked) ou 250001 (auth fail): **PARAR**, não tentar de novo, alertar o usuário.

## Checklist antes de executar

- [ ] Query tem `LIMIT`?
- [ ] Colunas listadas explicitamente (não `SELECT *`)?
- [ ] Filtro de partição/timestamp se aplicável?
- [ ] Credenciais via env, não hardcode?
- [ ] Saída tem PII? Se sim, plano de redaction definido?
- [ ] Warehouse correto para o volume estimado?

## Erros comuns

| Erro | Causa | Fix |
|---|---|---|
| `250001` | Auth fail | Verificar SF_USER, SF_PASSWORD; **não retry** |
| `390100` | Conta locked | Contatar admin; **não retry** |
| `Statement timeout` | Query pesada sem LIMIT | Adicionar LIMIT + filtros |
| Result com colunas estranhas (`COL1`, `COL2`...) | View renomeou colunas | Conferir `DESCRIBE VIEW` antes |
| `Cannot perform CREATE` | Role sem permissão | Trocar role com `USE ROLE <r>` |

## Referências

- `rules/snowflake-python.md` (regras canônicas)
- [[live-first-verification]] (sempre conferir schema atual antes de assumir)
- [[pii-handling]] (queries com PII)
