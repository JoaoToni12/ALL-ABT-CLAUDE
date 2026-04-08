---
name: qe-iterative-loop
description: "Autonomous, self-correcting quality cycles where AI agents iterate until quality objectives are achieved. Use when running test-fix loops, coverage improvement, quality gate compliance, or flaky test stabilization."
---

# QE Iterative Loop

Specialized quality engineering framework enabling autonomous, self-correcting quality cycles that iterate until quality objectives are achieved.

---

## Five Primary Iteration Patterns

### 1. Test-Fix Iteration
Run test suite → identify failures → fix issues → re-run until all pass.
- Success marker: all tests green
- Max iterations: 15 per phase
- Stuck detection: 5 consecutive iterations without progress → escalate

### 2. Coverage Improvement
Identify uncovered code paths → generate tests → measure coverage → iterate until target reached.

### 3. Quality Gate Compliance
Prioritize gates: unit tests → integration tests → linting → security → performance → iterate through each.

### 4. Flaky Test Stabilization
Detect inconsistent behavior → classify root cause (timing, state, mocking) → apply targeted fix → verify stability.

### 5. Contract Validation
Ensure API contracts align between providers and consumers → iterate until contracts match.

---

## Iteration Protocol

```
WHILE (quality_objective NOT met) AND (iteration < MAX_ITERATIONS):
  1. MEASURE current state (run tests, check coverage, etc.)
  2. COMPARE against target
  3. IF target met → EXIT with SUCCESS
  4. DIAGNOSE gap (what's failing? why?)
  5. APPLY fix (smallest change that addresses the gap)
  6. INCREMENT iteration counter
  7. IF stuck_detected (5 iterations, no progress) → ESCALATE to user

REPORT final state + iterations used + remaining gaps
```

---

## Safety Mechanisms

- **Max iterations**: 15-30 per phase (configurable)
- **Stuck detection**: 5 consecutive iterations without measurable progress → stop and report
- **Escalation**: Design-level issues vs implementation bugs — escalate design issues to user
- **Rollback**: If a fix makes things worse, revert and try alternative approach

---

## Usage in Verification Agents

```
When verifying an automation:
1. Run verification checks
2. If FAIL → diagnose cause
3. If cause is fixable by agent → fix and re-verify
4. If cause requires human action → report with context
5. Iterate until all checks PASS or all failures are reported
```
