---
name: sdd-workflow
description: Coordena o fluxo de trabalho Spec-Driven Development (SDD) para projetos, garantindo a sequência correta das etapas, aprovação de specs e rastreabilidade de requisitos.
---

# Skill: sdd-workflow

> **Documento:** SKILL.md  
> **Autor:** Silverio Leite Jr · Senior Solution Architect · OG1 TI  
> **Versão:** 1.0  
> **Data:** 2026-11-25  

## 1. Missão

Coordena o fluxo de trabalho completo do Spec-Driven Development (SDD) em projetos, garantindo que todas as etapas sejam seguidas na ordem canônica, as specs sejam aprovadas antes da implementação e a rastreabilidade entre RFs, US, UC e TC seja mantida.

**Regra fixa:** Apenas leitura e orientação. Nunca implementa código nem altera specs não aprovadas.

## 2. Ordem de Leitura (Subconjunto Declaratório)

Esta skill utiliza os seguintes documentos da ordem canônica `GUIDELINE.md` §10:

### Ordem Canônica Completa (1 a 10):
1. `docs/GUIDELINE.md` — metodologia (este documento)
2. `AGENTS.md` — contrato operacional do projeto
3. `docs/TO-DO.md` — status e priorização
4. `docs/PRD.md` — escopo funcional
5. `docs/SAD.md` — arquitetura e stack
6. `docs/ADR.md` — decisões arquiteturais (se existir)
7. `docs/DATABASE-PATTERN.md` — padrões de dados
8. `docs/NAMING-CONVENTION.md` — convenções de código e arquivos
9. `docs/DESIGN.md` — identidade visual (se aplicável)
10. `docs/sdd/NN-slug/` — spec do pacote em execução

### Subconjunto Utilizado por Esta Skill:
- `docs/GUIDELINE.md` §3, §4, §5, §8, §9, §10 (metodologia, ciclo de trabalho e ordem canônica)
- `AGENTS.md` — contrato operacional do projeto
- `docs/TO-DO.md` — status e priorização dos pacotes
- `docs/PRD.md` — escopo funcional do projeto
- `docs/SAD.md` — arquitetura e stack
- `docs/NAMING-CONVENTION.md` — convenções de código e arquivos
- `docs/sdd/NN-slug/` — spec do pacote em execução

**Nota:** Skills especializadas podem usar um subconjunto explícito desta lista, desde que declarem qual subconjunto utilizam, conforme `GUIDELINE.md` §10.

## 3. Visão Geral do Fluxo SDD

O fluxo SDD segue uma sequência linear de 6 etapas principais, conforme definido em `GUIDELINE.md` §2:

### Etapas do Fluxo

| Etapa | Entrada | Saída | Critério de Conclusão |
|-------|---------|-------|----------------------|
| **1. Setup (Etapa 0)** | Novo projeto | Artefatos de foundation | Todos os docs de foundation existem e foram revisados |
| **2. Consolidar PRD (Etapa 1)** | Ideia de produto | `PRD.md` aprovado | RFs definidos, sem `[A VALIDAR]` |
| **3. Decomposição (Etapa 1b)** | PRD aprovado | Matriz RF → US/UC/TC no `TO-DO.md` | Pacotes `sdd-NN-slug` criados e priorizados |
| **4. Especificar (Etapa 3)** | Pacote selecionado | US + UC + TC aprovados | Todos os specs do pacote estão `Aprovado` |
| **5. Plano Técnico (Etapa 4)** | Specs aprovadas | Plano técnico aprovado humanoamente | Aprovação explícita antes de implementação |
| **6. Implementar (Etapa 5)** | Plano aprovado | Código + testes verdes | Qualidade `npm test` e `tsc --noEmit` |

## 4. Verificações por Etapa

### 4.1 Etapa 0 — Setup e Fundação

**Verificar presença dos seguintes artefatos de fundação:**

- [ ] `docs/GUIDELINE.md` — Metodologia agnóstica
- [ ] `AGENTS.md` — Contrato operacional (na raiz do projeto)
- [ ] `docs/PRD.md` — Escopo funcional
- [ ] `docs/SAD.md` — Arquitetura e stack
- [ ] `docs/DATABASE-PATTERN.md` — Padrões de banco
- [ ] `docs/NAMING-CONVENTION.md` — Convenções de nome
- [ ] `docs/TO-DO.md` — Tracker de atividades
- [ ] `docs/GLOSSARY.md` — Vocabulário de domínio

**Verificar estrutura de pastas:**

- [ ] `docs/` existe
- [ ] `docs/templates/` existe
- [ ] `docs/sdd/` existe
- [ ] `.agents/skills/` existe e está populada
- [ ] `src/` existe
- [ ] `db/` existe (raiz do projeto)

**Proibir:** existência de `DESIGN-SYSTEM.md` (usar `DESIGN.md` conforme GUIDELINE.md §10).

### 4.2 Etapa 1b — Decomposição

**Mapear RFs do PRD para pacotes NN-slug:**

- [ ] Cada `RF-NN` do PRD tem um pacote `docs/sdd/NN-slug/`
- [ ] Matriz no `TO-DO.md` preenchida: `RF-NN` → `US-NN` → `UC-NN` → `TC-NN.MM`
- [ ] Pelo menos um pacote tem prioridade `Alta` definida
- [ ] Nenhum `RF-NN` contém `[A VALIDAR]` no texto (impede decomposição)

**Itens críticos:**

- [ ] PRD não pode ser `Aprovado` enquanto existir `[A VALIDAR]` em qualquer RF
- [ ] User Story, Use Case e Test Case de cada pacote precisam passar por ciclo `Draft` → `Em revisão` → `Aprovado`
- [ ] IDs de rastreabilidade seguem convenção: `RF-NN`, `CA-NN`, `RN-NN.x`, `US-NN`, `CAU-NN.x`, `UC-NN`, `RU-NN.x`, `TC-NN.MM`

### 4.3 Etapa 3 — Especificar

**Para cada pacote `sdd-XX-slug/`, verificar:**

- [ ] `USER-STORY-NN-SLUG_UPPER.md` existe e status é `Aprovado`
- [ ] `USE-CASE-NN-SLUG_UPPER.md` existe e status é `Aprovado`
- [ ] `TEST-CASE-NN-SLUG_UPPER.md` existe e testes passing (`npm run test`)
- [ ] IDs internos consistentes (ex: `CAU-01.1` cita `CA-01`, `RU-01.1` cita `RN-01.x`)

**Itens bloqueantes para implementação:**

- A skill `sdd-developer` só inicia se **todos** os itens acima estiverem `Aprovado`
- Qualquer RF com `[A VALIDAR]` impede a decomposição da Etapa 1b

### 4.4 Etapa 4 — Plano Técnico

**Registrar aprovação humana no `TO-DO.md`:**

- [ ] Aprovação do plano técnico registrada na seção correspondente
- [ ] Nenhuma mudança de modelo de dados sem aprovação explícita (conforme AGENTS.md §5)
- [ ] Novas dependências ou versões major requerem aprovação humana
- [ ] Mudanças em autenticação/autorização requerem aprovação explícita

### 4.5 Etapa 5 — Implementar

**Executar implementação com testes:**

- [ ] `npm run test` — Todos os testes passing
- [ ] `npm run lint` — `tsc --noEmit` verde
- [ ] Zero segredos expostos (verificar `.gitignore` e código fonte)
- [ ] Alterações de banco aderentes a `DATABASE-PATTERN.md`
- [ ] Código mínimo que satisfaz a spec (sem over-engineering)

### 4.6 Etapa 6 — Entregar

**Finalizar ciclo e publicar:**

- [ ] `TO-DO.md` atualizado com conclusão do pacote
- [ ] PR criado e integrado (referenciando IDs: `RF-NN`, `US-NN`, etc.)
- [ ] Relatório final publicado conforme GUIDELINE.md §8
- [ ] Status do pacote marcado como `Concluído` no `TO-DO.md`

## 5. Rastreabilidade de IDs

Todos os artefatos devem manter consistência nos IDs de rastreabilidade:

| Tipo | Formato | Exemplo | Onde aparece |
|------|---------|---------|--------------|
| Requisito funcional | `RF-NN` | `RF-01` | `PRD.md` |
| Critério de aceite do PRD | `CA-NN` | `CA-01` | `PRD.md` |
| Regra de negócio do PRD | `RN-NN.x` | `RN-01.1` | `PRD.md` |
| User Story | `US-NN` | `US-01` | `docs/sdd/NN-slug/USER-STORY-...` |
| Critério da User Story | `CAU-NN.x` | `CAU-01.1` | `docs/sdd/NN-slug/USER-STORY-...` |
| Use Case | `UC-NN` | `UC-01` | `docs/sdd/NN-slug/USE-CASE-...` |
| Regra do Use Case | `RU-NN.x` | `RU-01.1` | `docs/sdd/NN-slug/USE-CASE-...` |
| Caso de teste | `TC-NN.MM` | `TC-01.01` | `docs/sdd/NN-slug/TEST-CASE-...` |
| Decisão de arquitetura | `ADR-NNN` | `ADR-001` | `docs/ADR.md` (opcional) |

## 6. Erros Comuns (Gatilhos de Bloqueio)

| Erro | Consequência | Correção |
|------|-------------|----------|
| Implementar sem specs `Aprovado` | Bloqueio da skill `sdd-developer` | aguardar aprovação humana |
| `[A VALIDAR]` no PRD | Impede decomposição Etapa 1b | resolver validações antes de prosseguir |
| IDs inconsistentes entre RF → US → UC → TC | Falha na rastreabilidade | padronizar IDs conforme convenção |
| Mudança de modelo de dados sem aprovação | Requer aprovação humana (AGENTS.md §5) | solicitar aprovação antes de alterar |
| Commit de segredos (tokens, senhas) | Violência de segurança | nunca commitar credenciais |

## 7. Integração com Outras Skills

| Skill | Interação | Descrição |
|-------|-----------|-----------|
| `sdd-developer` | **Dependente** | Apenas executa após aprovação total das specs (US/UC/TC `Aprovado`) |
| `sdd-structure-validator` | **Validante** | Verifica consistência estrutural antes de iniciar workflow |
| `sdd-prd-writer` | **Gerador** | Cria/atualiza `PRD.md` a partir de linguagem natural |
| `sdd-userstory-writer` | **Gerador** | Cria User Story a partir de `RF-NN` |
| `sdd-usecase-writer` | **Gerador** | Cria Use Case a partir de PRD e User Story |
| `sdd-testcase-writer` | **Gerador** | Plano de testes a partir de Use Case |
| `sdd-adr-writer` | **Opcional** | Registra ADRs para decisões arquiteturais |
| `sdd-ascii-mockup` | **Opcional** | Desenho de mockups ASCII quando Extensão A ativa |

## 8. Formato do Relatório Final (GUIDELINE.md §8)

```markdown
## Resumo
## Arquivos alterados
## Testes executados
## Desvios / suposições
## Pendências
```

## 8. Carga Útil (Input) para Execução

O fluxo é acionado quando:

- [ ] Novo projeto iniciado (Etapa 0 completada)
- [ ] `PRD.md` status `Aprovado` (sem `[A VALIDAR]`)
- [ ] Pelo menos um pacote `sdd-NN-slug` priorizado no `TO-DO.md`
- [ ] Aprovação humana do plano técnico (Etapa 4)
- [ ] Contexto: `skill` tool carregada com `id="sdd-workflow"`

## 9. Próximos Passos Após Conclusão

- [ ] `TO-DO.md` atualizado
- [ ] PR criado com IDs citados (`RF-NN`, `US-NN`, `TC-NN.MM`)
- [ ] Próximo pacote do `TO-DO.md` selecionado ( Ordem: prioridade `Alta` → `Média` → `Baixa` )
- [ ] Validação estrutural com `sdd-structure-validator` skill
- [ ] Relatório final publicado

---

*Skill mantida em `docs/skills/sdd-workflow/SKILL.md`. Base directory: C:\@projetos\app-innovation-cards\docs\skills\sdd-workflow*