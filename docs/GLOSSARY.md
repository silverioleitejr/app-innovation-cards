# GLOSSARY — Innovation Board

> **Documento:** GLOSSARY.md  
> **Autor:** Silverio Leite Jr · Senior Solution Architect · OG1 TI  
> **E-mail:** silverio.leitejr@og1.com.br · **Telefone:** (11) 96020-6334  
> **Versão:** 0.1.0  
> **Data:** 2026-11-22  
> **Status:** Ativo  

> **Uso:** linguagem de domínio compartilhada por PRD, SAD, specs, testes e código. Todos os nomes de domínio, rótulos de interface e contratos de API seguem este glossário.

| Termo | Definição | Sinônimos a evitar |
|-------|-----------|--------------------|
| **Innovation Board** | Aplicação colaborativa em tempo real para condução de sessões de inovação em Dados, Analytics e IA, estruturada em funil de 3 etapas, Matriz 2×2, votação por sessão e auditoria imutável. | Quadro branco genérico, lousa, mural |
| **Funil de Inovação** | Fluxo oficial de maturidade das iniciativas no Painel composto por 3 etapas sequenciais: `01. Pitch & Ideia` (`PITCH`), `02. Avaliação Técnica & Valor` (`EVALUATION`) e `03. Backlog & Priorização` (`BACKLOG`). | Pipeline genérico, workflow de 4 colunas |
| **Cartão de Ideia** (`IdeaCard`) | Unidade de trabalho do painel que representa uma proposta de inovação, estruturada em Seção 1 (Dados do Pitch) e Seção 2 (Refinamento Técnico & Arquitetural). | Post-it, ticket, tarefa |
| **Card Inline** | Cartão editável criado diretamente ao clicar em uma área vazia das colunas `Pitch & Ideia` ou `Avaliação Técnica & Valor`, permitindo digitação imediata de Título e Descrição sem abrir modal. | Formulário popup, rascunho solto |
| **Pitch & Ideia** (`PITCH`) | Etapa `01` do funil onde as propostas são registradas inicialmente e submetidas à votação da equipe durante a sessão. | Caixa de entrada, rascunhos, brainstorm |
| **Avaliação Técnica & Valor** (`EVALUATION`) | Etapa `02` do funil onde as iniciativas selecionadas são posicionadas na Matriz Esforço × Benefício e passam pelo refinamento técnico (`0/3` a `3/3`). | Triagem, análise pendente, refinamento técnico (etapa removida) |
| **Backlog & Priorização** (`BACKLOG`) | Etapa `03` do funil reservada exclusivamente a iniciativas aprovadas pela Trava de Qualidade (`3/3`) e prontas para execução. | Fila geral, lista de desejos |
| **Matriz Esforço × Benefício** | Página dedicada (`Matriz`) que posiciona os cartões em `EVALUATION` em coordenadas espaciais contínuas `(posX, posY)` nos 4 quadrantes: *Ganhos Rápidos (Quick Wins)*, *Projetos Estruturantes*, *Melhorias Contínuas* e *Icebox*. | Gráfico de pontos, quadrante simples |
| **Trava de Qualidade** (`Quality Gate`) | Regra obrigatória (`RN-05.1`) que bloqueia a promoção de um cartão ao Backlog enquanto não estiverem preenchidos os 3 critérios: *Arquitetura e Solução Técnica*, *Critérios de Sucesso do MVP* e *Líder Técnico Responsável*. | Checklist opcional, validação visual |
| **Disciplina / Especialidade** | Classificação técnica da iniciativa e do participante entre 4 categorias oficiais: `Engenharia de Dados`, `Analytics / BI`, `IA / GenAI` e `Governança / FinOps`. | Departamento, squad, tag livre |
| **Estimativa de Esforço** | Dimensionamento relativo inicial da iniciativa em escala de camisetas: `P` (1–2 sem), `M` (3–4 sem), `G` (1–2 meses) e `XG` (3m+). | Story points, horas exatas |
| **Pin** | Marcador interativo anexado por um participante a um Cartão de Ideia (máximo de 1 pin por usuário por cartão), podendo ser o pin oficial de votação (`Voto +1`) ou um dos 4 pins de reação (`Aplauso`, `Dedo positivo`, `Dedo negativo`, `Coração`). | Emoji solto, curtida múltipla, selo |
| **Voto +1** (`vote_plus`) | Pin oficial de votação que contabiliza para o ranking **Tops 5 Ideias**. Só pode ser aplicado, substituído ou removido com status **Votação Aberta** e é limitado a **1 único card por participante por sessão**. | Voto livre, ponto extra, reação |
| **Pin de Reação** | Qualquer um dos 4 pins não contabilizados no ranking oficial (`Aplauso`, `Dedo positivo`, `Dedo negativo`, `Coração`), utilizáveis livremente independentemente de a votação estar aberta ou fechada. | Voto secundário, voto oficial |
| **Sessão de Inovação / Votação** (`VotingSessionRecord`) | Registro formal de uma reunião/rodada de votação criado ao acionar **Abrir Votação**, armazenando data da sessão, horário de início/término, duração em minutos, ID do administrador responsável, IDs de participantes presentes e ausentes, contagem inicial de cards por etapa e links das ideias novas, votadas, avaliadas e promovidas ao Backlog. | Rodada informal, turno, sala |
| **Participante Presente** | Usuário ativo cadastrado que estava conectado em tempo real (WebSocket) ou com sessão autenticada ativa no momento em que o Administrador acionou **Abrir Votação** (incluindo o próprio Administrador). | Convidado, visualizador anônimo |
| **Participante Ausente** | Usuário ativo cadastrado no diretório da plataforma que não estava logado no momento da abertura da sessão. | Usuário inativo, removido |
| **Comandos Admin** | Conjunto de 4 ações administrativas fixadas no rodapé do Painel exclusivas do perfil `ADMIN`: **Abrir Votação**, **Fechar Votação**, **Apurar Votos** e **Mover Eleitos Avaliação**. | Barra de ferramentas, menu de contexto |
| **Tops 5 Ideias** | Ranking das 5 iniciativas com maior quantidade de pins **`Voto +1`** na sessão, exibido no rodapé fixo do Painel e exportável em `.csv` ou `.pdf`. | Favoritos, mais curtidas |
| **Papel de Acesso (RBAC)** | Perfil de governança atribuído a cada usuário: `ADMIN` (Administrador), `FACILITATOR` (Facilitador), `MEMBER` (Membro Colaborador) e `VIEWER` (Observador). | Nível de conta, cargo |
| **Carga Inicial Idempotente** | Importação em lote (`JSON` ou `CSV`) de usuários executada pelo `ADMIN` com validação atômica tudo-ou-nada, criação de novos registros, atualização dos existentes e preservação obrigatória de senhas já alteradas pelos usuários. | Upload simples, sobrescrita de base |
| **Unificação de Conta Federada** | Vínculo automático de um login SSO (`Microsoft Entra ID` ou `Google Workspace`) a uma conta interna pré-existente que possua o mesmo e-mail normalizado, preservando papel e atributos sem duplicar usuários. | Conta espelho, login separado |
| **Trilha de Auditoria Imutável** | Histórico *append-only* encadeado por hash SHA-256 (`audit_logs`) que registra atomicamente o estado anterior (`beforeState`) e posterior (`afterState`) de todas as operações relevantes, acessível apenas a `ADMIN` e `FACILITATOR`. | Log de console, histórico editável |
| **Presença ao Vivo e Cursores Efêmeros** | Indicação em tempo real dos participantes conectados na barra superior e movimentação simultânea de cursores identificados por nome e cor, transmitidos apenas via WebSocket sem persistência em banco. | Rastreamento permanente, log de cliques |
