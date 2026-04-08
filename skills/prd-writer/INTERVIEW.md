# Elaboration Interview Guide

## Purpose
This is NOT a from-scratch questionnaire. The simplified PRD already exists in the Notion automation page. The interview's job is to **elaborate existing ideas, fill gaps, and drive decisions** — turning a rough description into a complete, buildable PRD.

---

## Pre-Interview: Extract from Simplified PRD

Before asking anything, fetch the automation page and extract what's already known:

```
Already defined (skip in interview):
- Nome da Automação: ___
- Área Solicitante: ___
- Problema descrito: sim / não / parcial
- Trigger/frequência: sim / não / parcial
- Integrações mencionadas: ___
- Métricas (horas/custo): sim / não
- Dependências listadas: sim / não
```

Present the summary to the user, then proceed only with rounds that have gaps.

---

## Round Structure

Use `AskUserQuestion` for each round. Max 3-4 questions per round. Use options when possible.

---

### Round A — Contexto & Problema (Section 1 gaps)

**Ask only if the simplified PRD lacks volume/impact numbers or risk statement.**

- **A1** — Quantas vezes por semana esse processo manual acontece hoje? Quantas pessoas são afetadas? Quanto tempo gasta por ocorrência?
  - *Why ask:* Section 1 needs concrete numbers to justify the automation.

- **A2** — O que acontece se não fizermos essa automação? Qual é o risco concreto?
  - Options to offer: `Erro humano recorrente` / `Custo operacional crescente` / `Risco regulatório/multa` / `Outro`

---

### Round B — Objetivo & Métricas (Section 2 gaps)

**Ask only if objective or metrics are missing/vague.**

- **B1** — Em UMA frase: o que a automação faz?
  - *Example:* "Ingere dados do provedor Bool diariamente e salva no Snowflake"

- **B2** — Qual é o output concreto por execução?
  - Options: `Tabela/linha no Snowflake` / `Mensagem no Slack` / `Email enviado` / `Ticket fechado no Intercom` / `Outro`

- **B3** — Métricas de sucesso (preencha o que souber, pode ser estimativa):
  - Horas economizadas por mês: ___
  - Custo evitado anual (R$): ___
  - Taxa de sucesso esperada (%): ___
  - SLA de execução: ___ (ex: "até 08h da manhã")

---

### Round C — Arquitetura Técnica (Section 3 gaps)

**Always run this round — architecture decisions need precision.**

- **C1** — Trigger: como a automação será disparada?
  - Options: `Cron/Schedule (especificar horário)` / `Webhook (evento externo)` / `Evento no banco de dados` / `Manual (sob demanda)`

- **C2** — Fluxo de dados: de onde vêm os dados e para onde vão?
  - Origem: `API externa (qual?)` / `Tabela Snowflake (qual schema/tabela?)` / `Slack` / `Email` / `Outro`
  - Destino: `Tabela Snowflake RAW/SEM_*` / `Slack channel` / `Email` / `API externa` / `Outro`

- **C3** — Snowflake: quais views SEM_* precisam existir ou ser criadas? Alguma tabela RAW nova?
  - *Tip: list view names if known, e.g., SEM_BOOL_TRANSACTIONS*

- **C4** — Ferramentas envolvidas no build:
  - Multi-select: `n8n` / `Snowflake` / `Python Container (n8n)` / `GitLab` / `Slack Bot` / `Outro`

---

### Round D — Dependências & Blockers (Section 4)

**Ask even if some are mentioned — blockers are often underspecified.**

- **D1** — Existem APIs externas que precisam de credenciais/acesso ainda não configurados?
  - For each: Nome | Status (Existe no n8n / Aguardando acesso / A criar) | Owner

- **D2** — Existem views ou tabelas Snowflake que ainda não existem e precisam ser criadas antes do build?
  - For each: Nome da view | Owner (quem cria) | Prazo estimado

- **D3** — Há dependência de aprovação de alguém (negócio, compliance, TI)?

---

### Round E — Segurança & Compliance (Section 5 gaps)

**Ask only if the automation touches customer data or uses LLMs.**

- **E1** — O fluxo processa dados de clientes (CPF, conta, transações)? Como será anonimizado/mascarado?
  - Options: `DDM via views SEM_*` / `Mascaramento no n8n antes de enviar` / `Não processa PII` / `A definir`

- **E2** — LLMs serão usados? Se sim, via qual gateway?
  - Options: `Não usa LLM` / `LLM Gateway interno (sem PII no prompt)` / `A definir`

---

### Round F — Tratamento de Erros (Section 6 gaps)

**Always run this round — error strategy is often missing from simplified PRDs.**

- **F1** — Quando o workflow falhar, qual canal do Slack deve receber o alerta?
  - *Common channels:* `#alarmes-sta` / `#alarmes-prod` / `#coe-automacoes` / `Outro`

- **F2** — Retry policy: quantas tentativas antes de alertar? Qual o intervalo?
  - Suggestion: `3 retries com backoff de 5min` / `2 retries imediatos` / `Sem retry, alertar imediatamente`

- **F3** — Quais cenários de falha são previsíveis para esta automação específica?
  - Check against: API fora do ar / Dados vazios / Timeout / Schema mudou / Credencial expirada / Outro

---

## Post-Interview Checklist

Before creating the Notion page, verify:
- [ ] All 9 template sections have content (not placeholders)
- [ ] Section 4 table has at least one row per dependency type
- [ ] Section 5 checkboxes are answered (not left as open questions)
- [ ] Sections 7, 8, 9 use standard CoE defaults (do not modify)
- [ ] Page title is: `PRD - [Nome da Automação]`
- [ ] Parent page is the automation entry in `automacoes_master`
