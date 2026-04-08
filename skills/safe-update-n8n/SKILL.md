---
name: safe-update-n8n
description: Safe workflow update enforcing fetch-diff-apply-verify pattern for n8n MCP edits. Use when updating n8n workflow nodes via MCP to prevent partial update data loss.
user_invocable: true
---

# /safe-update-n8n — Safe n8n Workflow Update

This skill enforces the **fetch → diff → apply → verify** pattern to prevent partial updates from overwriting existing fields.

## When to use

- Any time you need to update nodes in an n8n workflow via MCP tools
- Especially critical for updates involving >3 nodes or nodes with complex parameters

## Procedure

### Step 1: Identify targets
Ask the user (or determine from context):
- **Workflow ID** to update
- **Node(s)** to modify and what changes are needed

### Step 2: Fetch current state
```
mcp__n8n-mcp__n8n_get_workflow(id=WORKFLOW_ID, mode="full")
```
Save the full response. Extract the current state of each target node.

### Step 3: Show before/after diff
For each node being modified, present a clear diff:
- Show ONLY the fields that will change (mark as CHANGED)
- Confirm all other fields are marked as KEEP (will be included unchanged in the payload)
- Wait for user confirmation before proceeding

Example format:
```
Node: e06-build-slack (nodeId)
  parameters.jsCode: CHANGED
    Before: [first 3 lines...]
    After:  [first 3 lines...]
  parameters.mode: KEEP (= "runOnceForAllItems")
  type: KEEP (= "n8n-nodes-base.code")
  [... all other fields KEEP ...]
```

### Step 4: Apply with complete parameters
Build the update payload by **merging** existing fields with changes:
- Start from the FULL existing node parameters object
- Override ONLY the changed fields
- Always use `nodeId` (not `name`) to identify the node
- If >5 nodes: batch in groups of 3-5, re-fetching between batches

```
mcp__n8n-mcp__n8n_update_partial_workflow(id=WORKFLOW_ID, nodes=[...complete merged nodes...])
```

### Step 5: Re-fetch and verify
```
mcp__n8n-mcp__n8n_get_workflow(id=WORKFLOW_ID, mode="full")
```
Verify:
- [ ] Node count matches expected (no nodes lost)
- [ ] Changed values are correctly applied
- [ ] Unchanged values are still intact (spot-check at least 2 fields per node)
- [ ] Connections are preserved

If any verification fails: report the discrepancy and ask user how to proceed.

Then validate:
```
mcp__n8n-mcp__n8n_validate_workflow(id=WORKFLOW_ID)
```
Note: Code node validation errors for `$('NodeName')` or regex with `)` are known false positives.

## Abort conditions
- If fetch fails: stop and report
- If user doesn't confirm diff: stop
- If post-apply verification shows data loss: immediately report, do NOT attempt to fix without user approval
