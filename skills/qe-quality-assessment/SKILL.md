---
name: qe-quality-assessment
description: "Comprehensive quality gates, metrics analysis, and deployment readiness assessment. Use when evaluating quality, setting up quality gates, assessing deployment readiness, or tracking quality metrics."
---

# QE Quality Assessment

---

## Quality Dimensions

### 1. Functional Correctness
- Does the automation do what the PRD says?
- Are all acceptance criteria met?
- Edge cases handled?

### 2. Integration Health
- All external systems connected?
- Authentication valid?
- Data flows correctly between systems?

### 3. Error Handling
- Failures are caught, not silent?
- Alerts/notifications sent on errors?
- Recovery/retry mechanisms work?

### 4. Data Integrity
- Output data matches expected format?
- No data loss in transformations?
- Deduplication works (no double-processing)?

### 5. Operational Readiness
- Monitoring in place?
- Documentation complete?
- Runbook for manual intervention?

---

## Quality Gates

```
GATE 1: Structure Valid
  - Workflow parses correctly
  - All nodes connected
  - Credentials referenced

GATE 2: Functional Correct
  - Test execution succeeds
  - Output matches expected

GATE 3: Integration Verified
  - Each external system confirms output
  - Error handling tested

GATE 4: Acceptance Criteria Met
  - Each PRD criterion has PASS/FAIL
  - No FAIL on critical criteria

GATE 5: Deployment Ready
  - All gates above passed
  - No open blockers
  - Stakeholder sign-off (if needed)
```

---

## Quality Score

| Dimension | Weight | Score | Weighted |
|-----------|--------|-------|----------|
| Functional | 30% | ?/100 | ? |
| Integration | 25% | ?/100 | ? |
| Error Handling | 20% | ?/100 | ? |
| Data Integrity | 15% | ?/100 | ? |
| Operational | 10% | ?/100 | ? |
| **Total** | **100%** | | **?/100** |

### Grading
- A (90-100): Ready for production
- B (80-89): Minor issues, can deploy with monitoring
- C (70-79): Needs fixes before deployment
- D (60-69): Significant issues
- F (<60): Not ready

---

## Verification Report Template

```markdown
# Quality Assessment Report

## Automation: [Name]
## Date: [Date]
## Assessor: Claude Code (E2E Verification Agent)

### Summary
- Overall Grade: [A-F]
- Overall Score: [0-100]
- Recommendation: [DEPLOY / FIX FIRST / REDESIGN]

### Acceptance Criteria
| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | [desc]    | PASS   | [what was checked] |
| 2 | [desc]    | FAIL   | [what went wrong] |

### Integration Health
| System | Connected | Verified | Notes |
|--------|-----------|----------|-------|
| Slack  | YES       | PASS     | Message arrived |
| Notion | YES       | PASS     | Page updated |

### Issues Found
| # | Severity | Description | Recommendation |
|---|----------|-------------|----------------|
| 1 | HIGH     | [issue]     | [fix]          |

### Next Steps
- [ ] Fix issue #1
- [ ] Re-run verification
- [ ] Deploy to production
```
