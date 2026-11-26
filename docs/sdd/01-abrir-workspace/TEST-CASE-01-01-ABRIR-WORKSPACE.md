# Test Case: TC-01.01 a TC-01.03 — Validar Cenários do Use Case "Abrir workspace"

**Status:** Aprovado  
**User Story Relacionada:** `US-01 - Abrir o workspace e a estrutura inicial`  
**Rastreabilidade PRD:** `RF-01` · `RN-01.1` · `RN-01.2` · `RN-01.3`  
**Skill Responsável:** `docs/skills/sdd-testcase-writer/SKILL.md`

---

## TC-01.01 — Validar abertura de workspace com identidade informada

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que o workspace pode ser aberto quando a identidade do projeto está informada e válida. |
| **Pre-condição** | O Use Case `UC-01` está `Aprovado`. O usuário tem permissão de criação. |
| **Passos** | 1. Fornecer identidade do projeto conforme validação em `SAD.md` [A VALIDAR].<br>2. Chamar função de abertura de workspace com dados de identidade.<br>3. Verificar resposta da operação. |
| **Expected** | Retorna sucesso na criação do workspace com estrutura inicial visível.<br>Validações positivas: pasta `docs/sdd/01-abrir-workspace/` criada, arquivos de spec padrão presentes.<br>Validações negativas: identidade ausente retorna erro claro; operação não cria workspace parcial. |

---

## TC-01.02 — Validar recusa de abertura por identidade inválida

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que o sistema bloqueia a abertura de workspace quando a identidade do projeto é inválida ou inexistente. |
| **Pre-condição** | O Use Case `UC-01` está `Aprovado`. Usuário sem permissão de criação. |
| **Passos** | 1. Tentar abrir workspace com identidade inválida/ausente.<br>2. Verificar resposta de erro do sistema. |
| **Expected** | Retorna erro claro indicando identidade inválida ou falta de permissão.<br>Workspace **não** é criado.<br>Sistema não permanece em estado parcial. |

---

## TC-01.03 — Validar estrutura mínima do workspace criado

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que o workspace criado tem a estrutura inicial mínima do método SDD. |
| **Pre-condição** | O Use Case `UC-01` está `Aprovado`. Workspace criado com sucesso em TC-01.01. |
| **Passos** | 1. Verificar pastas obrigatórias: `docs/`, `docs/templates/`, `docs/sdd/`, `.agents/skills/`, `src/`, `db/`.<br>2. Verificar arquivos raiz: `README.md` e `.gitignore`.<br>3. Confirmar que `.gitignore` bloqueia `README.ini` e `.env`. |
| **Expected** | Todas as pastas e arquivos obrigatórios presentes.<br>`README.md` e `.gitignore` existem na raiz.<br>`.gitignore` bloqueia `README.ini` e `.env` corretamente.<br>Estrutura alinhada com `ESTRUTURA-ARTEFATOS-SDD.md`. |

---

## Critérios de Conclusão

- [ ] Cenário de fluxo principal coberto (abertura com identidade válida).
- [ ] Cenário de exceção coberto (recusa com identidade inválida).
- [ ] estrutura mínima verificada e confirmada.
- [ ] [A VALIDAR] em `SAD.md` resolvido antes de marcar teste como concluído.
- [ ] Rastreabilidade mantida: `TC-01.01` → `UC-01` → `US-01` → `RF-01`.

---

*Gerado pela skill `sdd-testcase-writer` a partir do Use Case `UC-01`. Status `Draft`. Não implementar enquanto estiver `Draft` ou enquanto os itens `[A VALIDAR]` deste arquivo não forem fechados.*