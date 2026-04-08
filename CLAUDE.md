# User-Level Claude Instructions

> Domain-specific rules (Snowflake, n8n, Notion, debugging) live in `.claude/rules/` and are loaded automatically by glob scope.

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
