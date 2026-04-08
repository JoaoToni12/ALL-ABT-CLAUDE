# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-08

### Added
- CLAUDE.md with universal coding standards (code style, error handling, git, testing, security)
- 5 contextual rules with glob scoping (Snowflake, n8n MCP, n8nac, Notion, debugging)
- 10 hooks: security guards (push, destructive git, sensitive files), quality gates (auto-format, debug statements, JSON validation, file size), session context injection, stop notification
- Hook profile system (minimal/standard/strict) via `CLAUDE_HOOK_PROFILE` env var
- 12 slash commands: plan, dev, research, review, tdd, build-fix, refactor-clean, quality-gate, checkpoint, orchestrate, verify-workflow, hook-profile
- 6 specialized agents with model selection: planner (sonnet), code-reviewer (sonnet), security-reviewer (sonnet), build-error-resolver (sonnet), doc-updater (haiku), verify-automation (opus)
- 23 domain skills: n8n (11), QA (5), deploy (4), core tools (3)
- /onboard skill for guided framework setup
- Cross-platform install scripts (install.sh + install.ps1)
- settings.json.template with placeholder substitution
- Documentation: README, BOUNDARIES decision guide, PROJECT-TEMPLATE
