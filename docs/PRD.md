# PRD — Innovation Board

> **Documento:** PRD.md  
> **Autor / Product Owner:** Silverio Leite Jr · Senior Solution Architect · OG1 TI  
> **E-mail:** silverio.leitejr@og1.com.br · **Telefone:** (11) 96020-6334  
> **Versão:** 0.4.0  
> **Data:** 2026-11-25  
> **Status:** Aprovado

> **Projeto / Produto:** Innovation Board (`innovation-board`)  
> **Documentos Relacionados:** `SAD.md` · `GLOSSARY.md`

---

## 1. Visão Geral do Produto

### 1.1 Resumo Executivo
O **Innovation Board** é uma aplicação colaborativa em tempo real voltada para a condução de sessões de inovação em áreas de Dados, Analytics e IA. O produto permite que especialistas técnicos, facilitadores e gestores registrem propostas durante sessões de pitch (inclusive clicando diretamente no quadro e com salvamento automático no editor), conduzam rodadas formais de votação controlada por sessão (`Voto +1`) e reações rápidas, apurem e exportem o ranking **Tops 5 Ideias** em `CSV` ou `PDF`, avaliem esforço e benefício em uma página dedicada de **Matriz**, promovam iniciativas maduras ao backlog com trava de qualidade, acompanhem o resumo histórico completo de cada reunião na página **Sessões**, reconheçam contribuições por meio de **Emblemas (Badges)** e da página **Ranking & Pontuação**, e auditem integralmente as decisões na **Trilha de Auditoria Imutável**.

### 1.2 Proposta de Valor
Substituir quadros genéricos de diagramação por um ambiente estruturado especificamente para o funil de inovação (**Pitch → Avaliação → Backlog**), unindo presença simultânea ao vivo, edição segura com salvamento automático, governança por perfis (`RBAC`), sessões formais de votação com controle de voto único por participante, reconhecimento ponderado por qualidade (emblemas e ranking auditável), registro consolidado das atividades de cada reunião e trilha de auditoria imutável.

> **Nota de Governança SDD:** Este documento descreve o **escopo funcional, regras de negócio, critérios de aceitação e experiência esperada pelo usuário**. Decisões técnicas de stack, arquitetura em camadas, segurança, resiliência e ADRs ficam documentadas em `SAD.md`. A linguagem de domínio compartilhada está definida em `GLOSSARY.md`.

---

## 2. Problema, Contexto e Hipótese de Negócio

### 2.1 Contexto Atual
A coordenação de iniciativas de inovação em Dados, BI e IA exige sessões colaborativas ágeis nas quais engenheiros, analistas e arquitetos propõem ideias, realizam votações justas durante a reunião, posicionam propostas em matriz de esforço versus benefício, detalham pré-requisitos técnicos e priorizam o backlog em conjunto — mantendo registro formal do que foi produzido em cada encontro.

### 2.2 Dores e Problemas Identificados
- **Dor 01:** Ausência de uma estrutura nativa para o ciclo de vida da inovação (`Pitch` → `Avaliação` → `Backlog`), permitindo que ideias entrem no backlog sem arquitetura, critérios de MVP ou líder técnico definidos.
- **Dor 02:** Falta de governança de votação durante workshops (votos fora da janela de votação, múltiplos votos do mesmo participante em ideias diferentes e dificuldade de consolidar e apresentar os Top 5 eleitos).
- **Dor 03:** Ausência de um histórico consolidado por reunião/sessão que responda quem esteve presente ou ausente, quanto tempo durou a sessão e quais ideias foram criadas, votadas, avaliadas ou promovidas ao backlog naquela data.
- **Dor 04:** Falta de controle de acesso por papéis organizacionais (`ADMIN`, `FACILITATOR`, `MEMBER`, `VIEWER`) e de uma trilha de auditoria imutável de todas as decisões.

### 2.3 Hipótese do Produto
Ao entregar um **painel colaborativo em tempo real estruturado em 3 etapas do funil, com grade compacta, criação inline de cards, editor com salvamento automático (debounce), votação formal controlada por sessão (`Voto +1`), rodapé administrativo com exportação de Top 5 (`CSV`/`PDF`), Matriz 2×2 dedicada, histórico consolidado de Sessões, sistema de Emblemas & Ranking ponderado por qualidade e Auditoria imutável** para equipes de Dados, Analytics e IA, alcançaremos **reuniões mais ágeis, maior engajamento técnico sem perda de dados na escrita, priorização democrática auditável, 100% de completude no Backlog e rastreabilidade integral de resultados por sessão**.

---

## 3. Objetivos e Métricas de Sucesso (KPIs)

| Objetivo de Negócio | Métrica / Indicador | Meta | Como Medir (Visão Funcional) |
| --- | --- | --- | --- |
| **Adesão às Sessões** | Percentual de participantes presentes em relação ao total de membros ativos cadastrados | ≥ 90% dos membros | Registro automático de presentes e ausentes capturado em cada sessão na página **Sessões** |
| **Integridade da Votação** | Conformidade das votações com janela aberta e limite de 1 `Voto +1` por usuário/sessão | 100% de conformidade | Validação automática na aplicação de pins e registro por sessão na trilha de auditoria |
| **Qualidade do Refinamento** | Percentual de ideias promovidas ao Backlog com Arquitetura, Critérios MVP e Líder Técnico preenchidos | 100% das ideias no Backlog | Trava de qualidade (`3/3`) aplicada em toda promoção para a coluna `03. Backlog & Priorização` |
| **Engajamento e Reconhecimento** | Percentual de membros ativos com emblemas conquistados e pontuação auditável no ciclo | ≥ 75% dos colaboradores | Acompanhamento na página **Ranking** (por período e especialidade) e emblemas nas listas de participantes |
| **Rastreabilidade de Reuniões** | Percentual de sessões com registro de início, término, duração, participantes e links de ideias produzidas | 100% das sessões | Consulta filtrada por data na página **Sessões** e inspeção na **Auditoria** |

---

## 4. Usuários, Personas e Perfis de Acesso

### Persona 1: Administrador de Inovação (`ADMIN`) *(Governança e Operação de Sessões)*
- **Perfil e Contexto:** Prepara o ambiente antes dos workshops, realiza a carga inicial de participantes, comanda a abertura/fechamento/apuração de cada sessão de votação, move ideias eleitas para avaliação e audita integralmente a plataforma.
- **Objetivo no Produto:** Gerenciar usuários e carga em lote, operar os **Comandos Admin** no rodapé do painel (`Abrir Votação`, `Fechar Votação`, `Apurar Votos`, `Mover Ideias Top 5 → Avaliação Técnica`), exportar relatórios Top 5 e consultar Sessões, Ranking e Auditoria.

### Persona 2: Facilitador / Arquiteto de Soluções (`FACILITATOR`) *(Moderação Técnica)*
- **Perfil e Contexto:** Lidera tecnicamente as dinâmicas, conduz o debate de viabilidade na Matriz, valida o refinamento arquitetural e aprova a entrada de iniciativas no Backlog.
- **Objetivo no Produto:** Criar, editar e mover qualquer cartão, anexar/substituir pins, conduzir o refinamento (`3/3`), promover cartões ao Backlog e consultar Sessões, Ranking e Auditoria.

### Persona 3: Membro Colaborador (`MEMBER` — Especialista em Dados, BI, IA ou FinOps)
- **Perfil e Contexto:** Propõe ideias durante o pitch, participa das votações com seu `Voto +1` por sessão, interage com reações e colabora no posicionamento na Matriz.
- **Objetivo no Produto:** Criar cartões rapidamente (inclusive clicando diretamente no quadro), editar/excluir seus próprios cartões com salvamento automático, votar com `Voto +1` quando a votação estiver aberta, reagir com pins e acompanhar Sessões, Emblemas e Ranking.

### Persona 4: Gestor / Stakeholder Convidado (`VIEWER`) *(Consulta)*
- **Perfil e Contexto:** Acompanha a dinâmica ao vivo e analisa os resultados das sessões sem interferir nos cartões.
- **Objetivo no Produto:** Visualizar Painel, Matriz, Sessões, Ranking, Top 5 Ideias, emblemas, pins e cursores ao vivo em modo estritamente de leitura.

---

## 5. Escopo Funcional (Requisitos Funcionais)

### 5.1 Mapa de Macro-Fluxo do Usuário (Jornada Principal)
1. **Entrada / Acesso:** O administrador realiza a carga inicial de participantes e cada membro acessa via credencial local, auto-registro ou login federado corporativo.
2. **Abertura da Sessão:** O administrador aciona **Abrir Votação** no rodapé do Painel, registrando uma nova **Sessão** com data, lista de IDs de presentes e ausentes, contagem inicial de cards por etapa e ID do administrador responsável.
3. **Pitch e Engajamento:** Os participantes entram simultaneamente, criam novas ideias (via botão **Nova ideia** com rascunho automático local ou clicando diretamente no board para digitar Título e Descrição inline), editam detalhes extensos com salvamento automático, interagem com pins de reação e aplicam seu único **`Voto +1`** da sessão.
4. **Encerramento, Apuração e Exportação:** O administrador aciona **Fechar Votação**, **Apurar Votos** (consolidando as **Tops 5 Ideias** por `Voto +1`), **Mover Ideias Top 5 → Avaliação Técnica** e pode exportar os Top 5 em **`.csv`** ou **`.pdf`**.
5. **Avaliação, Refinamento e Backlog:** O time posiciona iniciativas na página dedicada **Matriz** (`Esforço × Benefício`), preenche o refinamento técnico na gaveta do cartão (`3/3`) e promove cartões validados para **03. Backlog & Priorização**.
6. **Resultados, Reconhecimento e Auditoria:** O time consulta o resumo completo de cada encontro na página **Sessões** (filtrado por data, com links clicáveis por ID), acompanha emblemas, pontuação ponderada e progresso pessoal na página **Ranking**, e gestores auditam todas as transições na aba **Auditoria**.

### 5.2 Detalhamento das Funcionalidades

#### `[RF-01]` Autenticação Híbrida e Unificação de Conta por E-mail
- **Descrição Funcional:** Acesso via e-mail corporativo e senha local, auto-registro de novos usuários, alteração de senha pelo próprio usuário e login federado (`Microsoft Entra ID` e `Google Workspace`).
- **Atores Envolvidos:** `ADMIN`, `FACILITATOR`, `MEMBER`, `VIEWER`.
- **Regras de Negócio:**
  - `RN-01.1`: O e-mail normalizado em minúsculas é a chave única de identificação do usuário.
  - `RN-01.2`: No primeiro login federado de um usuário previamente cadastrado via carga inicial com o mesmo e-mail, a identidade externa é vinculada automaticamente à conta existente, preservando papel, especialidade e cor de cursor.
  - `RN-01.3`: Auto-registros sem cadastro prévio recebem o papel padrão `MEMBER`.

#### `[RF-02]` Cadastro Interno de Usuários e Carga Inicial Idempotente
- **Descrição Funcional:** Gestão do diretório interno contendo nome completo, e-mail, papel (`ADMIN`, `FACILITATOR`, `MEMBER`, `VIEWER`), especialidade (`Engenharia de Dados`, `Analytics / BI`, `IA / GenAI`, `Governança / FinOps`), cor do cursor e status (ativo/inativo), com suporte a importação em lote `JSON` e `CSV`.
- **Atores Envolvidos:** `ADMIN`.
- **Regras de Negócio:**
  - `RN-02.1`: A carga em lote é idempotente (cria novos e-mails e atualiza metadados dos existentes).
  - `RN-02.2`: A reexecução da carga nunca sobrescreve senhas já alteradas pelo próprio usuário.
  - `RN-02.3`: Validação atômica tudo-ou-nada: qualquer erro no lote aborta integralmente a carga sem alterações parciais.

#### `[RF-03]` Painel Colaborativo em Tempo Real, Grade Compacta e Página Dedicada de Matriz
- **Descrição Funcional:** Quadro colaborativo de fundo branco puro organizado em **3 macro-colunas**:
  1. **01. Pitch & Ideia** — Registro inicial das propostas (incluindo base inicial de iniciativas em Engenharia de Dados, Analytics/BI, IA/GenAI e Governança/FinOps).
  2. **02. Avaliação Técnica & Valor** — Propostas em avaliação com indicador de prontidão para Backlog (`0/3` a `3/3`) e atalho direto para a página **Matriz**.
  3. **03. Backlog & Priorização** — Iniciativas validadas para entrega.
  - **Distribuição Compacta:** Cada coluna exibe **2 cartões por linha** (`grid-cols-2`), apresentando de forma objetiva **Título**, **Categoria** (com marcador de cor da disciplina) e **Barra de Pins**, acompanhados por **animações suaves de entrada, saída e reposicionamento** quando cartões são criados ou movidos entre etapas.
  - **Criação Direta no Board:** Clicar em áreas livres das colunas `01. Pitch & Ideia` ou `02. Avaliação Técnica & Valor` (ou no atalho `+`) gera imediatamente um **cartão editável inline** que permite digitar **Título** e **Descrição** diretamente no board, escolher disciplina/esforço e salvar com `Ctrl+Enter`.
  - **Página Dedicada `Matriz`:** Visão em tela cheia da **Matriz Esforço × Benefício** com arraste espacial contínuo `(posX, posY)` nos 4 quadrantes (*Ganhos Rápidos*, *Projetos Estruturantes*, *Melhorias Contínuas*, *Icebox*) e fila lateral de ideias em Pitch.
  - **Presença e Filtros:** Barra de avatares conectados, cursores remotos em tempo real e filtros instantâneos por texto, disciplina e esforço.
- **Atores Envolvidos:** `ADMIN`, `FACILITATOR`, `MEMBER` (interação) e `VIEWER` (somente visualização).
- **Regras de Negócio:**
  - `RN-03.1`: Movimentação de cursores é estritamente efêmera e nunca gravada no histórico permanente.
  - `RN-03.2`: Usuários `VIEWER` têm todas as mutações bloqueadas no cliente e no servidor.
  - `RN-03.3`: Edições e movimentações simultâneas são reconciliadas via estado autoritativo do servidor em tempo real.

#### `[RF-04]` Cartões Estruturados de Ideia (Pitch + Refinamento Técnico + Salvamento Automático)
- **Descrição Funcional:** Gaveta lateral de edição/visualização (`CardDrawer`) dividida em duas seções, equipada com **salvamento automático com debounce** e indicador discreto de estado no rodapé (*Alterações pendentes...*, *Salvando automaticamente...*, *Salvo automaticamente às HH:mm:ss* ou *Rascunho salvo localmente às HH:mm:ss*):
  - **Seção 1 — Dados do Pitch:** Título, Disciplina, Dor/Oportunidade, Solução Proposta, Benefício Esperado, Modelo de Implementação (`In-House`, `Parceiro / Consultoria`, `SaaS / Managed`, `Híbrido`) e Esforço (`P`, `M`, `G`, `XG`).
  - **Seção 2 — Refinamento Técnico & Arquitetural:** Arquitetura e Solução Técnica, Pré-requisitos e Dependências, Riscos de Segurança/Privacidade (LGPD/Governança), Critérios de Sucesso do MVP e Líder Técnico Responsável.
- **Regras de Negócio:**
  - `RN-04.1`: Na criação em `Pitch`, apenas os dados essenciais são exigidos; o refinamento pode ser preenchido progressivamente.
  - `RN-04.2`: `MEMBER` edita/exclui apenas cartões de sua própria autoria; `ADMIN` e `FACILITATOR` editam/excluem qualquer cartão.
  - `RN-04.3`: Cada disciplina aplica automaticamente sua cor identificadora no cartão.
  - `RN-04.4`: Na edição de cartões existentes, alterações válidas são persistidas automaticamente no servidor após pausa de **900 ms** sem exibir notificações repetitivas, respeitando pré-validações (título obrigatório, gate `3/3` e permissão de Backlog), enfileirando digitações concorrentes e realizando *flush* imediato ao fechar a gaveta. O botão **Salvar e fechar** evita requisições duplicadas quando a versão atual já está salva.
  - `RN-04.5`: Na criação de novas ideias, o conteúdo é salvo automaticamente como rascunho local no navegador após **500 ms** (isolado por usuário e etapa inicial), sendo restaurado automaticamente caso o painel seja fechado ou recarregado, com opção explícita **Descartar rascunho** e limpeza automática ao confirmar **Criar iniciativa**.

#### `[RF-05]` Transição de Etapas e Trava de Qualidade (Gate) para o Backlog
- **Descrição Funcional:** Arraste (*Drag & Drop*) entre colunas ou mudança de etapa na gaveta do cartão.
- **Regras de Negócio:**
  - `RN-05.1`: A promoção para `03. Backlog & Priorização` exige o preenchimento obrigatório de **3 campos**: *Arquitetura e Solução Técnica*, *Critérios de Sucesso do MVP* e *Líder Técnico Responsável*.
  - `RN-05.2`: Caso falte qualquer campo, o cartão retorna à coluna anterior e exibe alerta detalhando os campos pendentes com atalho para o refinamento.
  - `RN-05.3`: Apenas `ADMIN` e `FACILITATOR` podem promover cartões para `Backlog & Priorização`.

#### `[RF-06]` Trilha de Auditoria Imutável e Histórico de Sessões de Votação
- **Descrição Funcional:** Registro inalterável de eventos de autenticação, gestão de usuários, ciclo de vida de cartões, pins e operações de votação/sessão, com filtros por ação, participante, entidade e busca textual, além de inspeção visual lado a lado (`Antes × Depois`) e tabela de **Registro de Sessões de Votação**.
- **Atores Envolvidos:** `ADMIN`, `FACILITATOR`.
- **Regras de Negócio:**
  - `RN-06.1`: Registros são estritamente *append-only* e encadeados por hash criptográfico, sem possibilidade de edição ou exclusão.
  - `RN-06.2`: O log de auditoria é persistido na mesma transação da operação de negócio.
  - `RN-06.3`: Acesso exclusivo para `ADMIN` e `FACILITATOR`.

#### `[RF-07]` Sistema de Pins de Votação (`Voto +1`) e Reação com Regras de Sessão
- **Descrição Funcional:** Permite anexar, substituir ou remover pins diretamente nos cartões do painel e na gaveta lateral, escolhendo entre 5 tipos:
  1. **`Voto +1`** (`vote_plus`) — voto oficial da sessão (usado no ranking Top 5)
  2. **`Aplauso`** (`applause`) — reação de destaque
  3. **`Dedo positivo`** (`thumbs_up`) — reação de concordância
  4. **`Dedo negativo`** (`thumbs_down`) — reação de ressalva
  5. **`Coração`** (`heart`) — reação de entusiasmo
- **Atores Envolvidos:** `ADMIN`, `FACILITATOR`, `MEMBER` (interação) e `VIEWER` (leitura).
- **Regras de Negócio:**
  - `RN-07.1` *(Regra a)*: O pin **`Voto +1`** somente pode ser aplicado, substituído ou removido quando o status do painel for **`VOTAÇÃO ABERTA`**. Os demais pins de reação permanecem disponíveis independentemente do status da votação.
  - `RN-07.2` *(Regra b)*: Cada participante pode aplicar **`Voto +1`** em **apenas 1 único card em todo o painel por sessão de votação aberta**. Caso tente aplicar `Voto +1` em outro card, o sistema bloqueia e informa o título do card onde o voto atual está alocado. Remover ou substituir o `Voto +1` naquele card enquanto a sessão estiver aberta libera o voto para outro card.
  - `RN-07.3` *(Regra c)*: O botão **Pin** permanece sempre ativo nos cards (para perfis não observadores), permitindo trocar/substituir diretamente o pin do usuário no card, validando sempre as regras `RN-07.1` e `RN-07.2` antes de aplicar.
  - `RN-07.4` *(Regra d)*: Cada usuário mantém no máximo 1 pin por cartão; toda alteração de pin é sincronizada em tempo real e registrada na auditoria (`CARD_PIN_TOGGLED`) com vínculo à sessão de votação ativa.

#### `[RF-08]` Rodapé Fixo de Comandos Admin, Tops 5 Ideias e Exportação (`CSV` / `PDF`)
- **Descrição Funcional:** Seção de rodapé fixada na base do **Painel** composta por duas linhas operacionais:
  - **Linha 1 — Comandos Admin e Status da Sessão:** Exibe o badge de status (`Votação Aberta · Sessão #N` ou `Votação Fechada · Sessão #N`), os 4 botões exclusivos do perfil `ADMIN` (**Abrir Votação**, **Fechar Votação**, **Apurar Votos** e **Mover Ideias Top 5 → Avaliação Técnica**) e o indicador em tempo real do card onde está aplicado o `Voto +1` do participante logado.
  - **Linha 2 — Tops 5 Ideias e Exportação:** Exibe o ranking das 5 ideias mais votadas por **`Voto +1`** (clicáveis para abrir o cartão), o horário da última apuração e o menu **Exportar Top 5** para download em **`.csv`** ou **`.pdf`** (relatório executivo formatado para apresentação).
- **Atores Envolvidos:** Visualização para todos os perfis; comandos administrativos exclusivos para `ADMIN`; exportação disponível para todos os usuários autenticados quando houver ideias ranqueadas.
- **Regras de Negócio:**
  - `RN-08.1`: O ranking **Tops 5 Ideias** e a **Apuração de Votos** contabilizam exclusivamente os pins **`Voto +1`**.
  - `RN-08.2`: Ao acionar **Abrir Votação** após fechar uma sessão anterior, os resultados anteriores permanecem arquivados no registro da sessão fechada e os pins `Voto +1` são zerados para a nova rodada (mantendo pins de reação intactos).
  - `RN-08.3`: **Mover Ideias Top 5 → Avaliação Técnica** promove automaticamente os cards do Top 5 que estejam em `01. Pitch & Ideia` para `02. Avaliação Técnica & Valor`, auditando e vinculando esses cards à sessão.

#### `[RF-09]` Registro de Sessões de Inovação e Página de Resultados (`Sessões`)
- **Descrição Funcional:** Cada reunião/rodada iniciada pelo comando **Abrir Votação** cria um registro formal de **Sessão** contendo o retrato inicial do encontro e consolida todas as atividades realizadas durante a sessão, exibidas na página dedicada **Sessões**.
- **Dados Gravados na Abertura (`Abrir Votação`):**
  - Data da sessão (`YYYY-MM-DD`) e timestamp de início;
  - Lista de **IDs dos participantes presentes** (usuários conectados/logados, incluindo o administrador);
  - Lista de **IDs dos participantes ausentes** (usuários ativos cadastrados não logados no momento);
  - Quantidade de cards em **01. Pitch & Ideia**;
  - Quantidade de cards em **02. Avaliação Técnica & Valor**;
  - Quantidade de cards em **03. Backlog & Priorização**;
  - **ID do Administrador logado** responsável por abrir a votação.
- **Página `Sessões` (Visualização de Resultados):**
  - **Área de Filtro:** Filtro por **data da sessão** (data específica, intervalo `De`/`Até`, atalhos rápidos `Todas as datas`, `Hoje`, `7 dias`, `30 dias` e filtro por status `Aberta`/`Fechada`).
  - **Lista Consolidada de Sessões:** Exibe data da sessão, nomes dos participantes presentes (com contagem de presentes/ausentes), hora de início, hora de término, duração em minutos, quantidade e **links clicáveis por ID** das **ideias novas**, **ideias votadas**, **ideias avaliadas** e **ideias promovidas para Backlog**.
  - **Expansão de Detalhes:** Exibe ID da sessão, ID do administrador responsável, snapshot inicial de cards (`01. Ideia`, `02. Avaliação`, `03. Backlog`) e relação completa com IDs de participantes presentes e ausentes.
- **Atores Envolvidos:** `ADMIN`, `FACILITATOR`, `MEMBER`, `VIEWER` (consulta); criação automática disparada por `ADMIN` em **Abrir Votação**.
- **Regras de Negócio:**
  - `RN-09.1`: Clicar em qualquer link de ID de ideia na lista de sessões abre imediatamente o cartão correspondente para inspeção na gaveta de detalhes.
  - `RN-09.2`: Novas ideias criadas, ideias votadas com `Voto +1`, ideias movidas para `Avaliação` e ideias promovidas para `Backlog` durante a sessão ativa são associadas automaticamente ao registro da sessão em tempo real.

#### `[RF-10]` Sistema de Emblemas de Contribuição (Badges)
- **Descrição Funcional:** Concede e exibe automaticamente **5 emblemas de contribuição** ao lado do nome de cada participante em todas as listas de usuários da plataforma (**Diretório de Participantes** em *Usuários*, popover interativo **Participantes da Sessão** no cabeçalho superior — acessível a todos os perfis —, listas de **Presentes/Ausentes** em *Sessões*, tabela de **Ranking** e menu da conta):
  1. **`Top Proposer`** — Líder em iniciativas propostas ou 4+ ideias cadastradas no painel.
  2. **`Avaliador Ativo`** — 2+ ações combinadas entre pins aplicados e lideranças técnicas refinadas.
  3. **`Arquiteto de Backlog`** — 1+ iniciativa aprovada no gate `3/3` e promovida ao Backlog.
  4. **`Ideia em Destaque`** — Ideia autoral eleita no Top 5 ou com 2+ votos/apoios recebidos de colegas.
  5. **`Guardião de Sessão`** — Conduziu sessão de inovação ou participou de 2+ sessões registradas.
- **Atores Envolvidos:** `ADMIN`, `FACILITATOR`, `MEMBER`, `VIEWER`.
- **Regras de Negócio:**
  - `RN-10.1`: Os emblemas são calculados dinamicamente em tempo real exclusivamente a partir de atividades reais registradas no painel (cartões, pins, refinamentos e sessões), sem atribuição manual arbitrária.
  - `RN-10.2`: Cada emblema exibe *tooltip* descritivo com a métrica exata que motivou a conquista.

#### `[RF-11]` Página de Ranking & Pontuação (`Ranking`)
- **Descrição Funcional:** Página dedicada de gamificação corporativa ponderada por qualidade e impacto técnico, acessível via aba **Ranking** no cabeçalho e atalho no popover de participantes:
  - **KPIs do Ciclo:** Total de pontos acumulados, iniciativas, aprovações no Backlog, emblemas conquistados e posição atual do participante logado (`#Pos · X pts`).
  - **Filtros e Recortes:** Período (*Histórico geral*, *Trimestre 90d*, *Últimos 30 dias*, *Sessão atual*), Especialidade técnica, alternância entre visão **Individual** e **Por Especialidade**, e opção **Incluir Observadores**.
  - **Destaques Top 3 e Tabela Auditável:** Cards de destaque para os 3 maiores contribuidores do período e tabela completa com expansão de linha exibindo o **extrato auditável de pontuação** por regra e **links clicáveis por ID** para abrir os cards que originaram os pontos.
  - **Progresso de Emblemas e Regras Oficiais:** Painel lateral **Seu Progresso de Emblemas** com percentual global e barras de progresso individuais para desbloquear cada um dos 5 emblemas, acompanhado da **Tabela Oficial de Pontuação**:
    - `+30 pts`: Iniciativa promovida ao Backlog (gate `3/3`, crédito ao autor e ao Líder Técnico);
    - `+20 pts`: Ideia eleita no Top 5 da sessão (apuração oficial);
    - `+15 pts`: Ideia avançou para Avaliação Técnica;
    - `+15 pts`: Refinamento técnico completo (`3/3`);
    - `+10 pts`: Nova iniciativa qualificada (com Dor/Oportunidade e Solução Proposta preenchidas);
    - `+5 pts`: Voto `+1` ou apoio positivo recebido de colega;
    - `+5 pts`: Participação ou condução de sessão de inovação;
    - `+2 pts`: Pin de avaliação ou voto aplicado.
- **Atores Envolvidos:** `ADMIN`, `FACILITATOR`, `MEMBER`, `VIEWER` (consulta).
- **Regras de Negócio:**
  - `RN-11.1` *(Proteção anti-abuso)*: Cartões sem *Dor/Oportunidade* e *Solução Proposta* não pontuam como iniciativa qualificada; auto-pins do próprio autor não geram pontos de apoio recebido; pins aplicados possuem teto de `+10 pts` por sessão (`5 pins × 2 pts`).
  - `RN-11.2`: Participantes com perfil `VIEWER` são excluídos por padrão do placar competitivo para evitar distorção, podendo ser incluídos opcionalmente via filtro.
  - `RN-11.3`: Toda pontuação exibida é integralmente auditável mediante expansão da linha do participante e abertura direta dos cards relacionados.

---

## 6. Diretrizes de Interface e Experiência (UX/UI)

- **Identidade e Marca:** Título padronizado como **Innovation Board** no cabeçalho superior, tela de autenticação e metadados HTML.
- **Estética Editorial (Agile Deck · OG1 TI):**
  - **Superfície Principal:** Fundo do board em branco puro (`#ffffff`), colunas com bordas hairline (`#dbd6d1`) e superfícies neutras quentes (`#f7f3f1`, `#fbf9f7`).
  - **Cor de Destaque:** Azul OG1 (`#0b41cd`) para ações primárias, navegação ativa, foco, pontuação e `Voto +1`.
  - **Semântica de Status:** Verde petróleo (`#0f766e`) para votação aberta, presença, emblemas desbloqueados e prontidão `3/3`; vermelho (`#ff1f26`) para bloqueios da trava de qualidade, votação fechada e ações destrutivas.
  - **Tipografia:** `Outfit` para títulos editoriais, `Plus Jakarta Sans` para leitura densa e `JetBrains Mono` (`tabular-nums`) para IDs, datas, horários, durações, pontuações, percentuais, contadores e hashes.
  - **Navegação em 2 Níveis:** Barra global superior (`Painel`, `Matriz`, `Sessões`, `Ranking`, `Auditoria`, `Usuários`, popover interativo de presença/participantes ao vivo, menu de conta com emblemas e CTA `Nova ideia`) + sub-barra contextual no Painel e na Matriz.

---

## 7. Matriz de Permissões (RBAC)

| Capacidade / Funcionalidade | `ADMIN` | `FACILITATOR` | `MEMBER` | `VIEWER` |
| --- | :---: | :---: | :---: | :---: |
| Visualizar Painel, Matriz, Sessões, Ranking, Emblemas, Cartões, Pins e Cursores ao vivo | Sim | Sim | Sim | Sim |
| Criar novos cartões de ideia (Gaveta com rascunho local ou Clique direto inline no board) | Sim | Sim | Sim | Não |
| Editar / Excluir qualquer cartão (com salvamento automático no editor) | Sim | Sim | Somente próprios | Não |
| Mover cartões entre Pitch, Avaliação e na Matriz | Sim | Sim | Sim | Não |
| Promover cartão ao Backlog (sujeito à Trava de Qualidade `3/3`) | Sim | Sim | Não | Não |
| Anexar / Substituir / Remover Pins (sujeito às regras de `Voto +1`) | Sim | Sim | Sim | Não |
| Exportar Tops 5 Ideias em `CSV` ou `PDF` | Sim | Sim | Sim | Sim |
| Comandos Admin (`Abrir/Fechar Votação`, `Apurar Votos`, `Mover Ideias Top 5 → Avaliação Técnica`) | Sim | Não | Não | Não |
| Consultar Trilha de Auditoria e Diff (`Antes × Depois`) | Sim | Sim | Não | Não |
| Gerenciar Usuários e executar Carga Inicial em Lote (`JSON`/`CSV`) | Sim | Não | Não | Não |

---

## 8. Critérios de Aceitação

1. **Autenticação e Unificação:** Usuário pré-cadastrado como `FACILITATOR` que faz login federado com o mesmo e-mail vincula a conta sem duplicação e preserva o papel.
2. **Carga Idempotente e Atômica:** Reexecutar carga `JSON`/`CSV` preserva senhas alteradas pelo usuário (`RN-02.2`); qualquer erro de validação aborta todo o lote (`RN-02.3`).
3. **Criação Inline e Layout 2×2 por Coluna:** Clicar em área vazia de `01. Pitch & Ideia` gera um card editável inline com Título e Descrição; os cards são distribuídos em 2 por linha por coluna com animações táteis ao criar ou mover entre etapas.
4. **Salvamento Automático com Debounce:** Editar campos de um card existente salva automaticamente após `900 ms` sem gerar toasts repetitivos e realiza *flush* ao fechar a gaveta; criar uma nova ideia salva rascunho local após `500 ms`, restaura ao reabrir e oferece **Descartar rascunho**.
5. **Regras de Votação por Pin (`Voto +1`):** `Voto +1` é bloqueado com votação fechada (`RN-07.1`), limitado a 1 único card por usuário por sessão aberta (`RN-07.2`), e o botão `Pin` permanece sempre ativo permitindo substituição direta com validação prévia (`RN-07.3`).
6. **Rodapé Admin e Exportação:** Comandos Admin (**Abrir Votação**, **Fechar Votação**, **Apurar Votos** e **Mover Ideias Top 5 → Avaliação Técnica**) operam o ciclo de votação em tempo real; `Tops 5 Ideias` reflete exclusivamente `Voto +1` e exporta corretamente para `.csv` e `.pdf`.
7. **Registro e Página de Sessões:** Acionar **Abrir Votação** grava data, IDs de presentes e ausentes, contagem de cards por etapa e ID do administrador; a página **Sessões** filtra por data e exibe duração, participantes (com emblemas) e links clicáveis por ID para ideias novas, votadas, avaliadas e promovidas ao Backlog.
8. **Emblemas de Contribuição e Página Ranking:** Emblemas reais aparecem ao lado do nome dos participantes no Diretório, no popover de presença, em Sessões e em Ranking; a página **Ranking** aplica filtros de período/especialidade, alterna entre Individual e Por Especialidade, exibe extrato expansível com links para cards e acompanha o progresso individual dos 5 emblemas.
9. **Trava de Qualidade do Backlog:** Arrastar cartão `< 3/3` para `03. Backlog & Priorização` devolve o cartão à etapa anterior com alerta dos campos faltantes.
10. **Auditoria Imutável:** Todas as mutações gravam `beforeState` / `afterState` com integridade encadeada, acessíveis apenas a `ADMIN` e `FACILITATOR`.
