---
name: deploy-n8n-workflow
description: Deploy a local n8n workflow JSON to production with pre-deploy diff, validation, and post-deploy canary monitoring. Use when pushing local workflow changes to n8n, after editing workflow JSON locally, or when asked to "deploy", "publicar", or "subir o workflow".
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Agent, mcp__n8n-mcp__n8n_get_workflow, mcp__n8n-mcp__n8n_update_full_workflow, mcp__n8n-mcp__n8n_validate_workflow, mcp__n8n-mcp__n8n_test_workflow, mcp__n8n-mcp__n8n_executions, mcp__n8n-mcp__n8n_workflow_versions
---

# /deploy-n8n-workflow — Deploy Local JSON to n8n

Deploy a locally-edited workflow JSON to the n8n instance, with pre-deploy diff, validation, and post-deploy health monitoring.

## Syntax

`/deploy-n8n-workflow <workflowId>` — Deploy from local JSON matching this ID
`/deploy-n8n-workflow <workflowId> --dry-run` — Show diff only, don't apply
`/deploy-n8n-workflow <workflowId> --canary <minutes>` — Monitor for N minutes after deploy (default: 5)

## Deploy Protocol

### Step 1: Locate Local JSON

1. Search for the workflow JSON in the project:
   ```
   Glob: n8n/workflows/**/*.json
   ```
2. Match by workflow ID in filename or inside the JSON (`"id": "..."`)
3. Read and parse the local JSON file
4. If not found, ask the user for the file path

### Step 2: Fetch Remote State

1. Call `n8n_get_workflow(id=WORKFLOW_ID, mode="full")` to get the currently deployed version
2. Record:
   - Remote node count and names
   - Remote active/inactive status
   - Remote version (if available via `n8n_workflow_versions(mode="list", workflowId=ID, limit=1)`)

### Step 3: Pre-Deploy Diff

Compare local vs remote and present a summary:

```
DEPLOY PREVIEW: <workflow name>
================================
Local file: <path>
Remote version: <id or timestamp>

NODES ADDED (N):    <nodes in local but not remote>
NODES REMOVED (N):  <nodes in remote but not local>
NODES MODIFIED (N): <nodes with parameter differences>
  - <node name>: <field1> changed, <field2> changed
CONNECTIONS CHANGED: <yes/no + count>
SETTINGS CHANGED:   <yes/no + details>

Risk Level: LOW / MEDIUM / HIGH
```

Risk assessment:
- **LOW**: Only parameter changes within existing nodes
- **MEDIUM**: Nodes added or removed, or connection changes
- **HIGH**: Trigger node changed, credentials changed, or active status toggled

If `--dry-run`, stop here.

### Step 4: Pre-Deploy Validation

1. Validate the local structure before deploying:
   - All nodes have `id` and `type` fields
   - Connections reference existing node names
   - No orphan nodes (except terminal nodes like Stop And Error)
   - Credentials are referenced by ID (not hardcoded values)
2. If validation fails, report issues and STOP

### Step 5: User Confirmation

Present the risk level and ask for explicit confirmation:
- For LOW risk: "Deploy N parameter changes to <workflow>?"
- For MEDIUM risk: "Deploy N node changes to <workflow>? This modifies the workflow structure."
- For HIGH risk: "**WARNING**: This deploy changes the trigger/credentials/active status. Confirm you want to proceed."

**NEVER auto-deploy without confirmation.**

### Step 6: Create Version Backup

Before applying changes:
```
n8n_workflow_versions(mode="list", workflowId=WORKFLOW_ID, limit=1)
```
Log the current version ID so the user knows what to rollback to if needed.
Inform user: "Current version backed up. Use `/rollback-n8n-workflow <ID>` to revert if needed."

### Step 7: Apply Deploy

Use `n8n_update_full_workflow` with the complete local JSON:
```
n8n_update_full_workflow(id=WORKFLOW_ID, nodes=<local nodes>, connections=<local connections>, settings=<local settings>)
```

If the API call fails, report the error and suggest checking:
- Payload size (>5 nodes may need batching via partial updates)
- Node name conflicts
- Invalid credential references

### Step 8: Post-Deploy Verification

1. **Re-fetch** the deployed workflow
2. **Compare** deployed state vs local JSON:
   - [ ] Node count matches
   - [ ] All node IDs present
   - [ ] Key parameters spot-checked (2-3 critical nodes)
   - [ ] Connections intact
3. **Validate**: `n8n_validate_workflow(workflowId=WORKFLOW_ID)`
   - Filter false positives (Code nodes with `$('NodeName')`, regex with `)`)
4. Report verification result

### Step 9: Canary Monitoring (optional)

If `--canary` or default 5-minute window:

1. Wait 30 seconds, then check `n8n_executions(workflowId=WORKFLOW_ID, limit=5)`
2. Look for:
   - New executions since deploy timestamp
   - Error rate: any execution with `status: "error"`
   - Execution duration anomalies (>2x typical)
3. If errors found:
   ```
   CANARY ALERT: <N> errors in <M> executions since deploy
   Errors:
   - Execution <id>: <error message>

   Recommend: /rollback-n8n-workflow <WORKFLOW_ID>
   ```
4. If no executions yet (workflow is schedule-triggered), report:
   "No executions since deploy. Next scheduled trigger: <time or unknown>. Monitor manually."
5. If all executions healthy:
   ```
   CANARY PASS: <N> executions since deploy, 0 errors
   ```

## Output Format

```
DEPLOY REPORT: <workflow name>
==============================
Direction: local → n8n
Backup: version <id> (use /rollback-n8n-workflow to revert)

[PASS/FAIL] Pre-deploy Validation: <detail>
[PASS/FAIL] Deploy Execution: <detail>
[PASS/FAIL] Post-deploy Verification: nodes <N>, connections <ok/fail>
[PASS/FAIL] Validation: <N errors, N false positives>
[PASS/FAIL/SKIP] Canary (<N>min): <N executions, N errors>

Status: DEPLOYED / FAILED / ROLLED BACK
```

## Safety Rules

- **NEVER deploy without user confirmation**
- **NEVER deploy to Error Handler** (`sLD6CqmllJCqSbbT`) without extra warning — affects ALL workflows
- If the workflow is currently `active: true` and the local JSON has `active: false`, warn that this will disable the scheduled trigger
- If deploying an orchestrator (PLD, Recusados, QI Tech), warn about subworkflow compatibility
- If canary detects errors, recommend rollback but don't auto-rollback — user decides
- For workflows with volume gates/budget caps, remind user to verify thresholds match production expectations

## Abort Conditions

- Local JSON not found or unparseable
- Pre-deploy validation fails
- User declines confirmation
- Deploy API call fails
- Post-deploy verification shows node loss or critical parameter mismatch

Workflow to deploy: $ARGUMENTS
