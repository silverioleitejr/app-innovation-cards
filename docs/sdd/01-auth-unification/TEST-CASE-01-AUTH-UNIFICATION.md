# TEST-CASE: 01-auth-unification — Autenticação Híbrida e Unificação de Conta por E-mail

> **Use Case:** `[UC-01]` | **User Story:** `[US-01]` | **Status:** `Aprovado` *(Aprovado por: Silverio Leite Jr · Data: 2026-11-26)*  
> **Versão:** 1.0.0 | **Data:** 2026-11-26 | **Glossário/ADRs:** `[docs/GLOSSARY.md]`, `[ADR-001]`, `[ADR-002]`

---

## 1. Seams (Fronteiras Públicas de Teste)

> Testes validam comportamento apenas nas interfaces públicas abaixo.

| ID | Seam (Interface Pública) | O que captura | O que deixa passar |
| :--- | :--- | :--- | :--- |
| `SEAM-01` | `POST /api/auth/login` | Validação de entrada, normalização de e-mail, verificação de credencial local, bloqueio de conta inativa, emissão de sessão e auditoria transacional. | Renderização de interface e detalhes internos de criptografia. |
| `SEAM-02` | `POST /api/auth/register` | Auto-registro de novo participante, atribuição do papel padrão `MEMBER`, bloqueio de e-mail duplicado, emissão de sessão e auditoria. | Renderização de interface. |
| `SEAM-03` | `POST /api/auth/federated` | Login federado (`Microsoft Entra ID` / `Google Workspace`), **Unificação de Conta Federada** preservando papel/especialidade/cor de cursor, criação de conta `MEMBER` quando inexistente e auditoria. | Infraestrutura real dos provedores externos OIDC/SAML. |
| `SEAM-04` | `POST /api/auth/password` e `GET /api/auth/me` | Exigência de token Bearer válido, validação da senha atual, atualização da credencial com `passwordChangedByUser` e consulta do perfil sanitizado (sem hash/salt). | Renderização de interface. |
| `SEAM-05` | `AuthScreen` e `PasswordModal` (Extensão A) | Estados visuais `Loading`, `Empty`, `Success` e `Error`, aderência aos tokens de `docs/DESIGN.md` e ausência de detalhes internos em mensagens de erro. | Lógica de persistência direta do banco. |

---

## 2. Massa de Dados Base (Fixtures)

> Valores literais fixos usados como fonte de verdade independente (zero tautologia).

* **`USER_FACILITATOR_PRESEEDED`:** `{ id: "usr-fac-01", name: "Ana Facilitadora", email: "ana.facilitadora@og1.com.br", role: "FACILITATOR", specialty: "IA / GenAI", cursorColor: "#0f766e", active: true, password: "Initial@2026" }`
* **`USER_INACTIVE`:** `{ id: "usr-inact-01", name: "Carlos Inativo", email: "carlos.inativo@og1.com.br", role: "MEMBER", specialty: "Engenharia de Dados", cursorColor: "#0b41cd", active: false, password: "Initial@2026" }`
* **`USER_SELF_REGISTER_NEW`:** `{ name: "Marina Nova", email: "Marina.Nova@OG1.com.br", password: "Strong@2026", specialty: "Analytics / BI" }` *(e-mail normalizado esperado: `"marina.nova@og1.com.br"`, papel esperado: `"MEMBER"`)*
* **`FEDERATED_PAYLOAD_EXISTING`:** `{ provider: "Microsoft Entra ID", sub: "entra-sub-9901", email: "ANA.FACILITADORA@OG1.COM.BR", name: "Ana Facilitadora" }`
* **`FEDERATED_PAYLOAD_NEW`:** `{ provider: "Google Workspace", sub: "gws-sub-4402", email: "novo.federado@og1.com.br", name: "Bruno Federado" }`
* **`PASSWORD_CHANGE_VALID`:** `{ currentPassword: "Initial@2026", newPassword: "Updated@2026" }`

---

## 3. Cenários de Teste (Ordem de Fatias Verticais)

> Executar em **fatias verticais** (1 teste → 1 implementação mínima → repetir), na ordem abaixo.

### `TC-01.01` — [Caminho Feliz] Login local com normalização de e-mail em minúsculas
* **Seam:** `SEAM-01` | **Rastreabilidade:** `CA-01`, `CAU-01.1`, `RU-01.1`, `RU-01.5`
* **Dado** `USER_FACILITATOR_PRESEEDED` ativo cadastrado com e-mail `"ana.facilitadora@og1.com.br"` e senha `"Initial@2026"`;
* **Quando** enviar `POST /api/auth/login` com `email: "  ANA.FACILITADORA@OG1.COM.BR  "` e `password: "Initial@2026"`;
* **Então** autentica com sucesso, retorna token de sessão e perfil sanitizado com `email: "ana.facilitadora@og1.com.br"` e `role: "FACILITATOR"` (sem campos de hash ou salt), e grava evento correspondente em `audit_logs` na mesma transação.

### `TC-01.02` — [Caminho Feliz] Primeiro login federado unifica conta pré-cadastrada sem duplicação
* **Seam:** `SEAM-03` | **Rastreabilidade:** `CA-01`, `CAU-01.2`, `RU-01.1`, `RU-01.2`, `RU-01.5`
* **Dado** `USER_FACILITATOR_PRESEEDED` previamente cadastrado sem vínculo federado (`role: "FACILITATOR"`, `specialty: "IA / GenAI"`, `cursorColor: "#0f766e"`);
* **Quando** enviar `POST /api/auth/federated` com `FEDERATED_PAYLOAD_EXISTING` (`provider: "Microsoft Entra ID"`, `email: "ANA.FACILITADORA@OG1.COM.BR"`);
* **Então** vincula a identidade externa à conta `"usr-fac-01"` sem criar segundo registro em `users`, preserva `role: "FACILITATOR"`, `specialty: "IA / GenAI"` e `cursorColor: "#0f766e"`, retorna sessão válida e grava evento de unificação em `audit_logs`.

### `TC-01.03` — [Caminho Feliz] Auto-registro atribui papel padrão MEMBER e normaliza e-mail
* **Seam:** `SEAM-02` | **Rastreabilidade:** `CA-01`, `CAU-01.3`, `RU-01.1`, `RU-01.3`, `RU-01.5`
* **Dado** nenhum usuário cadastrado com `"marina.nova@og1.com.br"`;
* **Quando** enviar `POST /api/auth/register` com `USER_SELF_REGISTER_NEW` (`email: "Marina.Nova@OG1.com.br"`);
* **Então** cria o usuário com `email: "marina.nova@og1.com.br"` e `role: "MEMBER"`, emite sessão válida e grava o evento de criação em `audit_logs`.

### `TC-01.04` — [Caminho Feliz] Primeiro login federado sem conta prévia cria conta MEMBER
* **Seam:** `SEAM-03` | **Rastreabilidade:** `CA-01`, `CAU-01.3`, `RU-01.1`, `RU-01.3`, `RU-01.5`
* **Dado** nenhum usuário cadastrado com `"novo.federado@og1.com.br"`;
* **Quando** enviar `POST /api/auth/federated` com `FEDERATED_PAYLOAD_NEW` (`provider: "Google Workspace"`);
* **Então** cria nova conta ativa com `email: "novo.federado@og1.com.br"`, `role: "MEMBER"` e vínculo `Google Workspace`, retorna sessão válida e grava evento em `audit_logs`.

### `TC-01.05` — [Caminho Feliz] Alteração de senha pelo próprio usuário autenticado
* **Seam:** `SEAM-04` | **Rastreabilidade:** `CA-01`, `CAU-01.4`, `RU-01.5`
* **Dado** `USER_FACILITATOR_PRESEEDED` autenticado com token Bearer válido;
* **Quando** enviar `POST /api/auth/password` com `PASSWORD_CHANGE_VALID` (`currentPassword: "Initial@2026"`, `newPassword: "Updated@2026"`);
* **Então** atualiza a credencial marcando `passwordChangedByUser` como verdadeiro, grava evento em `audit_logs`, passa a aceitar `POST /api/auth/login` com `"Updated@2026"` e rejeita `"Initial@2026"`.

### `TC-01.06` — [Exceção] Rejeita auto-registro com e-mail já existente (case-insensitive)
* **Seam:** `SEAM-02` | **Rastreabilidade:** `CAU-01.3`, `RU-01.1`
* **Dado** `USER_FACILITATOR_PRESEEDED` já cadastrado com `"ana.facilitadora@og1.com.br"`;
* **Quando** enviar `POST /api/auth/register` com `email: "Ana.Facilitadora@og1.com.br"`;
* **Então** rejeita a operação com erro de conflito sem criar novo usuário e sem alterar `role`, `specialty` ou senha da conta existente.

### `TC-01.07` — [Segurança] Bloqueia autenticação de conta inativa e requisições sem token válido
* **Seam:** `SEAM-01`, `SEAM-03`, `SEAM-04` | **Rastreabilidade:** `RU-01.4`, `SAD.md` §3
* **Dado** `USER_INACTIVE` (`active: false`) e uma requisição sem cabeçalho `Authorization: Bearer <token>` válido;
* **Quando** tentar autenticar `USER_INACTIVE` em `POST /api/auth/login` ou `POST /api/auth/federated`, ou chamar `POST /api/auth/password` / `GET /api/auth/me` sem token válido;
* **Então** bloqueia imediatamente todas as tentativas com mensagem neutra (sem expor detalhes internos ou existência de conta) e nenhuma sessão é emitida.

### `TC-01.08` — [Interface / UX] Estados obrigatórios e tratamento de erro seguro na UI
* **Seam:** `SEAM-05` | **Rastreabilidade:** `UC-01` Extensão A, `docs/DESIGN.md` §3
* **Dado** o participante na tela `AuthScreen` (ou `PasswordModal` quando autenticado);
* **Quando** submeter formulário vazio, credencial inválida ou aguardar resposta do servidor;
* **Então** a interface apresenta os estados `Empty`, `Loading` (controles bloqueados), `Error` (alerta no padrão de `docs/DESIGN.md` §3 sem stack trace) e `Success` (entrada no Painel ou fechamento com confirmação).

---

## 4. Checklist de Aprovação (DoR)

- [x] Todos os Critérios de Aceite da `USER-STORY` (`CAU-01.1` a `CAU-01.4`) e fluxos do `USE-CASE` (`UC-01`) estão cobertos.
- [x] Todas as *seams* (`SEAM-01` a `SEAM-05`) estão claras (o que capturam / deixam passar) e baseadas nas interfaces públicas reais.
- [x] Nenhum teste acopla a detalhes internos (métodos privados, SQL direto ou mocks internos).
- [x] Todos os resultados esperados usam valores literais independentes e seguem o `docs/GLOSSARY.md`.
