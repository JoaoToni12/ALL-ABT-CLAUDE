---
description: PII handling rules for AI/automation work — never publish raw PII to ticket systems / chat / logs; redact before output.
globs: ["**/*"]
---

# PII Handling

Contexto: workflows de automação frequentemente tocam dados pessoais (CPF, CNPJ, e-mail, telefone, nome). LGPD: até 2% do faturamento ou R$ 50M por violação. ANPD lista IA como prioridade 2025-2026. OWASP LLM02:2025 "Sensitive Information Disclosure" é #2 risk em apps LLM.

## Princípio canônico

PII bruta vive em sistemas com controles de acesso (data warehouse, banco transacional, vault). Em qualquer destino fora desses (ticket system, chat, prompts do LLM, logs, n8n executions), **referenciar por ID estável** (tx_id, customer_id, ou hash determinístico), nunca por CPF/nome/telefone/email.

## Regras

1. **Nunca pastear PII bruta no prompt do LLM.** Se a investigação exige um caso específico, use ID ou hash. O hook `pre-user-prompt-pii.js` bloqueia automaticamente quando o profile é `paranoid`.

2. **Nunca escrever PII em Linear/Notion/Slack via MCP.** Ticket pode dizer "investigar tx_id ABC123 com 3 indicadores" — nunca "investigar CPF 123.456.789-00 do <nome>". O hook `pre-mcp-pii-warn.js` escala para confirmação quando detecta no `paranoid` profile.

3. **Nunca logar PII em campos "livres" de workflow** (`contextSummary`, `reasoning_final`, `notes`). Esses campos costumam ser exportados para data warehouse e podem virar audit trail externo. Redact antes do node de logging.

4. **Sistema de origem é a fronteira.** Saídas de query que retornam linhas com PII devem (a) ficar no warehouse, ou (b) ser hasheadas/agregadas antes de sair para destinos externos.

5. **Em logs e screenshots para tickets**, redact: CPF → `***.***.**X-XX` (mantém últimos 2 dígitos para correlação), email → `j***@dominio.com`, telefone → `(11) ****-XXXX`.

6. **Test data nunca usa PII real** — nem em workflow de teste, nem em fixture, nem em comentário. Usar números sentinela (CPF `12345678909` é inválido na fórmula da Receita, serve como flag) e nomes ficcionais.

## Padrões de detecção (regex)

| Entidade | Pattern |
|---|---|
| CPF formatado | `\b\d{3}\.\d{3}\.\d{3}-\d{2}\b` (hyphen U+002D, não em-dash) |
| CPF raw | `\b\d{11}\b` + checksum (dígito 10 + 11 conforme algoritmo da Receita) |
| CNPJ formatado | `\b\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}\b` |
| CNPJ raw | `\b\d{14}\b` + checksum |
| Phone BR | `\b(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b` |
| Email | RFC pattern padrão |

(Para outros países, expandir com regex local — SSN US, NI UK, etc.)

## Quando flexibilizar

- Sessão local de debugging com `/hook-profile minimal`: hooks de PII ficam off. É consciente — você fica responsável.
- Queries do warehouse com `LIMIT 1` para inspeção pontual: ok, mas o resultado **não** sai do terminal/notebook.

## Por que essa regra existe

**Why:** Workflows de automação tocam PII por padrão; sem disciplina, PII vaza para Linear/Notion/Slack que tipicamente não têm os mesmos controles de acesso do data warehouse. LGPD cria risco regulatório real.

**How to apply:** Antes de qualquer prompt, ticket, post Slack, ou commit que toque dados reais — perguntar: "isso poderia ser feito com ID?". Se sim, usar ID. Os hooks `pre-user-prompt-pii.js` e `pre-mcp-pii-warn.js` são guardrails — não substituem a disciplina.
