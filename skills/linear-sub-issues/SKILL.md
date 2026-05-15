---
name: linear-sub-issues
description: Populate sub-issues for a Linear parent issue with sane defaults — sub-issues default to Backlog status, estimates assume AI Builder productivity is 1.5x baseline (so divide standard estimate by 1.5), and the breakdown follows Linear sub-issue best practices (right granularity, inherit context, clear scope). Use when the user wants to "quebrar uma issue em sub-tarefas", "criar sub-issues", "popular sub-issues", "break down issue", "split into sub-tasks", "subdividir issue no Linear". Trigger on /linear-sub-issues.
allowed-tools: Read, Glob, Grep, mcp__linear__get_issue, mcp__linear__list_teams, mcp__linear__list_issue_statuses, mcp__linear__list_issue_labels, mcp__linear__list_projects, mcp__linear__list_milestones, mcp__linear__list_issues, mcp__linear__save_issue
---

# Linear Sub-Issues — Populate with Sane Defaults

Skill para popular sub-issues de uma issue-pai no Linear evitando três problemas recorrentes:

1. **Excesso de sub-issues** — 15 sub-issues de 30min cada viram overhead de gestão.
2. **Estimativas mal definidas** — estimativas baseadas em "desenvolvedor médio" sem considerar que o AI Builder (Claude Code + dev) é 1.5x mais produtivo.
3. **Status criados errados** — sub-issues nascendo em `Todo`/`Unstarted` quando deveriam ficar em `Backlog` até alguém pegar.

## Defaults canônicos

| Aspecto | Default | Override |
|---|---|---|
| **Status** | `Backlog` (state type = `backlog`) | Usuário diz "essa sub-issue já tá em progresso" ou "começar essa em Todo" |
| **Estimativa** | (estimativa padrão) ÷ 1.5, arredondado para cima | Usuário pede explicitamente "use a estimativa padrão" ou "essa tem complexidade que IA não acelera" |
| **Priority** | Herdada do parent | Override explícito |
| **Project** | Herdado do parent | Override explícito |
| **Cycle** | Herdado do parent se aplicável | Override explícito |
| **Labels** | Herdar labels do parent relevantes ao trabalho | Adicionar labels específicas da sub-tarefa |
| **Assignee** | Mesmo do parent | Override explícito (e sinalizar) |
| **Milestone** | Herdado do parent se houver | Override explícito |

## Quando invocar

- "Quebrar issue ABC-123 em sub-tarefas"
- "Criar sub-issues para essa issue"
- "Popular sub-issues de XYZ"
- "Subdividir issue no Linear"
- "Break down [issue] into sub-tasks"
- `/linear-sub-issues`

## Quando NÃO invocar

- Criar issue standalone (não sub-issue) → usar `linear-issue-create`
- Atualizar sub-issue existente → `mcp__linear__save_issue` direto com `id`
- Bulk-import de issues sem hierarquia → outro flow

## Protocolo

### 1. Identificar issue-pai

Perguntar ao usuário (ou inferir do contexto):

- **Identificador da parent issue** — pode ser:
  - URL Linear (`https://linear.app/team/issue/ABC-123/...`)
  - Identifier (`ABC-123`)
  - Title parcial (busca via `mcp__linear__list_issues`)

Buscar a issue:
```
mcp__linear__get_issue(query="ABC-123" OU id)
```

Extrair: `teamId`, `priority`, `projectId`, `cycleId`, `assigneeId`, `labelIds`, `milestoneId`, `title`, `description`.

### 2. Confirmar contexto + scope

Mostrar ao usuário um resumo do parent:

```
Parent: ABC-123 — "Implementar X integration"
Team: <team-name> (<teamId>)
Priority: <0-4 + label>
Project: <project ou "(nenhum)">
Cycle: <cycle ou "(sem cycle)">
Labels: <list>
Assignee: <user ou "(unassigned)">
```

Perguntar: **"Qual é o escopo das sub-issues que você quer popular?"** — pegar uma descrição do breakdown desejado, em texto livre. Ex.:
- "Setup + API client + validação + testes + deploy"
- "Frontend forms, backend endpoint, integration test, docs"

Se o usuário não tiver clareza do breakdown, sugerir uma proposta a partir da `description` do parent e validar.

### 3. Listar estados do team (achar Backlog stateId)

```
mcp__linear__list_issue_statuses(teamId="<teamId>")
```

Filtrar por `type === "backlog"`. Capturar o `id` desse estado.

Se houver múltiplos com type `backlog`:
- Preferir o que tem o nome literal "Backlog"
- Se ainda for ambíguo, perguntar ao usuário qual usar

Se o team **não tiver estado tipo `backlog`** (raro mas possível), perguntar ao usuário qual estado usar como default e justificar — não cair silenciosamente em `unstarted`.

### 4. Listar labels do team (para sugestões de herança)

```
mcp__linear__list_issue_labels(teamId="<teamId>")
```

Identificar labels relevantes do parent que fazem sentido propagar (ex.: `backend`, `frontend`, `infra`, `bug`, `feature`).

### 5. Aplicar regra de granularidade

**Diretrizes de breakdown:**

| Tamanho da sub-issue | Decisão |
|---|---|
| < 1 hora de trabalho | **Lump com outra sub-issue** — overhead de gestão > valor da granularidade |
| 1h a 3 dias úteis | **OK** — escopo de uma sub-issue saudável |
| > 3-5 dias úteis | **Split** em sub-sub-issues, OU virar issue separada com seu próprio parent |

**Quantidade total:**
- **Ideal**: 3-7 sub-issues por parent
- **Máximo razoável**: 10
- **Mais que 10** → sugerir agrupamento ou re-pensar o parent (parent provavelmente é grande demais)

Se o usuário propôs >10 sub-issues, alertar: *"Você propôs N sub-issues. Acima de 10 vira overhead de gestão. Sugiro agrupar em [X], [Y], [Z]. Confirma?"*

### 6. Aplicar regra de estimativa (1.5x produtividade AI Builder)

Para cada sub-issue, calcular estimativa em **duas etapas**:

1. **Estimativa baseline** — quanto levaria um desenvolvedor médio (sem IA assistida).
2. **Ajuste AI Builder**: `final = ceil(baseline / 1.5)`, arredondado para a unidade do team (pontos Fibonacci, horas, dias).

Exemplos (pontos Fibonacci 1, 2, 3, 5, 8, 13):
| Baseline | Ajustado (÷1.5) | Final (Fibonacci ceiling) |
|---|---|---|
| 1 | 0.67 | **1** |
| 2 | 1.33 | **2** |
| 3 | 2.0 | **2** |
| 5 | 3.33 | **3** |
| 8 | 5.33 | **5** |
| 13 | 8.67 | **8** |

Exemplos (horas):
| Baseline | Ajustado | Final |
|---|---|---|
| 1h | 0.67h | **1h** |
| 4h | 2.67h | **3h** |
| 8h (1d) | 5.33h | **6h** |
| 16h (2d) | 10.67h | **11h ou 1.5d** |

**Quando NÃO aplicar o ajuste de 1.5x** (manter baseline):
- Tarefas dominadas por espera externa (review de outro time, aprovação de stakeholder, propagação de DNS, deploy lento).
- Tarefas com forte componente humano não-acelerável (decisão de negócio, entrevista com usuário, alinhamento político).
- Tarefas com forte componente de descoberta exploratória onde o ganho de IA é menos previsível (debugging de bug raro em prod, R&D).
- Se o usuário disser explicitamente "usa a estimativa padrão" ou "essa não tem aceleração de IA".

**Sinalizar** no campo `description` de cada sub-issue quando o ajuste foi aplicado, para que reviewers entendam:

```markdown
**Estimativa:** 3pt (baseline 5pt ajustado a 1.5x produtividade AI Builder)
```

Se o ajuste **não** foi aplicado (tarefa de espera/decisão), também sinalizar:

```markdown
**Estimativa:** 5pt (baseline preservado — tarefa não-acelerável por IA, ver Skill `linear-sub-issues`)
```

### 7. Compor cada sub-issue

Schema mínimo:

```javascript
{
  teamId: "<parent teamId>",
  parentId: "<parent id>",      // ESSENCIAL — sem isso vira issue standalone
  title: "<imperativo, ação + objeto>",
  description: "<multilinha — usar \\n REAL, não \\\\n. Ver rules/linear-mcp.md>",
  stateId: "<Backlog stateId>",  // capturado no Step 3
  priority: <herdado do parent ou override>,
  projectId: <herdado ou null>,
  cycleId: <herdado ou null>,
  assigneeId: <herdado ou null>,
  labelIds: [<lista herdada + específicas>],
  milestoneId: <herdado ou null>,
  estimate: <ajustado 1.5x conforme Step 6>,
}
```

**Title style**:
- Imperativo, action-oriented: `"Implementar endpoint POST /webhook"`, `"Adicionar validação Zod no formulário"`
- Evitar: `"Bug no endpoint"`, `"Refactor"`, `"Coisa do webhook"`
- Mantém o título curto (<60 chars idealmente) — a description carrega o detalhe

**Description** (template recomendado):

```markdown
## Contexto
<por que essa sub-tarefa existe, vínculo com o parent>

## O que fazer
<lista do que precisa ser implementado/mudado>

## Critério de aceite
- [ ] <observável e testável>
- [ ] <observável e testável>

## Estimativa
<final>pt (baseline <baseline>pt ajustado a 1.5x produtividade AI Builder)

## Notas
<opcional — dependências, riscos, links>
```

**Importante (do rule linear-mcp.md)**: ao passar `description` para `save_issue`, usar quebra de linha real (LF). Nunca passar a string `\\n` (dois chars) — Linear armazena literal e o issue renderiza em uma única linha.

### 8. Confirmar antes de criar

**Antes de qualquer `save_issue`**, mostrar ao usuário a lista completa proposta:

```
Vou criar N sub-issues da parent ABC-123:

1. [Backlog] "Implementar endpoint POST /webhook" — estimate 2pt (baseline 3pt)
   Labels: [backend, api]
2. [Backlog] "Adicionar validação Zod" — estimate 1pt (baseline 2pt)
   Labels: [backend, validation]
3. [Backlog] "Setup do logging estruturado" — estimate 1pt (baseline 2pt)
   Labels: [observability]
...

Confirma? (sim / ajustar / cancelar)
```

Aguardar confirmação explícita. Se o usuário disser "ajustar", iterar até OK.

### 9. Criar (e verificar)

Disparar as `save_issue` em paralelo (múltiplos tool calls numa única mensagem do assistant — rate limit do Linear é generoso). Após cada save, capturar o `id` retornado.

**Verificação obrigatória** após criação:

Para cada sub-issue criada, chamar `mcp__linear__get_issue(id)` e validar:

- [ ] `parentId` está correto (sub-issue está realmente vinculada ao parent)
- [ ] `state.type === "backlog"` (não foi para outro state silenciosamente)
- [ ] `estimate` é o valor ajustado
- [ ] `description` renderiza com quebras de linha (não tem `\n` literal)
- [ ] Labels herdadas estão presentes

Se algum check falhar, fazer um `save_issue(id="...", ...)` para corrigir antes de prosseguir.

### 10. Reportar

Resumo final ao usuário:

```
## Sub-issues criadas

Parent: ABC-123 — "Implementar X integration"
Created: N sub-issues, todas em Backlog

| # | Title | Estimate (ajustado) | URL |
|---|---|---|---|
| ABC-124 | Implementar endpoint... | 2pt | https://linear.app/... |
| ABC-125 | Adicionar validação... | 1pt | https://linear.app/... |
...

Total estimado (ajustado): <soma>pt
Total baseline (sem ajuste): <soma>pt — útil pra comparar com sprint capacity tradicional

Próximos passos:
- [ ] Mover ABC-124 para `Todo` quando começar
- [ ] Validar com a equipe se a granularidade tá boa
```

## Outras boas práticas de Linear que essa skill aplica

1. **Parent identification por ID, não por nome.** Buscar a issue antes de criar sub-issues — confirmar que o parent existe e capturar contexto. Evita o erro de "criei sub-issue mas vinculei na issue errada".

2. **`parentId` é mandatório.** Sem ele, o `save_issue` cria uma issue standalone. Se você precisa converter standalone → sub-issue depois, é re-save com `parentId` (atualização).

3. **Herança de `teamId`.** Sub-issue vai para o mesmo team do parent. Mover sub-issue para outro team é raro e deve ser confirmado.

4. **Priority herdada por default, override consciente.** Se o parent é P2 (High), as sub-issues também são P2 a menos que uma seja explicitamente "menos urgente".

5. **Não duplicar conteúdo do parent.** A description da sub-issue referencia o parent ("ver ABC-123 para contexto completo") em vez de copiar — evita drift quando o parent é atualizado.

6. **Labels específicas, não todas.** Herdar labels do parent que são *relevantes para o trabalho* da sub-issue. Label "feature" do parent geralmente sobra; label "backend" sobra apenas nas sub-issues backend.

7. **Cycle/Sprint awareness.** Se o parent está num cycle ativo, sub-issues devem entrar no mesmo cycle só se cabem na capacity restante. Se não cabem, criar em Backlog e priorizar para o próximo cycle.

8. **Não criar sub-issue só pra parecer organizado.** Tarefas atômicas pequenas (<1h) que pertencem ao mesmo contexto cabem numa única sub-issue com checklist. Excesso de granularidade = overhead de status update.

9. **Linking, não duplicação.** Se duas sub-issues dependem uma da outra, criar relação `blocks` / `blocked_by` via Linear (não via menção em description) — Linear renderiza isso na UI.

10. **Estimativas: ser claro sobre a unidade.** Se o team usa pontos Fibonacci, todas as sub-issues em pontos. Se usa horas, todas em horas. Não misturar.

## Erros comuns

| Erro | Sintoma | Fix |
|---|---|---|
| `parentId` faltando | Sub-issue cria como standalone | Re-save com `parentId` |
| `stateId` errado (Todo em vez de Backlog) | Aparece como "Unstarted" no board | Re-save com `stateId` correto após `list_issue_statuses` |
| Descrição em uma linha só | Pitfall `\n` literal | Re-save passando LF real |
| Estimativa baseline aplicada sem ajuste | Sub-issue muito grande pro tempo real | Ajustar para `/1.5` e re-save |
| Priority 0 herdado (None) | Sub-issue sem prioridade aparente | Herdar explicitamente do parent ou definir 3 (Medium) |
| Excesso de sub-issues (>10) | Board do parent vira lista interminável | Agrupar ou virar issue separada |

## Quando flexibilizar a regra de 1.5x

- **Tarefa exploratória com risco alto**: manter baseline (a IA pode acelerar, mas a variabilidade é maior).
- **Equipe ainda calibrando o uso de Claude Code**: ajuste menor (1.2x) nos primeiros sprints.
- **Tarefa onde a IA tem track record ruim no projeto** (debugging crônico de uma área): baseline ou +20%.

Sempre **documentar** o motivo do override na description da sub-issue ("estimativa preservada — área histórico de debugging difícil").

## Referências

- `rules/linear-mcp.md` — naming canônico (`save_*`), Priority mapping, pitfall `\n`, `teamId` discipline
- Skill `linear-issue-create` — criação de issue standalone (não sub-issue)
- [Linear docs: parent issues + sub-issues](https://linear.app/docs/parent-issues)
- [Linear docs: estimates](https://linear.app/docs/estimates)
