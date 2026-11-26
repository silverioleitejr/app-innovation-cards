# NAMING-CONVENTION — Innovation Board

> **Documento:** NAMING-CONVENTION.md  
> **Autor:** Silverio Leite Jr · Senior Solution Architect · OG1 TI  
> **E-mail:** silverio.leitejr@og1.com.br · **Telefone:** (11) 96020-6334  
> **Versão:** 1.0.0  
> **Data:** 2026-11-22  
> **Status:** Implementado  

## Regras Gerais

- **Código, tabelas e identificadores: inglês**
- **Documentação e commits: português**
- **Arquivos de spec:** `TIPO-NN-SLUG_UPPER.md` (sem sufixo `-REQUIREMENTS`)
- **Idioma de commit:** português (escopo técnico em inglês permitido)
- **Documentos de referência:** `GUIDELINE.md` §4 (ordem canônica), `SAD.md` (stack), `PRD.md` (escopo)

---

## Banco de Dados

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| **Tabelas** | snake_case plural | `users`, `sessions`, `cards`, `card_pins`, `board_voting_state`, `voting_sessions`, `audit_logs` |
| **Colunas** | snake_case | `email`, `password_hash`, `technical_lead`, `created_at` |
| **Prefixos de constraints/índices/triggers** | `pk_`, `fk_`, `uk_`, `ck_`, `idx_`, `trg_` | `pk_users`, `fk_cards_author_id`, `uk_users_email`, `idx_cards_stage`, `trg_audit_hash` |
| **Primary Key** | `id` (tipo TEXT) em todas as tabelas | `users.id`, `cards.id`, `voting_sessions.id` |
| **Foreign Key** | `_{tabela}_id` | `author_id`, `opened_by_id`, `federated_sub` |
| **Índices comuns** | `idx_{coluna}` | `idx_cards_stage`, `idx_users_email` |
| **Triggers** | `trg_{funcao}` | `trg_audit_hash` |
| **Unique Constraints** | `uk_{coluna}` | `uk_users_email` |

### 2.1 Convenções Específicas por Tipo

| Tipo de Entidade | Convenção | Exemplo |
|------------------|-----------|---------|
| **Usuários** | `usuário_{id}` em contexto de discussão | `usr-admin-silverio` |
| **Sessões** | `sessão_{número}` | `Sessão #3` |
| **Cartões** | `card-{curtoid}` | `card-01`, `card-1234abcd` |
| **Pins** | `pin_{tipo}_{cardId}_{userId}` (conceito) | `pin_vote_plus_card-01_usr-admin-silverio` |
| **Votações** | `votação_{número}` | `Votação Aberta`, `Votação Fechada` |

---

## Código (TypeScript/Node.js)

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| **Variáveis** | camelCase | `userCount`, `votingOpen`, `currentSession` |
| **Funções** | camelCase | `hashPassword()`, `normalizeEmail()`, `validateBacklogGate()` |
| **Classes** | PascalCase | `UserService`, `CardManager`, `VotingSession` |
| **Constantes** | UPPER_SNAKE_CASE | `PIN_TYPES`, `ROLES`, `EFFORT_SIZES`, `SPECIALTIES` |
| **Enumerados (enums)** | PascalCase | `Stage` (`PITCH | EVALUATION | BACKLOG`), `Role` (`ADMIN | FACILITATOR | MEMBER | VIEWER`) |
| **Arquivos** | kebab-case (pastas), PascalCase (componentes) | `use-card-pins-management.ts`, `CardPinsBar.tsx` |
| **Tabelas SQL** | snake_case plural | `users`, `cards` (como acima) |
| **Colunas SQL** | snake_case | `technical_lead`, `voting_session_id` |

---

## Documentação e Commits

| Elemento | Convenção | Observação |
|----------|-----------|------------|
| **Assuntos de commit** | Português | `feat(auth): unificação de conta por e-mail` |
| **Descrição de mudanças** | Português para negócio; inglês para escopo técnico | Ex: "Tabela users: adicionar coluna federated_provider" |
| **Nomes de branches** | `feat/NN-slug` ou `fix/NN-slug` | `feat/01-abrir-workspace`, `fix/07-system-debug` |
| **IDs de requisito** | `RF-NN`, `CA-NN`, `RN-NN.x`, `US-NN`, `UC-NN`, `TC-NN.MM` | Conforme `GUIDELINE.md` §3 |
| **IDs de ADR** | `ADR-NNN` | `ADR-001`, `ADR-002`, etc. |
| **Namespaces de skill** | `sdd-*` | `sdd-developer`, `sdd-prd-writer`, etc. |

---

## Convenções Visuais (UI)

| Elemento | Convenção |
|----------|-----------|
| **Cores de cursor** | Paleta definida: `#0b41cd`, `#0f766e`, `#6d28d9`, `#b45309`, `#0369a1`, `#be123c` |
| **Cores de destaque** | Azul OG1 (`#0b41cd`), Verde petróleo (`#0f766e`) |
| **Tipografia** | `Outfit` (títulos), `Plus Jakarta Sans` (leitura), `JetBrains Mono` (`tabular-nums`) (IDs, datas, horários) |
| **Superfície** | Branco puro (`#ffffff`) para board; cores quentes para fundos secundários |

---

## Validação

- Todas as novas tabelas, colunas e índices devem seguir as convenções acima **antes** de serem aplicadas ao banco.
- Migrações que adicionem colunas não seguirem o padrão devem ser refatoradas antes do merge.
- O validador `sdd-structure-validator` raportará desvios como `Aviso` ou `Bloqueante` dependendo da criticidade.
- Conflitos entre `DATABASE-PATTERN.md` e `NAMING-CONVENTION.md` são resolvidos em favor do `DATABASE-PATTERN.md` (é a fonte de verdade para tudo que é banco de dados), conforme regra inicial deste documento.

---

**Integração:** Este documento deve ser lido em conjunto com `DATABASE-PATTERN.md` (regras específicas de banco) e `GUIDELINE.md` §4 (ordem canônica). Este é o documento de referência para nomeação consistente em todo o códigobase, TypeScript, SQL e documentação.
