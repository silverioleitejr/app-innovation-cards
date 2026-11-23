# Test Case: TC-AGENTES-04.01 a TC-AGENTES-04.03 — Valores Mágicos Tipados

**Status:** Draft  
**Framework:** Vitest / Jest  
**Relacionado:** `US-AGENTES-04`, `UC-AGENTES-04`

## TC-AGENTES-04.01 — Tipo CursorPosition criado e usado

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que o tipo `CursorPosition` foi criado e está sendo usado em vez de `number` puro |
| **Pre-condição** | `src/types.ts` contém `type CursorPosition` e `const MIN_CURSOR_POSITION`, `MAX_CURSOR_POSITION` |
| **Passos** | 1. Importar `CursorPosition` em componente que usa posição de cursor<br>2. Usar o tipo em lugar de `number` puro |
| **Expected** | TypeScript compilando sem erros (`npm run typecheck` passando)<br>Todos os uses de posição de cursor usando o novo tipo |

## TC-AGENTES-04.02 — Substituição de números mágicos

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que todos os `100` e `0` no context de cursor foram substituídos pelas constantes |
| **Pre-condição** | Busca no codebase por `Math.max(0, Math.min(100, ...)` removida |
| **Passos** | 1. Substituir todas as ocorrências de `100` e `0` diretas no range de cursor pelas constantes<br>2. Verificar que não resta `Math.max(0, Math.min(100, ...)` no codebase |
| **Expected** | Nenhuma ocorrência de `Math.max(0, Math.min(100, ...)` no codebase<br>Todas as posições de cursor usando `MIN_CURSOR_POSITION` e `MAX_CURSOR_POSITION` |

## TC-AGENTES-04.03 — Funcionalidade de cursor preservada

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que a funcionalidade de cursor WebSocket continua funcionando com o novo tipo/constante |
| **Pre-condição** | Aplicação rebuild e rodando |
| **Passos** | 1. Rodar `npm run build` e `npm run dev`\br>2. Acessar a aplicação<br>3. Mover cursor na matriz de esfuerzo×benefício<br>4. Verificar que cursor se move de extremo a extremo |
| **Expected** | Cursor se move do lado esquerdo ao direito (0 a 100)<br>Eventos `cursor:moved` WebSocket funcionando<br>Não há valores fora do range 0-100 logados |

## Critérios de Conclusão
- [ ] Tipo `CursorPosition` criado e usado em todo o codebase
- [ ] Todos os `100` e `0` no context de cursor substituídos pelas constantes
- [ ] `npm run typecheck` passando (`tsc --noEmit`)
- [ ] Funcionalidade de cursor funcionando (range 0-100)
- [ ] `TO-DO.md` atualizado com conclusão