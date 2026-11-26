---
name: architecture-decision-records
description: Diretrizes, templates e fluxo para propor e registrar Decisões Arquiteturais no formato ADR (Architecture Decision Record) contendo Título, Status, Contexto, Decisão e Consequências (Trade-offs).
---

# Skill: Registro de Decisões Arquiteturais (ADR)

Esta skill orienta o registro formal de decisões estruturais importantes no projeto **Agile Deck**, utilizando o padrão **ADR (Architecture Decision Record)** para garantir rastreabilidade histórica, clareza técnica e transparência sobre trade-offs.

## 1. Quando Criar uma ADR

Sempre crie ou proponha uma ADR quando houver:

- Mudança ou definição da stack principal (ex.: Next.js App Router, Prisma ORM, Tailwind v4).
- Escolha de modelo de banco de dados ou estratégias de persistência/schema.
- Definição de padrões de integração de segurança, proxies de API (Gemini/JIRA) ou autenticação.
- Mudança na arquitetura de componentes ou padrões de UI.
- Alteração relevante no fluxo de desenvolvimento (ex.: Metodologia SDD).

---

## 2. Estrutura Padrão de um Documento ADR

Toda ADR deve ser salva no diretório `docs/adrs/` ou `docs/adr/` com o nome `ADR-NNN-titulo-resumido.md` e seguir a estrutura:

```markdown
# ADR-NNN: [Título Descritivo da Decisão]

- **Status:** [Proposto | Aprovado | Substituído | Rejeitado]
- **Data:** YYYY-MM-DD
- **Autores:** [Nome dos autores / Antigravity AI]
- **Requisitos Relacionados:** [RF-XX / PRD.md / AGENTS.md]

---

## 1. Contexto

Descreva o problema de negócio ou desafio técnico, as restrições existentes, as forças que influenciam a decisão e o estado atual do sistema.

---

## 2. Opções Consideradas

Listagem das alternativas avaliadas com breve explicação:

- **Opção A:** ...
- **Opção B:** ...
- **Opção C:** ...

---

## 3. Decisão

Descreva explicitamente a solução escolhida, a fundamentação técnica/estratégica e o escopo de aplicação.

---

## 4. Consequências e Trade-offs

Apresente os impactos positivos e os custos/riscos aceitos com a decisão:

### Impactos Positivos (Ganhos)

- ✅ ...
- ✅ ...

### Trade-offs & Riscos Aceitos

- ⚠️ ...
- ⚠️ ...
```

---

## 3. Diretório de Armazenamento de ADRs

As ADRs do projeto devem ser organizadas em:

```text
release-2/
└── docs/
    └── adrs/
        ├── ADR-001-nextjs-app-router-stack.md
        ├── ADR-002-postgresql-schema-agil-jira.md
        ├── ADR-003-prisma-orm-persistence.md
        └── ADR-004-spec-driven-development-sdd.md
```
