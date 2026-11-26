# Plano de Execução: US-01 — Abrir o workspace e a estrutura inicial

**RF Relacionado:** RF-01  
**Status do RF:** Consultado em PRD.md (v0.4.0, Aprovado)  
**Pacote SDD:** docs/sdd/01-abrir-workspace/  
**Data de Criação:** 2026-11-25  

## 1. Visão Geral do Requisito

- **Título:** Autenticação Híbrida e Unificação de Conta por E-mail
- **Descrição Funcional:** Acesso via e-mail corporativo e senha local, auto-registro de novos usuários, alteração de senha pelo próprio usuário e login federado (Microsoft Entra ID e Google Workspace).
- **Atores Envolvidos:** ADMIN, FACILITATOR, MEMBER, VIEWER.
- **Regras de Negócio:**
  - RN-01.1: O e-mail normalizado em minúsculas é a chave única de identificação do usuário.
  - RN-01.2: No primeiro login federado de um usuário previamente cadastrado via carga inicial com o mesmo e-mail, a identidade externa é vinculada automaticamente à conta existente, preservando papel, especialidade e cor de cursor.
  - RN-01.3: Auto-registros sem cadastro prévio recebem o papel padrão MEMBER.

## 2. Plano de Execução

### 2.1 Atividades Pré-Desenvolvimento

- [ ] **Verificar Use Case** `UC-01 - Abrir o workspace e a estrutura inicial` — Confirmar existência e status `Aprovado`.
- [ ] **Verificar Test Cases** `TC-01.01 a TC-01.03` — Confirmar existência e validação dos cenários de teste.
- [ ] **Confirmar status `Aprovado`** — User Story `US-01`, Use Case `UC-01` e Test Cases `TC-01.01` a `TC-01.03` devem estar `Aprovado` antes da implementação (conforme GUIDELINE.md §9).
- [ ] **Revisar SAD.md** — Conferir seções de arquitetura, autenticação e isolamento (enquanto `[A VALIDAR]`).
- [ ] **Confirmar DATABASE-PATTERN.md** — Padrões de banco de dados para autenticação (hash de senha, salt, tokens).
- [ ] **Confirmar NAMING-CONVENTION.md** — Convenções de nomeclatura para tabelas, colunas e IDs.

### 2.2 Atividades de Desenvolvimento

- [ ] **Implementar fluxo de autenticação local** — Login com e-mail e senha, hash via scryptSync, validação temporamente constante.
- [ ] **Implementar fluxo de auto-registro** — Cadastro de novo usuário com papel padrão MEMBER, geração de cursorColor aleatório.
- [ ] **Implementar login federado** — Endpoint POST /api/auth/federated para Microsoft Entra ID e Google Workspace, vinculação automática de identidade.
- [ ] **Implementar unificação de identidade** — Quando usuário previamente cadastrado faz login federado, vincular fid a conta existente preservando papel e especialidade.
- [ ] **Implementar validação de e-mail** — Normalização em minúsculas, regex de formato de e-mail.

### 2.3 Atividades Pós-Desenvolvimento

- [ ] **Executar suíte de testes** — `npm run test` com foco em testes de autenticação (TC-01.01 a TC-01.03).
- [ ] **Verificar comandos de qualidade** — `tsc --noEmit` verde; zero erros de lint.
- [ ] **Atualizar TO-DO.md** — Marcar conclusão do planejamento do pacote `01-abrir-workspace`.
- [ ] **Criar Pull Request** — Referenciando IDs: `RF-01`, `US-01`, `UC-01`, `TC-01.01 a TC-01.03`.
- [ ] **Executar validação estrutural** — Skill `sdd-structure-validator` sobre o pacote `01-abrir-workspace`.

### 2.4 Atividades de Documentação

- [ ] **Atualizar User Story** `US-01-ABRIR-WORKSPACE` — Caso haja mudanças nos critérios de aceite.
- [ ] **Atualizar Use Case** `UC-01-ABRIR-WORKSPACE` — Caso houver novas regras de fluxo.
- [ ] **Gerar ASCII-MOCKUP** (se Extensão A estiver ativa) — Desenho das páginas de auth (login, auto-registro, login federado).

## 3. Rastreabilidade

| Tipo | ID | Status | Observação |
|------|----|--------|------------|
| Requisito Funcional | RF-01 | Consultado | Em PRD.md (v0.4.0, Aprovado) |
| User Story | US-01 | [A definir] | Pacote 01-abrir-workspace — depende de aprovação total |
| Use Case | UC-01 | [A definir] | Pacote 01-abrir-workspace — depende de aprovação total |
| Caso de Teste | TC-01.01 a TC-01.03 | [A definir] | Pacote 01-abrir-workspace — depende de aprovação total |

## 4. Observações

- Este plano deriva do requisito RF-01 do documento PRD.md versão 0.4.0 (status Aprovado).
- Para implementação efetiva, o agente `sdd-developer` deve ser acionado **apenas** quando User Story, Use Case e Test Case estiverem com status `Aprovado`.
- RN-01.2 (unificação de identidade federada) e RN-01.3 (auto-registro MEMBER) são as regras críticas que devem ser validadas em testes unitários e de integração.
- Caso o fluxo de autenticação envolva interface de usuário (telas de login, auto-registro), verificar a presença de `ASCII-MOCKUP-01-ABRIR-WORKSPACE.md` e `DESIGN.md` (tokens visuais).
- Todas as alterações de modelo de dados (tabelas users, sessions) exigem aprovação humana conforme AGENTS.md §5.
- O hash de senha deve ser derivado com `crypto.scryptSync` (64 bytes) e *salt* aleatório de 16 bytes; verificação em tempo constante via `crypto.timingSafeEqual`.

## 4. Próximos Passos Após Criação do Plano

- [ ] **Aprovar specs** — Mover User Story, Use Case e Test Cases de `Draft`/`Em revisão` para `Aprovado`.
- [ ] **Executar implementação** — Skill `sdd-developer` com os artefatos aprovados.
- [ ] **Executar validação estrutural** — Skill `sdd-structure-validator` sobre o pacote `01-abrir-workspace`.
- [ ] **Próximo pacote** — Consultar TO-DO.md para o próximo pacote prioritário (próximo da lista: `02-error-handling`).
- [ ] **Relatório final** — Publicar relatório conforme GUIDELINE.md §8, citando IDs `RF-01`, `US-01`, `UC-01`, `TC-01.01 a TC-01.03`.

---
*Plano de execução gerado para o pacote `01-abrir-workspace`, relacionado ao requisito RF-01 do PRD.md. Este documento deve ser mantido atualizado sempre que houver mudanças nos artefatos de spec ou no código implementado.*