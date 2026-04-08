---
name: sync-n8n-workflow
description: Sync the local n8n workflow JSON with the deployed state in n8n. Use when the user wants to sync, export, or update the local workflow JSON after deploying changes. Trigger on /sync-n8n-workflow or when asked to "sincronizar o workflow", "exportar o json", "sync local" or "atualizar json local".
---

# Sync n8n Workflow → Local JSON

Busca o workflow do n8n e escreve o JSON local em uma única operação. Roda **uma vez no final da sessão**, não após cada deploy.

---

## Step 1 — Identify target

If workflow ID and local path are not obvious from context, ask:
> "Qual o ID do workflow e o caminho do arquivo JSON local?"

For OPEX-2 / WF1 the defaults are:
- **Workflow ID:** `BxEUG84X7BPmvgMu`
- **Local path:** `n8n/workflows/wf1-slack-modal-intake.json`

---

## Step 2 — Fetch full workflow

```
n8n_get_workflow(id="<workflow_id>", mode="full")
```

The result is saved to a persisted file. Note the file path returned in `<persisted-output>`.

---

## Step 3 — Write Python sync script

Use the **Write tool** to create a temp file (e.g., `$TMPDIR/sync_workflow.py`):

```python
import json

# UPDATE these two paths per session:
TOOL_FILE = r'<path from persisted-output>'
OUT_FILE  = r'<absolute local json path>'

with open(TOOL_FILE, encoding='utf-8') as f:
    outer = json.loads(f.read())

wf_data = json.loads(outer[0]['text'])['data']

local_wf = {
    "id":          wf_data['id'],
    "name":        wf_data['name'],
    "active":      wf_data['active'],
    "nodes":       wf_data['nodes'],
    "connections": wf_data['connections'],
    "settings":    wf_data.get('settings', {}),
    "staticData":  wf_data.get('staticData'),
    "tags":        wf_data.get('tags', [])
}

with open(OUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(local_wf, f, indent=2, ensure_ascii=False)

print(f"OK — {len(local_wf['nodes'])} nodes written to {OUT_FILE}")
```

> **CRITICAL:** Always use `encoding='utf-8'` on both open() calls. Windows default (cp1252) breaks on em dashes and special chars in node names.

---

## Step 4 — Run script

```bash
python3 $TMPDIR/sync_workflow.py
```

---

## Step 5 — Sanity checks

After sync, verify:

```python
# Quick check — add to script or run separately
for n in local_wf['nodes']:
    if n.get('type') == 'n8n-nodes-base.webhook':
        assert n.get('webhookId'), f"MISSING webhookId on {n['name']}"
    if n.get('id') == 'n05a-open-modal':
        p = n['parameters']
        assert p.get('url'), "N05a URL is empty — updateNode wiped parameters!"
        assert p.get('method'), "N05a method is missing"
print("Sanity checks passed")
```

---

## Step 6 — Commit

```bash
git add n8n/workflows/<workflow-file>.json
git commit -m "chore: sync local workflow JSON from n8n"
```

---

## Common Pitfalls

| Problem | Cause | Fix |
|---|---|---|
| `UnicodeDecodeError` | Missing `encoding='utf-8'` | Add to both `open()` calls |
| `JSONDecodeError: Extra data` | File has Read tool line-number prefix | Strip `→` prefix or use raw file path |
| `N05a URL empty` | `updateNode` replaced all params | Re-apply full params (method/url/auth/options) |
| Script not found | Windows path with `~` in bash | Use absolute path from system temp dir |
