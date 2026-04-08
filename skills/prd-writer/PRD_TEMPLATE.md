# PRD Template — 9 Sections (CoE Standard)

This is the authoritative CoE PRD structure. Use it as the base when composing the final Notion page. Replace all `[PLACEHOLDER]` values with data from the simplified PRD and the elaboration interview.

---

> Cada automação deve ter um PRD escrito na page do Notion antes de iniciar a construção. Este documento serve como fonte única de verdade para o CoE e como contexto para assistentes de código (Cursor, Claude Code) ajudarem no desenvolvimento e anteciparem blockers.

---

## 1. Contexto e Problema

- **Dor Atual:** [Descrever o processo manual ou ineficiência. Volume: quantas vezes/semana, pessoas afetadas, tempo gasto]
- **Quem sofre:** [Área solicitante, cargo, impacto no dia a dia]
- **O que acontece se não fizermos nada:** [Risco: multa regulatória, custo operacional crescente, erro humano recorrente]

---

## 2. Objetivo e Resultado Esperado

- **O que a automação faz em uma frase:** [ex: Ingere dados do provedor Bool diariamente e salva no Snowflake]
- **Output concreto:** [O que é produzido a cada execução: tabela RAW atualizada / arquivo CSV no email / mensagem no Slack / ticket fechado no Intercom]
- **Métricas de sucesso:**
  - Horas economizadas por mês (meta): [___]
  - Custo evitado anual (meta): R$ [___]
  - Taxa de sucesso esperada: [___%]
  - SLA de execução: [___ ex: até 08h da manhã]

---

## 3. Arquitetura Técnica

- **Trigger:** [Como a automação é disparada: Cron/Schedule / Webhook / Evento de banco / Manual]
- **Frequência:** [Quantas vezes roda: diária às 06h / a cada 15min / sob demanda]
- **Fluxo de dados:**
  1. Origem: [de onde vem o dado: API externa / tabela Snowflake / Slack / email]
  2. Processamento: [o que acontece com o dado: transformação / validação / enriquecimento]
  3. Destino: [para onde vai: tabela Snowflake / Slack channel / email / API externa]
- **Views Snowflake necessárias:** [listar SEM_* que precisa criar ou usar]
- **Integrações externas:** [listar todas: Slack / Intercom / BACEN / Bool / BTG / etc.]
- **Ferramentas envolvidas:** [n8n / Snowflake / Python Container / GitLab / Slack / outras]

---

## 4. Dependências e Blockers

Esta seção é crítica para antecipar problemas antes de começar o build.

| Dependência | Tipo | Status | Owner | Impacto se bloqueado |
|---|---|---|---|---|
| [ex: API do BTG] | API externa | Aguardando | [Owner] | Não consegue iniciar o build |
| [ex: View SEM_BOOL] | Snowflake | A criar | [Owner] | Precisa existir antes do workflow |
| [ex: Canal #alarmes] | Slack | Existe | -- | Nenhum |

**Tipos de dependência:**
- API externa (acesso, credenciais, rate limits)
- Dados (views, tabelas, permissões Snowflake)
- Infraestrutura (n8n nodes, Python packages, credenciais)
- Pessoas (aprovação, UAT, informação de negócio)
- Regulatório (compliance, PII, BACEN)

---

## 5. Segurança e Compliance (Sovereign Stack)

- [ ] O fluxo lida com PII? Se sim, como será mascarada/anonimizada?
- [ ] Dados sensíveis ficam dentro da VPN/VPC? (Zero Trust Externo)
- [ ] Credenciais estão no n8n Credential Manager (sem hardcode)?
- [ ] SQL usa views semânticas (SEM_\*) com DDM aplicado?
- [ ] LLMs são usados? Se sim, via LLM Gateway interno (sem PII no prompt)?
- [ ] Logs não expõem dados sensíveis?

---

## 6. Tratamento de Erros e Observabilidade

- **Error Trigger:** [O que acontece quando o workflow falha: ex: alerta no #alarmes-sta via n8n Error Trigger]
- **Retry policy:** [Quantas tentativas antes de alertar: ex: 3 retries com backoff de 5min]
- **Cenários de falha conhecidos:**
  - API fora do ar → retry + alerta
  - Dados vazios → skip + log
  - Timeout → retry com timeout maior
  - Schema mudou → alerta + pausa
- **Monitoramento pós-deploy:** [Como saber se está funcionando: ex: verificar linha no Snowflake, conferir mensagem no Slack]

---

## 7. Critérios de Aceite

A automação só pode ir para Homologação quando todos os critérios abaixo forem atendidos:

- [ ] Executa com sucesso em ambiente de dev com dados reais (ou anonimizados)
- [ ] Output corresponde ao esperado (validado manualmente)
- [ ] Error handling testado (simular falha e verificar alerta)
- [ ] Workflow versionado no repositorio (`<org>/<team>/[nome-do-projeto]`)
- [ ] Branch `workflow/OPEX-{N}-{slug}` mergeada para `dev`
- [ ] Variáveis de ambiente configuradas (sem hardcode)
- [ ] Checklist Sovereign Stack verde
- [ ] Solicitante validou o output (UAT)

---

## 8. Plano de Rollout

### Setup do Repositório *(antes de qualquer código)*
- [ ] Criar projeto no repositorio da equipe: `<org>/<team>/[nome-do-projeto]`
- [ ] Criar branch `dev` e definir como branch padrão no GitLab
- [ ] Criar estrutura de pastas padrão (ver [Git Project Standard](https://www.notion.so/product-ngcash/Git-Project-Standard-30d4457c716781978d14f54d340375a3))
- [ ] Preencher `README.md`, `CLAUDE.md` e `PRD.md` no repo
- [ ] Primeiro commit: `chore: project scaffold`
- [ ] Criar branch de trabalho: `workflow/OPEX-{N}-{slug}`

### Fases de Entrega
- **Fase 1 — Dev:** Build e teste local no n8n na branch `workflow/OPEX-{N}-{slug}`
- **Fase 2 — Homologação:** Rodar com dados reais por 3-5 dias, solicitante valida; merge para `dev`
- **Fase 3 — Produção:** Ativar schedule, PR `dev` → `main` após UAT aprovado, preencher Handoff, notificar stakeholder
- **Fase 4 — Monitoramento:** Acompanhar por 2 semanas, ajustar se necessário

> Convenções de branch: `main` (produção, nunca commitar direto) / `dev` (integração, branch padrão) / `workflow/OPEX-{N}-{slug}` / `fix/OPEX-{N}-{slug}` / `docs/{slug}`
> Referências: [Git Project Standard](https://www.notion.so/product-ngcash/Git-Project-Standard-30d4457c716781978d14f54d340375a3) · [Pipeline & Procedimento Operacional](https://www.notion.so/product-ngcash/Pipeline-Procedimento-Operacional-30d4457c716781ff8aaaf1f19d1659f3)

---

## 9. Contexto para AI Assistants (Cursor / Claude Code)

Quando for usar um assistente de código para ajudar no build, copie o conteúdo deste PRD como contexto inicial. O assistente deve saber:
- Qual o objetivo do workflow
- Quais integrações e credenciais estão envolvidas
- Quais são os blockers conhecidos
- Quais as regras de segurança (Sovereign Stack)
- Qual o formato esperado de input e output

Isso permite que o assistente antecipe problemas, sugira error handling adequado e gere código alinhado com os padrões do CoE.
