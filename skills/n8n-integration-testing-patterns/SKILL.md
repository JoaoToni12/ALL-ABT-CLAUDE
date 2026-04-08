---
name: n8n-integration-testing-patterns
description: "API contract testing, authentication flows, rate limit handling, and error scenario coverage for n8n integrations with external services. Use when testing n8n node integrations."
---

# n8n Integration Testing Patterns

---

## Quick Checklist

- Credentials valid and not expired
- API permissions sufficient for operations
- Rate limits understood and respected
- Error responses properly handled
- Data formats match API expectations

---

## Integration Categories

| Category | Examples | Auth Type |
|----------|----------|-----------|
| Communication | Slack, Teams, Discord | OAuth2, Webhook |
| Data Storage | Google Sheets, Airtable, Snowflake | OAuth2, API Key |
| Project Mgmt | Linear, Jira, Notion | OAuth2, API Key |
| Dev Tools | GitHub, GitLab | OAuth2, API Key |
| Custom APIs | REST endpoints | Header Auth, Basic Auth |

---

## Connectivity Testing

For each integration node in the workflow:
1. **Credential exists** in n8n instance
2. **Credential is valid** (not expired, not revoked)
3. **Permissions sufficient** for the operations used
4. **Endpoint reachable** from n8n instance

### Authentication Types
| Type | Refresh | Risk |
|------|---------|------|
| OAuth2 | Auto token refresh | Token can expire silently |
| API Key | Manual rotation | Key can be revoked |
| Basic Auth | No refresh | Password changes break it |
| Header Auth | Manual | Same as API Key |

---

## Operation Testing

For each integration node:
1. **Identify operation** (e.g., Slack: postMessage, Notion: createPage)
2. **Generate test data** matching the operation's expected input
3. **Execute** the operation in isolation
4. **Validate response** — correct status, expected data format
5. **Verify side effects** — message actually posted? Page actually created?

---

## Verification by Integration

### Slack
- `slack_get_channel_history` → message arrived in correct channel?
- `slack_get_thread_replies` → thread reply posted correctly?
- Check: message content matches expected template

### Notion
- `notion-fetch` → page/database entry created/updated?
- Check: properties match expected values
- Check: content blocks present

### Linear
- `get_issue` → issue created with correct fields?
- `list_comments` → comment posted?
- Check: status, assignee, labels match

### Snowflake (via query)
- Run verification query against expected table
- Check: row count, field values, timestamps

---

## Error Scenarios to Test

1. **Invalid credentials** → Workflow should handle gracefully (not crash)
2. **API timeout** → Retry or error handling kicks in
3. **Rate limit (429)** → Back-off and retry, or graceful degradation
4. **Not found (404)** → Expected for lookup operations, should be handled
5. **Permission denied (403)** → Clear error message, not silent failure
6. **Invalid data** → Validation before sending, or meaningful error on response

---

## Rate Limit Awareness

```
For each external API:
  - What is the rate limit? (requests/minute)
  - Does the workflow respect it? (delays, batching)
  - What happens when limit is hit? (retry-after header?)
  - Is there a circuit breaker pattern?
```

---

## Test Report Format

```
## Integration Test Report

| Integration | Status | Auth | Operations | Errors |
|-------------|--------|------|------------|--------|
| Slack       | PASS   | OK   | 2/2        | 0      |
| Notion      | PASS   | OK   | 3/3        | 0      |
| Linear      | WARN   | OK   | 2/3        | 1      |
| Snowflake   | PASS   | OK   | 1/1        | 0      |

### Failed Operations
- Linear: createIssue — missing required field "teamId"

### Recommendations
- Add teamId to Linear node configuration
```
