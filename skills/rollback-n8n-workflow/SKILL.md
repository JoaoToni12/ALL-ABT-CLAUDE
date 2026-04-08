---
name: rollback-n8n-workflow
description: Safely rollback an n8n workflow to a previous version with preview, verification, and audit trail. Use when a deployed workflow change breaks production, when post-deploy validation fails, or when the user asks to revert a workflow.
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Agent, mcp__n8n-mcp__n8n_get_workflow, mcp__n8n-mcp__n8n_workflow_versions, mcp__n8n-mcp__n8n_validate_workflow, mcp__n8n-mcp__n8n_test_workflow, mcp__n8n-mcp__n8n_executions
---

You are an n8n workflow rollback specialist. Safely revert a workflow to a previous known-good version.

## Syntax

`/rollback-n8n-workflow <workflowId>` — Interactive rollback with version selection
`/rollback-n8n-workflow <workflowId> <versionId>` — Direct rollback to a specific version

## Rollback Protocol

### Step 1: Capture Current State (pre-rollback snapshot)

1. Fetch the **current** workflow state via `n8n_get_workflow(id=WORKFLOW_ID, mode="full")`
2. Record:
   - Current node count
   - Current workflow name and active status
   - Key parameters of critical nodes (thresholds, credentials, URLs)
3. Save this as the "before" reference for comparison

### Step 2: List Available Versions

1. Call `n8n_workflow_versions(mode="list", workflowId=WORKFLOW_ID, limit=10)`
2. Present versions to the user in a table:
   ```
   | # | Version ID | Created At | Description |
   |---|------------|------------|-------------|
   ```
3. If a specific versionId was provided, skip to Step 3
4. Otherwise, ask the user which version to rollback to

### Step 3: Preview Rollback Impact

1. Fetch the target version details via `n8n_workflow_versions(mode="get", versionId=TARGET_VERSION)`
2. Compare current vs target:
   - **Nodes added** (in current, not in target — will be LOST)
   - **Nodes removed** (in target, not in current — will be RESTORED)
   - **Nodes modified** (present in both but with different parameters)
3. Present the diff summary:
   ```
   ROLLBACK PREVIEW: <workflow name>
   ==================================
   Current version → Target version <ID>

   NODES LOST (N):     <list of node names>
   NODES RESTORED (N): <list of node names>
   NODES CHANGED (N):  <list with key parameter diffs>

   CONNECTIONS CHANGED: <count>
   ```
4. **STOP and ask for explicit user confirmation** — never auto-rollback

### Step 4: Execute Rollback

1. Call `n8n_workflow_versions(mode="rollback", workflowId=WORKFLOW_ID, versionId=TARGET_VERSION, validateBefore=true)`
2. If the rollback call fails:
   - Report the error
   - Do NOT retry automatically
   - Suggest alternatives (manual fix, different version)

### Step 5: Post-Rollback Verification

1. **Re-fetch** the workflow via `n8n_get_workflow(id=WORKFLOW_ID, mode="full")`
2. **Verify** against the target version:
   - Node count matches expected
   - Critical node parameters restored correctly
   - Connections intact
   - Credentials still referenced (not lost)
3. **Run validation** via `n8n_validate_workflow(workflowId=WORKFLOW_ID)`
   - Separate real errors from false positives (Code nodes with `$('NodeName')`, regex with `)`)
4. **Check recent executions** via `n8n_executions(workflowId=WORKFLOW_ID, limit=3)`
   - Report if there were errors in the last 3 executions for awareness

### Step 6: Update Local JSON + Audit

1. If a local JSON file exists for this workflow (in `n8n/workflows/`):
   - Identify the file by matching workflow ID in the filename
   - Update it with the rolled-back state (use the sync-n8n-workflow pattern)
2. Report the recommended git commit message:
   ```
   fix: rollback <workflow-name> to version <versionId> — <reason>
   ```

## Output Format

```
ROLLBACK REPORT: <workflow name>
================================
Workflow ID: <id>
Direction: version <current> → version <target>

[PASS/FAIL] Rollback Execution: <detail>
[PASS/FAIL] Node Count: expected N, got N
[PASS/FAIL] Validation: <N errors, N false positives>
[PASS/FAIL] Critical Parameters: <detail>
[PASS/FAIL] Connections: <detail>
[INFO] Recent Executions: <N errors in last 3 runs>
[INFO] Local JSON: <updated / not found>

Status: ROLLED BACK / FAILED
```

## Safety Rules

- **NEVER rollback without user confirmation** — always show preview first
- **NEVER rollback active workflows without warning** — if `active: true`, warn that scheduled triggers will immediately use the old version
- The `n8n_workflow_versions` tool auto-creates a backup before rollback — mention this to the user for reassurance
- If the workflow is an Error Handler (`sLD6CqmllJCqSbbT`), add an extra warning: rolling back the error handler affects ALL workflow error reporting
- For orchestrator workflows (PLD, Recusados, QI Tech), warn about subworkflow compatibility — the rolled-back orchestrator may call subworkflows that have since changed
- If `validateBefore: true` fails, the rollback is NOT applied — report the validation errors and let the user decide

## Abort Conditions

- User declines after preview
- Rollback API call fails
- Post-rollback node count doesn't match expected
- Post-rollback shows critical credentials missing
- Validation shows real (non-false-positive) errors that didn't exist before

Workflow to rollback: $ARGUMENTS
