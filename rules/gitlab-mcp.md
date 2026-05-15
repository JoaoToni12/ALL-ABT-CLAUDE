---
description: GitLab MCP usage rules — official OAuth flow, when to prefer glab CLI, branch protection awareness.
globs: ["**/*"]
---

# GitLab MCP — Regras de Uso

Servidor oficial mantido pela GitLab (não Anthropic, não comunidade `zereight/gitlab-mcp`). Docs: [docs.gitlab.com/user/gitlab_duo/model_context_protocol/mcp_server](https://docs.gitlab.com/user/gitlab_duo/model_context_protocol/mcp_server/).

## Auth (uma vez por máquina)

OAuth 2.0 Dynamic Client Registration:

```
mcp__gitlab__authenticate              # abre browser para autorização
mcp__gitlab__complete_authentication   # finaliza troca de tokens
```

Para adicionar o servidor (caso não esteja conectado):

```
claude mcp add --transport http GitLab https://gitlab.com/api/v4/mcp
```

Token salvo no sistema; não precisa re-auth a cada sessão. Se a sessão pedir auth de novo: o token expirou.

## Quando usar MCP vs `glab` / `git` CLI

| Tarefa | Ferramenta preferida | Por quê |
|---|---|---|
| Listar MRs, filtrar por autor/label | MCP | JSON estruturado, fácil de pivotar |
| Ler diff de um MR | MCP | Bom para review automatizado |
| Adicionar comentário de review | MCP | Threading + reply context preservado |
| Criar MR novo | `glab mr create` | Mais previsível, menos hop de auth |
| Push de branch | `git push` direto | MCP não tem advantage |
| Aprovar MR / merge | MCP, com confirmação | É destrutivo — `pre-mcp-destructive.js` escala |
| Triagem de pipeline failure | `glab ci status` + MCP para detalhes | CLI lista, MCP mergulha |

## Branch protection NÃO é preempted

O MCP **não bloqueia** push/merge para branches protegidos antes de chamar a API. Ele depende do server-side reject (403/422) do GitLab. Falhas aparecem como erros pós-fato.

**Antes** de qualquer operação destrutiva (merge, branch delete, tag delete): verificar se a branch está protegida via `mcp__gitlab__*` get_branch_protection (ou equivalente). Se sim, garantir que o usuário tem maintainer access.

## Convenções de MR

- **Draft por padrão** para qualquer MR não-trivial: começa como `Draft:` no título; usuário promove quando pronto.
- **Descrição obrigatória**: testes rodados, screenshots se UI, link para Linear issue se aplicável.
- **Reviewer assignment**: nunca auto-assign sem perguntar; CoE tem reviewers rotativos.
- **Squash on merge**: default do GitLab; se o feature branch tem muito commit de "fix typo", squash garante histórico limpo.

## Pitfalls conhecidos

1. **CI variables não aparecem via MCP** — para inspecionar `${CI_*}` env, usar `glab variable list` (CLI) ou UI.
2. **MR templates** carregam automaticamente em `glab mr create` mas o MCP pode ignorar — checar a description renderizada antes de finalizar.
3. **Self-hosted GitLab** (não SaaS) exige opt-in explícito em 17.x+. Configuração de instance varia.

## Por que essa regra existe

**Why:** MCP novo no setup, OAuth flow não-óbvio, e fácil cometer merge destrutivo achando que branch protection vai salvar. Drift entre `glab` CLI e MCP em produtividade depende da tarefa.

**How to apply:** Em pipelines de MR review, MCP. Em criar/pushar, CLI. Antes de merge → confirmar branch protection live antes da call. Tudo destrutivo passa pelo `pre-mcp-destructive.js`.

Referências: [[reference_n8n_instance]] (similar Mac/PC sync pattern com instâncias autenticadas).
