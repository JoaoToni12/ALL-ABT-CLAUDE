# User-Level Claude Instructions

> Domain-specific rules (Snowflake, n8n, Notion, PII, debugging) live in `.claude/rules/` and are loaded automatically by glob scope.

## n8n Workflow Conventions
- Always use n8nac (not MCP node-by-node) for n8n workflow deployment
- Cron timezone should match your operational timezone (e.g., America/Sao_Paulo for BR ops), NOT UTC by default
- Never auto-strip resource/operation fields from Slack nodes during partial updates
- Verify column names against actual schema before writing queries
- Default test/dev outputs should be disabled before any workflow update to avoid accidental writes to production Notion/Slack

## General Coding Standards

### Code Style
- Prefer immutability — create new objects instead of mutating existing ones
- Keep files between 200-400 lines (500 max for complex modules, 800 absolute ceiling)
- Keep functions under 50 lines — split at clear boundaries
- Maximum 4 levels of nesting — flatten with early returns or guard clauses
- No hardcoded values — use constants or config
- Organize by feature/domain, not by file type

### Error Handling
- Handle errors at every level — no silent failures
- Validate all input at system boundaries (user input, API responses, webhooks, file reads)
- Fail fast with clear error messages
- Treat all external data as untrusted

### Git Workflow
- Commit messages follow: `<type>: <description>` (feat, fix, refactor, docs, test, chore, perf, ci)
- Commits should be atomic — one logical change per commit
- Review all changes before pushing (run tests + quality checks)
- Never commit directly to main/master

### Testing
- Write tests first when possible (TDD: Red → Green → Refactor)
- Test types: unit (isolated functions), integration (API/DB), E2E (critical paths)
- When fixing bugs: write a failing test that reproduces the bug before fixing it

### Security Checklist (before any commit)
- No hardcoded secrets (API keys, passwords, tokens)
- All user inputs validated
- SQL injection prevention (parameterized queries only)
- Error messages don't leak sensitive data
- Credentials in environment variables or secret managers, never in code
- PII never published to ticket systems / chat / logs (see `rules/pii-handling.md`)

## Diagnosis Discipline
- Do NOT change working credentials or configurations when debugging — confirm the actual failure mode first
- When a fix doesn't work after 1-2 attempts, STOP and re-examine assumptions instead of trying more variations
- For 403/auth errors: check webhook path/ID mismatch and Slack app interactivity URL FIRST before blaming DNS, network, or credentials
- Surface your current hypothesis before making changes so the user can correct course early

## Token & Context Discipline

### Subagent routing for read-only investigation
Keep verbose read-only work OUT of the main context. Delegate to a subagent (typically `Explore`) so only the summary re-enters the main conversation.

Default candidates to delegate:
- Data warehouse `SELECT` / validation queries that return rows Claude only needs to summarize
- `n8n_executions` log scraping and error diagnosis across many runs
- Multi-workflow diagnostic sweeps (one subagent per workflow, dispatched in parallel)
- `n8n_get_workflow(mode="full")` inspection when the answer is a single field or count
- Exploration across unfamiliar directories (Glob/Grep sweeps with >5 result files)

Rules when delegating:
- State explicitly in the prompt: "Read-only. Do not write/edit. Return findings only."
- For parallel investigations, dispatch N subagents in a SINGLE message (multiple Agent tool_use blocks)
- Ask for a bounded-length report (e.g. "report in under 200 words") so the summary doesn't bloat main context
- Never delegate synthesis or decision-making — the subagent returns findings, you decide the fix

### Model routing by task character
Switch models mid-session via `/model` when the task character changes. Don't run everything on Opus.

- **Haiku** (`claude-haiku-4-5-20251001`) — mechanical work: simple MCP lookups, JSON field validation, grep/glob navigation, git read ops, file renames, single-value fetches
- **Sonnet** (current: 5, `claude-sonnet-5`) — standard implementation, most debugging, workflow edits, routine refactors
- **Opus** (current: 4.8, `claude-opus-4-8`) — architecture, multi-step reasoning, complex cross-file debugging, novel design
- **Fable** (`claude-fable-5`) — new tier as of mid-2026; no established routing rule yet, evaluate case by case before adopting a default use case

When in doubt about the exact model ID, use `/model` to switch — the picker shows what's available.

### n8nac vs n8n MCP — boundary canônico

**n8nac (n8n-as-code v2.x)** é a camada de gerenciamento de arquivos. Use para:
- Deploy de workflow (`n8nac push <file> --verify`)
- Builds novos do zero (autoria local em `.workflow.ts` + push)
- Versionamento em GitLab/Git
- Validação local antes de deploy (`n8nac skills validate`)

**n8n MCP (`mcp__n8n-mcp__*`)** é a camada de inspeção/edição runtime. Use para:
- Inspeção rápida (`n8n_get_workflow`, `n8n_list_workflows`, `n8n_executions`)
- Partial updates em workflows já deployed (especialmente AI sub-nodes que n8nac não cobre bem)
- Validação no servidor (`n8n_validate_workflow`)
- Testes ad-hoc (`n8n_test_workflow`)
- Versionamento server-side (`n8n_workflow_versions`)

**Regra de ouro**: se o arquivo `.workflow.ts` é a fonte da verdade no repo → n8nac. Se a fonte da verdade é o n8n server e você precisa inspecionar/ajustar → MCP. Quando ambos parecem aplicáveis, prefira n8nac (revertível via git).

### When to split a project CLAUDE.md into a context skill
Move reference-style content out of project CLAUDE.md into a project-level skill at `.claude/skills/<project>-context/SKILL.md` when ALL THREE hold:
1. CLAUDE.md has >50 lines of reference material
2. Sessions often touch only a subset where most of CLAUDE.md is dead weight
3. The content is looked up on demand (tables, endpoints, schemas, IDs), not applied every turn

Stays in CLAUDE.md: architecture diagram, security mandates, branch/commit conventions, always-relevant guidance.
Moves to skill: ID tables, API endpoint catalogs, warehouse schemas, credential maps.

Store the skill INSIDE the repo (`.claude/skills/...`) — version-controlled with the code, not user-level.

Skip the split for small/short-lived automations — the overhead exceeds the savings.

@RTK.md
