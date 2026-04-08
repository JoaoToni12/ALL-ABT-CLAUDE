---
description: n8nac CLI usage rules and Claude Code plugin integration
globs: ["**/workflows/**", "**/*n8n*", "**/n8nac*", "**/AGENTS.md"]
---

# n8n-as-a-code (n8nac) — Regras de Uso

`n8nac` v1.5.3 instalado globalmente. Usar como camada de gerenciamento de arquivos para workflows n8n complexos, complementando o n8n MCP.

## Quando usar n8nac vs MCP
- **n8nac**: gerenciar workflow como arquivo local (pull/push), versionar no GitLab, builds novos do zero
- **MCP (`mcp__n8n-mcp__*`)**: inspeção rápida, partial updates em workflows existentes, validação, execuções

## Comandos principais
```bash
n8nac init-auth          # configurar instância e credenciais (fazer uma vez por projeto)
n8nac pull <id>          # baixar workflow do n8n para arquivo local JSON
n8nac push <arquivo>     # fazer upload do arquivo local para o n8n
n8nac list               # listar todos os workflows e status (local/remote/both)
n8nac find <query>       # encontrar workflow por nome parcial ou ID
n8nac verify <id>        # validar nós contra schema local (detecta typeVersion errado, params faltando)
```

## Regras de workflow
- **Sempre fazer `n8nac pull` antes de editar** — nunca editar o arquivo local sem sincronizar estado atual
- **Sempre fazer `n8nac verify` após editar** — valida schemas de nós antes do push
- **`n8nac push` = deploy** — só fazer push quando o workflow estiver pronto para ir ao ar
- Manter arquivos de workflow no repositório do projeto sob `workflows/`
- Nunca commitar arquivos com credenciais hardcoded nos nós

## Integração com Claude Code (plugin)

Plugin instalado via dois comandos no Claude Code CLI (fazer uma vez no user level):
```
/plugin marketplace add EtienneLescot/n8n-as-code
/plugin install n8n-as-code@n8nac-marketplace
```

Por projeto (executar na raiz do repositório do projeto):
```bash
npx --yes n8nac init          # cria n8nac-config.json com credenciais da instância
npx --yes n8nac update-ai     # gera AGENTS.md com ontologia completa de nós
```

O arquivo `AGENTS.md` gerado contém o schema de 537 nós — Claude Code lê automaticamente.
Todo `CLAUDE.md` de projeto n8n deve referenciar:
```md
Para qualquer tarefa n8n neste repositório:
1. Leia `./AGENTS.md` antes de planejar, codificar ou revisar.
2. Trate `./AGENTS.md` como autoritativo e obrigatório.
```

O plugin provê ao Claude Code: node search offline, schema lookup sem alucinação, exemplos de workflow e validação — complementando o n8n MCP.
