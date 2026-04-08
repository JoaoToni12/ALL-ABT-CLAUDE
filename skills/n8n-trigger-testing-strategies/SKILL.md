---
name: n8n-trigger-testing-strategies
description: "Webhook testing, schedule validation, event-driven triggers, and polling mechanism testing for n8n workflows. Use when testing how workflows are triggered."
---

# n8n Trigger Testing Strategies

---

## Quick Checklist

- Trigger activates workflow correctly
- Payload parsed and validated
- Authentication enforced (if configured)
- Error responses are informative
- Response time is acceptable

---

## Trigger Types

| Type | Use Case | Testing Focus |
|------|----------|---------------|
| **Webhook** | External HTTP calls | Payloads, auth, HTTP methods |
| **Schedule** | Timed execution | Cron accuracy, timezone |
| **Polling** | Check for changes | Interval, deduplication |
| **Manual** | User-triggered | Input data validation |
| **Sub-workflow** | Called by parent | Input schema, error propagation |

---

## Webhook Testing

### Payload Validation
Test with:
- Valid JSON payload → expect 200 OK
- Empty object `{}` → expect graceful handling
- Invalid JSON → expect 400 or error workflow
- Large payload → expect handling or rejection
- Missing required fields → expect validation error

### HTTP Method Testing
- Test configured method (POST, GET, etc.)
- Test unsupported methods → expect 405

### Authentication
- No auth header → expect 401 (if auth configured)
- Invalid token → expect 401
- Valid token → expect 200
- Expired token → expect 401

---

## Schedule Testing

### Cron Validation
- Is the cron expression syntactically valid?
- Does it fire at the expected times?
- Timezone correct? (UTC vs local)
- Edge cases: midnight, DST transitions, month boundaries

### Common Schedules
| Expression | Meaning |
|-----------|---------|
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | Every hour |
| `0 0 * * *` | Daily at midnight |
| `0 9 * * 1-5` | Weekdays at 9 AM |
| `0 0 1 * *` | First of month |

---

## Polling Testing

- Does it poll at the configured interval?
- Deduplication: same data doesn't trigger twice?
- Empty poll: no data available → no execution triggered?
- First poll: correct initial state?

---

## Sub-Workflow Testing

- Parent passes correct input schema?
- Sub-workflow returns expected output?
- Error in sub-workflow propagates to parent?
- Timeout handling between parent and sub-workflow?

---

## Testing via MCP

```
1. Get workflow details → identify trigger type
2. For webhooks:
   - Get webhook URL from workflow config
   - Send test payloads via HTTP
   - Check execution was triggered
3. For schedules:
   - Verify cron expression
   - Execute manually to test logic
4. For sub-workflows:
   - Execute parent with test data
   - Verify sub-workflow was called
```
