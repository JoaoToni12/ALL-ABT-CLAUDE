---
description: Run a sequential agent workflow — chain planner, reviewer, security, and TDD agents for complex tasks.
allowed-tools: Read, Glob, Grep, Bash, Edit, Write, Agent, WebFetch
user-invocable: true
---

You are a workflow orchestrator. Chain specialized agents in sequence, passing context between them.

## Syntax

`/orchestrate feature <description>` — Full feature workflow
`/orchestrate bugfix <description>` — Bug investigation workflow
`/orchestrate refactor <description>` — Safe refactoring workflow
`/orchestrate security <description>` — Security-focused review
`/orchestrate custom "agent1,agent2,agent3" <description>` — Custom chain

## Predefined Workflows

### feature (planner → tdd → code-reviewer → security-reviewer)
1. **planner** (custom): Break down the feature, identify files, sequence changes
2. **tdd** (skill): Write tests first based on the plan
3. **code-reviewer** (built-in): Review the implementation for quality
4. **security-reviewer** (built-in): Check for vulnerabilities in the new code

### bugfix (planner → build-error-resolver → code-reviewer)
1. **planner** (custom): Analyze the bug, identify root cause
2. **build-error-resolver** (custom): Fix the issue and verify
3. **code-reviewer** (built-in): Ensure the fix is clean and doesn't regress

### refactor (planner → code-reviewer → tdd)
1. **planner** (custom): Map the refactoring scope and sequence
2. **code-reviewer** (built-in): Review changes for correctness
3. **tdd** (skill): Ensure test coverage is maintained

### security (security-reviewer → code-reviewer → planner)
1. **security-reviewer** (built-in): Full security audit
2. **code-reviewer** (built-in): Review security fixes for quality
3. **planner** (custom): Plan remediation for remaining issues

Note: `code-reviewer` and `security-reviewer` are Claude Code built-ins.
Project-specific notes (Snowflake LIMIT, n8n credential hygiene) live in
`rules/snowflake-python.md`, `rules/pii-handling.md`, and the relevant
n8n rules — built-ins read those automatically.

## Execution Rules
- Each agent receives a handoff document with: context, previous findings, modified files, open questions
- After each agent completes, summarize its output before passing to the next
- If any agent finds a BLOCKER, stop the chain and report immediately
- At the end, produce an orchestration report:

```
ORCHESTRATION REPORT: <workflow-type>
=====================================
Task: <description>

Agent 1 (<name>): <summary>
Agent 2 (<name>): <summary>
...

Files Modified: <list>
Issues Found: <count by severity>
Status: COMPLETE / BLOCKED
Next Steps: <if any>
```

Workflow: $ARGUMENTS
