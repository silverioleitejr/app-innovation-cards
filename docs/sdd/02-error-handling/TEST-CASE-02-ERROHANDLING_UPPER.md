# Test Case: TC-AGENTES-02.01 a TC-AGENTES-02.04 — Manejo de Erros da API

**Status:** Em revisão  
**Framework:** Vitest / Jest  
**Relacionado:** `US-AGENTES-02`, `UC-AGENTES-02`

## TC-AGENTES-02.01 — Erro de validação de campo

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que erros de validação de formulário são capturados com códigos e campos específicos |
| **Pre-condição** | Formulário de registro/login sendo submetido com dados inválidos |
| **Passos** | 1. Submeter formulário com e-mail inválido<br>2. Capturar `ApiError` recebido |
| **Expected** | `ApiError` com `status: 400`<br>`code: 'VALIDATION_ERROR'`<br>`validationErrors: ['E-mail deve ser um e-mail válido']` |

## TC-AGENTES-02.02 — Erro de rede/fetch

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que erros de rede são tratados com código adequado |
| **Pre-condição** | Requisição API com conexão offline ou servidor indisponível |
| **Passos** | 1. Tentar API call com rede desconectada<br>2. Capturar `ApiError` recebido |
| **Expected** | `ApiError` com `status: 0` ou `504`<br>`code: 'NETWORK_ERROR'`<br>Mensagem: "Erro de rede. Tente novamente." |

## TC-AGENTES-02.03 — Constraint de banco de dados

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que violações de constraint são traduzidas para erros significativos |
| **Pre-condição** | Tentativa de inserir dado que viola constraint única (ex: e-mail duplicado) |
| **Passos** | 1. Tentar criar usuário com e-mail já cadastrado<br>2. Capturar `ApiError` recebido |
| **Expected** | `ApiError` com `status: 409` ou `400`<br>`code: 'CONSTRAINT_ERROR'`<br>Mensagem: "Já existe um usuário com este e-mail." |

## TC-AGENTES-02.03 — Erro de sessão expirada

| Campo | Descrição |
|-------|-----------|
| **Objetivo** | Verificar que sessões expiradas causam logout forçado |
| **Pre-condição** | Usuário com token expirado tentando acessar rota protegida |
| **Passos** | 1. Tentar acessar rota protegida com token expirado<br>2. Capturar `ApiError` recebido |
| **Expected** | `ApiError` com `status: 401`<br>`code: 'AUTHORIZATION_ERROR'`<br>Mensagem: "Sessão expirada. Faça login novamente."<br>Cliente deslogado automaticamente |

## Critérios de Conclusão
- [ ] Todos os 4 test cases passing (`npm run test`)
- [ ] `ApiError` possui campos `code` e `validationErrors` preenchidos corretamente
- [ ] Mensagens de erro são amigáveis ao usuário, mas contêm códigos técnicos
- [ ] `TO-DO.md` atualizado com conclusão
- [ ] Nenhum vazamento de dados sensíveis nas mensagens de erro