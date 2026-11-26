# [US-01] Autenticação Híbrida e Unificação de Conta por E-mail

> **Documento:** USER-STORY-01-AUTH-UNIFICATION.md  
> **Autor:** Silverio Leite Jr · Senior Solution Architect · OG1 TI  
> **Versão:** 1.0.0  
> **Data:** 2026-11-26  
> **Status:** Aprovado  
> **Aprovado por:** Silverio Leite Jr · **Data de Aprovação:** 2026-11-26  

> **Projeto:** Innovation Board (`innovation-board`)  
> **Pacote SDD:** `docs/sdd/01-auth-unification/`  
> **Rastreabilidade PRD:** `RF-01`  
> **Use Case Relacionado:** `UC-01`  

---

## História de Usuário

**Como** participante do **Innovation Board** (`ADMIN`, `FACILITATOR`, `MEMBER` ou `VIEWER`)  
**Quero** acessar a plataforma com meu e-mail corporativo via credencial local, auto-registro ou login federado (`Microsoft Entra ID` ou `Google Workspace`), além de poder alterar minha própria senha  
**Para** ingressar rapidamente nas sessões de inovação sem duplicar minha conta e mantendo intactos meu **Papel de Acesso (RBAC)**, minha **Disciplina / Especialidade** e minha cor de cursor quando já houver cadastro prévio.

---

## Critérios de Aceite

- [ ] **CAU-01.1:** Um participante pré-cadastrado consegue entrar com seu e-mail corporativo e senha local independentemente de maiúsculas ou minúsculas no e-mail (`RN-01.1`), acessando o **Innovation Board** com seu **Papel de Acesso (RBAC)** configurado. *(origem `CA-01`)*
- [ ] **CAU-01.2:** Um participante previamente cadastrado (por exemplo, como `FACILITATOR`) que realiza seu primeiro login federado via `Microsoft Entra ID` ou `Google Workspace` com o mesmo e-mail normalizado tem a **Unificação de Conta Federada** concluída automaticamente, sem duplicação de conta e preservando papel, especialidade e cor de cursor (`RN-01.2`). *(origem `CA-01`)*
- [ ] **CAU-01.3:** Um participante sem cadastro prévio que conclui o auto-registro recebe automaticamente o papel padrão `MEMBER` (`RN-01.3`), e tentativas de auto-registro com um e-mail já cadastrado são bloqueadas para evitar duplicidade (`RN-01.1`). *(origem `CA-01`)*
- [ ] **CAU-01.4:** Um participante autenticado consegue alterar sua própria senha informando a senha atual e a nova senha, passando a acessar a plataforma com a credencial atualizada sem alterar seu papel ou demais atributos da conta. *(origem `CA-01`)*

---

## Notas e Restrições

- O e-mail normalizado em minúsculas é a chave única de identificação do usuário em todos os fluxos de entrada (`RN-01.1`).
- A gestão administrativa do diretório de usuários e a **Carga Inicial Idempotente** (`JSON`/`CSV`) pertencem ao `RF-02` (`02-user-management`) e estão fora do escopo desta história.
- Contas inativas não podem autenticar por nenhum método (local ou federado).
- Esta história permanece em `Draft` até revisão e aprovação humana conforme `docs/GUIDELINE.md` §9.

---

## Referências

- `docs/PRD.md` (§4, §5.2 `RF-01` e §8 `CA-01`)
- `docs/GLOSSARY.md`
- `docs/GUIDELINE.md` (§3 e §9)
- `docs/templates/USE-CASE-TEMPLATE.md`

---

*Template de User Story. Instanciado em `docs/sdd/01-auth-unification/USER-STORY-01-AUTH-UNIFICATION.md`*
