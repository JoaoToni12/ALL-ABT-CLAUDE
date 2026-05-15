---
description: Slack message safety — no PII, no @channel, no raw payloads, test channels first.
globs: ["**/*"]
---

# Slack Safety

Workflows n8n + Claude Code frequentemente postam em Slack (alertas, summaries, modais). Risco: PII vaza, @channel spamma N pessoas, payload bruto inclui dados sensíveis.

## Regras

1. **Nunca usar `@channel` ou `@here`** em mensagem programática. Exceção: incidente real com on-call confirmado. Para alarms automáticos, mencione apenas o usuário ou grupo específico (`<@USER_ID>` ou `<!subteam^GROUP_ID>`).

2. **Nunca postar payload bruto de execução**. `JSON.stringify($json)` em modal ou bloco markdown é vetor de PII leak — fields como `customer_data`, `tx_payload`, `recipient` carregam dados protegidos. Sempre filtrar antes de postar.

3. **Test channels primeiro.** Antes de apontar workflow novo para canal de produção, rodar em canal de teste (ex: `#bots-test`, `#sandbox`). Confirmar o template renderiza certo, sem PII, sem @channel acidental.

4. **CPF/CNPJ/phone/email nunca no corpo**. Mesmo em DM. Referência por `tx_id` ou `customer_id`; quem tiver permissão consulta a fonte.

5. **Webhook URLs são secret.** `hooks.slack.com/services/...` é credencial — nunca commitar no repo, nunca printar em chat. O hook `pre-sensitive-files.js` bloqueia.

6. **Mensagens são imutáveis para auditoria.** Slack guarda histórico mesmo se você deletar. Assumir que tudo é retido por 90+ dias (depende da org). Não postar nada que não pode ser auditado.

## Template de alarm seguro

```
:warning: Caso suspeito detectado
- Transação: <tx_id>
- Score: 0.87 (threshold 0.7)
- Próxima ação: revisar em https://internal/case/<tx_id>
- Cc: <@on_call_user_id>
```

Nunca:

```
:warning: Caso suspeito — <Nome Completo> (CPF 123.456.789-00, email@dominio.com)
- Tentativa de transação R$ 5000 para <Outro Nome> (CPF ...)
- @channel revisar agora
```

## Por que essa regra existe

**Why:** Slack costuma ser canal alto-volume; sem regra, é fácil postar payload bruto ou @channel em alarm que dispara N notificações no fim de semana. Domínios que tocam PII (fraude, KYC, billing) amplificam o risco.

**How to apply:** Antes de qualquer workflow que poste em Slack, conferir o template em canal de teste. Em n8n, o node de Slack idealmente recebe campo `text` já redacted — fazer a sanitização em Code node anterior, não no Slack node.

Referências: ver `pii-handling.md` (regra principal de PII) e `live-first-verification.md` (verificar canal antes de mudar destino).
