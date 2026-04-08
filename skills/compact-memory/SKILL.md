---
name: compact-memory
description: Compact and deduplicate the current project's memory files. Use when memory files are getting large, before starting a long session, or when asked to "compactar memória", "limpar memória", "compact memory", or "organizar os gotchas". Keeps MEMORY.md under 200 lines and removes resolved/redundant entries from detail files.
---

# Compact Memory

Consolida os arquivos de memória do projeto, removendo entradas redundantes, desatualizadas ou muito verbosas. Reduz custo de contexto em sessões longas.

---

## Step 1 — Read all memory files

Identify the memory directory for the current project:
- Default: `~/.claude/projects/<project-slug>/memory/`
- List all `.md` files there

Read each file in full.

---

## Step 2 — Audit MEMORY.md

`MEMORY.md` is loaded automatically — must stay **under 200 lines**.

Check for:
- [ ] Duplicate IDs or references already in CLAUDE.md
- [ ] Completed task context that's no longer relevant
- [ ] Entries that can be summarized in 1 line instead of 5
- [ ] Links to detail files that no longer exist

**Rule:** If something is already in the project's `CLAUDE.md`, remove it from `MEMORY.md`.

---

## Step 3 — Audit detail files (e.g. n8n-gotchas.md)

For each gotcha/pattern file, remove or merge:

1. **Superseded entries** — if a newer gotcha replaces an older one, keep only the latest
2. **Resolved entries** — bugs that have been permanently fixed in code (not just worked around)
3. **Duplicate patterns** — two entries describing the same root cause
4. **Numbered gaps** — re-number sequentially after removals (e.g., if #11 was removed, rename #12→#11)

**Keep:**
- Active bugs that could recur
- Non-obvious API behaviors (n8n quirks, Slack/Linear edge cases)
- Format/syntax rules that are easy to get wrong

---

## Step 4 — Rewrite files

Use the **Edit** or **Write** tool to apply changes:

- `MEMORY.md` → must be ≤ 200 lines after compaction
- Detail files → no hard limit, but prefer dense/reference style over narrative

Do NOT remove entries that were added in the last session (they haven't been validated as stable yet).

---

## Step 5 — Confirm

Report to the user:
```
✅ Memory compacted
   MEMORY.md:       X → Y lines
   n8n-gotchas.md:  X → Y lines
   Removed: [list of removed/merged entries]
   Kept:    [count] entries
```
