---
name: sdd-planner-writer
description: Planner writer skill para criar planos de execução detalhados baseados em requisitos do PRD, gerando artefato PLAN-STORY-NN-SLUG-NAME.md na pasta do pacote SDD.
---

# Skill: sdd-planner-writer

> **Documento:** SKILL.md  
> **Autor:** Silverio Leite Jr · Senior Solution Architect · OG1 TI  
> **Versão:** 1.0  
> **Data:** 2026-11-25  

## 1. Missão

Gerar artefatos de planejamento detalhado (PLAN-STORY) a partir de requisitos funcionais (RFs) do documento `PRD.md`. A skill coordena a leitura do requisito, diagnóstico de contexto e criação do planejamento para execução do desenvolvedor, garantindo rastreabilidade com IDs do esquema `RF-NN` → `US-NN` → `UC-NN` → `TC-NN.MM`.

**Regra fixa:** A skill somente procede se identificar o requisito e o pacote SDD correspondente. Se nenhum requisito for informado, pergunta ao usuário e lista os requisitos disponíveis.

## 2. Entrada e Saída esperada

### Entrada (Input)

| Campo | Descrição | Obrigatório |
|-------|-----------|-------------|
| `requisito` | Número do requisito funcional no formato `RF-NN` (ex: `RF-01`) | Não (se não informado, skill pergunta ao usuário) |
| `slug` | Slug do pacote SDD no formato kebab-case (ex: `01-abrir-workspace`) | Não (se não informado, skill tenta inferir ou perguntar) |

### Saída (Output)

| Artefato | Caminho | Descrição |
|----------|---------|-----------|
| **PLAN-STORY** | `docs/sdd/NN-slug/PLAN-STORY-NN-SLUG-NAME.md` | Plano de execução detalhado derivado do requisito consultado |

## 3. Lógica de Execução

### 3.1 Cenário: Requisito e Slug informados

Se ambos os parâmetros (`requisito` e `slug`) forem fornecidos, a skill:

1. Valida se o requisito existe no formato `RF-NN`
2. Lê o `docs/PRD.md` para extrair o detalhe do requisito (descrição, regras de negócio `RN-NN.x`, atores)
3. Verifica se o pacote `docs/sdd/{slug}/` existe
4. Cria o artefato `PLAN-STORY-NN-SLUG-NAME.md` no pacote com o planejamento derivado
5. Retorna mensagem de sucesso com o caminho do arquivo criado

### 3.2 Cenário: Apenas Requisito informado (sem Slug)

Se apenas o `requisito` for fornecido (ex: `RF-01`), mas o `slug` não:

1. Lê `docs/PRD.md` para validar e extrair o requisito `RF-01`
2. Procura na matriz do `docs/TO-DO.md` qual pacote `sdd-NN-slug` está mapeado para este `RF-NN`
3. Se encontrar o mapeamento, procede para criar o artefato no pacote correspondente
4. Se **não encontrar** o mapeamento no TO-DO.md, pergunta ao usuário informando os pacotes disponíveis
5. Caso o usuário informe o slug manualmente, procede normalmente

### 3.3 Cenário: Nenhum parâmetro informado (Pedido ao Usuário)

Se nenhum dos parâmetros for fornecido, a skill executará o seguinte fluxo:

1. **Ler `docs/PRD.md`** para extrair todos os requisitos funcionais `RF-NN` e seus títulos
2. **Listar** os números e títulos dos requisitos encontrados no formato:
   ```
   RF-01 - Autenticação Híbrida e Unificação de Conta por E-mail
   RF-02 - Cadastro Interno de Usuários e Carga Idempotente
   RF-03 - Painel Colaborativo em Tempo Real, Grade Compacta e Página de Matriz
   RF-04 - Cartões Estruturados de Ideia (Pitch + Refinamento Técnico)
   RF-05 - Transição de Etapas e Trava de Qualidade (Gate) para o Backlog
   RF-06 - Trilha de Auditoria Imutável e Histórico de Sessões de Votação
   RF-07 - Sistema de Pins de Votação (Voto +1) e Reação com Regras de Sessão
   RF-08 - Rodapé Fixo de Comandos Admin, Tops 5 Ideias e Exportação (CSV / PDF)
   RF-09 - Registro de Sessões de Inovação e Página de Resultados (Sessões)
   RF-10 - Sistema de Emblemas de Contribuição (Badges)
   RF-11 - Página de Ranking & Pontuação (Ranking)
   ```
3. **Exibir mensagem** ao usuário (conforme especificado):
   ```
   Não identifiquei qual o requisito deve ser planejado. Informar o numero do requisito de acordo com o documento PRD
   ```
4. **Aguardar** o usuário informar o número do requisito (ex: `RF-01`)
5. **Voltar ao passo 1** com o requisito informado

### 4. Estrutura do Artefato de Saída (PLAN-STORY)

O arquivo `PLAN-STORY-NN-SLUG-NAME.md` criado na pasta `docs/sdd/NN-slug/` terá o seguinte conteúdo padrão:

```markdown
# Plano de Execução: [Título do Requisito RF-NN]

**RF Relacionado:** RF-NN  
**Status do RF:** [Consultado em PRD.md]  
**Pacote SDD:** docs/sdd/NN-slug/  
**Data de Criação:** YYYY-MM-DD  

## 1. Visão Geral do Requisito

- **Título:** [Título extraído do PRD.md]
- **Descrição Funcional:** [Descrição do PRD.md]
- **Atores Envolvidos:** [Do PRD.md]
- **Regras de Negócio:** [RN-NN.x do PRD.md]

## 2. Plano de Execução

### 2.1 Atividades Pré-Desenvolvimento

- [ ] Verificar existência de Use Case `UC-NN` no pacote
- [ ] Verificar existência de Test Case `TC-NN.MM` no pacote
- [ ] Confirmar status `Aprovado` dos artefatos de spec
- [ ] Revisar `SAD.md` para compatibilidade de stack/arquitetura

### 2.2 Atividades de Desenvolvimento

- [ ] Implementar código mínimo que satisfaça a spec
- [ ] Criar/atualizar componentes conforme DESIGN.md (se houver UI - Extensão A)
- [ ] Integrar com banco de dados conforme DATABASE-PATTERN.md
- [ ] Aplicar regras de negócio RN-NN.x no código

### 2.3 Atividades Pós-Desenvolvimento

- [ ] Executar suíte de testes (`npm run test`)
- [ ] Verificar comandos de qualidade (`tsc --noEmit`)
- [ ] Atualizar TO-DO.md com conclusão do planejamento
- [ ] Criar Pull Request (PR) referenciando IDs: `RF-NN`, `US-NN`, `TC-NN.MM`

## 3. Rastreabilidade

| Tipo | ID | Status | Observação |
|------|----|--------|------------|
| Requisito Funcional | RF-NN | Consultado | Em PRD.md |
| User Story | US-NN | [A definir] | Pacote NN-slug |
| Use Case | UC-NN | [A definir] | Pacote NN-slug |
| Caso de Teste | TC-NN.MM | [A definir] | Pacote NN-slk |

## 4. Observações

- Este plano deriva do requisito RF-NN do documento PRD.md versão X.X.X.
- Para implementação efetiva, o agente `sdd-developer` deve ser acionado apenas quando User Story, Use Case e Test Case estiverem com status `Aprovado`.
- Caso o requisito envolva interface de usuário (Extensão A), verificar também a presença de `ASCII-MOCKUP-NN-SLUG-NAME.md` e `DESIGN.md`.
- Todas as alterações de modelo de dados ou dependências novas requerem aprovação humana conforme AGENTS.md §5.
```

## 5. Integração com Outras Skills

| Skill | Papel |
|-------|-------|
| `sdd-structure-validator` | **Validante** | Verifica consistência do pacote antes/after da criação do planejamento |
| `sdd-developer` | **Dependente** | Apenas executa após aprovação total das specs (US/UC/TC `Aprovado`) |
| `sdd-userstory-writer` | **Referência** | Pode ser acionado para reescrever a User Story caso necessário |
| `sdd-usecase-writer` | **Referência** | Pode ser acionado para reescrever o Use Case caso necessário |
| `sdd-testcase-writer` | **Referência** | Pode ser acionado para reescrever o plano de testes caso necessário |
| `sdd-adr-writer` | **Opcional** | Registra ADR caso o planejamento implique decisão arquitetônica nova |
| `sdd-ascii-mockup` | **Opcional** | Caso o requisito envolva interface de usuário, pode gerar mockup ASCII |

## 6. Exemplos de Uso

### Execução 1: Com todos os parâmetros

```
Skill acionada com: requisito=RF-01, slug=01-abrir-workspace
Resultado: Arquivo criado em docs/sdd/01-abrir-workspace/PLAN-STORY-RF-01-01-ABRIR-WORKSPACE.md
```

### Execução 2: Apenas requisito (skill pergunta ao usuário)

```
Usuário não informa slug.
Skill lista RFs do PRD e pergunta: "Não identifiquei qual o requisito deve ser planejado. Informar o numero do requisito de acordo com o documento PRD"

Usuário responde: RF-07
Skill encontra mapeamento RF-07 → pacote 01-abrir-workspace (via TO-DO.md)
Resultado: Arquivo criado em docs/sdd/01-abrir-workspace/PLAN-STORY-RF-07-01-ABRIR-WORKSPACE.md
```

### Execução 3: Nenhum parâmetro (fluxo completo de pergunta)

```
Skill sem parâmetros.
Exibe mensagem: "Não identifiquei qual o requisito deve ser planejado. Informar o numero do requisito de acordo com o documento PRD"
Exibe lista de RFs do PRD (RF-01 a RF-11).
Usuário informa: RF-03
Skill mapeia RF-03 → pacote 01-abrir-workspace (via TO-DO.md mapping).
Resultado: Arquivo criado em docs/sdd/01-abrir-workspace/PLAN-STORY-RF-03-01-ABRIR-WORKSPACE.md
```

## 7. Exemplos de RFs Disponíveis no PRD.md

A skill deve ser capaz de listar os seguintes requisitos ao ser acionada sem parâmetros:

```
RF-01 - Autenticação Híbrida e Unificação de Conta por E-mail
RF-02 - Cadastro Interno de Usuários e Carga Inicial Idempotente
RF-03 - Painel Colaborativo em Tempo Real, Grade Compacta e Página Dedicada de Matriz
RF-04 - Cartões Estruturados de Ideia (Pitch + Refinamento Técnico)
RF-05 - Transição de Etapas e Trava de Qualidade (Gate) para o Backlog
RF-06 - Trilha de Auditoria Imutável e Histórico de Sessões de Votação
RF-07 - Sistema de Pins de Votação (Voto +1) e Reação com Regras de Sessão
RF-08 - Rodapé Fixo de Comandos Admin, Tops 5 Ideias e Exportação (CSV / PDF)
RF-09 - Registro de Sessões de Inovação e Página de Resultados (Sessões)
RF-10 - Sistema de Emblemas de Contribuição (Badges)
RF-11 - Página de Ranking & Pontuação (Ranking)
```

## 8. Critérios de Dependência

- **Obrigatório:** Acesso leitura a `docs/PRD.md` e `docs/TO-DO.md`
- **Recomendado:** Pacote `docs/sdd/NN-slug/` já existir (caso contrário, skill pode criar ou perguntar)
- **Condição de bloqueio:** PRD com status diferente de `Aprovado` ou conter `[A VALIDAR]` em algum RF impede a criação do planejamento

## 9. Próximos Passos Após Criação do PLAN-STORY

- Atualizar `TO-DO.md` com conclusão do planejamento
- Verificar se User Story/Use Case/Test Case do pacote precisam ser atualizados
- Acionar skill `sdd-developer` para implementação (após aprovação das specs)
- Publicar relatório final conforme GUIDELINE.md §8

---