---
name: context-driven-testing
description: "Apply context-driven testing principles where practices are chosen based on project context, not universal 'best practices'. Use when making testing decisions, questioning dogma, or adapting approaches to specific project needs."
---

# Context-Driven Testing

Practices are chosen based on project context — not universal "best practices."

---

## Seven Principles

1. Value of any practice depends on its context
2. Good practices in context, no universal best practices
3. People working together are most important
4. Projects unfold in unpredictable ways
5. Product is a solution — if problem not solved, product fails
6. Good testing is challenging intellectual work
7. Judgment and skill determine right things at right times

---

## Context Factors

| Factor | Questions to Ask |
|--------|-----------------|
| **Project** | Business goal? User needs? Failure impact? |
| **Constraints** | Timeline? Budget? Team skills? Legacy systems? |
| **Risk** | Safety-critical? Regulated? High volume? |
| **Technical** | Stack quirks? Integrations? Observability? |

---

## Investigation vs. Checking

| Checking | Investigation |
|----------|--------------|
| Did API return 200? | Does API meet user needs? |
| Does button work? | What happens under load? |
| Matches the spec? | Does it solve the problem? |
| Script says PASS | Are there problems the script misses? |

---

## Adapting to Context

### High-risk automation (financial, PII)
- Rigorous verification of every output
- Traceability from requirement to test
- Security checks on all integrations

### Internal tool / low-risk
- Smoke test critical path
- Spot-check outputs
- Focus on usability over exhaustive coverage

### New automation (greenfield)
- Heavier exploratory testing
- Requirements likely incomplete — investigate
- Build test knowledge as you go

### Mature automation (maintenance)
- Regression focus
- Change impact analysis
- Monitor for drift from expected behavior

---

## SFDIPOT Heuristic (for test idea generation)

| Dimension | What to Test |
|-----------|-------------|
| **S**tructure | Components, data structures, code paths |
| **F**unction | Features, capabilities, operations |
| **D**ata | Inputs, outputs, transformations, boundaries |
| **I**nterfaces | APIs, UIs, integrations between systems |
| **P**latform | OS, browser, infrastructure, environment |
| **O**perations | Workflows, processes, user journeys |
| **T**ime | Timing, concurrency, scheduling, deadlines |

---

## For Verification Agents

When verifying a CoE automation:
1. **Read the PRD** — understand the business context
2. **Identify risk level** — financial? PII? customer-facing?
3. **Choose verification depth** based on risk:
   - High risk → verify every criterion, every integration, every output
   - Low risk → verify critical path, spot-check the rest
4. **Adapt as you learn** — if you find a bug, increase scrutiny in that area
5. **Report with context** — not just PASS/FAIL, but "this matters because..."
