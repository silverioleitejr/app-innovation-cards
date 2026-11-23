# PRD — SDD Project Bootstrapper (MVP)

Nov 18, 2026 · @Junior Leite

| Campo | Valor |
| --- | --- |
| **Autor** | Silverio Leite Jr (Junior) |
| **Cargo** | Senior Solution Architect — OG1 TI |
| **E-mail** | silverio.leitejr@og1.com.br |
| **Telefone** | (11) 96020-6334 |
| **Versão** | 2.0.0-MVP (Revisado — Escopo Puramente Funcional) |
| **Status** | Em revisão |
| **Data** | 2026-11-18 |

## 1. Visão Geral do Produto

O **SDD Project Bootstrapper** é uma aplicação web de produtividade e governança voltada para arquitetos e desenvolvedores que praticam **Spec-Driven Development (SDD)** com suporte de agentes de IA.

O produto centraliza, padroniza e conduz a inicialização de novos projetos web em um fluxo guiado de **9 etapas sequenciais (Etapas 0 a 8)** — desde a definição da estrutura inicial de pastas, elaboração e revisão dos artefatos de especificação (`PRD.md`, `SAD.md`, `DESIGN.md`), seleção de *Skills* agênticas e configuração do contrato operacional (`AGENTS.md`), até a criação e publicação direta no repositório remoto sem necessidade de executar comandos em terminal.

*(Nota: Todas as definições de stack tecnológica, persistência, integrações via API/SDK, modelagem de dados e arquitetura de segurança estão especificadas exclusivamente no documento `SAD.md`.)*

## 2. Problema e Contexto

Iniciar um novo projeto web seguindo rigorosamente a metodologia Spec-Driven Development exige uma sequência repetitiva de preparação documental, estrutural e de contexto para agentes de IA. Quando executado manualmente a cada projeto, esse processo gera atrito operacional e inconsistências entre repositórios.

**Dores identificadas:**

- Repetição manual de 9 etapas estruturais e documentais a cada novo projeto iniciado.
- Falta de padronização entre os documentos `PRD.md`, `SAD.md`, `DESIGN.md` e `AGENTS.md` de diferentes projetos.
- Esquecimento de etapas críticas antes do início da codificação agêntica (como incluir skills padrão ou configurar regras de comportamento no `AGENTS.md`).
- Dependência de comandos manuais de terminal para inicializar estrutura, criar repositório remoto e subir a carga inicial de arquivos.
- Ausência de um local centralizado para consultar, reutilizar templates/skills e acompanhar o progresso de múltiplos projetos simultâneos.

**Hipótese:** Uma plataforma web que conduza as 9 etapas do bootstrap SDD, ofereça templates e skills reutilizáveis, auxilie na redação dos artefatos e publique toda a estrutura diretamente no repositório remoto reduzirá o tempo de setup de novos projetos em mais de 80% e garantirá 100% de conformidade metodológica desde o primeiro registro.

## 3. Objetivos e Métricas de Sucesso (MVP)

| Objetivo | Métrica | Meta MVP |
| --- | --- | --- |
| Acelerar o setup de projetos | Tempo total desde a criação do workspace até o repositório pronto | < 3 minutos |
| Padronizar artefatos SDD | Projetos iniciados contendo `PRD.md`, `SAD.md`, `DESIGN.md` e `AGENTS.md` | 100% dos projetos |
| Eliminar dependência de terminal | Etapas de criação de repositório e envio inicial realizadas direto pela interface | 100% via interface web |
| Reutilizar governança agêntica | Projetos publicados com skills padrão selecionadas do catálogo | 100% dos projetos |
| Garantir visibilidade | Histórico de publicações e estrutura remota consultáveis na própria ferramenta | 100% das publicações rastreadas |

## 4. Usuários e Personas

**Arquiteto de Soluções / Tech Lead (Persona Principal)**
Define a visão do produto, diretrizes arquiteturais, padrões visuais e regras de governança antes de delegar a implementação aos agentes de IA. Busca velocidade, rigor metodológico, padronização de templates e rastreabilidade entre múltiplos projetos.

**Desenvolvedor Full-Stack AI-First**
Utiliza agentes de desenvolvimento no dia a dia e precisa que todo novo repositório já nasça com documentação consistente (`PRD.md`, `SAD.md`, `DESIGN.md`), contrato de agentes (`AGENTS.md`) e skills de comportamento prontas para uso, evitando retrabalho e desvios de escopo.

## 5. Funcionalidades do MVP

### 5.1 Acesso e Gestão de Projetos (Workspaces)

- Acesso autenticado individual, garantindo que cada usuário visualize e gerencie exclusivamente seus próprios projetos e customizações.
- Criação, listagem, alternância e exclusão de múltiplos projetos independentes.
- Cadastro dos metadados do projeto: Nome do Projeto, Identificador (*slug*), Descrição da Stack, Conta/Organização do repositório remoto, Nome do Repositório e Visibilidade (Privado ou Público).
- Salvamento automático contínuo de todas as alterações feitas nos formulários e documentos.

### 5.2 Pipeline Guiado de 9 Etapas (0 a 8)

Navegação lateral com indicador visual de status por etapa (**Pendente**, **Em andamento**, **Concluído**) e barra de progresso geral do projeto:

- **Etapa 0 — Estrutura de Diretórios:** Definição da estrutura lógica de pastas do projeto (`docs/`, `src/`, `.agents/skills/`).
- **Etapa 1 — Elaborar `PRD.md`:** Edição da especificação funcional do produto a partir do template mestre pré-preenchido com os metadados do projeto.
- **Etapa 2 — Elaborar `SAD.md`:** Edição da documentação técnica/arquitetural alinhada ao `PRD.md` definido na etapa anterior.
- **Etapa 3 — Revisar `DESIGN.md`:** Edição das diretrizes visuais acompanhada de checklist interativo de validação (identidade visual, acessibilidade, tipografia e responsividade).
- **Etapa 4 — Estrutura Inicial do Projeto:** Revisão dos arquivos base do repositório (`README.md`, regras de exclusão e diretórios iniciais).
- **Etapa 5 — Criação do Repositório Remoto:** Provisionamento do repositório na conta/organização configurada diretamente pela interface, sem uso de terminal.
- **Etapa 6 — Publicação Inicial:** Envio consolidado de toda a estrutura de diretórios, documentos e skills para o repositório remoto em uma única ação.
- **Etapa 7 — Seleção de Skills Agênticas:** Escolha, filtragem por categoria e eventual ajuste pontual das skills de comportamento que acompanharão o projeto.
- **Etapa 8 — Configurar `AGENTS.md`:** Consolidação do contrato operacional dos agentes de desenvolvimento referenciando a documentação e as skills selecionadas.

### 5.3 Gestão de Templates Mestre e Catálogo de Skills

- **Templates SDD:** Visualização e edição dos templates padrão de `PRD.md`, `SAD.md`, `DESIGN.md`, `AGENTS.md` e `README.md`, com opção de restaurar o modelo original padrão a qualquer momento.
- **Catálogo de Skills Disponíveis:** Biblioteca pesquisável e filtrável por categoria contendo skills padrão pré-carregadas e possibilidade de o usuário cadastrar, editar ou desativar suas próprias skills reutilizáveis.
- **Personalização por Projeto:** Possibilidade de adaptar o conteúdo de uma skill especificamente para um projeto sem alterar a definição original do catálogo.

### 5.4 Assistência Inteligente na Elaboração de Artefatos

- Ação opcional e sob demanda nas etapas documentais para gerar ou refinar rascunhos de `PRD.md`, `SAD.md`, `DESIGN.md` e `AGENTS.md` considerando o contexto das etapas anteriores.
- O usuário mantém controle total para revisar, editar ou descartar qualquer sugestão gerada antes de salvar ou publicar.

### 5.5 Inspeção do Repositório Remoto e Histórico de Publicações

- **Explorador de Estrutura Remota:** Visualização da árvore completa de pastas e arquivos já existentes no repositório remoto diretamente na interface.
- **Leitura de Arquivos Remotos:** Abertura e leitura do conteúdo de qualquer arquivo do repositório remoto para conferência ou sincronização com o workspace.
- **Histórico de Publicações:** Registro consultável de todas as tentativas de publicação realizadas no projeto (data/hora, status de sucesso ou falha, quantidade de arquivos enviados e link direto para o registro no repositório).

## 6. Fora do Escopo (MVP)

- Edição colaborativa simultânea em tempo real (múltiplos usuários editando o mesmo documento ao mesmo tempo).
- Execução de comandos no terminal local ou acesso direto ao sistema de arquivos do computador do usuário.
- Marketplace público de compartilhamento de skills entre diferentes empresas/contas externas.
- Gestão de pipelines de CI/CD, monitoramento de produção ou deploy da aplicação gerada em nuvem.
- Gestão de planos, assinaturas ou cobrança (billing).
- Modo de operação off-line.

## 7. Requisitos Não-Funcionais (Qualidade e Governança)

| Requisito | Especificação |
| --- | --- |
| **Usabilidade** | Interface limpa e orientada a produtividade, permitindo navegação fluida entre as 9 etapas e leitura confortável de documentos extensos |
| **Responsividade** | Otimizado para desktop (1280px+); funcional em notebooks e tablets (1024px+) |
| **Privacidade e Isolamento** | Cada usuário acessa exclusivamente seus projetos, templates customizados e skills privadas; credenciais de acesso a serviços externos nunca ficam expostas ao navegador |
| **Transparência no Uso de IA** | Nenhum conteúdo de projeto é processado por inteligência artificial sem acionamento explícito do usuário |
| **Confiabilidade** | Salvamento contínuo sem perda de trabalho em caso de recarregamento de página; mensagens claras e acionáveis em caso de falha na publicação remota |
| **Auditabilidade** | Histórico imutável de todas as execuções de publicação realizadas por projeto |
| **Compatibilidade** | Navegadores modernos (Chrome, Edge, Firefox e Safari nas últimas 2 versões) |

## 8. Critérios de Aceite

### CA-01 — Acesso e Gestão de Workspaces

- [ ] Usuário autenticado consegue criar um novo projeto informando nome, stack, conta/organização, nome do repositório e visibilidade.
- [ ] Ao criar o projeto, os documentos iniciais (`PRD.md`, `SAD.md`, `DESIGN.md`, `AGENTS.md`, `README.md`) são gerados automaticamente a partir dos templates ativos com os dados do projeto preenchidos.
- [ ] Alterações nos documentos são salvas automaticamente e permanecem disponíveis ao recarregar a página ou acessar de outro dispositivo.

### CA-02 — Fluxo das 9 Etapas e Templates

- [ ] Todas as 9 etapas (0 a 8) são navegáveis e exibem status atualizado conforme o avanço do usuário.
- [ ] Etapa 3 (`DESIGN.md`) permite marcar e desmarcar itens do checklist de revisão visual.
- [ ] Usuário consegue editar seus templates mestre e restaurar o modelo padrão quando desejar.

### CA-03 — Catálogo de Skills Agênticas

- [ ] Etapa 7 lista as skills padrão disponíveis e permite filtrar por categoria.
- [ ] Usuário consegue selecionar/desmarcar skills para o projeto e cadastrar novas skills reutilizáveis no catálogo.

### CA-04 — Assistência Inteligente (IA)

- [ ] Usuário consegue acionar a geração assistida do `SAD.md` utilizando como base o `PRD.md` já preenchido na Etapa 1.
- [ ] O texto sugerido é apresentado para revisão do usuário sem sobrescrever silenciosamente seu trabalho sem confirmação.

### CA-05 — Publicação e Inspeção do Repositório Remoto (Sem Terminal)

- [ ] Usuário consegue criar o repositório remoto e publicar toda a estrutura inicial (documentos, pastas e skills selecionadas) diretamente pela interface web, sem executar comandos em terminal.
- [ ] Após a publicação, a interface exibe a árvore real de pastas e arquivos do repositório remoto e permite abrir o conteúdo de qualquer arquivo listado.
- [ ] O histórico do projeto registra a publicação com data, status e link para o repositório.

## 9. Riscos de Produto e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Tentativa de criar repositório com nome já existente | Média | Médio | Validar existência prévia e exibir mensagem clara permitindo escolher outro nome ou vincular ao repositório existente |
| Divergência entre o que foi definido no `PRD.md` e o que foi detalhado no `SAD.md` | Média | Alto | Manter o `PRD.md` focado apenas em escopo funcional e oferecer geração/revisão assistida do `SAD.md` diretamente a partir do `PRD.md` |
| Usuário colar senhas ou chaves sensíveis dentro dos textos de especificação | Baixa | Alto | Aplicar higienização preventiva antes do envio para assistência de IA e exibir orientação de boas práticas na interface |
| Sobrescrita acidental de texto editado manualmente ao alterar metadados | Baixa | Médio | Preservar edições manuais do usuário nos documentos, aplicando interpolação de template apenas na criação inicial ou mediante confirmação explícita |

## 10. Roadmap Pós-MVP

| Fase | Entregável Funcional | Pré-requisito |
| --- | --- | --- |
| **v1.1** | Visualização lado a lado (Markdown renderizado) e comparador visual (*diff*) entre versão local e versão no repositório remoto | MVP aprovado |
| **v1.2** | Sincronização bidirecional (importar alterações feitas diretamente no repositório remoto de volta para o workspace) | v1.1 |
| **v1.3** | Workspaces compartilhados em equipe com perfis de permissão (Arquiteto, Desenvolvedor, Revisor) | MVP aprovado |
| **v2.0** | Dashboard de governança SDD (aderência de projetos aos artefatos padrão e histórico de evolução) | v1.3 |

---

*Este documento é vivo e descreve exclusivamente o escopo funcional e de produto. Toda especificação técnica e arquitetural reside no `SAD.md`.*