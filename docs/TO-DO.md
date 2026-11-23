# TO-DO — Spec-Driven Development Tracker

**Project:** Innovation Board  
**Last Updated:** 2026-11-23  
**Methodology:** SDD conforme `GUIDELINE.md` §2

---

## 0. Setup do Projeto (Etapa 0)

> **Critério de saída:** o setup está registrado e os artefatos abaixo existem e foram revisados pelo menos uma vez.

| Artefato | Status | Observações |
|----------|--------|-------------|
| `docs/SAD.md` | ✅ Concluído | Arquitetura documentada (142 linhas) |
| `docs/GUIDELINE.md` | ✅ Concluído | Metodologia 1.2 (2026-11-20) |
| `docs/PRD.md` | ✅ Concluído | Requisitos completos (0.3.0, 2026-11-22) |
| `docs/AGENTS.md` | ✅ Concluído | Contrato operacional (1.1, 2026-11-23) - recém-criado |
| `docs/GLOSSARIO.md` | ✅ Concluído | Vocabulário de domínio |
| `docs/TO-DO.md` | ✅ Concluído | Esta tracker |
| `docs/sdd/` | 🟳 Em progresso | Pacotes a serem criados |
| `docs/ADR.md` | ❌ Não existe | Se houver decisões críticas, criar |
| `docs/DATABASE-PATTERN.md` | ❌ Não existe | Padrões de dados |
| `docs/NAMING-CONVENTION.md` | ❌ Não existe | Convenções de nomeclatura |
| `docs/DESIGN.md` | ❌ Não existe | Identidade visual (UI) |

> **STATUS GERAL:** Setup registrado. Próximo passo: decomposição em pacotes SDD (Etapa 1b).

---

## 1b. Decomposição de Requisitos

Mapeamento de `RFs` do `PRD.md` para pacotes `docs/sdd/NN-slug/` e IDs de rastreabilidade.

| RF do PRD | Pacote SDD | User Story | Use Case | Test Case |
|-----------|------------|------------|----------|-----------|
| `[RF-01]` Autenticação Híbrida e Unificação de Conta por E-mail | `sdd-01-auth-unification` | `US-01` | `UC-01` | `TC-01.01` a `TC-01.03` |
| `[RF-02]` Cadastro Interno de Usuários e Carga Idempotente | `sdd-02-user-management` | `US-02` | `UC-02` | `TC-02.01` a `TC-02.03` |
| `[RF-03]` Painel Colaborativo, Grade Compacta e Página de Matriz | `sdd-03-collaborative-board` | `US-03` | `UC-03` | `TC-03.01` a `TC-03.05` |
| `[RF-04]` Cartões Estruturados de Ideia (Pitch + Refinamento) | `sdd-04-idea-cards` | `US-04` | `UC-04` | `TC-04.01` a `TC-04.04` |
| `[RF-05]` Transição de Etapas e Trava de Qualidade (Gate) para o Backlog | `sdd-05-stage-gate` | `US-05` | `UC-05` | `TC-05.01` a `TC-05.03` |
| `[RF-06]` Trilha de Auditoria Imutável e Histórico de Sessões | `sdd-06-audit-trail` | `US-06` | `UC-06` | `TC-06.01` a `TC-06.03` |
| `[RF-07]` Sistema de Pins de Votação (`Voto +1`) e Reação | `sdd-07-voting-pins` | `US-07` | `UC-07` | `TC-07.01` a `TC-07.04` |
| `[RF-08]` Rodapé Fixo de Comandos Admin, Tops 5 e Exportação | `sdd-08-admin-footer` | `US-08` | `UC-08` | `TC-08.01` a `TC-08.03` |
| `[RF-09]` Registro de Sessões de Inovação e Página Sessões | `sdd-09-sessions-recording` | `US-09` | `UC-09` | `TC-09.01` a `TC-09.04` |

---

## 2. Priorização Atual

| Prioridade | Pacote SDD | Título Resumido | Responsável | Status |
|------------|------------|-----------------|-------------|--------|
| **Alta** | `sdd-01-auth-unification` | Unificação de autenticação híbrida | Time Tech | 🟡 Em análise |
| **Alta** | `sdd-03-collaborative-board` | Painel colaborativo grade 2×2 | Time Tech | 🟡 Em análise |
| **Alta** | `sdd-04-idea-cards` | Cartões estruturados de ideia | Time Tech | 🟡 Em análise |
| **Média** | `sdd-05-stage-gate` | Trava de qualidade 3/3 para Backlog | Time Tech | ⚪ Pendente |
| **Média** | `sdd-06-audit-trail` | Trilha de auditoria imutável | Time Tech | ⚪ Pendente |
| **Baixa** | `sdd-07-voting-pins` | Sistema de pins de votação | Time Tech | ⚪ Pendente |
| **Baixa** | `sdd-08-admin-footer` | Rodapé de comandos e exportação | Time Tech | ⚪ Pendente |
| **Baixa** | `sdd-09-sessions-recording` | Registro de sessões e página Resultados | Time Tech | ⚪ Pendente |

---

## 3. Próximos Pacotes a Especificar

Seguir a ordem natural de dependência:

1. `sdd-01-auth-unification` → Autenticação e unificação por e-mail (dependência foundation para todos os outros)
2. `sdd-02-user-management` → Cadastro e carga inicial de usuários
3. `sdd-03-collaborative-board` → Painel e matriz de esforço × benefício
4. `sdd-04-idea-cards` → Cards estruturados com dados do Pitch e Refino
5. `sdd-05-stage-gate` → Transições entre etapas e trava de qualidade
6. `sdd-06-audit-trail` → Registro imutável de auditoria
7. `sdd-07-voting-pins` → Sistema de pins Voto +1 com regras de sessão
8. `sdd-08-admin-footer` → Rodapé de comandos e exportação Top 5
9. `sdd-09-sessions-recording` → Página Sessões com histórico completo

---

## 3. Melhorias de Código (SDD Improvements)

| ID | Título | Prioridade | Status | Responsável |
|----|--------|------------|--------|-------------|
| `IMPROV-01` | Refatoração para redução de duplicação de código | Média | 🟳 Em desenvolvimento | Time Tech |
| `IMPROV-02` | Profundização no manejo de erros da API | Alta | ⚪ Pendente | Time Tech |
| `IMPROV-03` | Decomposição de componentes grandes em sub-componentes | Média | ⚪ Pendente | Time Tech |
| `IMPROV-04` | Extração de valores mágicos para constantes e tipos | Média | ⚪ Pendente | Time Tech |
| `IMPROV-05` | Aumento da cobertura de testes automatizados | Alta | ⚪ Pendente | Time Tech |

### `IMPROV-01` — Code Duplication Potential

- **User Story:** `US-IMPROV-01` — Refatoração de padrões de duplicação de código
- **Pacote SDD:** `sdd-01-improvements-code-duplication`
- **Artefatos criados:**
  - `docs/sdd/01-improvements-code-duplication/USER-STORY-01-IMPROVCODES_UPPER.md`
  - `docs/sdd/01-improvements-code-duplication/USE-CASE-01-IMPROVCODES_UPPER.md`
  - `docs/sdd/01-improvements-code-duplication/TEST-CASE-01-IMPROVCODES_UPPER.md`
- **Hook criado:** `src/hooks/useCardPinsManagement.ts` — centraliza lógica de identificação de pin do usuário, agrupamento por tipo e validação de regras de voto
- **Próximos passos:** Integrar o hook nos componentes `CardPinsBar`, `BoardFunnelView` e `SessionsView`; atualizar a UI para usar os novos hooks; verificar que não há perda de funcionalidade

### `IMPROV-02` — Error Handling Depth
- **User Story:** `US-AGENTES-02` — Profundização no manejo de erros da API
- **Pacote SDD:** `sdd-02-error-handling`
- **Artefatos criados:** `USER-STORY`, `USE-CASE`, `TEST-CASE` (ver pasta `docs/sdd/02-error-handling/`)
- **Próximos passos:** Adicionar campos `code` e `validationErrors` ao `ApiError`; criar tipos de erro específicos (`NETWORK_ERROR`, `VALIDATION_ERROR`, `CONSTRAINT_ERROR`, `AUTHORIZATION_ERROR`); adicionar wrapping de erro em operações DB críticas

### `IMPROV-03` — Component Size
- **User Story:** `US-AGENTES-03` — Redução de tamanho de componentes
- **Pacote SDD:** `sdd-03-component-size`
- **Artefatos criados:** `USER-STORY`, `USE-CASE`, `TEST-CASE` (ver pasta `docs/sdd/03-component-size/`)
- **Próximos passos:** Decompor `BoardFunnelView.tsx` (~43KB) em sub-componentes (`BoardHeader`, `BoardColumns`, `BoardFooter`); decompor `SessionsView.tsx` (~22KB) em `SessionList`, `SessionFilter`, `SessionDetails`; decompor `UsersAdminView.tsx` (~21KB) em `UserTable`, `UserForm`, `UserActions`; verificar que performance não se degrada

### `IMPROV-04` — Hardcoded Values
- **User Story:** `US-AGENTES-04` — Extração de valores mágicos para constantes
- **Pacote SDD:** `sdd-04-hardcoded-values`
- **Artefatos criados:** `USER-STORY`, `USE-CASE`, `TEST-CASE` (ver pasta `docs/sdd/04-hardcoded-values/`)
- **Próximos passos:** Identificar todos os usos do número mágico `100` e `0` no range de cursor position no WebSocket handling; criar tipo `CursorPosition` e constantes `MIN_CURSOR_POSITION`/`MAX_CURSOR_POSITION` em `src/types.ts`; substituir todos os usos diretos pelo novo tipo/constante

### `IMPROV-05` — Test Coverage
- **User Story:** `US-AGENTES-05` — Aumento da cobertura de testes automatizados
- **Pacote SDD:** `sdd-05-test-coverage`
- **Artefatos criados:** `USER-STORY`, `USE-CASE`, `TEST-CASE` (ver pasta `docs/sdd/05-test-coverage/`)
- **Próximos passos:** Configurar framework Vitest (ou manter Jest se já existir); criar testes para as 4 funções puras em `src/types.test.ts` (`validateBacklogGate`, `computeTopVotedIdeas`, `getMatrixQuadrant`, `getInitials`); criar testes para regras críticas de voting e pin management; garantir cobertura mínima de 80%

---

## 4. Critérios de Aceite por Pacote

---