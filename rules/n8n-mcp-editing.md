---
description: Safety rules for editing n8n workflows via MCP tools
globs: ["**/workflows/**", "**/*n8n*"]
---

# n8n MCP — Regras de Edição de Workflows

Ao usar ferramentas `mcp__n8n-mcp__*` para editar workflows:

## Antes de Qualquer Update
- **Sempre buscar estado atual** via `n8n_get_workflow(mode="full")` antes de partial updates
- Partial updates (`n8n_update_partial_workflow`) **sobrescrevem campos omitidos** — incluir TODOS os campos existentes no payload, não apenas os alterados
- Usar `nodeId` (não `name`) para identificar nós — nomes com `.`, `/` ou caracteres especiais causam "Node not found"
- **Nunca alterar `typeVersion` de um nó** durante updates a menos que explicitamente pedido — preservar o `typeVersion` existente do estado fetched. Alterar silenciosamente quebra o comportamento do nó

## Batching de Updates
- Updates grandes (>5 nós) devem ser feitos em grupos de 3-5 nós por chamada
- Re-fetch o workflow completo após cada batch para confirmar estado
- Nunca assumir que o estado anterior ao batch ainda é válido após aplicar mudanças

## Limitações Conhecidas do MCP
- **Payload size cap**: chamadas muito grandes falham silenciosamente — batch é obrigatório
- **`sourceOutputIndex`**: não é confiável para nós IF/Switch — verificar manualmente conexões após update
- **Auto-sanitization**: afeta TODOS os nós na chamada, não apenas os alterados — sempre re-fetch completo
- **Validator false positives**: erros em Code nodes com `$('NodeName')` ou regex com `)` são falsos positivos

## Verificação Pós-Edição
- Após cada update: re-fetch workflow + validar (`n8n_validate_workflow`)
- Conferir: contagem de nós, valores alterados, valores que deviam permanecer iguais
- Se divergência detectada: corrigir antes de prosseguir, nunca ignorar
- Em edições multi-nó: comparar estado antes vs depois — garantir que funcionalidade existente não quebrou

## Expression Syntax Gotchas
- `$('NodeName').first().json.field` — correto para referenciar outros nós
- `$input.first().json` — correto para input do nó atual
- `.item.json` é INVÁLIDO na maioria dos contextos — nunca usar sem verificar
- Na dúvida, consultar docs de expressões n8n antes de escrever
