# User Story: US-AGENTES-02 — Profundização no Manejo de Erros da API

**Status:** Em revisão  
**Priority:** Alta  
**Relacionado:** `RF-01`, `RF-02`, `RF-06` (PRD.md)

## Descrição
Como desenvolvedor, desejo melhorar o manejo de erros na API layer do Innovation Board, para que a aplicação forneça mensagens de erro mais precisas, codes identificáveis e suporte melhor o débatching de erros de validação e de rede, seguindo as regras de negócio definidas no PRD.

## Critérios de Aceite
- [ ] Adicionar campos `code` e `validationErrors` adicionais na classe `ApiError` (`src/lib/api.ts`)
- [ ] Criar tipos específicos de erro para cenários: `NETWORK_ERROR`, `VALIDATION_ERROR`, `CONSTRAINT_ERROR`, `AUTHORIZATION_ERROR`
- [ ] Garantir que todas as operações de banco de dados em `server/db.ts` tenham wrapping de erro adequado com mensagens significativas
- [ ] Criar cenários de teste para: erro de fetch falho, erro de validação de campo, erro de constraint de banco, erro de sessão expirada
- [ ] Atualizar `TO-DO.md` com conclusão da tarefa

## Dependências
- `AGENTS.md` — Contrato de comportamento agentico (seção 9: Segurança)
- `GUIDELINE.md` — Metodologia SDD (seção 5: Ciclo de Trabalho, seção 8: Formato do Relatório Final)
- `TO-DO.md` — Tracker de atividades (Etapa 1b: Decomposição)

## Sub-tarefas
1. Revisar `src/lib/api.ts` e `server/db.ts` para entender padrões atuais de erro
2. Definir novos tipos de erro e atualizar `ApiError` class
3. Adicionar try/catch with mensagens significativas em operações DB críticas
4. Criar testes unitários para cenários de erro
5. Verificar mensagens de erro em cenários reais (login falho, validação de formulário, constraint de banco)
6. Registrar conclusão em `TO-DO.md`

## Observações
- As mensagens de erro devem ser amigáveis ao usuário, mas conter códigos técnicos para debugging
- Os codes devem ser consistentes com as `RN-NN.x` do PRD
- Erros de sessão devem invalidar tokens e forçar re-login (regra `RN-01.3`)