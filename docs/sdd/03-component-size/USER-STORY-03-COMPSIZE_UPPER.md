# User Story: US-AGENTES-03 — Redução de Tamanho de Componentes

**Status:** Draft  
**Priority:** Média  
**Relacionado:** `RF-03`, `RF-04`, `RF-05` (PRD.md)

## Descrição
Como desenvolvedor, desejo decompor componentes grandes do Innovation Board em sub-componentes menores e mais focados, mantendo a funcionalidade da interface dashboard, para que o código seja mais manutenível e easier to understand.

## Critérios de Aceite
- [ ] Identificar componentes com mais que 20KB (linhas de código): `BoardFunnelView.tsx` (~43KB), `SessionsView.tsx` (~22KB), `UsersAdminView.tsx` (~21KB)
- [ ] Decompor identificados em sub-componentes lógicos sem quebrar a interface
- [ ] Manter todas as prop interfaces e tipos consistentes
- [ ] Verificar que performance de renderização não se degrada (Lighthouse metrics iguais ou melhores)
- [ ] Atualizar `TO-DO.md` com conclusão da tarefa

## Dependências
- `AGENTS.md` — Contrato de comportamento agentico
- `GUIDELINE.md` — Metodologia SDD (seção 5: Ciclo de Trabalho)
- `TO-DO.md` — Tracker de atividades
- `src/components/` — Componentes atuais

## Sub-tarefas
1. Medir tamanho exato de cada componente (linhas, bytes)
2. Identificar responsabilidades separáveis em cada componente
3. Definir sub-componentes e suas prop interfaces
4. Mover lógica para sub-componentes, mantendo parent componente como orquestrador
5. Atualizar imports e usos em pais e filhos
6. Testar rendering e interações em todos os sub-componentes
7. Registrar conclusão em `TO-DO.md`

## Observações
- `BoardFunnelView` pode ser quebrado em: `Header`, `BoardColumns`, `Footer`, `MatrixLink`
- `SessionsView` pode ser quebrado em: `SessionList`, `SessionFilter`, `SessionDetails`
- `UsersAdminView` pode ser quebrado em: `UserList`, `UserForm`, `UserTable`
- O objetivo é reduzir cada arquivo para < 20KB, se possível
- Não remover funcionalidade, apenas reorganizar

## Relacionados
- `US-AGENTES-03` (User Story acima)
- `TC-AGENTES-03.01` a `TC-AGENTES-03.03` (Test Cases)
- Componentes: `BoardFunnelView.tsx`, `SessionsView.tsx`, `UsersAdminView.tsx`