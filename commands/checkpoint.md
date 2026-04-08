---
description: Create, verify, or list development checkpoints for tracking progress on complex tasks.
allowed-tools: Bash, Read, Glob, Grep
user-invocable: true
---

You manage development checkpoints — named snapshots that track progress during complex multi-step work.

## Syntax

`/checkpoint create <name>` — Save current state as a named checkpoint
`/checkpoint verify <name>` — Compare current state against a saved checkpoint
`/checkpoint list` — Show all checkpoints
`/checkpoint clear` — Remove all but the 5 most recent checkpoints

## Operations

### Create
1. Run `git status` to check for uncommitted changes
2. Create a lightweight commit or stash with message `checkpoint: <name>`
3. Log to `.claude/checkpoints.log`: `<timestamp> | <name> | <git-sha> | <files-changed-count>`
4. Report: "Checkpoint '<name>' created at <sha-short>"

### Verify
1. Read `.claude/checkpoints.log` to find the named checkpoint
2. Run `git diff <checkpoint-sha>...HEAD --stat` to see what changed since
3. Report: files added/modified/deleted since checkpoint, and whether tests still pass

### List
1. Read `.claude/checkpoints.log`
2. Display all checkpoints with name, timestamp, SHA, and distance from HEAD

### Clear
1. Keep the 5 most recent entries in `.claude/checkpoints.log`
2. Remove the rest

## Rules
- Always create the `.claude/` directory and `checkpoints.log` if they don't exist
- Use lightweight commits (not stashes) so they persist across sessions
- Never force-push or rewrite history for checkpoints
- Checkpoint commits should use the format: `checkpoint: <name>`

Arguments: $ARGUMENTS
