# Test Case: TC-AGENTES-03.01 a TC-AGENTES-03.03 — Decomposição de Componentes

**Status:** Draft  
**Framework:** Vitest / Jest + React Testing Library  
**Relacionado:** `US-AGENTES-03`, `UC-AGENTES-03`

## TC-AGENTES-03.01 — Decompor BoardFunnelView

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que BoardFunnelView pode ser decomposto em sub-componentes menores sem perda de funcionalidade |
| **Pre-condição** | `BoardFunnelView.tsx` existente com ~43KB |
| **Passos** | 1. Criar sub-componentes: `BoardHeader`, `BoardColumns`, `BoardFooter`<br>2. Atualizar `BoardFunnelView` para usar sub-componentes<br>3. Rodar testes de renderização |
| **Expected** | Sub-componentes criados com interfaces de props consistentes<br>Render output idêntico ao original<br>Todos os event handlers funcionando (pins, voting, navigation)<br>`npm run test` passando |

## TC-AGENTES-03.02 — Decompor SessionsView

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que SessionsView pode ser decomposto em sub-componentes menores |
| **Pre-condição** | `SessionsView.tsx` existente com ~22KB |
| **Passos** | 1. Criar sub-componentes: `SessionList`, `SessionFilter`, `SessionDetails`<br>2. Atualizar `SessionsView` para usar sub-componentes<br>3. Rodar testes de renderização |
| **Expected** | Sub-componentes criados com interfaces de props consistentes<br>Render output idêntico ao original<br>Filtros, seleção de sessão funcionando<br>`npm run test` passando |

## TC-AGENTES-03.03 — Manter performance após decomposição

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que decomposição não degrada performance de renderização |
| **Pre-condição** | Aplicação rodando com versões antigas e novas de componentes |
| **Passos** | 1. Build da aplicação (`npm run build`)\br>2. Rodar Lighthouse ou Chrome DevTools Performance<br>3. Comparar metrics de renderização |
| **Expected** | Métricas de renderização iguais ou melhores que versão anterior<br>Nenhum "layout shift" introduzido<br>Tempo de interação (TTI) mantido ou reduzido |

## Critérios de Conclusão
- [ ] Sub-componentes criados para `BoardFunnelView` e `SessionsView`
- [ ] `npm run test` passando para todos os testes relacionados
- [ ] Métricas de performance iguais ou melhores
- [ ] `TO-DO.md` atualizado com conclusão
- [ ] Código seguindo convenções do `AGENTS.md` e `GUIDELINE.md`