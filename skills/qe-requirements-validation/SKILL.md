---
name: qe-requirements-validation
description: "Requirements traceability, acceptance criteria validation, and BDD scenario management for complete requirements coverage. Use when validating requirements, tracing tests, generating BDD scenarios, or checking coverage."
---

# QE Requirements Validation

Four core capabilities for ensuring requirements are complete, testable, and traced.

---

## 1. Acceptance Criteria Validation (SMART)

Evaluate each criterion against:
- **S**pecific — Is the expected behavior unambiguous?
- **M**easurable — Can we objectively verify pass/fail?
- **A**chievable — Is it technically feasible to test?
- **R**elevant — Does it relate to the user need?
- **T**estable — Can we write a concrete test for it?

### Red Flags
- Vague language: "should work properly", "handles errors gracefully"
- Missing boundaries: no limits, thresholds, or edge cases defined
- Untestable: "user feels confident", "system is fast"

---

## 2. Traceability Matrix

Map: `Requirement → Test Case → Verification Result`

| Requirement | Test Case | Status | Coverage |
|-------------|-----------|--------|----------|
| REQ-001     | TC-001    | PASS   | Full     |
| REQ-002     | (none)    | -      | UNTESTED |
| (orphan)    | TC-005    | PASS   | Orphaned |

### Flags
- **Untested requirement**: No test case mapped → high risk
- **Orphaned test**: Test exists but no requirement → possibly outdated

---

## 3. BDD Scenario Generation

From acceptance criteria, generate Gherkin scenarios:

```gherkin
Feature: [Feature Name]

  Scenario: Happy path
    Given [precondition]
    When [action]
    Then [expected result]

  Scenario: Edge case - [description]
    Given [boundary condition]
    When [action]
    Then [expected behavior at boundary]

  Scenario: Error - [description]
    Given [error condition]
    When [action]
    Then [error handling behavior]
```

---

## 4. Coverage Analysis

For each requirement:
- Has at least one automated test? (unit, integration, or E2E)
- Has manual verification plan?
- Risk level if untested? (high/medium/low)

### Coverage Report Format
```
Total Requirements: N
  Covered (automated): X (Y%)
  Covered (manual only): A (B%)
  Untested: C (D%) ← these are risks

High-risk untested: [list]
```

---

## Usage Pattern

```
1. EXTRACT acceptance criteria from PRD/requirements doc
2. VALIDATE each criterion with SMART check
3. BUILD traceability matrix (requirement → test)
4. IDENTIFY gaps (untested requirements, orphaned tests)
5. GENERATE missing test scenarios (BDD format)
6. REPORT coverage with risk assessment
```
