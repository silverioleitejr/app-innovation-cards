# Use Case: UC-AGENTES-04 — Extrair Valores Mágicos para Tipos e Constantes

**Status:** Draft  
**Actor:** Desenvolvedor Frontend/Backend  
**Preconditions:**  
- Acesso ao `server.ts`, `src/hooks/useRealtimeBoard.ts`, `src/components/`  
- `AGENTS.md` lido (seção 9: Segurança, convenções)  

## Fluxo de Execução

1. **Identificar valores mágicos**: Buscar em todo o códigobase por números `0` e `100` no context de posição de cursor WebSocket:
   - `server.ts`: `Math.max(0, Math.min(100, msg.x))` e similar
   - `src/hooks/useRealtimeBoard.ts`: possíveis uses de 0/100 para cursor
   - Componentes: `posX`, `posY` no range 0-100 para matriz de esfuerzo×benefício
2. **Definir constante/tipo**: Em `src/types.ts` (ou `src/constants.ts` se já existir convenção lá):
   - `type CursorPosition = number` com range documentado 0-100
   - `const MAX_CURSOR: CursorPosition = 100`
   - `const MIN_CURSOR: CursorPosition = 0`
3. **Substituir usos diretos**: Substituir todas as ocorrências de `100` e `0` no context de cursor pelo novo tipo/constante
4. **Atualizar tipos de props**: Atualizar interfaces de componentes que recebem `cursorPosition` para usar o tipo `CursorPosition` ao invés de `number`
5. **Testar funcionalidade**: Garantir que:
   - Cursor ainda se move de 0 a 100 em todas as condições
   - Eventos WebSocket de cursor:moved continuam funcionando
   - Não há "jumping" ou valores fora do expected range
6. **Documentar**: Atualizar `TO-DO.md` com conclusão

## Pós-condições
- Tipo `CursorPosition` criado e usado em todo o codebase
- Todos os números mágicos `0` e `100` no context de cursor substituídos
- Funcionalidade de cursor mantida (range 0-100 preservado)
- `TO-DO.md` atualizado com status `Concluído`

## Fluxo Alternativo
Se o codebase já tiver convenção de constantes em `src/constants.ts`, usar esse arquivo em vez de criar em `src/types.ts`.

## Relacionados
- `US-AGENTES-04` (User Story acima)
- `TC-AGENTES-04.01` a `TC-AGENTES-04.03` (Test Cases)
- `RN-03.1`, `RN-03.2` (Regras de cursor do PRD)