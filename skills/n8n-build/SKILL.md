---
name: n8n-build
description: Build n8n workflows via MCP tools — find nodes, configure operations, validate configurations, and fix validation errors. Use when building, configuring, or validating workflow nodes via mcp__n8n-mcp__ tools, encountering validation errors, choosing node types, or understanding property dependencies.
---

# n8n Build — Node Discovery, Configuration & Validation

End-to-end guide for building workflows using `mcp__n8n-mcp__*` tools: find the right node → configure it correctly → validate → fix errors → deploy.

---

## 1. Tool Selection Quick Reference

### Most-used tools

| Tool | Use when | Notes |
|---|---|---|
| `search_nodes` | Finding nodes by keyword | Returns both nodeType formats |
| `get_node` | Understanding operations/fields | Use `detail:"standard"` (default, 95% of cases) |
| `validate_node` | Checking config before deploy | Use `profile:"runtime"` |
| `n8n_update_partial_workflow` | Editing deployed workflows | MOST USED — 99% success rate |
| `validate_workflow` | Checking full workflow structure | Catches connection + expression issues |
| `n8n_deploy_template` | Deploy from template library | 2700+ real workflows |

### nodeType format — two formats exist, don't mix them

```javascript
// search/validate tools — short prefix
"nodes-base.slack"
"nodes-base.httpRequest"
"nodes-langchain.agent"

// workflow creation/update tools — full prefix
"n8n-nodes-base.slack"
"n8n-nodes-base.httpRequest"
"@n8n/n8n-nodes-langchain.agent"
```

`search_nodes` returns BOTH formats in the result — use `nodeType` for search/validate, `workflowNodeType` for workflow tools.

### `get_node` detail levels

- `detail:"standard"` (default, ~1-2K tokens) — use first, covers 95% of needs
- `mode:"docs"` — readable markdown docs for a node
- `mode:"search_properties", propertyQuery:"auth"` — find a specific property
- `detail:"full"` (~3-8K tokens) — only when standard is insufficient

---

## 2. Node Configuration Patterns

### Key insight: resource + operation determines required fields

Different operations on the same node require different fields. Always check after changing operation.

```javascript
// Slack post message
{ resource: "message", operation: "post", channel: "#general", text: "Hello!" }

// Slack update message — different required fields!
{ resource: "message", operation: "update", messageId: "123", text: "Updated!" }
// channel is NOT required for update
```

### Property dependency pattern (displayOptions)

Fields appear/disappear based on other field values:

```javascript
// HTTP Request: body only appears when sendBody=true AND method=POST/PUT/PATCH
{ method: "POST", sendBody: true, body: { contentType: "json", content: {...} } }

// GET request — sendBody not present
{ method: "GET", url: "https://api.example.com" }
```

### Progressive configuration workflow

```
1. get_node({nodeType: "nodes-base.slack"})          // standard detail, see operations
2. Set resource + operation first
3. validate_node({...config, profile: "runtime"})    // reveals missing required fields
4. Fix → validate → repeat (avg 2-3 cycles)
5. n8n_update_partial_workflow to deploy
```

### Common node patterns

**Resource/operation nodes** (Slack, Google Sheets, Airtable):
```javascript
{ resource: "<entity>", operation: "<action>", /* operation-specific fields */ }
```

**HTTP nodes**: method → sendBody → body (cascade dependency)

**Conditional nodes** (IF, Switch):
- Binary operators (equals, contains, greaterThan): needs `value1` + `value2`
- Unary operators (isEmpty, isNotEmpty): needs `value1` only + `singleValue: true` (auto-added)

**Workflow update operations** in `n8n_update_partial_workflow`:
```javascript
// Use semantic branch names instead of sourceIndex
{ type: "addConnection", source: "IF", target: "True Handler", branch: "true" }
{ type: "addConnection", source: "Switch", target: "Handler A", case: 0 }
```

Always include `intent` parameter in workflow updates for better responses:
```javascript
n8n_update_partial_workflow({ id: "...", intent: "Add error handling for API failures", operations: [...] })
```

---

## 3. Validation Loop

### Profiles — choose by stage

| Profile | Use when | What it checks |
|---|---|---|
| `minimal` | Quick edits in progress | Required fields only |
| `runtime` | Pre-deployment (**recommended**) | Required + types + values |
| `ai-friendly` | AI-generated configs | Same as runtime, fewer false positives |
| `strict` | Production critical workflows | Everything + best practices |

### Error types and fixes

| Error type | Meaning | Fix |
|---|---|---|
| `missing_required` | Required field absent | `get_node` to see required fields, add them |
| `invalid_value` | Value not in allowed options | Check error message for allowed values |
| `type_mismatch` | Wrong data type | Convert to expected type (e.g. `"100"` → `100`) |
| `invalid_expression` | Bad `{{}}` syntax | See expression section in n8n-code-javascript skill |
| `invalid_reference` | Node name doesn't exist in workflow | Fix spelling or create the referenced node |

### Auto-sanitization — runs on EVERY workflow update

The system automatically fixes operator structures:
- Binary operators (equals, contains): removes `singleValue`
- Unary operators (isEmpty, isNotEmpty): adds `singleValue: true`
- IF/Switch metadata added for v2.2+/v3.2+

**Cannot auto-fix**: broken connections, branch count mismatches. Use:
```javascript
n8n_update_partial_workflow({ id: "...", operations: [{ type: "cleanStaleConnections" }] })
```

### Common false positives (safe to ignore)

- "Missing error handling" — acceptable for dev/test workflows or non-critical notifications
- "No retry logic" — acceptable for idempotent ops or APIs with their own retry
- "Unbounded query" — acceptable for small/known datasets, aggregations

Use `profile:"ai-friendly"` to reduce noise from these in AI-generated configs.

---

## 4. End-to-End Build Cycle

```
search_nodes({query: "slack"})
  → get_node({nodeType: "nodes-base.slack"})
  → configure resource + operation + required fields
  → validate_node({...config, profile: "runtime"})
  → fix errors (usually 2-3 rounds)
  → n8n_create_workflow OR n8n_update_partial_workflow
  → validate_workflow({id})
  → n8n_update_partial_workflow({..., operations: [{type: "activateWorkflow"}]})
```

### Always-available tools (no n8n API needed)
`search_nodes`, `get_node`, `validate_node`, `search_templates`, `get_template`, `tools_documentation`

### Requires n8n API (N8N_API_URL + N8N_API_KEY)
`n8n_create_workflow`, `n8n_update_partial_workflow`, `n8n_validate_workflow` (by ID), `n8n_list_workflows`, `n8n_test_workflow`, `n8n_executions`, `n8n_deploy_template`, `n8n_autofix_workflow`

---

## 5. Anti-patterns

- `detail:"full"` immediately → try `standard` first
- One-shot workflow creation → iterate (avg 56s between edits)
- Skip validation before activation → always `validate_workflow` before activating
- Use `n8n-nodes-base.*` prefix with search/validate tools → use `nodes-base.*`
- Manually fix auto-sanitization → let the system handle operator structure

---

## Related skills

- **n8n-code-javascript** — writing JS/Python in Code nodes, expression syntax
- **n8n-workflow-patterns** — architectural patterns (webhook, API integration, AI agent, scheduled tasks)
- **n8n-as-code:n8n-architect** — n8nac CLI workflow (`.workflow.ts` authoring, push/pull/deploy)
- **n8n-execution-debug** — debugging failed executions
