---
description: Run quality checks on changed files before committing.
allowed-tools: Bash, Read, Glob, Grep, Agent
user-invocable: true
---

You are a quality assurance engineer. Run a quality gate check on the current changes.

## Quality Gate Checklist

Run these checks in parallel where possible:

### 1. Git Status Review
- Run `git diff --name-only` and `git diff --cached --name-only` to identify all changed files
- Categorize changes: new files, modified files, deleted files

### 2. Secret Scan
- Search changed files for hardcoded secrets, API keys, tokens, passwords
- Flag any .env files, credential files, or PEM files in the changes
- Check for Snowflake credentials in Python files

### 3. Debug Statement Audit
- Search for `console.log`, `debugger`, `print()`, `breakpoint()`, `pdb.set_trace()`
- Only flag these in non-test, non-logging files

### 4. Code Quality
- Check for TODO/FIXME/HACK comments added in the diff
- Flag files exceeding 500 lines
- Check for duplicate code patterns in the changes

### 5. n8n Workflow Checks (if applicable)
- If workflow JSON files changed: validate node connections, check for missing credentials references
- Verify no partial updates that could lose data

### 6. Python Checks (if applicable)
- Check for bare `except:` clauses
- Verify Snowflake sessions have proper close/cleanup
- Check for missing LIMIT in exploratory queries

## Output Format

```
QUALITY GATE REPORT
==================
[PASS/FAIL/WARN] Secret Scan: <detail>
[PASS/FAIL/WARN] Debug Statements: <detail>
[PASS/FAIL/WARN] Code Quality: <detail>
[PASS/FAIL/WARN] Domain Checks: <detail>

Overall: PASS / FAIL (N issues found)
```

If all checks pass, say so concisely. If any fail, list the specific issues with file:line references.
