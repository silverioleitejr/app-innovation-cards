# User Story: US-AGENTES-01 — Refatoração de Padrões de Duplicação de Código

**Status:** Draft  
**Priority:** Média  
**Relacionado:** `RF-03`, `RF-04`, `RF-07` (PRD.md)

## Descrição
Como desenvolvedor do Innovation Board, desejo identificar e extrair padrões de duplicação de código em componentes compartilhados, visando reduzir a repetição e facilitar a manutenção do sistema, especialmente nas áreas de gerenciamento de pins e edição de cartões.

## Critérios de Aceite
- [ ] Identificar padrões repetidos em no mínimo 3 componentes (`CardPinsBar`, `BoardFunnelView`, `SessionsView`)
- [ ] Extrair hook(s) compartilhado(s) para lógica comum
- [ ] Atualizar componentes afetados para usar o novo hook(s) sem perda de funcionalidade
- [ ] Verificar consistência de behavior before/after refatoração
- [ ] Atualizar `docs/TO-DO.md` com conclusão da tarefa

## Dependências
- `AGENTS.md` — Contrato de comportamento agentico
- `GUIDELINE.md` — Metodologia SDD (seção 5: Ciclo de Trabalho)
- `TO-DO.md` — Tracker de atividades (Etapa 1b: Decomposição)

## Sub-tarefas
1. Analisar componentes em busca de duplicação usando ferramentas de mesure de tamanho e duplicação
2. Definir interface do novo hook compartilhado
3. Implementar o hook compartilhado em `src/hooks/`
4. Atualizar `CardPinsBar.tsx`, `BoardFunnelView.tsx`, `SessionsView.tsx` para usar o hook
5. Testar que pins funcionam corretamente em todos os componentes
6. Registrar conclusão em `TO-DO.md`

## Observações
- Padrões identificados: lógica de anexar/substituir/remover pins, formatação de cursor position (0-100), validação de votação session state
- Hook sugerido: `useCardPinsManagement` ou `useCursorPosition`