# [UC-01] Autenticação Híbrida e Unificação de Conta por E-mail

> **Documento:** USE-CASE-01-AUTH-UNIFICATION.md  
> **Autor:** Silverio Leite Jr · Senior Solution Architect · OG1 TI  
> **Versão:** 1.0.0  
> **Data:** 2026-11-26  
> **Status:** Aprovado  
> **Aprovado por:** Silverio Leite Jr · **Data de Aprovação:** 2026-11-26  

> **Projeto:** Innovation Board (`innovation-board`)  
> **Pacote SDD:** `docs/sdd/01-auth-unification/`  
> **User Story Relacionada:** `US-01`  
> **Test Cases Relacionados:** `TC-01.01` a `TC-01.08`  
> **Rastreabilidade PRD:** `RF-01` (`RN-01.1`, `RN-01.2`, `RN-01.3`) · `CA-01` (`docs/PRD.md` §5.2 e §8)  
> **Skill Responsável:** `docs/skills/sdd-developer/SKILL.md`  

---

## PARTE I — CORE (OBRIGATÓRIO)

### 1. Objetivo e Escopo Técnico
- **Objetivo:** Permitir que participantes acessem o Innovation Board por credencial local, auto-registro ou login federado corporativo, unificando automaticamente contas pré-cadastradas pelo e-mail normalizado sem duplicação e preservando o perfil organizacional.
- **Atores e Sistemas Envolvidos:** Participantes com papéis `ADMIN`, `FACILITATOR`, `MEMBER` e `VIEWER`; provedores de identidade federada corporativos (`Microsoft Entra ID` e `Google Workspace`) conforme `docs/SAD.md` §4.3.
- **Natureza do Pacote:**
  - [x] Extensão A — Interface & UX
  - [x] Extensão B — Back-end / Integração / Assíncrono
  - [ ] Extensão C — Orquestração de IA
- **Fora de Escopo:**
  - Cadastro administrativo interno de usuários, ativação/inativação de contas e carga inicial em lote (`JSON`/`CSV`) — cobertos por `RF-02` (`02-user-management`).
  - Consulta visual da trilha de auditoria e comparação `Antes × Depois` — cobertos por `RF-06` (`06-audit-trail`).
  - Provisionamento ou configuração de diretórios/aplicativos nos provedores externos de identidade (`Microsoft Entra ID` e `Google Workspace`).
  - Recuperação de senha por e-mail externo (fluxo de reset assíncrono não especificado no `RF-01`).

### 2. Pré-condições e Referências
- **Pré-condições:**
  - Ambiente de persistência inicializado com schema de usuários, sessões e auditoria íntegro (conforme `docs/SAD.md` §2.2 e §4.2).
  - Para acesso local de conta existente ou unificação federada de conta pré-cadastrada: registro ativo correspondente presente na entidade `users` com e-mail normalizado.
  - Para alteração de senha pelo próprio usuário: sessão autenticada válida e conta ativa (conforme `docs/SAD.md` §3).
- **Referências obrigatórias** (conforme `docs/GUIDELINE.md` §4):
  - `docs/SAD.md` (seções §2.1, §2.2, §3, §4.2, §4.3 e §5 `ADR-002`)
  - `docs/DATABASE-PATTERN.md` (§1, §2, §3, §5 e §6)
  - `docs/NAMING-CONVENTION.md`
  - `docs/DESIGN.md` (Extensão A ativa)
  - `docs/ADR.md` (`ADR-01` — inicialização do servidor e disponibilidade dos endpoints de autenticação)

### 3. Contrato de Dados e Persistência
- **Entidades afetadas:**
  - `users` — consultar (por e-mail normalizado ou `id`), criar (no auto-registro ou primeiro login federado sem cadastro prévio) e alterar (vínculo de `federated_provider`/`federated_sub` na unificação e atualização de credencial/flag `password_changed_by_user` na alteração de senha).
  - `sessions` — criar (emissão de token de sessão com data de expiração após autenticação válida) e remover (no encerramento de sessão ou revogação).
  - `audit_logs` — criar (registro *append-only* do evento de autenticação, auto-registro, unificação federada ou alteração de senha na mesma transação da operação).
- **Governança:** mutações em transação atômica, auditoria conforme `docs/DATABASE-PATTERN.md` §2 e §5, isolamento e controle de sessão conforme `docs/SAD.md` §3 e `docs/DATABASE-PATTERN.md` §3.
- **Input DTO:** conforme validação de entrada e domínios definida em `docs/SAD.md` §3 (e-mail corporativo válido, credencial local ou atributos de identidade federada contendo provedor suportado, identificador externo e e-mail; para alteração de senha, senha atual e nova senha).
- **Output DTO:** token de sessão autenticado, prazo de expiração e perfil sanitizado do usuário (`id`, `name`, `email`, `role`, `specialty`, `cursorColor`, `active`, provedor federado vinculado), nunca incluindo hash ou salt de senha.

### 4. Fluxo Principal
1. O participante seleciona na tela de autenticação o modo de acesso desejado (login local, auto-registro ou login federado corporativo) ou aciona a alteração de senha estando autenticado, enviando os dados solicitados.
2. A camada de entrada valida o formato dos campos obrigatórios e, quando aplicável à alteração de senha, verifica a sessão autenticada ativa (conforme `docs/SAD.md` §3), mantendo-se fina e sem regras de negócio.
3. A camada de entrada delega a operação ao serviço de domínio de autenticação.
4. O serviço normaliza o e-mail para minúsculas (sem espaços nas extremidades) e executa a lógica de negócio correspondente ao modo escolhido:
   - **Login local:** localiza o usuário ativo pelo e-mail normalizado e verifica a credencial em tempo constante conforme `docs/SAD.md` §3.
   - **Auto-registro:** verifica inexistência de conta para o e-mail normalizado, gera a credencial protegida e atribui o papel padrão `MEMBER`.
   - **Login federado:** valida o provedor suportado (`Microsoft Entra ID` ou `Google Workspace`); se já existir conta para o e-mail normalizado, vincula a identidade externa à conta existente preservando `role`, `specialty` e `cursorColor`; se não existir, cria a conta com papel padrão `MEMBER` já vinculada ao provedor.
   - **Alteração de senha:** valida a senha atual da conta ativa, deriva a nova credencial e marca `password_changed_by_user` como verdadeiro.
5. Em transação atômica, o serviço persiste as alterações em `users` (quando houver), cria o registro de sessão em `sessions` (para fluxos de entrada) e grava o evento correspondente em `audit_logs` com encadeamento de integridade (conforme `docs/DATABASE-PATTERN.md` §2 e §5).
6. O sistema retorna o token de sessão e o perfil sanitizado do usuário autenticado (ou confirmação de senha atualizada), liberando o acesso ao Innovation Board com as permissões do seu papel.

### 5. Fluxos Alternativos
- **Validação inválida:** quando e-mail, senha ou provedor federado estiverem ausentes ou fora do formato/domínio permitido, a camada de entrada devolve erro estruturado de validação antes de acionar o serviço de domínio; nenhum registro é criado ou alterado.
- **Falha de autenticação/autorização:**
  - Credenciais locais incorretas, conta inativa (`active = false`) ou sessão expirada/inválida na alteração de senha resultam em bloqueio imediato com mensagem neutra ao ator (sem revelar existência de e-mail ou detalhes criptográficos); nenhuma sessão é emitida e nenhuma senha é alterada.
  - Tentativa de auto-registro com e-mail já cadastrado é rejeitada com erro de conflito orientando o uso do login local ou federado; a conta existente permanece intacta.
- **Falha de persistência:** qualquer erro durante a gravação em `users`, `sessions` ou `audit_logs` executa rollback completo da transação, registra log estruturado sem segredos nem stack trace exposto ao cliente e informa falha temporária ao ator; nenhum estado parcial é gravado.

### 6. Regras de Negócio e Guardrails
- **`[RU-01.1]` (origem `RN-01.1`):** O e-mail normalizado em minúsculas é a chave única de identificação do usuário em todos os fluxos (login local, auto-registro e login federado), impedindo contas duplicadas para o mesmo endereço.
- **`[RU-01.2]` (origem `RN-01.2`):** No primeiro login federado de um usuário previamente cadastrado (por carga inicial ou cadastro interno) com o mesmo e-mail normalizado, a identidade externa (`federated_provider` e `federated_sub`) deve ser vinculada à conta existente preservando integralmente `role`, `specialty` e `cursorColor`.
- **`[RU-01.3]` (origem `RN-01.3`):** Todo auto-registro ou primeiro login federado sem conta prévia recebe obrigatoriamente o papel padrão `MEMBER`.
- **`[RU-01.4]` (origem `SAD.md` §3):** Contas marcadas como inativas não podem autenticar por nenhum método (local ou federado) nem manter sessões ativas.
- **`[RU-01.5]` (origem `RN-06.2`):** Toda criação de conta, unificação federada, emissão de sessão e alteração de senha deve gravar o respectivo evento em `audit_logs` na mesma transação da operação de negócio.
- **Aprovação humana:** qualquer mudança no modelo de dados de `users`/`sessions`, no mecanismo de autenticação/autorização ou introdução de nova dependência de identidade exige aprovação explícita conforme `AGENTS.md` §5.

### 7. Critérios de Aceite Técnicos
- [ ] Fluxo principal coberto por testes (login local, auto-registro, login federado com unificação preservando papel/especialidade/cor e alteração de senha).
- [ ] Fluxos de exceção cobertos (validação inválida, credenciais inválidas, conta inativa, e-mail duplicado no auto-registro e rollback em falha de persistência).
- [ ] Comandos de qualidade do `AGENTS.md` verdes.
- [ ] Zero segredos, hashes ou salts expostos em respostas ou logs.

---

## PARTE II — EXTENSÕES (marcar N/A se não aplicável)

### EXTENSÃO A — Interface & UX
> **Status:** ATIVA

- **Rota / componente:** tela de autenticação do produto (`AuthScreen`, exibida quando não há sessão válida) com abas/modos de login local, auto-registro e botões de acesso federado (`Microsoft Entra ID` e `Google Workspace`), além do modal de alteração de senha (`PasswordModal`) acessível a partir do menu da conta autenticada.
- **Diretrizes visuais:** exclusivamente tokens semânticos, superfícies, tipografia e estados interativos definidos em `docs/DESIGN.md` (§2 e §3), sem tokens inventados.
- **Estados obrigatórios:**
  - `Loading`: bloqueio dos botões de submissão com feedback visual durante a verificação de credenciais, vínculo federado ou gravação da nova senha.
  - `Empty`: formulários limpos com rótulos claros e placeholders orientativos antes do preenchimento.
  - `Success`: transição imediata para o Painel autenticado (nos fluxos de entrada) ou feedback visual de confirmação com fechamento do modal (na alteração de senha).
  - `Error`: alerta acessível no padrão semântico de erro de `docs/DESIGN.md` §3, sem expor detalhes internos ou stack trace.

### EXTENSÃO B — Back-end / Integrações
> **Status:** ATIVA

- **Gatilho:** requisições HTTP síncronas de entrada para autenticação local, auto-registro, autenticação federada e alteração de senha (conforme contrato da camada de aplicação em `docs/SAD.md` §2.1 e §4.3).
- **Port / Adapter:** contrato de autenticação federada conforme `docs/SAD.md` §4.3 para os provedores corporativos `Microsoft Entra ID` e `Google Workspace`, preparado para acoplamento a tokens corporativos OIDC/SAML sem alterar o domínio de unificação por e-mail.
- **Idempotência e concorrência:** a unificação federada é idempotente por e-mail normalizado — logins federados subsequentes do mesmo usuário reutilizam o vínculo existente sem duplicar `users` nem sobrescrever `role`, `specialty` ou `cursorColor`; a unicidade de e-mail é garantida por restrição única na camada de persistência (`docs/DATABASE-PATTERN.md` §1.3).
- **Resiliência:** timeout e tratamento de contenção de escrita na persistência conforme `docs/SAD.md` §4.2 (`busy_timeout` e transações atômicas); falhas do provedor federado ou validação inválida operam em *fail-fast* sem criar conta parcial.

### EXTENSÃO C — IA Generativa
> **Status:** N/A — não se aplica

---

*Template stack-agnóstico. Todas as decisões técnicas devem referenciar seções do SAD.md.*
