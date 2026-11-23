# User Story: US-AGENTES-05 — Aumento da Cobertura de Testes Automatizados

**Status:** Draft  
**Priority:** Alta  
**Relacionado:** `RF-01` a `RF-09` (PRD.md), `GUIDELINE.md` §5.5

## Descrição
Como desenvolvedor, desejo adicionar testes automatizados para funções puras e componentes críticos do Innovation Board, de modo que a qualidade do código seja verificada continuamente e os riscos de regressão sejam minimizados.

## Critérios de Aceite
- [ ] Configurar framework de teste (Vitest, recomendado para Vite/TS no projeto)
- [ ] Criar testes para funções puras em `src/types.ts`:
  - `validateBacklogGate` — todos os cenários (3/3 validade, <3/3, campos faltantes)
  - `computeTopVotedIdeas` — ranking por votos, limite 5, empatado por data/createdAt
  - `getMatrixQuadrant` — os 4 quadrantes (QUICK_WIN, STRATEGIC, CONTINUOUS, ICEBOX)
  - `getInitials` — nome único, nome simples, nome vazio
- [ ] Criar testes para componentes críticos:
  - Regras de voting: `Voto +1` somente com votação aberta, limitado a 1 único card por usuário/sessão, botão Pin sempre ativo com validação prévia
  - Pin management: anexar, substituir, remover pins seguindo `RN-07.1` a `RN-07.4`
  - Componentes: `BoardFunnelView`, `SessionsView` (events, props, state)
- [ ] Garantir cobertura mínima de 80% para funções críticas
- [ ] Integrar `npm run test` ao pipeline de CI/CD (se houver) ou garantir que rodam localmente
- [ ] Atualizar `TO-DO.md` com conclusão da tarefa

## Dependências
- `AGENTS.md` — Contrato de comportamento agentico (seção 5: quando pedir aprovação humana)
- `GUIDELINE.md` — Metodologia SDD (seção 5: "Testes rastreáveis", seção 8: Formato do Relatório Final)
- `TO-DO.md` — Tracker de atividades (Etapa 1b: Decomposição)
- `package.json` — Scripts de teste já definidos ou precisão de configuração

## Sub-tarefas
1. **Configurar framework**: Se não existir, adicionar Vitest ou Jest ao `package.json` com configuração otimizada para Vite/TS
2. **Testes de funções puras**: Criar arquivos de teste em `src/types.test.ts` (ou `src/__tests__/`)
   - `validateBacklogGate` — testar cenário 3/3 (validade), <3/3 (campos faltantes específicos), edge cases
   - `computeTopVotedIdeas` — testar ranking, limite 5, empate por score/data
   - `getMatrixQuadrant` — testar os 4 quadrantes com diferentes posX/posY combinations
   - `getInitials` — testar nome completo, nome único, string vazia
3. **Testes de componentes críticos**: Criar arquivos de teste em `src/components/__tests__/`
   - Pin management rules (RN-07.1 a RN-07.4)
   - Voting flow: open/closed state, vote limits, pin toggling
   - BoardFunnelView interactions (card creation, movement, voting)
   - SessionsView interactions (filter, selection, details)
4. **Integrar testes**: Garantir `npm run test` roda e passa todos os novos testes
5. **Cobertura**: Garantir cobertura mínima de 80% (ferramenta: Vitest coverage ou Jest coverage)
6. **Documentar**: Atualizar `TO-DO.md` com conclusão

## Observações
- As funções `validateBacklogGate`, `computeTopVotedIdeas`, `getMatrixQuadrant`, `getInitials` já existem em `src/types.ts` e são "test-ready" (não têm testes, mas a lógica é simples o suficiente)
- As regras de voting (`RN-07.1` a `RN-07.4`) estão implementadas no server (`server.ts`) e no frontend (`src/hooks/useRealtimeBoard.ts`, componentes)
- O framework Vitest é nativamente compatível com Vite e oferece melhor performance que Jest para projetos Vite
- Os testes devem ser escritos seguindo o estilo do projeto (TypeScript, convenções de nome)

## Relacionados
- `US-AGENTES-05` (User Story acima)
- `TC-AGENTES-05.01` a `TC-AGENTES-05.13` (Test Cases)
- `GUIDELINE.md` §5.5 ("Testes rastreáveis")
- `AGENTS.md` §5 ("Quando Pedir Aprovação Humana")