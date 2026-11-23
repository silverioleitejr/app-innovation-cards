# Use Case: UC-AGENTES-03 — Decomposição de Componentes Grandes

**Status:** Draft  
**Actor:** Desenvolvedor Frontend  
**Preconditions:**  
- Acesso aos componentes `BoardFunnelView.tsx`, `SessionsView.tsx`, `UsersAdminView.tsx`  
- `AGENTS.md` lido (seção 3: Ciclo de Trabalho)  

## Fluxo de Execução

1. **Medir componentes**: Rodar comando para medir tamanho (`wc -l` ou ferramenta IDE) e identificar quais ultrapassam 20KB
   - `BoardFunnelView.tsx`: ~43KB (linhas)
   - `SessionsView.tsx`: ~22KB (linhas)
   - `UsersAdminView.tsx`: ~21KB (linhas)
2. **Identificar responsabilidades**: Para cada componente, listar:
   - Visualização (HTML/JSX)
   - Lógica de estado (useState, useEffect)
   - Lógica de eventos (handlers de clique, submit, etc.)
   - Busca de dados (fetch, useSelector)
   - Componentes aninhados
3. **Definir sub-componentes**: Para cada componente maior, definir sub-componentes lógicos:
   - `BoardFunnelView` → `BoardHeader`, `BoardColumns`, `BoardFooter`, `MatrixLink`
   - `SessionsView` → `SessionList`, `SessionFilter`, `SessionDetails`
   - `UsersAdminView` → `UserTable`, `UserForm`, `UserActions`
4. **Criar sub-componentes**: Mover lógica correspondente para novos arquivos
   - Manter interfaces de props consistentes
   - Usar `export default` e `export type` para tipos
   - Usar `prop-types` se necessário (ou TypeScript types)
5. **Atualizar pai**: O componente pai deve apenas orquestrar os sub-componentes, recebendo props e passando handlers
6. **Testar**: Rodar `npm run test` e verificar que não há regressão
   - Verificar rendering output
   - Verificar event handlers funcionando
   - Verificar state management funcionando
7. **Performance**: Rodar `npm run build` e verificar Lighthouse metrics
8. **Documentar**: Atualizar `TO-DO.md` com conclusão

## Pós-condições
- Cada componente identificado ultrapassando 20KB foi decomposto
- Sub-componentes criados com interfaces de props consistentes
- Nenhuma funcionalidade perdida ou alterada
- Performance mantida ou melhorada
- `TO-DO.md` atualizado com status `Concluído`

## Fluxo Alternativo
Se a decomposição causar aumento de complexidade de props passing, considerar o uso de Context API ou state management global (Zustand, Redux) para compartilhar estado.

## Relacionados
- `US-AGENTES-03` (User Story acima)
- `TC-AGENTES-03.01` a `TC-AGENTES-03.03` (Test Cases)
- `RF-03.1`, `RF-03.2` (Regras de renderização do PRD)