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
1. **Planner**: Break down the feature, identify files, sequence changes
2. **TDD**: Write tests first based on the plan
3. **Code-Reviewer**: Review the implementation for quality
4. **Security-Reviewer**: Check for vulnerabilities in the new code

### bugfix (planner → build-error-resolver → code-reviewer)
1. **Planner**: Analyze the bug, identify root cause
2. **Build-Error-Resolver**: Fix the issue and verify
3. **Code-Reviewer**: Ensure the fix is clean and doesn't regress

### refactor (planner → code-reviewer → tdd)
1. **Planner**: Map the refactoring scope and sequence
2. **Code-Reviewer**: Review changes for correctness
3. **TDD**: Ensure test coverage is maintained

### security (security-reviewer → code-reviewer → planner)
1. **Security-Reviewer**: Full security audit
2. **Code-Reviewer**: Review security fixes for quality
3. **Planner**: Plan remediation for remaining issues

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
