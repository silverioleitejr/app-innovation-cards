# Test Case: TC-AGENTES-01.01 a TC-AGENTES-01.03 — Hook de Gerenciamento de Pins

**Status:** Draft  
**Framework:** Vitest (ou Jest)  
**Relacionado:** `US-AGENTES-01`, `UC-AGENTES-01`

## TC-AGENTES-01.01 — Hook de anexar pin

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que o hook consegue anexar um pin a um cartão |
| **Pre-condição** | Hook `useCardPinsManagement` importado e disponível |
| **Passos** | 1. Chamar `anexarPin('card-123', 'vote_plus')`<br>2. Verificar no state do componente |
| **Expected** | Pin `vote_plus` adicionado ao cartão `card-123`<br>Estado atualizado no componente<br>Evento de broadcast WebSocket disparado |

## TC-AGENTES-01.02 — Hook de substituir pin

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que o hook consegue substituir um pin existente |
| **Pre-condição** | Cartão já possuir um pin `vote_plus` |
| **Passos** | 1. Chamar `substituirPin('card-123', 'thumbs_up')`<br>2. Verificar estado do componente |
| **Expected** | Pin `vote_plus` removido, pin `thumbs_up` adicionado<br>Estado refletido em todos os componentes via WebSocket<br>Regra `RN-07.2` respeitada (máximo 1 pin por usuário/sessão) |

## TC-AGENTES-01.03 — Hook de remover pin

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que o hook consegue remover um pin de um cartão |
| **Pre-condição** | Cartão possuir pin `vote_plus` ou `thumbs_up` |
| **Passos** | 1. Chamar `removerPin('card-123')`<br>2. Verificar estado do componente |
| **Expected** | Pin removido do cartão<br>Estado limpo no componente<br>Botão de pin ainda ativo para nova aplicação (regra `RN-07.3`) |

## Critérios de Conclusão
- [ ] Todos os 3 test cases passing (`npm run test`)
- [ ] Cobertura de código mínima de 80% para o hook
- [ ] `TO-DO.md` atualizado com conclusão
- [ ] Nenhum efeito colateral em componentes não afetados