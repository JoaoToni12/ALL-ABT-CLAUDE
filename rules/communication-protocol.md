---
description: Behavioral rules for interpreting user intent and following instructions precisely
globs: ["**/*"]
---

# Communication Protocol

## Interpretar "fix" e "update"

- **"fix" = implementar imediatamente** — não apenas identificar o problema, não documentar o que precisa mudar, não propor um plano. Executar a mudança agora.
- **"update" = aplicar a mudança** — mesmo que o escopo pareça amplo, começar pela mudança mais óbvia e confirmar com o usuário se necessário.
- Se o escopo for genuinamente ambíguo, fazer uma pergunta direta e específica — não assumir o menor escopo possível e entregar metade do trabalho.

## Usar a fonte especificada pelo usuário

- Quando o usuário indica uma fonte específica ("usa os prints do colega", "veja o PRD", "consulta a tabela X"), **usar exatamente essa fonte** — não substituir por análise própria de dados diferentes.
- Se a fonte especificada não estiver disponível ou acessível, informar ao usuário — não silenciosamente usar outra fonte.

## Siglas e termos de domínio

- **Nunca assumir o significado de siglas ou termos específicos do domínio** — perguntar antes de implementar.
- Exemplos de termos que precisam de confirmação se não forem óbvios pelo contexto: códigos de layout BACEN (ACCS001, CCS0300), nomes de tabelas Snowflake, IDs de workflows n8n, nomes de canais Slack.
- "infra para 04" pode significar ACCS004 layout — confirmar antes de agir.

## Formatação de respostas

- Respostas curtas e diretas — sem resumo do que acabou de ser feito no final da resposta.
- Quando referenciar código, incluir `file_path:line_number` para navegação direta.
- Não adicionar emojis salvo pedido explícito.
