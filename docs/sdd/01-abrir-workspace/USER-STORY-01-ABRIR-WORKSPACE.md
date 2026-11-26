# User Story: US-01 — Abrir o workspace e a estrutura inicial

**Status:** Aprovado  
**Priority:** Alta  
**Relacionado:** `RF-01`, `RN-01.1`, `RN-01.2`, `RN-01.3` (PRD.md)

## Descrição
Como Arquiteto de Soluções, desejo abrir um workspace com a estrutura inicial do método SDD pronta para receber os artefatos, sem necessidade de comando de terminal, para iniciar um novo projeto de inovação de forma padronizada.

## Critérios de Aceite
- [x] Workspace criado com estrutura inicial do método (padrão NN-slug)
- [x] Identidade do projeto informada e validada contra SAD.md
- [x] Estrutura de pastas (docs/, src/, .agents/skills/, db/) presente e organizada
- [x] Documentos de fundação (GUIDELINE.md, AGENTS.md, PRD.md, SAD.md, TO-DO.md, docs/GLOSSARY.md) presentes
- [x] Pacotes SDD (docs/sdd/NN-slug/) já decompostos e mapeados no TO-DO.md
- [x] Sem segredos expostos no repositório
- [x] TO-DO.md atualizado com conclusão da tarefa

## Dependências
- `GUIDELINE.md` — Metodologia SDD (ordem canônica §4)
- `AGENTS.md` — Contrato operacional do projeto
- `TO-DO.md` — Tracker de atividades (Etapa 1b: Decomposição)
- `SAD.md` — Arquitetura e stack (seções de validação)
- `DATABASE-PATTERN.md` — Padrões de banco de dados
- `NAMING-CONVENTION.md` — Convenções de nomeclatura

## Sub-tarefas
1. Verificar existência de identidade de projeto e permissões [A VALIDAR]
2. Validar estrutura de diretórios conforme ESTRUTURA-ARTEFATOS-SDD.md
3. Confirmar presença de documentos de fundação em docs/
4. Mapear RFs do PRD para pacotes NN-slug no TO-DO.md
5. Registrar conclusão em TO-DO.md

## Observações
- Este pacote é foundation — não implementa funcionalidade de negócio do produto destino
- Extensão A ativa: Interface & UX (requer DESIGN.md para tokens visuais)
- Rastreabilidade: RF-01 → US-01 → UC-01 → TC-01.01 a TC-01.04
- Skill responsável: sdd-developer (apenas após aprovação total das specs)

---
*Artefato gerado conforme GUIDELINE.md §3 e §9. Status: Aprovado — liberado para implementação ou referência.*