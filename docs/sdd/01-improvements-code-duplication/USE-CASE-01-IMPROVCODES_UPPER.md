# Use Case: UC-IMPROV-01 — Extrair Hook de Gerenciamento de Pins

**Status:** Draft  
**Actor:** Desenvolvedor Frontend  
**Preconditions:**  
- Acesso ao repositório `app-innovation-cards`  
- Conhecimento de `CardPinsBar`, `BoardFunnelView`, `SessionsView`  
- `AGENTS.md` lido e entendido  

## Fluxo de Execução

1. **Identificar duplicação**: Analisar a lógica de gerenciamento de pins em `CardPinsBar.tsx`, `BoardFunnelView.tsx`, `SessionsView.tsx`:
   - Extração do `userPin` via `pins.find((p) => p.userId === currentUserId)`
   - Cálculo do `grouped` a partir de `PIN_TYPES.map(...)` 
   - Lógica de `voteUsedOnOtherCard` e `voteLockedClosed`
   - Geração de tooltips e labels para cada tipo de pin
2. **Definir hook**: Criar `src/hooks/useCardPinsManagement.ts` com as seguintes responsabilidades:
   - `useCardPin(cardId, userId)` → returns `{ pinType, mine, blockedByClosed, blockedByRuleB }`
   - `useGroupedPins(pins, currentUserId)` → returns grouped metadata for all pin types
   - `useVoteValidation(currentUserId, userVoteCard, votingOpen, votingSessionNumber)` → returns validation state
   - `usePinTooltip(cardId, currentUserId, pins, userVoteCard, votingOpen, votingSessionNumber)` → returns tooltip string
3. **Atualizar componentes**: Substituir a lógica inline em cada componente pelo novo hook:
   - `CardPinsBar.tsx`: substituir os cálculos de `userPin`, `grouped`, `voteUsedOnOtherCard`, `voteLockedClosed`, e a geração de tooltips
   - `BoardFunnelView.tsx`: atualizar para usar o hook onde a lógica de pins aparece
   - `SessionsView.tsx`: atualizar para usar o hook onde a lógica de pins aparece
4. **Verificar**: Rodar `npm run test` e confirmar que todos os testes passam
5. **Documentar**: Atualizar `TO-DO.md` com conclusão da tarefa

## Pós-condições
- Hook `useCardPinsManagement` criado e exportado em `src/hooks/`
- `CardPinsBar`, `BoardFunnelView`, `SessionsView` usando o novo hook
- Nenhuma funcionalidade de pins perdida ou alterada (mismo comportamento)
- `TO-DO.md` atualizado com status `Concluído`

## Fluxo Alternativo
Se o hook não puder ser extraído sem quebrar a funcionalidade, considerar a criação de um utilitário compartilhado em `src/lib/` em vez disto, ou extrair funções puras para `src/types.ts`.

## Relacionados
- `US-IMPROV-01` (User Story acima)
- `TC-IMPROV-01.01` a `TC-IMPROV-01.03` (Test Cases)
- `RF-07.1`, `RN-07.1`, `RN-07.2`, `RN-07.3` (Regras de negócio do PRD)