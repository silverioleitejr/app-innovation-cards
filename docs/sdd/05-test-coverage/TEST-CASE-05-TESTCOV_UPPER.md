# Test Case: TC-AGENTES-05.01 a TC-AGENTES-05.13 — Testes Automatizados

**Status:** Draft  
**Framework:** Vitest  
**Relacionado:** `US-AGENTES-05`, `UC-AGENTES-05`

## Funções Puras em `src/types.test.ts`

## TC-AGENTES-05.01 — validateBacklogGate: cenário completo

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Testar `validateBacklogGate` com todos os 3 campos preenchidos |
| **Pre-condição** | Função importada de `src/types` |
| **Passos** | Chamar `validateBacklogGate({ technicalArchitecture, mvpSuccessCriteria, technicalLead: 'João Silva' })` |
| **Expected** | `{ valid: true, missingFields: [], completedCount: 3 }` |

## TC-AGENTES-05.02 — validateBacklogGate: falta 1 campo

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Testar `validateBacklogGate` com apenas 1 campo preenchido |
| **Pre-condição** | Função importada de `src/types` |
| **Passos** | Chamar `validateBacklogGate({ technicalArchitecture: 'Arquitetura Padrão' })` |
| **Expected** | `{ valid: false, missingFields: ['Arquitetura e Solução Técnica', 'Critérios de Sucesso do MVP', 'Líder Técnico Responsável'], completedCount: 1 }` |

## TC-AGENTES-05.03 — validateBacklogGate: falta 2 campos

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Testar `validateBacklogGate` com 2 campos preenchidos |
| **Pre-condição** | Função importada de `src/types` |
| **Passos** | Chamar `validateBacklogGate({ technicalArchitecture: 'Arq.', mvpSuccessCriteria: 'CRITÉRIOS' })` |
| **Expected** | `{ valid: false, missingFields: ['Líder Técnico Responsável'], completedCount: 2 }` |

## TC-AGENTES-05.04 — computeTopVotedIdeas: ranking por votos

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Testar ranking de ideias pelos votos |
| **Pre-condição** | Array de `IdeaCard[]` com pins variados |
| **Passos** | Chamar `computeTopVotedIdeas(cards, 5)` |
| **Expected** | Ranking com no máximo 5 ideias, ordenado por `positiveVotes` descending, empatado por stage e createdAt |

## TC-AGENTES-05.05 — computeTopVotedIdeas: limite 5

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Testar que o retorno nunca excede o limite especificado |
| **Pre-condição** | Array de cards com mais de 5 votos cada |
| **Passos** | Chamar `computeTopVotedIdeas(cards, 5)` com 10+ cards com votos |
| **Expected** | Retorno contém no máximo 5 cards, ainda que haja mais cards com votos |

## TC-AGENTES-05.06 — computeTopVotedIdeas: empatado por stage

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Testar desempate por stage (PITCH antes) |
| **Pre-condição** | Dois cards com mesmo score, estágios diferentes |
| **Passos** | Chamar `computeTopVotedIdeas(cards, 2)` com cards PITCH e EVALUATION com mesmo score |
| **Expected** | Card do stage PITCH aparece antes do card do stage EVALUATION no resultado |

## TC-AGENTES-05.06 — computeTopVotedIdeas: empatado por data

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Testar desempate por data (mais recente) |
| **Pre-condição** | Dois cards com mesmo score, mesmo stage, diferentes createdAt |
| **Passos** | Chamar `computeTopVotedIdeas(cards, 2)` com cards mesmo stage, createdAt diferentes |
| **Expected** | Card com createdAt mais recente aparece primeiro |

## TC-AGENTES-05.07 — getMatrixQuadrant: QUICK_WIN

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Testar quadrante QUICK_WIN (alto benefício, baixo esforço) |
| **Pre-condição** | Função importada de `src/types` |
| **Passos** | Chamar `getMatrixQuadrant(25, 75)` — posX baixo, posY alto |
| **Expected** | `{ id: 'QUICK_WIN', label: 'Ganhos Rápidos', description: 'Alto benefício · Baixo esforço' }` |

## TC-AGENTES-05.08 — getMatrixQuadrant: STRATEGIC

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Testar quadrante STRATEGIC (alto benefício, alto esforço) |
| **Pre-condição** | Função importada de `src/types` |
| **Passos** | Chamar `getMatrixQuadrant(75, 75)` — posX alto, posY alto |
| **Expected** | `{ id: 'STRATEGIC', label: 'Projetos Estruturantes', description: 'Alto benefício · Alto esforço' }` |

## TC-AGENTES-05.09 — getMatrixQuadrant: CONTINUOUS

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Testar quadrante CONTINUOUS (benefício moderado, baixo esforço) |
| **Pre-condição** | Função importada de `src/types` |
| **Passos** | Chamar `getMatrixQuadrant(25, 75)` — posX baixo, posY alto |
| **Expected** | `{ id: 'CONTINUOUS', label: 'Melhorias Contínuas', description: 'Benefício moderado · Baixo esforço' }` |

## TC-AGENTES-05.10 — getMatrixQuadrant: ICEBOX

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Testar quadrante ICEBOX (benefício moderado, alto esforço) |
| **Pre-condição** | Função importada de `src/types` |
| **Passos** | Chamar `getMatrixQuadrant(75, 25)` — posX alto, posY baixo |
| **Expected** | `{ id: 'ICEBOX', label: 'Icebox', description: 'Benefício moderado · Alto esforço' }` |

## TC-AGENTES-05.11 — getInitials: nome completo

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Testar `getInitials` com nome completo |
| **Pre-condição** | Função importada de `src/types` |
| **Passos** | Chamar `getInitials('João Silva')` |
| **Expected** | `'JS'` |

## TC-AGENTES-05.12 — getInitials: nome único

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Testar `getInitials` com nome único |
| **Pre-condição** | Função importada de `src/types` |
| **Passos** | Chamar `getInitials('Maria')` |
| **Expected** | `'MA'` |

## TC-AGENTES-05.13 — getInitials: string vazia

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Testar `getInitials` com string vazia |
| **Pre-condição** | Função importada de `src/types` |
| **Passos** | Chamar `getInitials('')` |
| **Expected** | `'?'` |

## Componentes Críticos — Regras de Voting

## TC-AGENTES-05.14 — Votação aberta vs fechada

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Testar que `Voto +1` é bloqueado quando votação está fechada |
| **Pre-condição** | Componente ou mock que simula estado de votação |
| **Passos** | 1. Definir `votingOpen: false`<br>2. Tentar aplicar `vote_plus` em cartão<br>3. Verificar se operação é bloqueada |
| **Expected** | Operação bloqueada com mensagem: "Votação fechada. Pin não aplicável." |

## TC-AGENTES-05.15 — Votos múltiplos no mesmo card

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Testar que usuário pode ter no máximo 1 pin por card |
| **Pre-condição** | Usuário já possui `vote_plus` em card A |
| **Passos** | 1. Tentar aplicar outro `vote_plus` no mesmo card A<br>2. Verificar se operação é bloqueada e informa card atual |
| **Expected** | Operação bloqueada, mensagem informa card onde voto já está alocado (regra `RN-07.2`) |

## TC-AGENTES-05.15 — Botão Pin sempre ativo

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Testar que botão de pin permanece ativo para troca direta |
| **Pre-condição** | Usuário logado, votação aberta |
| **Passos** | 1. Verificar UI do pin em card<br>2. Tentar substituir pin de `vote_plus` para `thumbs_up`<br>3. Verificar se valida regras RN-07.1 e RN-07.2 antes de aplicar |
| **Expected** | Botão ativo, substituição aplicada com validação prévia, estado sincronizado em tempo real (regra `RN-07.3`) |

## Critérios de Conclusão
- [ ] Todas as TCs 05.01 a 05.13 passando (`npm run test`)
- [ ] Testes de componentes críticos (05.14 a 05.15) passando
- [ ] Cobertura mínima de 80% identificada
- [ ] `TO-DO.md` atualizado com conclusão
- [ ] `npm run test` e `npm run typecheck` passando