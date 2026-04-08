---
description: Notion API payload structure and escaping rules
globs: ["**/*notion*"]
---

# Notion API — Regras de Uso

- Rich text properties exigem estrutura de bloco específica — verificar formato antes de chamar.
- Page properties e block children usam schemas diferentes — não misturar.
- Mermaid code blocks precisam de escaping correto em payloads da Notion API.
