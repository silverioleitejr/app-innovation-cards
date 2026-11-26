---
name: sdd-adr-writer
description: Analisa um assunto, problema ou mudança de arquitetura em linguagem natural com critérios técnicos de arquitetura, segurança, resiliência e privacidade, e registra, aprova ou substitui decisões no docs/ADR.md (append-only) no formato ADR-NNN. Use sempre que o usuário pedir para criar, registrar, revisar, aprovar ou substituir um ADR (Architecture Decision Record) no padrão SDD.
---

# Skill: SDD ADR Writer

> **Documento:** SKILL.md  
> **Autor:** Silverio Leite Jr · Senior Solution Architect · OG1 TI  
> **E-mail:** silverio.leitejr@og1.com.br · **Telefone:** (11) 96020-6334  
> **Versão:** 1.2.0  
> **Data:** 2026-11-26  

## 1. Missão

Você é responsável por **analisar, registrar, aprovar e substituir Decisões de Arquitetura (ADRs)** a partir de uma descrição em linguagem natural, mantendo rastreabilidade com `docs/SAD.md` e com os pacotes `docs/sdd/NN-slug/`.

**Princípios:**
- Usar o template `docs/templates/ADR-TEMPLATE.md` como modelo canônico.
- Manter o documento `docs/ADR.md` estritamente **append-only**.
- Analisar o assunto com critérios de arquitetura de software, segurança da informação, resiliência e privacidade.
- Consultar o checklist de referência (`docs/templates/CHECKLIST-ARQUITETURA.md`) como guia, adaptando à stack definida no `docs/SAD.md`.
- Identificar o próximo número sequencial de 3 dígitos (`ADR-NNN`) verificando tanto `docs/ADR.md` quanto `docs/SAD.md` §5 (para evitar colisão de IDs) e atualizar o Índice Rápido.

## 2. Ordem de Leitura (Subconjunto Canônico — `docs/GUIDELINE.md` §4)

1. `docs/GUIDELINE.md` (§3, §4 e §10)
2. `AGENTS.md` (§5 e §9)
3. `docs/SAD.md` (stack vigente, camadas, segurança e seção §5 de ADRs)
4. `docs/ADR.md` (se existir)
5. `docs/DATABASE-PATTERN.md` (quando a decisão envolver persistência ou dados)
6. `docs/templates/ADR-TEMPLATE.md` (modelo estrutural obrigatório)
7. `docs/templates/CHECKLIST-ARQUITETURA.md` (guia de análise técnica)

## 3. Comandos Suportados

### 3.1 Registrar nova decisão
```text
Registrar ADR: [descrição em linguagem natural do problema ou mudança]
```
ou
```text
Analisar e registrar decisão de arquitetura sobre: [assunto]
```

**Comportamento:**

1. **Leitura e Numeração (`ADR-NNN`)**  
   - Leia `docs/ADR.md` (ou crie a partir de `docs/templates/ADR-TEMPLATE.md` se não existir) e `docs/SAD.md` §5.  
   - Identifique o maior número de ADR existente entre ambos os documentos e calcule o próximo no formato de 3 dígitos (`ADR-001`, `ADR-002`, ..., `ADR-NNN`).

2. **Análise técnica**  
   Avalie o assunto considerando os 5 pilares de `docs/templates/CHECKLIST-ARQUITETURA.md`:
   - Segurança e proteção de dados
   - Desempenho e escalabilidade
   - Disponibilidade e resiliência
   - Manutenibilidade e observabilidade
   - Aderência à stack e padrões do `docs/SAD.md`
   - Princípios de privacidade (menor privilégio, isolamento, minimização de dados)

   Use o checklist como guia. Não force itens de stacks não utilizadas no projeto.

3. **Esclarecimentos**  
   Se faltar informação crítica para uma decisão fundamentada, liste perguntas objetivas e aguarde resposta antes de registrar.

4. **Registro (Append-Only)**  
   Adicione ao final de `docs/ADR.md` uma nova entrada no formato:

   ```markdown
   ### ADR-{NNN}
   - **Data:** {{YYYY-MM-DD}}
   - **Status:** Proposta
   - **Assunto:** {{TITULO}}
   - **Contexto:** {{FORCAS_E_RESTRICOES}}
   - **Alternativas:** {{OPCAO_DESCARTADA}} (descartada: {{MOTIVO}}) · {{OPCAO_ESCOLHIDA}} (escolhida)
   - **Decisão:** {{O_QUE_FOI_DECIDIDO}}
   - **Consequências:** + {{GANHO}} / − {{CUSTO}}
   - **Substitui:** —
   - **Pacotes SDD impactados:** `docs/sdd/{{NN}}-{{SLUG}}/`
   ```

   Se esta decisão substitui outra, preencha **Substitui** com o ID antigo (`ADR-MMM`) e altere somente a linha **Status** do ADR anterior para `Substituída por ADR-{NNN}` (e a coluna Status correspondente no Índice).

5. **Atualização do Índice**  
   Adicione uma linha na tabela de índice de `docs/ADR.md` com o novo ID (`ADR-NNN`), data, assunto e status (`Proposta`).

6. **Saída**  
   Apresente o ADR registrado e o relatório final no padrão `docs/GUIDELINE.md` §8.

### 3.2 Aprovar decisão existente
```text
Aprovar ADR-NNN
```
- Somente mediante instrução explícita do humano responsável, altere a linha `- **Status:** Proposta` do `ADR-NNN` (e sua linha no Índice) para `Aceita`, mantendo o restante do corpo inalterado.

### 3.3 Substituir decisão existente
```text
Substituir ADR-MMM por nova decisão: [descrição]
```
- Execute o fluxo `3.1` criando um novo `ADR-NNN` ao final do arquivo com `- **Substitui:** ADR-MMM` e atualize exclusivamente o campo **Status** do `ADR-MMM` (no corpo e no Índice) para `Substituída por ADR-NNN`.

## 4. Regras

- Nunca sobrescreva ou apague o corpo de um ADR anterior.
- Status inicial obrigatório: `Proposta`. Só mude para `Aceita` após aprovação humana explícita.
- Ao substituir, altere apenas a linha **Status** do ADR antigo (`Substituída por ADR-NNN`).
- Referencie sempre o `docs/SAD.md` quando a decisão alterar ou complementar a arquitetura base.
- Se a decisão impactar pacotes SDD existentes, liste-os no campo **Pacotes SDD impactados** (ou `—` quando transversal).
- Mantenha linguagem técnica clara, concisa e justificada em português.

## 5. Definition of Done

- [ ] Próximo número `ADR-NNN` identificado sem colisão com `docs/ADR.md` nem com `docs/SAD.md` §5.
- [ ] Nova entrada adicionada ao final de `docs/ADR.md` (append-only).
- [ ] Índice Rápido de `docs/ADR.md` atualizado.
- [ ] Análise considerou segurança, desempenho, resiliência, manutenibilidade e privacidade.
- [ ] Documento salvo em `docs/ADR.md`.

---

*Skill mantida em `docs/skills/sdd-adr-writer/SKILL.md`  
e publicada em `.agents/skills/sdd-adr-writer/SKILL.md`.*
