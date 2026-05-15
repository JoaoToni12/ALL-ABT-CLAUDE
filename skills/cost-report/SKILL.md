---
name: cost-report
description: Generate an API cost report for n8n workflows — actual usage vs budget caps. Uses n8n executions + data-warehouse audit tables. Use when asked for "cost report", "relatorio de custo", "budget vs actual", "quanto gastamos", or when reviewing cost-guardrail effectiveness.
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

Build (or load from the project's CLAUDE.md / memory) a registry of the workflows the project tracks for cost. Schema:

```
| Workflow | n8n ID | External APIs | Unit Cost Estimate |
|---|---|---|---|
| <workflow-name> | <16-char id> | <vendor list> | <R$/call estimate per vendor> |
```

Examples of typical categories to capture:
- **External API consumers** (e.g., credit bureau lookups, KYC vendor calls, identity verification) — usually the highest cost-per-call.
- **LLM consumers** (e.g., Gemini/OpenAI for classification, generation, RAG) — moderate per-call, can scale fast.
- **Compute-heavy** (e.g., batch jobs hitting paid APIs in loops) — easy to spike unexpectedly.

> **NOTE**: Unit costs are estimates. The skill should ask the user for corrections on first run: "Estes custos unitarios estao corretos?"
> Maintain the registry in the project's CLAUDE.md or `.claude/skills/<project>-context/SKILL.md` for reuse.

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

For each tracked workflow, fetch the workflow and find:
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
    # Example: external API call audit — adapt to your project's audit tables.
    "External API Calls": f"""
        SELECT COUNT(*) as total_calls,
               COUNT(DISTINCT IDENTIFIER) as unique_targets,
               MIN(EXECUTED_AT) as first_call,
               MAX(EXECUTED_AT) as last_call
        FROM {{YOUR_DATABASE}}.{{YOUR_SCHEMA}}.{{YOUR_API_AUDIT_TABLE}}
        WHERE EXECUTED_AT >= '{{START_DATE}}'
    """,
    "Automation Runs": f"""
        SELECT WORKFLOW_NAME,
               COUNT(*) as total_runs,
               SUM(CASE WHEN STATUS = 'SUCCESS' THEN 1 ELSE 0 END) as success,
               SUM(CASE WHEN STATUS = 'ERROR' THEN 1 ELSE 0 END) as errors
        FROM {{YOUR_DATABASE}}.{{YOUR_SCHEMA}}.{{YOUR_RUNS_TABLE}}
        WHERE EXECUTED_AT >= '{{START_DATE}}'
        GROUP BY WORKFLOW_NAME
        ORDER BY total_runs DESC
    """
    # Add more queries per cost dimension your project tracks.
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

EXTERNAL API WORKFLOWS
┌────────────────────────┬───────┬─────────┬──────────┬──────────┬───────────┐
│ Workflow               │ Execs │ Success │ Est.Calls│ Budget   │ Est.Cost  │
├────────────────────────┼───────┼─────────┼──────────┼──────────┼───────────┤
│ <workflow A>           │  NNN  │   NNN   │   NNN    │ NNN/day  │ R$ NNN.NN │
│ <workflow B>           │  NNN  │   NNN   │   NNN    │ NNN/day  │ R$ NNN.NN │
│ ...                    │       │         │          │          │           │
├────────────────────────┼───────┼─────────┼──────────┼──────────┼───────────┤
│ SUBTOTAL EXTERNAL APIs │       │         │          │          │ R$ NNN.NN │
└────────────────────────┴───────┴─────────┴──────────┴──────────┴───────────┘

LLM WORKFLOWS
┌────────────────────────┬───────┬─────────┬──────────┬───────────┐
│ Workflow               │ Execs │ Success │ Est.Calls│ Est.Cost  │
├────────────────────────┼───────┼─────────┼──────────┼───────────┤
│ <llm workflow>         │  NNN  │   NNN   │   NNN    │ R$ NNN.NN │
│ ...                    │       │         │          │           │
├────────────────────────┼───────┼─────────┼──────────┼───────────┤
│ SUBTOTAL LLM           │       │         │          │ R$ NNN.NN │
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
- Compare against any prior cost-incident baseline the project tracks (overspend after a guardrail miss is a useful anchor)

## Rules

- **Unit costs are estimates** — always caveat this in the report
- **n8n executions API** has limits (max ~250 per call) — batch if needed
- **Snowflake queries** are generated but NOT executed — user runs them manually (Snowflake session rules)
- **Audit tables**: replace `{YOUR_DATABASE}.{YOUR_SCHEMA}.{YOUR_*_TABLE}` placeholders with the audit tables specific to your project. Column names (`WORKFLOW_NAME`, `EXECUTED_AT`, `STATUS`, `IDENTIFIER`) are illustrative — adjust to your schema
- **Never cache execution counts** across sessions — always query fresh data
- For first-time runs, ask user to confirm/correct unit cost estimates
- **Windows path encoding**: if script write fails due to special characters in the user's home path, use the system temp directory or pass path via variable

Report scope: $ARGUMENTS
