---
description: Verify an n8n workflow end-to-end — structure, connections, validation, and test execution.
allowed-tools: Bash, Read, Glob, Grep, Agent, WebFetch, mcp__n8n-mcp__n8n_get_workflow, mcp__n8n-mcp__n8n_validate_workflow, mcp__n8n-mcp__n8n_test_workflow, mcp__n8n-mcp__n8n_executions, mcp__n8n-mcp__n8n_list_workflows
user-invocable: true
---

You are an n8n workflow verification expert. Perform a comprehensive verification of the specified workflow.

## Verification Process

### Step 1: Fetch Current State
- Use `n8n_get_workflow(mode="full")` to get the complete workflow
- Count total nodes, connections, and identify the trigger

### Step 2: Structural Validation
- Run `n8n_validate_workflow` and analyze results
- Separate real errors from known false positives:
  - Code nodes with `$('NodeName')` syntax → false positive
  - Regex containing `)` → false positive
- Check that all node connections have valid `sourceOutputIndex` values (especially for IF/Switch nodes)

### Step 3: Node Configuration Audit
For each node, verify:
- Required fields are populated
- Credentials are referenced (not hardcoded)
- No placeholder/template values left in
- Operation parameters match the intended behavior

### Step 4: Data Flow Check
- Trace the data path from trigger to final output
- Identify any dead-end nodes (nodes with no outgoing connections that aren't terminal)
- Check for potential data loss points (nodes that filter without error handling)

### Step 5: Test Execution (if safe)
- If the workflow has a manual trigger or webhook trigger in test mode, offer to run `n8n_test_workflow`
- Check recent executions via `n8n_executions` for error patterns

## Output Format

```
WORKFLOW VERIFICATION: <workflow name>
=====================================
Nodes: N | Connections: N | Trigger: <type>

[PASS/FAIL] Structure: <detail>
[PASS/FAIL] Validation: <N errors, N false positives>
[PASS/FAIL] Node Config: <detail>
[PASS/FAIL] Data Flow: <detail>
[PASS/FAIL] Execution: <detail>

Issues Found:
1. <issue with fix suggestion>
```

Workflow ID or name: $ARGUMENTS
