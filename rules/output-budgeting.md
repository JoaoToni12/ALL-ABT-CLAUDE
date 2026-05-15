---
description: Long deliverables go to file; reply with summary + path. Avoids context waste and output token limits.
globs: ["**/*"]
---

# Output Budgeting

Mensagens longas inline desperdiçam contexto e às vezes batem no limite de output tokens. Escrever deliverables longos em arquivo e responder com resumo + path.

## Regra

Qualquer um destes vai pra arquivo (não inline):

- **Reports/análises >200 linhas** → arquivo `.md` no diretório do projeto
- **Listas de >50 itens** (tickets, queries, achados) → arquivo + resumo top-N na resposta
- **Código gerado >100 linhas** → arquivo `.js`/`.ts`/`.py`/etc., não code block
- **Slide decks, PRDs, docs canônicos** → sempre arquivo
- **SQL queries longas (>30 linhas)** → arquivo `.sql`
- **Dumps de execution data, logs, payloads brutos** → arquivo + 5-bullet resumo

Resposta inline depois de escrever em arquivo:

```
[Caminho do arquivo]
[3-5 bullets do que tem nele]
[1 próxima pergunta ou próximo passo]
```

## Path defaults

- Deliverable de projeto → diretório do projeto (`./deliverables/`, `./docs/`, ou onde já houver convenção)
- Análise transiente / scratch → temp do OS (`$env:TEMP\claude-scratch\{slug}.md` em PowerShell, `/tmp/claude-scratch/{slug}.md` em Unix)
- Nunca escrever em raiz do projeto sem motivo claro

## Não se aplica quando

- Usuário pediu explicitamente output inline ("me mostra aqui", "cola na conversa")
- Conteúdo é genuinamente curto (lista de 3-5 itens, snippet de <30 linhas)
- Resposta é uma decisão/recomendação curta — essas ficam inline mesmo
