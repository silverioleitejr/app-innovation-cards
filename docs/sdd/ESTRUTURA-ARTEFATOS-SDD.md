# Estrutura de Artefatos SDD

> **Documento:** ESTRUTURA-ARTEFATOS-SDD.md  
> **Autor:** Silverio Leite Jr · Senior Solution Architect · OG1 TI  
> **E-mail:** silverio.leitejr@og1.com.br · **Telefone:** (11) 96020-6334  
> **Versão:** 1.3.0  
> **Data:** 2026-11-19  
> **Status:** Aprovado  

> **Propósito:** visão consolidada da estrutura de artefatos do kit SDD. A ordem de leitura e os IDs são definidos **somente** em `docs/GUIDELINE.md` (§4 e §3).

---

## Estrutura de um projeto

```text
projeto/
├── docs/
│   ├── GUIDELINE.md              ← AGNÓSTICO (copiar intacto)
│   ├── AGENTS.md                 ← contrato operacional          (AGENTS-TEMPLATE)
│   ├── TO-DO.md                  ← matriz, cobertura de RF, gate G2 (TO-DO-TEMPLATE)
│   ├── PRD.md                    ← escopo funcional              (PRD-TEMPLATE)
│   ├── SAD.md                    ← arquitetura e stack (§1–§13)  (SAD-TEMPLATE)
│   ├── ADR.md                    ← opcional, append-only         (ADR-TEMPLATE)
│   ├── DATABASE-PATTERN.md       ← padrões de dados              (DATABASE-PATTERN-TEMPLATE)
│   ├── NAMING-CONVENTION.md      ← código, branches, versão      (NAMING-CONVENTION-TEMPLATE)
│   ├── DESIGN.md                 ← identidade visual             (DESIGN-TEMPLATE)
│   ├── GLOSSARY.md               ← opcional, linguagem de domínio (GLOSSARY-TEMPLATE)
│   ├── templates/                ← 13 modelos mestres (kit)
│   ├── skills/                   ← FONTE DA VERDADE das skills (7)
│   └── sdd/
│       └── NN-slug/
│           ├── USER-STORY-NN-SLUG_UPPER.md
│           ├── USE-CASE-NN-SLUG_UPPER.md
│           └── TEST-CASE-NN-SLUG_UPPER.md
├── .agents/skills/               ← PUBLICADAS (geradas por sync-skills.sh)
├── scripts/sync-skills.sh        ← publica e valida (--check)
├── src/   db/   README.md
```

Arquivos do kit que **não** vão para o projeto: `ESTRUTURA-ARTEFATOS-SDD.md`, `BACKLOG.md`, `PLANO-DE-ACAO-CONSISTENCIA-SDD.md`, o deck.

## Templates (`docs/templates/`)

`PRD` · `USER-STORY` · `USE-CASE` · `TEST-CASE` · `TO-DO` · `SAD` · `DATABASE-PATTERN` · `NAMING-CONVENTION` · `DESIGN` · `AGENTS` · `ADR` · `GLOSSARY` (`*-TEMPLATE.md`) e `CHECKLIST-ARQUITETURA.md`.
Todos usam o cabeçalho padrão com `{{AUTHOR_NAME}}`, `{{AUTHOR_ROLE}}`, `{{AUTHOR_EMAIL}}`, `{{AUTHOR_PHONE}}`.

## Skills (`docs/skills/`)

| Skill | Tipo | Função |
|-------|------|--------|
| `sdd-prd-writer` | obrigatória | Gera/revisa o PRD |
| `sdd-userstory-writer` | obrigatória | Gera/valida a USER-STORY do pacote |
| `sdd-usecase-writer` | obrigatória | Gera/valida o USE-CASE do pacote |
| `sdd-testcase-writer` | obrigatória | Gera o plano de testes (seams, fixtures, cenários) |
| `sdd-developer` | obrigatória | Implementa em fatias Red → Green |
| `sdd-structure-validator` | obrigatória | Valida estrutura e rastreabilidade (somente leitura) |
| `sdd-adr-writer` | opcional | Registra decisões em `ADR.md` |

## Separação de responsabilidades

| Artefato | Tipo | Reuso |
|----------|------|-------|
| `GUIDELINE.md` | Agnóstico | 100% |
| `AGENTS`, `PRD`, `SAD`, `ADR`, `DATABASE-PATTERN`, `NAMING-CONVENTION`, `DESIGN`, `GLOSSARY`, `TO-DO` | Customizado | Por projeto |
| `docs/templates/` | Kit | Copiar e instanciar |
| `docs/skills/` | Fonte | Versionada no repositório |
| `.agents/skills/` | Publicado | Gerado pelo script |
| `docs/sdd/NN-slug/` | Customizado | Por pacote |

## Fluxo resumido

0 Fundação → 1 PRD → 1a Arquitetura (SAD, DATABASE-PATTERN) → 1b Decomposição → 2 Priorizar → 3 Especificar (**G1**) → 4 Plano + seams (**G2**) → 5 Implementar (Red → Green) → 6 Entregar (**G3**). Detalhes em `GUIDELINE.md` §2.

## Bootstrap de um novo projeto

1. Copiar `GUIDELINE.md` intacto, `docs/templates/`, `docs/skills/` e `scripts/`.
2. Rodar `scripts/sync-skills.sh`.
3. Instanciar `AGENTS`, `NAMING-CONVENTION`, `TO-DO` (e `DESIGN`, `GLOSSARY` se couber) a partir dos templates.
4. Gerar o PRD com `sdd-prd-writer` e seguir o fluxo. *(O Bootstrapper automatizado está no backlog: BL-07.)*
