---
description: Bash variable interpolation safety, JSON/regex special character traps, encoding gotchas on Windows
globs: ["**/*.json", "**/*.jsonc", "**/*.ts", "**/*.tsx", "**/*.js", "**/*.py", "**/*.workflow.ts", "**/*.md"]
---

# Bash & JSON Safety

## Bash variable interpolation em workflow JSON

Ao escrever arquivos JSON que contêm expressões n8n (como `$json`, `$env`, `$input`, `$node`), **bash tentará interpolar estas variáveis** se o JSON for passado via heredoc ou echo com aspas duplas. Isso silenciosamente corrompe o arquivo.

**Regra:** Nunca usar bash heredoc ou echo com aspas duplas para escrever workflow JSON.

```bash
# ERRADO — bash interpola $json e $input
cat > workflow.json << EOF
{ "expression": "{{ $json.field }}" }
EOF

# CORRETO — usar a Write tool diretamente (sem bash)
# OU usar single quotes no heredoc:
cat > workflow.json << 'EOF'
{ "expression": "{{ $json.field }}" }
EOF

# CORRETO — usar Python para escrever o arquivo (preserva encoding também)
python3 -c "
import json
data = {'expression': '{{ \$json.field }}'}
with open('workflow.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
"
```

**Sempre preferir a Write tool** para criar/atualizar arquivos JSON — ela não passa pelo shell e não tem problema de interpolação.

## Caracteres especiais em regex

Ao escrever padrões regex (especialmente para filtros de PII, validação de CPF, telefone):

- **Nunca digitar caracteres especiais de memória** — copiar do dado fonte real
- **Em dash** (`—`, U+2014) ≠ **hyphen** (`-`, U+002D) ≠ **en dash** (`–`, U+2013) ≠ **á** (U+00E1)
- CPF pattern: `\d{3}\.\d{3}\.\d{3}-\d{2}` — usar hyphen simples, não em dash
- Telefone: `\b\d{9,11}\b`
- Verificar com `charCodeAt()` ou `ord()` se suspeitar de caractere errado

```javascript
// Verificar se o regex está usando o caractere certo
const pattern = /\d{3}\.\d{3}\.\d{3}-\d{2}/;
console.log([...'-'].map(c => c.charCodeAt(0))); // deve ser [45] para hyphen
```

## Encoding em arquivos de workflow

- **Sempre usar UTF-8** ao ler/escrever workflow JSON no Windows
- `cp1252` (default do Windows) quebra em dashes, aspas curvas, e acentos presentes em nomes de nós
- Em Python: `open(path, encoding='utf-8')` em TODOS os `open()` calls
- Em Node.js: `fs.readFileSync(path, 'utf8')`
