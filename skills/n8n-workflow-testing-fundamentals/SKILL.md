---
name: n8n-workflow-testing-fundamentals
description: "Comprehensive n8n workflow testing including execution lifecycle, node connection patterns, data flow validation, and error handling strategies. Use when testing n8n workflow automation applications."
---

# n8n Workflow Testing Fundamentals

---

## Quick Checklist

- All nodes properly connected (no orphans)
- Trigger node correctly configured
- Data mappings between nodes valid
- Error workflows defined
- Credentials properly referenced

---

## Workflow Structure Validation

### 1. Trigger Node Exists
Every workflow needs at least one trigger (webhook, schedule, manual, or sub-workflow call).

### 2. No Orphan Nodes
Check that every node is connected to the flow. Orphan nodes indicate incomplete wiring.

```
For each node in workflow.nodes:
  Is it referenced in workflow.connections (as source OR target)?
  If not → WARN: orphan node "{name}"
```

### 3. Credentials Referenced
For each node that requires credentials:
- Credential ID exists in the n8n instance
- Credential type matches node expectation

### 4. No Dead Branches
IF nodes should have both true/false branches connected (or explicitly documented as intentional dead-end).

---

## Execution Testing

### Test with realistic data
```
1. Prepare test input matching production schema
2. Execute workflow via API: execute_workflow(id, testData)
3. Wait for completion (with timeout)
4. Check execution status: success/failed/waiting
5. Validate output data at each node
```

### Execution States
| State | Meaning | Action |
|-------|---------|--------|
| `success` | Completed | Validate outputs |
| `error` | Failed | Check error node + message |
| `waiting` | Paused | Check wait/webhook nodes |
| `running` | In progress | Wait or timeout |

---

## Data Flow Validation

Trace data through the node chain:
```
Trigger output → Node 1 input (match?) → Node 1 output → Node 2 input (match?) → ...
```

### Common Data Flow Issues
- **Missing field**: Node expects `$.json.email` but upstream provides `$.json.emailAddress`
- **Type mismatch**: Node expects string, gets number
- **Empty array**: SplitInBatches receives [] → subsequent nodes never execute
- **Expression error**: `{{ $json.field }}` fails when field is undefined

---

## Node Connection Patterns

### Linear: `A → B → C → D`
Test: Execute once, validate each node output sequentially.

### Branching: `A → IF → [B] or [C] → Merge → D`
Test: Execute with data that triggers each branch separately.

### Parallel: `A → Split → [B, C] → Merge → D`
Test: Validate both parallel paths complete, merge has correct items.

### Loop: `A → SplitInBatches → B → [loop back] → C`
Test: Verify all items processed, no infinite loops, batch size correct.

---

## Error Handling

### Check for:
1. Error workflow configured (Settings → Error Workflow)
2. `continueOnFail` set on fault-tolerant nodes
3. Try/catch patterns via IF nodes checking `$execution.error`
4. Retry logic where appropriate (HTTP nodes with retry on fail)

---

## Performance Baseline

- Execution time for typical payload size
- Memory usage for large datasets
- Node-by-node timing to identify bottlenecks
- Batch size optimization for SplitInBatches

---

## MCP-Based Testing

Using the n8n MCP tools available:
```
1. get_workflow_details(workflowId) → inspect structure
2. Validate nodes, connections, credentials
3. execute_workflow(workflowId, testData) → run test
4. Check execution result via n8n API
```
