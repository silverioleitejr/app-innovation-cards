---
name: sdd-update-agents
description: Skill para atualização do AGENTS.md em projetos SDD, definindo contrato de comportamento agentico baseado em GUIDELINE.md, PRD.md e SAD.md.
---
# sdd-update-agents — Atualização do AGENTS.md em Projetos SDD

## Propósito

Esta skill dokumenta o procedimento operacional para atualizar o arquivo `AGENTS.md` em projetos que adotam Spec-Driven Development (SDD). O `AGENTS.md` é **crítico** para o projeto, pois define o contrato de comportamento dos agentes de IA.

## Pré-condições

Antes de iniciar a atualização, confirme:

| Item | Fonte | Ação |
|------|-------|------|
| Entender o escopo | `docs/PRD.md` | Ler todos os RFs, RNs e CA's |
| Verificar stack atual | `docs/SAD.md` | Confirmar tecnologias, versões e papéis |
| Revisar metodologia | `docs/GUIDELINE.md` | Confirmar versão e procedimentos SDD |
| Checar convenções | `docs/NAMING-CONVENTION.md` | Confirmar formatos de ID (RF-NN, US-NN, TC-NN.MM, etc.) |
| Revisar ADRs | `docs/ADR.md` (se existir) | Identificar decisões que afetem o contrato de agentes |
| Verificar skills | `.agents/skills/` | Listar skills disponíveis e status de publicação |

## Passo a Passo da Atualização

### Etapa 1 — Leitura Fundamental

1. **Ler `docs/GUIDELINE.md`** (obrigatório):
   - Seção 4: Ordem de Leitura Canônica
   - Seção 5: Ciclo de Trabalho do Agente (Explore → Plan → Execute)
   - Seção 8: Formato do Relatório Final
   - Seção 9: Status de Artefatos de Spec

2. **Ler `docs/PRD.md`** (obrigatório):
   - Visão geral do produto (§1)
   - Objetivos e KPIs de sucesso (Tabela §3)
   - Usuários, personas e perfis de acesso (§4)
   - Escopo funcional (§5) — todos os RF-xx e RN-NN.x
   - Critérios de aceitação (§8)

3. **Ler `docs/SAD.md`** (necessário se houver mudanças de tecnologia):
   - Stack/runtime, frontend UI, bundler, estilização
   - Backend HTTP, tempo real, persistência
   - Segurança (autenticação, autorização, auditoria)
   - Resiliência e integrações

### Etapa 2 — Verificação do Arquivo Atual

1. Comparar `AGENTS.md` (existente) com a estrutura esperada:
   - Verificar se todos os 10 sections estão presentes
   - Confirmar que placeholders `{{...}}` foram substituídos
   - Validar que IDs seguem `GUIDELINE.md` §3 convenção
   - Verificar skills table tem todas skills do projeto marcadas

### Etapa 3 — Ajustes e Substituições

Substituir todos os placeholders `{{...}}` por valores reais do projeto.

### Etapa 4 — Validação Pós-Atualização

1. Executar checklist de validação:
   - `AGENTS.md` segue a ordem canônica de `GUIDELINE.md` §4
   - Nenhum placeholder `{{...}}` permanece no arquivo
   - IDs seguem convenção `NAMING-CONVENTION.md` §3
   - Referências internas usam backticks com prefixo `docs/`
   - Tabela de skills reflete realidade de `.agents/skills/`
   - Comandos padrão correspondem ao `SAD.md` definido

### Etapa 5 — Publicação

1. Salvar o `AGENTS.md` atualizado na raiz do projeto (`AGENTS.md`)
2. Atualizar `docs/TO-DO.md` marcando a tarefa como concluída
3. Confirmar publicação de skills: executar `scripts/sync-skills.sh` se necessário

## Rastreabilidade

| Tipo | ID | Descrição | Referência |
|------|-----|-----------|------------|
| User Story | US-AGENTES-01 | Como agente de IA, quero que o AGENTS.md seja atualizado seguindo a metodologia SDD | GUIDELINE.md §2, §4 |
| Use Case | UC-ATUALIZAR-AGENTES-01 | Atualizar o arquivo AGENTS.md de um projeto SDD com base em PRD.md, SAD.md e GUIDELINE.md | RF-01 (implicação indireta) |
| Test Case | TC-01.01 | Verificar se AGENTS.md tem todos os 10 sections necessários após atualização | GUIDELINE.md §8 |
| Test Case | TC-01.02 | Validar que todos os placeholders `{{...}}` foram substituídos por valores reais | GUIDELINE.md §4 |
| Test Case | TC-01.03 | Confirmar que a tabela de skills reflete o status atual de `.agents/skills/` | GUIDELINE.md §10 |

## Quando Solicitar Aprovação Humana

Pare e peça aprovação explícita antes de continuar, quando ocorrer:

- Alteração de modelo de dados ou migração
- Nova dependência ou versão major da stack
- Mudança em autenticação ou autorização
- Alteração que afete mais de 5 arquivos de produção
- Conflito entre spec (PRD), SAD.md, DATABASE-PATTERN.md, NAMING-CONVENTION.md ou ADR.md

## Checklist de Conclusão

- [ ] `docs/GUIDELINE.md` lido e entendido (seção 4, 5, 8, 9)
- [ ] `docs/PRD.md` lido e entendido (todos os RFs e RNxs)
- [ ] `docs/SAD.md` lido (se houver mudança de stack)
- [ ] `docs/NAMING-CONVENTION.md` consultado (formatos de ID)
- [ ] Arquivo `AGENTS.md` atualizado sem placeholders
- [ ] Tabela de skills atualizada com status real de `.agents/skills/`
- [ ] Comandos padrão adequados ao projeto
- [ ] Aprovação humana obtida (quando necessária)
- [ ] `docs/TO-DO.md` atualizado com conclusão
- [ ] Relatório final publicado seguindo `GUIDELINE.md` §8