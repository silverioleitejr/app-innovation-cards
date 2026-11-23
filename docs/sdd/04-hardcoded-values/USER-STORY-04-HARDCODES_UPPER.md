# User Story: US-AGENTES-04 — Extração de Valores Mágicos para Constantes

**Status:** Draft  
**Priority:** Média  
**Relacionado:** `RF-03`, `RF-07` (PRD.md)

## Descrição
Como desenvolvedor, desejo extrair valores mágicos do código do Innovation Board, particularmente o range 0-100 no handling de cursor position no WebSocket, para que o código seja mais legível, tipado e mais fácil de manter.

## Critérios de Aceite
- [ ] Identificar todos os usos do número mágico `100` e `0` no range de cursor position no WebSocket handling (`server.ts`, `src/hooks/useRealtimeBoard.ts`, componentes)
- [ ] Criar tipo ou constante `CursorPosition` com range 0-100 tipado em TypeScript
- [ ] Substituir todos os usos diretos de números pelo novo tipo/constante
- [ ] Verificar que não há quebras de funcionalidade (cursor ainda se move de 0 a 100)
- [ ] Atualizar `TO-DO.md` com conclusão da tarefa

## Dependências
- `AGENTS.md` — Contrato de comportamento agentico (seção 9: Segurança, convenção deCommits)
- `GUIDELINE.md` — Metodologia SDD (seção 5: Ciclo de Trabalho, convenção de constantes)
- `TO-DO.md` — Tracker de atividades
- `src/types.ts` — Tipos existentes (já tem `EFFORT_SIZES`, `PIN_TYPES`, etc.)

## Sub-tarefas
1. **Identificar usos**: Buscar por `100`, `0` no context de cursor/x/y no WebSocket code
   - `server.ts`: clamping de cursor `Math.max(0, Math.min(100, msg.x))`
   - `src/hooks/useRealtimeBoard.ts`: possíveis usos similares
   - Componentes: `BoardFunnelView.tsx`, `MatrixCanvasView.tsx` (posX, posY)
2. **Definir tipo/constante**: Criar em `src/types.ts` ou `src/constants.ts`:
   ```typescript
   export type CursorPosition = number; // 0 a 100
   export const MAX_CURSOR_POSITION: CursorPosition = 100;
   export const MIN_CURSOR_POSITION: CursorPosition = 0;
   ```
3. **Substituir usos**: Substituir `Math.max(0, Math.min(100, msg.x))` por `Math.max(MIN_CURSOR_POSITION, Math.min(MAX_CURSOR_POSITION, msg.x))`
4. **Tipar funções**: Atualizar funções que recebem posição de cursor para usar o tipo `CursorPosition`
5. **Testar**: Verificar que cursor ainda se move de 0 a 100 em todas as condições
6. **Documentar**: Atualizar `TO-DO.md` com conclusão

## Observações
- O tipo `CursorPosition` deve ser usado em vez de `number` em props e estado relacionados
- Os valores `0` e `100` representam respectivamente o lado esquerdo/direito ou baixo/alto do quadro
- Consistência com `EFFORT_SIZES`, `PIN_TYPES` já existentes em `src/types.ts`

## Relacionados
- `US-AGENTES-04` (User Story acima)
- `TC-AGENTES-04.01` a `TC-AGENTES-04.03` (Test Cases)
- `RN-03.1`, `RN-03.2`, `RN-03.3` (Regras de cursor do PRD)