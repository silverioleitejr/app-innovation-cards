# Use Case: UC-AGENTES-01 — Extrair Hook de Gerenciamento de Pins

**Status:** Draft  
**Actor:** Desenvolvedor Frontend  
**Preconditions:**  
- Acesso ao repositório `app-innovation-cards`  
- Conhecimento de `CardPinsBar`, `BoardFunnelView`, `SessionsView`  
- `AGENTS.md` lido e entendido  

## Fluxo de Execução

1. **Identificar duplicação**: Rodar `npm run lint` e analisar componentes `CardPinsBar.tsx`, `BoardFunnelView.tsx`, `SessionsView.tsx` em busca de lógica repetida de gerenciamento de pins
2. **Definir hook**: Criar `src/hooks/useCardPinsManagement.ts` com as seguintes funcionalidades:
   - `anexarPin(cardId, pinType, votingSessionId)`
   - `substituirPin(cardId, newPinType, votingSessionId)`
   - `removerPin(cardId, votingSessionId)`
   - `obterPinsDoCartao(cardId)`
3. **Atualizar componentes**: Substituir a lógica inline em cada componente pelo novo hook
4. **Verificar**: Rodar `npm run test` e confirmar que todos os testes passam
5. **Documentar**: Atualizar `TO-DO.md` com conclusão

## Pós-condições
- Hook `useCardPinsManagement` criado e exportado
- `CardPinsBar`, `BoardFunnelView`, `SessionsView` usando o novo hook
- Nenhuma funcionalidade de pins perdida ou alterada
- `TO-DO.md` atualizado com status `Concluído`

## Fluxo Alternativo
Se o hook não puder ser extraído sem quebrar a funcionalidade, considerar a criação de um utilitário compartilhado em `src/lib/` em vez disto.

## Relacionados
- `US-AGENTES-01` (User Story acima)
- `TC-AGENTES-01.01` a `TC-AGENTES-01.03` (Test Cases)
- `RF-07.1`, `RN-07.1`, `RN-07.2`, `RN-07.3` (Regras de negócio do PRD)