# Use Case: UC-AGENTES-05 — Implementação de Testes Automatizados

**Status:** Draft  
**Actor:** Desenvolvedor QA / Frontend  
**Preconditions:**  
- `AGENTS.md` lido (seção 5: quando pedir aprovação humana)  
- `GUIDELINE.md` lido (seção 5: "Testes rastreáveis", seção 8: formato de relatório)  
- `TO-DO.md` consultado (atividades em andamento)  

## Fluxo de Execução

1. **Configurar framework**: Se não existir, adicionar Vitest ao `package.json`:
   - `npm i -D vitest @types/vitest`
   - Adicionar script no `package.json`: `"test": "vitest run"` ou manter `"test": "vitest"`
2. **Criar testes de funções puras** em `src/types.test.ts`:
   - `validateBacklogGate(card)` — testar:
     * Cenário: todos os 3 campos preenchidos → `{ valid: true, completedCount: 3 }`
     * Cenário: apenas `technicalArchitecture` → `{ valid: false, missingFields: ['Critérios de Sucesso do MVP', 'Líder Técnico Responsável'], completedCount: 1 }`
     * Cenário: `technicalArchitecture` + `mvpSuccessCriteria` → `{ valid: false, missingFields: ['Líder Técnico Responsável'], completedCount: 2 }`
   - `computeTopVotedIdeas(cards, limit)` — testar:
     * Cenário: cards com diferentes counts de vote_plus → ranking correto pelo count
     * Cenário: empate em score → desempate por stage (PITCH antes) e createdAt (mais recente)
     * Cenário: cards com 0 vote_plus → excluídos do ranking
   - `getMatrixQuadrant(posX, posY)` — testar:
     * (≤50, ≤50) → QUICK_WIN
     * (>50, ≤50) → STRATEGIC
     * (≤50, >50) → CONTINUOUS
     * (>50, >50) → ICEBOX
     * Edge cases: posX=50, posY=50 (limites)
   - `getInitials(name)` — testar:
     * Nome completo tipo "João Silva" → "JS"
     * Nome único tipo "Maria" → "MA"
     * String vazia tipo "" → "?"
3. **Criar testes de componentes críticos** em `src/components/__tests__/`:
   - Regras de voting (`RN-07.1` a `RN-07.4`):
     * Votação aberta vs fechada
     * Múltiplo voto no mesmo card bloqueado
     * Múltiplo voto em cards diferentes permitido (máximo 1 pin por usuário/sessão)
     * Botão Pin sempre ativo com validação prévia
   - Component BoardFunnelView:
     * Criação de card inline (clique em área vazia)
     * Movimento entre stages (Pitch → Evaluation → Backlog)
     * Pins (anexar, substituir, remover)
   - Component SessionsView:
     * Filtro por data
     * Seleção de sessão
     * Detalhes da sessão
4. **Integrar no pipeline**: Garantir `npm run test` roda todos os testes novos e existentes
5. **Cobertura**: Configurar relatório de cobertura e garantir mínima de 80%
   - `npx vitest run --coverage`
   - Ou `npm run test -- --coverage`
6. **Documentar**: Atualizar `TO-DO.md` com conclusão

## Pós-condições
- Framework Vitest configurado e `npm run test` passando
- Testes para todas as funções puras em `src/types.ts` (4 funções): passing
- Testes para regras críticas de voting e pin management passando
- Cobertura de código mínima de 80% identificada
- `TO-DO.md` atualizado com status `Concluído`

## Fluxo Alternativo
Se o projeto já usar Jest, não migrar para Vitest — manter o existente e adicionar testes novos.

## Relacionados
- `US-AGENTES-05` (User Story acima)
- `TC-AGENTES-05.01` a `TC-AGENTES-05.13` (Test Cases)
- `GUIDELINE.md` §5.5, §8
- `AGENTS.md` §5