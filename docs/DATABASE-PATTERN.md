# DATABASE-PATTERN — Innovation Board

> **Documento:** DATABASE-PATTERN.md  
> **Autor:** Silverio Leite Jr · Senior Solution Architect · OG1 TI  
> **E-mail:** silverio.leitejr@og1.com.br · **Telefone:** (11) 96020-6334  
> **Versão:** 1.0.0  
> **Data:** 2026-11-22  
> **Status:** Implementado  

> **Regra:** este documento é a fonte para tudo que é banco de dados. `NAMING-CONVENTION.md` não repete estas regras.

---

## 1. Nomenclatura

### 1.1 Tabelas
As tabelas segurem convenção **snake_case** plural:

- `users` — cadastro de participantes (chave única: e-mail normalizado em minúsculas)
- `sessions` — tokens de sessão Bearer e dados de autenticação
- `cards` — iniciativas do funil de inovação
- `card_pins` — pins anexados aos cartões (chave primária composta: `cardId + userId`)
- `board_voting_state` — estado singleton da votação corrente
- `voting_sessions` — histórico completo de sessões de votação
- `audit_logs` — trilha de auditoria append-only com hash SHA-256 encadeado

### 1.2 Colunas
Convenção **snake_case** para todas as colunas. Exemplos principais:

| Tabela | Colunas Principais |
|--------|-------------------|
| `users` | `id`, `name`, `email`, `password_hash`, `password_salt`, `password_changed_by_user`, `role`, `specialty`, `cursor_color`, `active`, `federated_provider`, `federated_sub`, `created_at`, `updated_at` |
| `sessions` | `token`, `user_id`, `created_at`, `expires_at` |
| `cards` | `id`, `title`, `discipline`, `pain_opportunity`, `proposed_solution`, `expected_benefit`, `implementation_model`, `effort`, `technical_architecture`, `prerequisites_dependencies`, `security_privacy_risks`, `mvp_success_criteria`, `technical_lead`, `stage`, `pos_x`, `pos_y`, `order_index`, `author_id`, `author_name`, `version`, `created_at`, `updated_at` |
| `card_pins` | `card_id`, `user_id`, `user_name`, `pin_type`, `voting_session_id`, `created_at` |
| `board_voting_state` | `id` (CHECK id = 'default'), `voting_open`, `tallied_at`, `top_ideas_json`, `updated_at`, `updated_by` |
| `voting_sessions` | `id`, `session_number`, `session_date`, `status`, `opened_by`, `opened_at`, `closed_by`, `closed_at`, `total_votes`, `present_user_ids_json`, `absent_user_ids_json`, `initial_pitch_count`, `initial_evaluation_count`, `initial_backlog_count`, `new_card_ids_json`, `voted_card_ids_json`, `evaluated_card_ids_json`, `backlog_card_ids_json`, `top_ideas_json`, `moved_card_titles_json` |
| `audit_logs` | `id`, `timestamp`, `actor_id`, `actor_name`, `actor_email`, `actor_role`, `action`, `entity_type`, `entity_id`, `entity_label`, `before_state`, `after_state`, `integrity_hash` |

### 1.3 Prefixos de Constraints/Índices/Triggers
Todos os índices e constraints segurem o padrão **pk_**, **fk_**, **uk_**, **ck_**, **idx_**, **trg_**:

- **pk_** = Primary Key
- **fk_** = Foreign Key
- **uk_** = Unique Constraint
- **ck_** = Check Constraint
- **idx_** = Índice comum (performance)
- **trg_** = Trigger

Exemplos no projeto:
- `pk_users` (primary key em `id`)
- `fk_cards_author_id` (foreign key referenciando `users.id`)
- `uk_users_email` (unique constraint em e-mail normalizado)
- `idx_cards_stage` (índice em `stage` para queries de agrupamento)
- `trg_audit_hash` (trigger que calcula hash SHA-256 antes de inserir em audit_logs)

---

## 2. Colunas de Auditoria

Todas as tabelas têm controle de auditoria. Colunas obrigatórias:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `timestamp` | TEXT (ISO 8601) | Data/hora da operação |
| `actor_id` | TEXT | ID do usuário que executou a ação |
| `actor_name` | TEXT | Nome do usuário |
| `actor_email` | TEXT | E-mail do usuário |
| `actor_role` | TEXT | Papel (ADMIN/FACILITATOR/MEMBER/VIEWER) |
| `before_state` | JSON | Estado antes da mutação (nullable) |
| `after_state` | JSON | Estado após a mutação |
| `integrity_hash` | TEXT (SHA-256, 16 chars) | Hash que encadeia o log anterior (audit_logs apenas) |

**Regra RN-06.2:** O log de auditoria é persistido na mesma transação da operação de negócio.
**Regra ADR-002:** `journal_mode = DELETE` para eliminação de dependências de memória compartilhada (`-shm`/`-wal`).

---

## 3. Isolamento e Acesso por Linha

| Tabela | Regra de Isolamento |
|--------|---------------------|
| `users` | Acesso restrito por `id`; `federated_provider` e `federated_sub` para login SSO |
| `sessions` | Acesso por `token` (opaco, 256 bits); `user_id` vincula à conta |
| `cards` | RBAC server-side: `VIEWER` bloqueado; `MEMBER` apenas próprios; `FACILITATOR`/`ADMIN` livres |
| `card_pins` | 1 pin por usuário por cartão (chave primária composta `cardId + userId`); validação de `Voto +1` por sessão |
| `board_voting_state` | Acesso singleton (`id = 'default'`); apenas `ADMIN`/`FACILITATOR` para mutações |
| `voting_sessions` | Histórico imutável; `append-only` com hash encadeado; acesso exclusivo `ADMIN`/`FACILITATOR` |
| `audit_logs` | **Strictamente append-only**: nenhuma rota `UPDATE` ou `DELETE` exposta; cada novo evento calcula `integrityHash = SHA-256(previousHash + payload)` |

---

## 4. Migrações

- **Biblioteca:** `better-sqlite3` com transações síncronas
- **Journal Mode:** `PRAGMA journal_mode = DELETE` (sem dependência de `-shm`/`-wal`)
- **Quick Check:** `PRAGMA quick_check` na inicialização para detectar corrupção
- **Busy Timeout:** `PRAGMA busy_timeout = 5000` (5 segundos timeout para locks)
- **Migrações Evolutivas:** Colunas adicionadas via `ALTER TABLE`; verificadas via `PRAGMA table_info` antes de executar
- **Idempotência:** Seeds iniciais não destrutivos (verificam `COUNT(*) > 0` antes de inserir)
- **Schema migrations** armazenadas em `server/db.ts` (ou `db/db.ts` na raiz) com blocos de verificação de colunas existentes

---

## 5. Ciclo de Vida dos Dados

| Etapa | Descrição |
|-------|-----------|
| **Criação** | Seeds idempotentes via `seedInitialData()` e `seedInitialPinsIfEmpty()`; transação atomic tudo-ou-nada |
| **Atualização** | `UPDATE` via transações `db.transaction()`; cada mutação tem correspondente `appendAuditLog()` |
| **Leitura** | Apenas `SELECT` com *prepared statements* parametrizados; 100% das queries são parametrizadas |
| **Exclusão** | `DELETE` operations são restritas; `audit_logs` nunca são alteradas (append-only) |
| **Soft Delete** | Não aplicado; registros são removidos fisicamente quando necessário, com migração de dados caso haja necessidade futura |

---

## 6. Seeds e Dados de Referência

- **Seed inicial:** `seedInitialData()` em `db/db.ts` — 7 usuários (1 ADMIN, 2 FACILITATOR, 2 MEMBER, 1 VIEWER) com senha padrão `og1@2026`
- **Federated providers:** `Microsoft Entra ID` e `Google Workspace`
- **Specialties definidas:** `Engenharia de Dados`, `Analytics / BI`, `IA / GenAI`, `Governança / FinOps`
- **Effort sizes:** `P` (Pequeno), `M` (Médio), `G` (Grande), `XG` (Extra Grande)
- **Implementation models:** `In-House`, `Parceiro / Consultoria`, `SaaS / Managed`, `Híbrido`
- **PIN types:** `vote_plus`, `applause`, `thumbs_up`, `thumbs_down`, `heart`
- **Roles:** `ADMIN`, `FACILITATOR`, `MEMBER`, `VIEWER`
- **Todos os seeds são não destrutivos:** reexecução nunca sobrescreve dados existentes (exceto contas novas em carga limpa)

---

**Integração:** Este documento deve ser lido em conjunto com `NAMING-CONVENTION.md` (convenções de nome) e `SAD.md` (stack e arquitetura geral). Mudanças neste documento exigem revisão conforme `AGENTS.md` §5 (alteração de modelo de dados/migração requer aprovação humana).
