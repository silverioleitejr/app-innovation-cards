# Use Case: UC-AGENTES-02 — Melhoria no Manejo de Erros da API

**Status:** Draft  
**Actor:** Desenvolvedor Frontend e Backend  
**Preconditions:**  
- `src/lib/api.ts` e `server/db.ts` acessíveis  
- `AGENTS.md` lido (seção 9: Segurança)  
- `PRD.md` lido (requisitos de autenticação e validação)  

## Fluxo de Execução

1. **Revisar ApiError**: Analisar `src/lib/api.ts` (linhas 15-33) e adicionar campos opcionais `code` e `validationErrors` se ainda não existirem
2. **Definir tipos de erro**: Criar enum ou tipos literais para:
   - `NETWORK_ERROR` — falha de conexão/timeout
   - `VALIDATION_ERROR` — falha de validação de campo/requisição
   - `CONSTRAINT_ERROR` — violação de constraint de banco de dados
   - `AUTHORIZATION_ERROR` — tentativa de acesso não autorizado
3. **Atualizar DB wrapping**: Em `server/db.ts`, adicionar try/catch em operações críticas com:
   - Captura de erros do `better-sqlite3`
   - Mensagens significativas (ex: "Já existe um usuário com este e-mail")
   - Log de erro para debugging (sem vazar dados sensíveis)
4. **Testar cenários**:
   - Simular falha de fetch → verificar `ApiError` com `code: 'NETWORK_ERROR'`
   - Submeter formulário inválido → verificar `validationErrors` preenchido
   - Tentar inserir dado duplicado → verificar `CONSTRAINT_ERROR`
   - Usar token expirado → verificar `AUTHORIZATION_ERROR` e logout forçado
5. **Documentar**: Atualizar `TO-DO.md` com conclusão

## Pós-condições
- `ApiError` possui campos `code` e `validationErrors` opcionais
- 4 tipos de erro definidos e consistentes
- Operações DB têm wrapping de erro com mensagens amigáveis
- Testes passing para todos os cenários (`npm run test`)
- `TO-DO.md` atualizado com status `Concluído`

## Fluxo Alternativo
Se o `better-sqlite3` lançar erros nativos, criar camada de tradução entre erros nativos do banco e `ApiError` do frontend.

## Relacionados
- `US-AGENTES-02` (User Story acima)
- `TC-AGENTES-02.01` a `TC-AGENTES-02.04` (Test Cases)
- `RN-01.1`, `RN-01.2`, `RN-01.3` (Regras de autenticação do PRD)
- `RN-06.1`, `RN-06.2` (Regras de auditoria do PRD)