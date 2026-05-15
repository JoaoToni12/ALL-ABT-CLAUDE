---
description: n8nac v2 CLI usage rules, environment-based config, and Claude Code plugin integration
globs: ["**/workflows/**", "**/*n8n*", "**/n8nac*", "**/AGENTS.md", "**/*.workflow.ts"]
---

# n8n-as-a-code (n8nac v2) — Regras de Uso

`n8nac` v2.2.1 instalado globalmente (upgraded from v1.5.3 em 2026-05-15). Para boundary canônico vs n8n MCP, ver `CLAUDE.md`. Este rule cobre comandos e gotchas.

## ⚠️ Breaking changes v1 → v2 (importante)

| v1.5.3 (removed) | v2.x (substituto) |
|---|---|
| `n8nac init` | `n8nac setup` (escolhe modo do facade) |
| `n8nac init-auth --host --api-key` | `n8nac env auth set <name> --api-key-stdin` |
| `n8nac init-project --project-index --sync-folder` | `n8nac env add <name> --base-url <url> --sync-folder <path>` |
| `n8nac switch` | `n8nac env use <name>` |
| (config único) | `n8nac workspace migrate` (migra projeto v1 → v2 environments) |

**Para projetos existentes** (com `n8nac-config.json` v1): rodar `n8nac workspace migrate --json` (dry-run) → revisar → `n8nac workspace migrate --write` em cada repo de automação local.

Para descobrir quais projetos precisam de migration:

```powershell
# PowerShell
Get-ChildItem -Path $HOME -Recurse -Filter "n8nac-config.json" -ErrorAction SilentlyContinue
```
```bash
# Bash / Git Bash
find ~ -name "n8nac-config.json" 2>/dev/null
```

## Workspace environments (v2 conceito novo)

Config v2 substitui o único `n8nac-config.json` por **environments** (Dev/Staging/Prod), cada um com base URL, API key, sync folder próprios:

```bash
# Setup inicial num projeto novo (replaces init)
n8nac setup                                              # escolher modo facade
n8nac env add Dev --base-url https://n8n.example.com --sync-folder workflows/dev
n8nac env auth set Dev --api-key-stdin                   # cola JWT, Enter, Ctrl+D
n8nac env use Dev                                         # marca Dev como ativo
n8nac update-ai                                          # regenera AGENTS.md
```

Para promover workflow entre envs (v2 feature):
```bash
n8nac promote workflows/dev/my-flow.workflow.ts --to Prod
```

## Fluxo obrigatório: editar workflow existente

1. `n8nac list` → ver todos os workflows + status sync
2. `n8nac pull <workflowId>` → baixar versão remota → .ts local no sync-folder do env ativo
3. Editar o `.workflow.ts` no editor
4. `n8nac skills validate <arquivo.ts>` → validar localmente
5. `n8nac push <arquivo.workflow.ts> --verify` → subir + verificar live

## Regra crítica de diretório

SEMPRE rodar n8nac a partir da raiz do projeto (onde fica `n8nac-config.json` v1 ou `.n8nac/` v2). Sintoma de diretório errado em v2: "no environments configured" ou "workspace not initialized".

## Protocolo antes de criar/editar nós (NUNCA adivinhar parâmetros)

```bash
n8nac skills examples search "slack notification"   # buscar exemplo da comunidade
n8nac skills search "google sheets"                 # encontrar nome exato do nó
n8nac skills node-info googleSheets                 # schema completo
n8nac skills node-schema googleSheets               # snippet rápido
n8nac skills validate <arquivo.ts>                  # validar localmente
```

- `type`: usar EXATAMENTE o valor do schema, com prefixo de pacote (`n8n-nodes-base.switch`)
- `typeVersion`: usar a versão MAIS ALTA disponível no schema — nunca inventar
- Nomes de parâmetros: exatamente como no schema (`spreadsheetId`, não `spreadsheet_id`)

## Estrutura do arquivo .workflow.ts

### Mínima

```typescript
import { workflow, node, links } from '@n8n-as-code/transformer';

@workflow({ name: 'Nome do Workflow', active: false })
export class MeuWorkflow {
  @node({ name: 'Get Data', type: 'n8n-nodes-base.httpRequest', version: 4.2, position: [250, 300] })
  GetData = { url: 'https://api.exemplo.com', method: 'GET' };

  @links()
  defineRouting() {
    this.GetData.out(0).to(this.ProximoNo.in(0));
  }
}
```

(Transformer ainda é `@n8n-as-code/transformer`, atualizado para 2.0.0 — sem breaking change no decorator API.)

### Nós de AI — padrão crítico

Nós com flag `[ai_*]` no NODE INDEX usam SEMPRE `.uses()`, nunca `.out().to()`:

```typescript
@links()
defineRouting() {
  this.ChatTrigger.out(0).to(this.AiAgent.in(0));
  this.AiAgent.uses({
    ai_languageModel: this.OpenaiModel.output,
    ai_memory: this.Memory.output,
    ai_tool: [this.SearchTool.output],         // SEMPRE array
    ai_document: [this.Doc.output],            // SEMPRE array
  });
}
```

### Expressões

```
✅ {{ $json.fieldName }}
✅ {{ $('NomeDoNo').item.json.field }}
❌ {{ $node["Name"].json.field }}  (legado, evitar)
❌ $items / $item  (usar $json)
```

### Nomes de nós

Padrão "Ação Recurso": "Get Customers", "Send Email", "Filter Duplicates". Evitar: "Node1", "HTTP Request", "Code".

## Erros comuns — evitar

| Erro | Sintoma | Solução |
|---|---|---|
| `type` sem prefixo de pacote | Silencioso | Usar `n8n-nodes-base.switch` |
| `typeVersion` inventado | "Could not find workflow" | Usar versão mais alta do schema |
| `operation` inválido | "Could not find property option" | Verificar `options[].value` no node-schema |
| `resource` + `operation` de seções diferentes | Comportamento inesperado | Cada resource tem seu próprio set de operations |
| AI sub-nó com `.out().to()` | Conexões invisíveis/quebradas | Usar `.uses()` |
| `ai_tool` como ref simples | Erro de conexão | Sempre array: `[this.Tool.output]` |
| `value1`/`value2` invertidos em Switch/If | Regras nunca batem | `value1` = expressão, `value2` = literal |
| Backtick em Code node | Parse error | Usar `String.fromCharCode(96)` |
| "No environments configured" (v2) | Rodando v2 em projeto não migrado | `n8nac workspace migrate --write` |
| "CLI not configured" (v1 stale) | n8nac fora do projeto OU projeto não-inicializado | `cd` para a raiz ou `n8nac setup` + `n8nac env add` |

## Resolver conflitos

```bash
n8nac resolve <id> --mode keep-current    # forçar versão local
n8nac resolve <id> --mode keep-incoming   # forçar versão remota
```

## Workflow de teste

REGRA: só trocar o trigger. NÃO simplificar a lógica do workflow. A versão de teste deve ser funcionalmente idêntica à prod.

## Comandos de referência rápida (v2)

```bash
# Inspect
n8nac list                                # listar todos + status
n8nac list --local                        # só locais
n8nac find "query"                        # buscar por nome/ID/filename
n8nac fetch <id>                          # atualizar cache remoto
n8nac verify <id>                         # validar workflow live

# Edit cycle
n8nac pull <id>                           # remoto → local
n8nac push <file> --verify                # local → remoto + verify
n8nac promote <file> --to <env>           # promote entre environments

# Testing
n8nac test <id>                           # trigger via webhook/chat/form
n8nac test-plan <id>                      # plano de teste sugerido
n8nac execution <subcommand>              # inspect executions

# Workflow lifecycle
n8nac workflow activate <id>
n8nac workflow deactivate <id>
n8nac workflow present <id>               # render summary

# Convert
n8nac convert <file>                      # JSON ↔ TS
n8nac convert-batch <dir>                 # batch

# Environments
n8nac env list
n8nac env use <name>
n8nac env add <name> --base-url <url> --sync-folder <path>
n8nac env auth set <name> --api-key-stdin
n8nac workspace migrate --write           # migrar config v1 → v2
n8nac workspace inspect                   # ver estado atual

# Skills + AI
n8nac skills search "query"
n8nac skills node-info <nodeName>
n8nac skills node-schema <nodeName>
n8nac skills validate <file>
n8nac skills examples search "query"
n8nac skills examples download <id>
n8nac update-ai                           # regenerar AGENTS.md

# Credentials
n8nac credentials                         # readiness recipes
n8nac credential                          # manage credentials

# MCP server (novo em v2)
n8nac mcp                                 # start n8n-as-code MCP server
```

## Checklist antes de qualquer operação

- [ ] Estou na raiz do projeto? (`pwd`)
- [ ] `n8nac list` roda sem erro? Se não → verificar env ativo via `n8nac env list`.
- [ ] Projeto está em v2? (`n8nac workspace inspect`) Se v1, rodar `workspace migrate --write` antes.
- [ ] Fiz `pull` antes de editar?
- [ ] Schema verificado via `node-info` para nós novos?
- [ ] Validei com `n8nac skills validate`?
- [ ] Fiz push com `--verify` ou rodei `n8nac verify` após push?
- [ ] Não simplifiquei lógica em workflow de teste?
- [ ] Não commitei `credentials.json`?

## Integração com Claude Code (plugin)

Plugin já habilitado em `~/.claude/settings.json` via marketplace `EtienneLescot/n8n-as-code`. Para atualizar:

```
/plugin marketplace update
/plugin update n8n-as-code
```

Setup por projeto (v2):

```bash
n8nac setup                               # uma vez por projeto
n8nac env add Dev --base-url <url> --sync-folder workflows
n8nac env auth set Dev --api-key-stdin    # cola JWT
n8nac env use Dev
n8nac update-ai                           # gera AGENTS.md (537+ nodes)
```

Todo `CLAUDE.md` de projeto n8n deve referenciar:

```md
Para qualquer tarefa n8n neste repositório:
1. Leia `./AGENTS.md` antes de planejar, codificar ou revisar.
2. Trate `./AGENTS.md` como autoritativo e obrigatório.
```

## Fallback: quando n8nac não resolve

Usar Python API diretamente apenas se n8nac não suportar a operação. **ATENÇÃO**: `json.load`/`dump` corrompe template literals (backticks) e expressões JS em Code nodes — preferir sempre o n8nac.
