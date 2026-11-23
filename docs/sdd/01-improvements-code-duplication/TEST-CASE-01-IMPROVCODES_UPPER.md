# Test Case: TC-IMPROV-01.01 a TC-IMPROV-01.03 — Hook de Gerenciamento de Pins

**Status:** Draft  
**Framework:** Vitest / Jest  
**Relacionado:** `US-IMPROV-01`, `UC-IMPROV-01`

## TC-IMPROV-01.01 — Hook useCardPin: retornar pin do usuário

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que o hook `useCardPin` retorna o pin do usuário logado em um cartão |
| **Pre-condição** | Hook `useCardPin` importado e card com pins cadastrados |
| **Passos** | 1. Chamar `useCardPin('card-123', 'user-456')`<br>2. Verificar o objeto retornado |
| **Expected** | Retorna `{ pinType: 'vote_plus', mine: true, blockedByClosed: false, blockedByRuleB: false }` quando o usuário tem voto+ no cartão |

## TC-IMPROV-01.02 — Hook useGroupedPins: agrupar por tipo

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que o hook `useGroupedPins` agrupa pins por tipo corretamente |
| **Pre-condição** | Hook `useGroupedPins` importado e array de pins diversificado |
| **Passos** | 1. Chamar `useGroupedPins(pinsArray, 'user-456')`<br>2. Verificar estrutura do retorno |
| **Expected** | Retorna objeto com chaves para cada `PinType` contendo `{ count, mine, isVotePlus, blockedByClosed, blockedByRuleB, names }` |

## TC-IMPROV-01.03 — Hook useVoteValidation: validar voto

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que o hook `useVoteValidation` valida corretamente as regras de voto |
| **Pre-condição** | Hook `useVoteValidation` importado com state simulando sessão aberta/fechada |
| **Passos** | 1. Chamar `useVoteValidation(userId, userVoteCard, votingOpen, votingSessionNumber)`<br>2. Verificar estado de validação |
| **Expected** | Retorna objeto com `valid`, `blockedByClosed`, `blockedByRuleB`, e mensagens apropriadas baseadas nas regras `RN-07.1` a `RN-07.4` |

## Critérios de Conclusão
- [ ] Todos os 3 test cases passing (`npm run test`)
- [ ] Hook `useCardPinsManagement` criado em `src/hooks/`
- [ ] `CardPinsBar`, `BoardFunnelView`, `SessionsView` usando o novo hook
- [ ] Comportamento idêntico antes e depois da refatoração (tests passing)
- [ ] `TO-DO.md` atualizado com conclusão