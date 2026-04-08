---
name: cost-report
description: Generate an API cost report for n8n workflows — actual usage vs budget caps. Uses n8n executions + Snowflake audit tables. Use when asked for "cost report", "relatorio de custo", "budget vs actual", "quanto gastamos", or when reviewing FinOps guardrail effectiveness.
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Agent, mcp__n8n-mcp__n8n_executions, mcp__n8n-mcp__n8n_list_workflows, mcp__n8n-mcp__n8n_get_workflow
---

# /cost-report — API Cost Report

Generates a cost report comparing actual API call volumes against budget caps defined in guardrail nodes.

## Syntax

`/cost-report` — Full report for all monitored workflows (last 7 days)
`/cost-report <workflowId>` — Report for a specific workflow
`/cost-report --period <days>` — Custom period (default: 7)
`/cost-report --snowflake` — Include Snowflake query generation for detailed audit

## Cost Report Protocol

### Step 1: Identify Monitored Workflows

Use the known workflow registry from CLAUDE.md:

**Fraude (external API costs):**

| Workflow | ID | APIs | Unit Cost Estimate |
|---|---|---|---|
| PLD & CR Consultas Externas | 1A8ldEA0cXekTnfr | CAF, BDC | CAF ~R$0.50/call, BDC ~R$0.30/call |
| Recusados AntiFraude NRT | ggjEii4WRELQJJ3s | CAF, BDC | CAF ~R$0.50, BDC ~R$0.30 |
| Caf Resolucao 6 V2 | gO9ML1oVsdLAepiN | CAF | CAF ~R$0.50/call |
| Consulta Renda BDC V2 | 5F70JgLOfmG91TKK | BDC | BDC ~R$0.30/call |
| Consulta Processos CPF BDC V2 | vF2PhInvfiewTrHJ | BDC | BDC ~R$0.30/call |
| QI Tech Investigation | Y0o9jsCDdGUq40sN | QI Tech | QI Tech ~R$0.10/call |
| IA Anti Fraude Juiza V3 | gEe6VL3CCMSmpkDF | OpenAI | GPT ~R$0.05/call |
| Avaliacao de Infracoes V3 | zG1FFc171aHuRjxq | CAF | CAF ~R$0.50/call |

**FinOps (LLM costs):**

| Workflow | ID | APIs | Unit Cost Estimate |
|---|---|---|---|
| Faturamento Unico | OcTYYqo7Xt3g2DlM | Gemini | ~R$0.02/call |
| Faturamento BDC | ki0ar3xZl99DSEgB | Gemini | ~R$0.02/call |
| Faturamento Klubi | j3HU47G3sNKLcSV5 | Gemini | ~R$0.02/call |
| Faturamento Pismo | xhVQMwfvgxI25rsL | Gemini | ~R$0.02/call |

> **NOTE**: Unit costs are estimates. Update when actual pricing data is available.
> Ask user for corrections on first run: "Estes custos unitarios estao corretos?"

### Step 2: Collect Execution Data from n8n

For each workflow, call:
```
n8n_executions(workflowId=ID, limit=100)
```

Extract per workflow:
- **Total executions** in the period
- **Successful executions** (status: "success")
- **Failed executions** (status: "error")
- **Average items processed** per execution (from execution data if available)
- **Total estimated API calls** = successful executions x avg items per execution

> **Truncation warning**: If total executions returned equals the `limit` parameter, warn the user that results may be truncated and the cost estimate is a **floor**, not a ceiling. Increase limit or paginate.

### Step 3: Extract Budget Caps from Guardrail Nodes

For each Fraude workflow, fetch the workflow and find:
- **Volume Gate** node: extract the threshold value (max items per execution)
- **Budget Cap** node: extract the daily/monthly cap (from Snowflake query in the node)

If guardrail nodes are not yet deployed, mark as "NO CAP" in the report.

### Step 4: Generate Snowflake Query (optional, with --snowflake)

If the user requests detailed audit data, generate a Python script:

```python
# cost_report.py — Run with: python3 cost_report.py
# Requires: snowflake-connector-python, active Snowflake session

from datetime import datetime, timedelta
import json

PERIOD_DAYS = {period}
START_DATE = (datetime.now() - timedelta(days=PERIOD_DAYS)).strftime('%Y-%m-%d')

QUERIES = {{
    "CAF Calls": f"""
        SELECT COUNT(*) as total_calls,
               COUNT(DISTINCT CPF) as unique_cpfs,
               MIN(DT_EXECUCAO) as first_call,
               MAX(DT_EXECUCAO) as last_call
        FROM NGCASH.SQUAD_RISK.MAT_RESOLUCAO6_CONSULTAS_N8N
        WHERE DT_EXECUCAO >= '{{START_DATE}}'
    """,
    "BDC Renda Calls": f"""
        SELECT COUNT(*) as total_calls,
               COUNT(DISTINCT CPF) as unique_cpfs
        FROM NGCASH.SQUAD_RISK.MAT_BDC_RENDA
        WHERE DATA_INGESTAO >= '{{START_DATE}}'
    """,
    "BDC Lawsuits Calls": f"""
        SELECT COUNT(*) as total_calls,
               COUNT(DISTINCT CPF) as unique_cpfs
        FROM NGCASH.SQUAD_RISK.MAT_BDC_LAWSUITS
        WHERE DATA_INGESTAO >= '{{START_DATE}}'
    """,
    "Automation Runs": f"""
        SELECT FLUXO_AUTOMACAO,
               COUNT(*) as total_runs,
               SUM(CASE WHEN STATUS = 'SUCCESS' THEN 1 ELSE 0 END) as success,
               SUM(CASE WHEN STATUS = 'ERROR' THEN 1 ELSE 0 END) as errors
        FROM NGCASH.SQUAD_RISK.N8N_AUTOMATION_RUNS_HISTORY
        WHERE DT_EXECUCAO >= '{{START_DATE}}'
        GROUP BY FLUXO_AUTOMACAO
        ORDER BY total_runs DESC
    """
}}

print("Generated queries — connect to Snowflake and run each:")
for name, query in QUERIES.items():
    print(f"\\n--- {{name}} ---")
    print(query)
```

Write the script to a temp directory (e.g., `$TMPDIR/cost_report.py` or system temp) and inform the user.

### Step 5: Compile Cost Report

```
COST REPORT — Period: <start> to <end> (<N> days)
===================================================

FRAUDE WORKFLOWS
┌────────────────────────┬───────┬─────────┬──────────┬──────────┬───────────┐
│ Workflow               │ Execs │ Success │ Est.Calls│ Budget   │ Est.Cost  │
├────────────────────────┼───────┼─────────┼──────────┼──────────┼───────────┤
│ PLD & CR               │  NNN  │   NNN   │   NNN    │ NNN/day  │ R$ NNN.NN │
│ Recusados AntiFraude   │  NNN  │   NNN   │   NNN    │ NNN/day  │ R$ NNN.NN │
│ CAF Resolucao 6        │  NNN  │   NNN   │   NNN    │ NNN/day  │ R$ NNN.NN │
│ ...                    │       │         │          │          │           │
├────────────────────────┼───────┼─────────┼──────────┼──────────┼───────────┤
│ SUBTOTAL FRAUDE        │       │         │          │          │ R$ NNN.NN │
└────────────────────────┴───────┴─────────┴──────────┴──────────┴───────────┘

FINOPS WORKFLOWS (LLM)
┌────────────────────────┬───────┬─────────┬──────────┬───────────┐
│ Workflow               │ Execs │ Success │ Est.Calls│ Est.Cost  │
├────────────────────────┼───────┼─────────┼──────────┼───────────┤
│ Faturamento Unico      │  NNN  │   NNN   │   NNN    │ R$ NNN.NN │
│ ...                    │       │         │          │           │
├────────────────────────┼───────┼─────────┼──────────┼───────────┤
│ SUBTOTAL FINOPS        │       │         │          │ R$ NNN.NN │
└────────────────────────┴───────┴─────────┴──────────┴───────────┘

TOTAL ESTIMATED COST: R$ NNN.NN
BUDGET UTILIZATION:   NN% of monthly cap

GUARDRAIL EFFECTIVENESS
- Volume gates triggered: N times
- Budget caps triggered: N times
- Circuit breakers triggered: N times
- Anomaly alerts sent: N

HEALTH INDICATORS
[OK/WARN/CRIT] Error rate: N% (threshold: 5%)
[OK/WARN/CRIT] Budget utilization: N% (threshold: 80%)
[OK/WARN/CRIT] Duplicate call ratio: N% (threshold: 2%)
```

### Step 6: Recommendations

Based on the data, generate actionable recommendations:
- If any workflow exceeds 80% of budget: warn
- If error rate > 5%: flag for investigation
- If volume is consistently <50% of gate: suggest lowering gate threshold
- If a guardrail has never triggered: verify it's properly configured
- Compare against the March 2026 incident (R$8k CAF overspend) as baseline

## Rules

- **Unit costs are estimates** — always caveat this in the report
- **n8n executions API** has limits (max ~250 per call) — batch if needed
- **Snowflake queries** are generated but NOT executed — user runs them manually (Snowflake session rules)
- **FLUXO_AUTOMACAO** in N8N_AUTOMATION_RUNS_HISTORY maps to workflow names, not IDs
- **Never cache execution counts** across sessions — always query fresh data
- For first-time runs, ask user to confirm/correct unit cost estimates
- **Windows path encoding**: if script write fails due to special characters in the user's home path, use the system temp directory or pass path via variable

Report scope: $ARGUMENTS
