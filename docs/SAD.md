# SAD — Innovation Board

> **Documento:** SAD.md  
> **Autor:** Silverio Leite Jr · Senior Solution Architect · OG1 TI  
> **E-mail:** silverio.leitejr@og1.com.br · **Telefone:** (11) 96020-6334  
> **Versão:** 1.1.0  
> **Data:** 2026-11-25  
> **Status:** Implementado  

> **Documentos Relacionados:** `PRD.md` · `GLOSSARY.md`

---

## 1. Stack Tecnológica

### 1.1 Serviços para Inicialização (Seção de Inicialização)

Esta seção define quais serviços devem ser iniciados automaticamente via skill `sdd-app-start`. Cada serviço inclui o comando de inicialização e as portas associadas.

| # | Serviço | Comando de Inicialização | Porta Padrão | Dependências |
|---|---------|-------------------------|--------------|--------------|
| 1 | **Servidor Node.js + Express** | `npx tsx server.ts` ou `npm run dev` | 3000 | `db/` (raiz), `src/`, `server.ts` |
| 2 | **Banco de Dados SQLite** | `db/db.ts` (auto-inicializa na abertura) | N/A (embarcado) | Arquivo `innovation-board.db` em `db/` |
| 3 | **WebSocket Server** | Iniciado junto com o servidor Express (porta 3000) | 3000 (ws://localhost:3000/ws) | Servidor Express ativo |

## 1.2 Como Inicializar os Serviços

Para iniciar todos os serviços definidos, execute os passos abaixo em ordem:

### Passo 1: Instalar Dependências (se necessário)

```bash
npm install
```

### Passo 2: Iniciar o Servidor Node.js

```bash
# Método recomendado (TypeScript via tsx)
npx tsx server.ts

# Ou via npm script (se definido no package.json)
npm run dev
```

O servidor iniciará na porta **3000** e fornecerá:
- API REST em `http://localhost:3000/api/*`
- WebSocket em `ws://localhost:3000/ws`
- Healthcheck em `http://localhost:3000/api/health`

### Passo 3: Verificar Disponibilidade dos Serviços

Após iniciar o servidor, verifique:

1. **Ping de porta:** Conexão TCP bem-sucedida na porta 3000
2. **Healthcheck:** Requisição `GET http://localhost:3000/api/health` deve retornar JSON com status OK
3. **Banco de Dados:** Arquivo `db/innovation-board.db` deve existir e conter as tabelas esperadas (usuarios, sessions, cards, etc.)

### Passo 4: URLs de Entrada da Aplicação

Assim que todos os serviços estiverem disponíveis, a aplicação estará acessível em:

- **Aplicação HTTP:** http://localhost:3000
- **WebSocket:** ws://localhost:3000/ws
- **Healthcheck:** http://localhost:3000/api/health

### Passo 5: Verificação Opcional com Skill sdd-app-start

A skill `sdd-app-start` pode ser acionada para validar automaticamente a inicialização:

```text
skill id="sdd-app-start"
```

A skill lerá o `SAD.md`, tentará iniciar os serviços e emitirá um relatório detalhado com status, erros e propostas de resolução.

## 1.3 Stack Tecnológica (existente)

### 1.2 Stack Tecnológica (existente)

| Camada | Tecnologia / Biblioteca | Versão Alvo | Papel na Arquitetura |
| --- | --- | --- | --- |
| **Runtime** | Node.js (ESM + TypeScript via `tsx`) | Node 22 / `tsx` 4.x | Execução unificada da API HTTP, servidor WebSocket e middleware Vite |
| **Frontend UI** | React + TypeScript | React 19 / TS 7.x | SPA reativa com tipagem forte compartilhada com o backend (`src/types.ts`) |
| **Bundler / Dev Server** | Vite (integrado em `middlewareMode`) | Vite 8.x | Compilação de produção (`dist/`) e serviço de módulos em desenvolvimento na porta `3000` |
| **Estilização** | Tailwind CSS v4 (`@tailwindcss/vite`) | Tailwind 4.x | Design System editorial **Agile Deck (OG1 TI)** com tokens semânticos em `src/index.css` |
| **Animações e Ícones** | Motion (`motion/react`) + `lucide-react` | Motion 12.x | Animações táteis de entrada, saída e reposicionamento de cartões (`AnimatePresence`, `LayoutGroup`) |
| **Exportação de Relatórios** | `jspdf` + gerador CSV UTF-8 BOM | jsPDF 4.x | Geração client-side de relatórios executivos `.pdf` (A4) e planilhas `.csv` dos Top 5 |
| **Backend HTTP** | Express | Express 4.x | API REST autenticada (`/api/*`), controle RBAC, validações de domínio e transações |
| **Tempo Real** | `ws` (`WebSocketServer` em `/ws`) | ws 8.x | Broadcast de presença, cursores efêmeros, mutações de cartões, pins e estado de votação/sessões |
| **Persistência & ORM Adapter** | Kysely (`kysely`) + SQLite (`better-sqlite3`) / PostgreSQL (`pg`) | `kysely` 0.29.x / `better-sqlite3` 13.x / `pg` 8.x | Adapter multi-dialeto controlado por `APP_ENV`: `DEV` usa SQLite local (`db/innovation-board.db` via `SqliteDialect`) e `PRD` usa PostgreSQL (`PostgresDialect`) |

---

## 2. Arquitetura em Camadas

A aplicação adota uma arquitetura **monolítica modular full-stack** servida por um único processo Node.js na porta `3000`, separada em 4 camadas bem definidas:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 1. Camada de Apresentação (React SPA — src/components/*)                   │
│    BoardFunnelView · MatrixCanvasView · SessionsView · RankingView         │
│    AuditTrailView · UsersAdminView · UserBadgeList · CardDrawer (Autosave) │
│    CardPinsBar · AuthScreen · PasswordModal                                │
├────────────────────────────────────────────────────────────────────────────┤
│ 2. Camada de Estado, Tempo Real, Gamificação e HTTP (src/hooks/*, lib/*)   │
│    App.tsx (orquestração, updates otimistas com rollback, save silencioso) │
│    useRealtimeBoard.ts (WebSocket /ws com reconexão exponencial)           │
│    badges.ts (motor determinístico de pontuação, emblemas e progresso)     │
│    api.ts (fetch autenticado Bearer) · exportTopIdeas.ts (CSV / PDF)       │
├────────────────────────────────────────────────────────────────────────────┤
│ 3. Camada de Aplicação, Domínio e API (server.ts + src/types.ts)           │
│    Autenticação/Sessões · Middleware RBAC · Trava de Qualidade (Backlog)   │
│    Motor de Regras de Votação (a/b/c/d) · Snapshot de Sessões · WS Hub     │
├────────────────────────────────────────────────────────────────────────────┤
│ 4. Camada de Persistência e Auditoria (server/db.ts — SQLite ACID)         │
│    users · sessions · cards · card_pins · board_voting_state               │
│    voting_sessions · audit_logs (append-only com hash SHA-256 encadeado)   │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Responsabilidades por Camada
1. **Apresentação (`src/components/`):** Componentes funcionais desacoplados focados em renderização, acessibilidade, feedback imediato e validação preventiva na UI (ex.: pré-validação de `Voto +1`, trava de qualidade `3/3`, salvamento automático no `CardDrawer`, exibição de emblemas via `UserBadgeList` e visualização de placar/progresso em `RankingView`).
2. **Orquestração, Sincronização e Motor Analítico Client-Side (`src/App.tsx`, `src/hooks/useRealtimeBoard.ts`, `src/lib/badges.ts`, `src/lib/api.ts`):**
   - Mantém o estado reativo do workspace (`cards`, `users`, `votingState`, `presence`, `remoteCursors`) e o suporte a salvamento silencioso (`handleSaveCard(..., { silent: true })`) para o autosave.
   - Deriva em tempo real, via `src/lib/badges.ts` (`computeUserContributions`, `buildParticipantRanking`, `buildDisciplineStandings`), os **5 emblemas de contribuição**, a **pontuação ponderada por qualidade** (com filtros de período, especialidade e proteções anti-abuso) e as **barras de progresso de emblemas** diretamente do estado sincronizado do servidor.
   - Aplica atualizações otimistas com *rollback* imediato quando o servidor rejeita uma transição (ex.: `422 QUALITY_GATE_BLOCKED`, `423 VOTING_CLOSED`, `409 VOTE_SESSION_LIMIT_REACHED`).
   - Reconcilia eventos recebidos via `/ws` (`card:created`, `card:updated`, `card:moved`, `card:deleted`, `cards:sync`, `voting:updated`, `users:updated`, `presence:update`, `cursor:move`).
3. **Aplicação e Domínio (`server.ts`, `src/types.ts`):**
   - **Fonte única de verdade (server-authoritative):** todas as regras de negócio (`RBAC`, trava de qualidade `3/3`, limite de 1 `Voto +1` por sessão, abertura/fechamento de sessão, carga atômica de usuários) são revalidadas no servidor.
   - **Contratos compartilhados (`src/types.ts`):** tipos de domínio e funções puras (`validateBacklogGate`, `computeTopVotedIdeas`, `getMatrixQuadrant`) são reutilizados entre cliente e servidor para evitar divergência de regras.
4. **Persistência (`server/db.ts`):**
   - Gerencia schema, migrações idempotentes via `PRAGMA table_info`, seeds iniciais não destrutivos e transações síncronas ACID (`db.transaction(...)`).
   - Garante atomicidade entre cada operação de negócio e o correspondente registro em `audit_logs`.

### 2.2 Modelo de Dados Principal (SQLite)
- **`users`**: cadastro de participantes (`id`, `email` único normalizado, `passwordHash`, `passwordSalt`, `passwordChangedByUser`, `role`, `specialty`, `cursorColor`, `active`, `federatedProvider`, `federatedSub`).
- **`sessions`**: tokens de autenticação Bearer (`token`, `userId`, `createdAt`, `expiresAt`).
- **`cards`**: iniciativas do funil (`id`, dados de Pitch, dados de Refinamento Técnico, `stage` em `PITCH | EVALUATION | BACKLOG`, coordenadas `posX/posY`, `version`, `authorId`).
- **`card_pins`**: pins anexados aos cartões com chave primária composta `(cardId, userId)` garantindo 1 pin por usuário por cartão, além de `votingSessionId` para vincular `Voto +1` à sessão ativa.
- **`board_voting_state`**: estado singleton (`default`) indicando `votingOpen`, `currentSessionId`, `talliedAt` e snapshot `topIdeasJson`.
- **`voting_sessions`**: histórico completo de cada sessão de inovação (`id`, `sessionNumber`, `sessionDate`, `status`, `openedById`, `openedBy`, `openedAt`, `closedBy`, `closedAt`, `totalVotes`, `presentUserIdsJson`, `absentUserIdsJson`, `initialPitchCount`, `initialEvaluationCount`, `initialBacklogCount`, `newCardIdsJson`, `votedCardIdsJson`, `evaluatedCardIdsJson`, `backlogCardIdsJson`, `topIdeasJson`, `movedCardTitlesJson`).
- **`audit_logs`**: tabela *append-only* contendo ator, ação, entidade, snapshots JSON `beforeState` / `afterState` e `integrityHash` encadeado via SHA-256.

---

## 3. Segurança

- **Autenticação e Armazenamento de Senhas:**
  - Senhas locais derivadas com `crypto.scryptSync` (64 bytes) e *salt* aleatório de 16 bytes por usuário; verificação em tempo constante via `crypto.timingSafeEqual`.
  - Tokens de sessão opacos de 256 bits (`crypto.randomBytes(32)`) com expiração de 7 dias, transmitidos via cabeçalho `Authorization: Bearer <token>` (REST) e *query string* autenticada na conexão WebSocket `/ws`.
  - Inativação de usuário revoga imediatamente todas as sessões ativas em `sessions`.
- **Autorização Baseada em Papéis (RBAC Server-Side):**
  - Middleware `requireAuth` protege todas as rotas `/api/*` (exceto login, auto-registro, login federado, demo accounts e `/api/health`).
  - Verificações explícitas de papel em cada endpoint: `VIEWER` bloqueado em qualquer escrita; `MEMBER` restrito a edição/exclusão de cartões próprios; `FACILITATOR` + `ADMIN` autorizados para promoção ao Backlog e consulta de Auditoria; `ADMIN` exclusivo para Gestão de Usuários, Carga em Lote e Comandos de Votação.
- **Integridade da Trilha de Auditoria:**
  - Nenhuma rota de `UPDATE` ou `DELETE` é exposta sobre `audit_logs`.
  - Cada novo evento calcula `integrityHash = SHA-256(previousHash + payload)`, criando uma cadeia verificável contra adulterações.
- **Proteção contra Injeção e Validação de Entrada:**
  - 100% das consultas SQL utilizam *prepared statements* parametrizados (`better-sqlite3`).
  - Renderização segura via React (sem injeção de HTML bruto).
  - Limite de payload JSON (`2mb`) no Express e validação estrita de domínios (`ROLES`, `SPECIALTIES`, `EFFORT_SIZES`, `PIN_TYPES`, formatos de e-mail e cores hexadecimais).

---

## 4. Integrações e Resiliência

### 4.1 Comunicação em Tempo Real e Reconexão
- **WebSocket Dedicado (`/ws`):** Montado sobre o mesmo `http.Server` do Express para funcionar transparentemente atrás de proxies reversos na porta `3000`.
- **Reconexão Resiliente:** O hook `useRealtimeBoard.ts` aplica *backoff* exponencial (1s até 15s) em caso de queda de conexão e dispara `onReconnected` para recarregar o estado completo (`cards`, `users`, `voting`) assim que o socket é restabelecido.
- **Isolamento do Vite em Desenvolvimento:** O middleware do Vite é inicializado com `{ middlewareMode: true, hmr: false, ws: false }` acompanhado do plugin inline `disable-vite-client-ws` em `server.ts`, que suprime a chamada automática `transport.connect(...)` de `/@vite/client`. Isso impede tentativas de conexão WebSocket na porta `24678` e elimina rejeições não tratadas no navegador, preservando integralmente o canal colaborativo `/ws` e o carregamento de estilos.

### 4.2 Resiliência de Persistência, Edição e Inicialização
- **Recuperação Automática de SQLite (`openDatabase` em `server/db.ts`):** Na inicialização, executa `PRAGMA busy_timeout = 5000` e `PRAGMA quick_check`. Em caso de corrupção de arquivo (`SQLITE_CORRUPT` após paradas abruptas de container), limpa arquivos corrompidos/residuais e recria automaticamente um banco íntegro com *seed* idempotente.
- **Modo de Journal Seguro para Containers:** Utiliza `PRAGMA journal_mode = DELETE` para eliminar dependências de memória compartilhada (`-shm`/`-wal`) sensíveis a hibernação de containers.
- **Migrações Idempotentes:** Colunas adicionadas evolutivamente (`votingSessionId`, `currentSessionId`, colunas de snapshot e atividades de `voting_sessions`) são verificadas via `PRAGMA table_info` antes de executar `ALTER TABLE`, garantindo compatibilidade com bancos existentes.
- **Resiliência contra Perda de Dados na Edição (`CardDrawer.tsx`):**
  - *Cartões existentes:* salvamento automático com debounce de **900 ms** via `PUT /api/cards/:id` em modo silencioso, controle de concorrência em voo (`autoSavingInFlightRef` + `pendingFollowUpRef` para enfileirar digitações durante requisições pendentes), proteção contra escrita após exclusão/desmontagem, pré-validação de regras obrigatórias, *flush* imediato ao fechar a gaveta e supressão de envio duplicado quando o snapshot atual já foi salvo.
  - *Novas ideias:* persistência automática de rascunho em `localStorage` com debounce de **500 ms** (chave isolada por usuário e etapa inicial), restauração transparente na reabertura, botão **Descartar rascunho** e limpeza após criação bem-sucedida.
- **Encerramento Limpo (Graceful Shutdown) e Healthcheck:** Handlers de `SIGTERM` e `SIGINT` fecham `wss`, `http.Server`, middleware Vite e conexão SQLite de forma ordenada; endpoint `GET /api/health` responde `{ "status": "ok" }` para monitoramento de disponibilidade.

### 4.3 Integrações Externas e Exportação
- **Identidade Federada (Fluxo de Unificação):** Endpoint `POST /api/auth/federated` implementa o contrato de vínculo por e-mail normalizado para provedores corporativos (`Microsoft Entra ID`, `Google Workspace`), pronto para acoplamento a tokens OIDC/SAML corporativos em produção.
- **Exportação Client-Side (`CSV` e `PDF`):** Executada integralmente no navegador (`src/lib/exportTopIdeas.ts`) sem dependência de serviços externos de renderização, garantindo baixa latência e zero risco de indisponibilidade.

---

## 5. Decisões Arquiteturais (ADRs)

### ADR-001 — Servidor Unificado Express + Vite Middleware + WebSocket na Porta 3000
- **Contexto:** O ambiente de execução expõe uma única porta HTTP/WS (`3000`) atrás de proxy reverso.
- **Decisão:** Servir a SPA React (via middleware Vite em dev e arquivos estáticos `dist/` em produção), a API REST `/api/*` e o WebSocket `/ws` no mesmo `http.Server`.
- **Consequência:** Elimina problemas de CORS, simplifica o deploy (`npm run build` + `node server.ts`) e garante compatibilidade total com iframes e proxies corporativos.

### ADR-002 — Persistência Dual com Adapter Kysely (`APP_ENV=DEV` em SQLite · `APP_ENV=PRD` em PostgreSQL)
- **Contexto:** O ambiente de desenvolvimento local exige zero configuração externa e mutações rápidas com SQLite embarcado (`better-sqlite3`), enquanto o ambiente produtivo/nuvem (`APP_ENV=PRD`) requer banco relacional gerenciado PostgreSQL (`pg.Pool`) configurado por variáveis de ambiente (`DATABASE_URL` ou `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`).
- **Decisão:** Adotar o **Kysely** (`Kysely<DatabaseSchema>` em `db/schema.ts` e `db/kysely.ts`) como adapter oficial multi-dialeto: quando `APP_ENV=DEV` (padrão), utiliza `SqliteDialect` sobre `db/innovation-board.db`; quando `APP_ENV=PRD`, exige configuração PostgreSQL (*fail-fast*), instancia `PostgresDialect` com `pg.Pool`, garante a criação idempotente das 7 tabelas no PostgreSQL, hidrata o estado inicial na subida e replica mutações parametrizadas para o PostgreSQL.
- **Consequência:** Mantém uma única definição tipada das 7 tabelas (`DatabaseSchema`), preserva compatibilidade total com `tsc --noEmit` e com as transações síncronas/auditoria em `DEV`, e habilita persistência PostgreSQL em `PRD` apenas alternando `APP_ENV` no `.env`.

### ADR-003 — Desabilitação Completa do WebSocket HMR do Vite (`hmr: false, ws: false` + Plugin `disable-vite-client-ws`)
- **Contexto:** No Vite 8 em `middlewareMode`, desabilitar apenas `hmr: false` ainda abria um servidor WebSocket auxiliar na porta `24678`, e mesmo com `ws: false` o script `/@vite/client` ainda tentava abrir uma conexão WebSocket para a porta `24678`, provocando rejeições não tratadas (`WebSocket closed without opened.`) no navegador.
- **Decisão:** Configurar `hmr: false` e `ws: false` em `createViteServer` combinados com um plugin leve de transformação (`disable-vite-client-ws`) que remove a chamada automática `transport.connect(...)` em `vite/dist/client/client.mjs`, mantendo exclusivamente o WebSocket da aplicação em `/ws`.
- **Consequência:** Inicialização limpa sem portas residuais, zero erros de console no cliente Vite e estabilidade total do canal colaborativo em tempo real.

### ADR-004 — Estado de Votação e Histórico de Sessões Persistidos no Servidor
- **Contexto:** As regras de votação (`Voto +1` somente com votação aberta, máximo 1 `Voto +1` por participante por sessão e registro de participantes presentes/ausentes e atividades por reunião) não podem depender apenas do estado local do cliente.
- **Decisão:** Centralizar a validação de pins e o ciclo de vida das sessões em `voting_sessions` e `board_voting_state` no servidor, sincronizando alterações via evento WebSocket `voting:updated` e `cards:sync`, complementados por pré-validação otimista no frontend.
- **Consequência:** Garante integridade mesmo sob acessos concorrentes de múltiplos participantes e mantém histórico confiável para a página **Sessões** e para a **Auditoria**.

### ADR-005 — Animações Táteis com Motion Preservando Drag & Drop Nativo
- **Contexto:** Cartões no funil precisam de animações suaves de entrada, saída e reposicionamento sem quebrar o Drag & Drop HTML5 entre colunas.
- **Decisão:** Utilizar `LayoutGroup` e `AnimatePresence mode="popLayout" initial={false}` envolvendo cada cartão em um container `motion.div` (`layout="position"`), mantendo o `<article draggable>` nativo no nível interno.
- **Consequência:** Evita conflito de eventos/tipos entre gestos de arraste do Motion e HTML5 Drag & Drop, mantendo transições fluídas sem piscar na carga inicial.

### ADR-006 — Salvamento Automático Híbrido no `CardDrawer` (Servidor para Edição · `localStorage` para Novos Rascunhos)
- **Contexto:** Durante o preenchimento de ideias longas e refinamentos arquiteturais, fechamentos acidentais ou recarregamentos podem causar perda de conteúdo; porém, persistir cartões ainda incompletos no servidor poluiria o painel compartilhado e a trilha de auditoria imutável.
- **Decisão:** Adotar estratégia em dois modos no `CardDrawer.tsx`: (a) para cartões já existentes, executar autosave silencioso com debounce de `900 ms` contra `PUT /api/cards/:id` com controle de concorrência e *flush* no fechamento; (b) para cartões novos, persistir o rascunho localmente em `localStorage` com debounce de `500 ms` por usuário e etapa, criando o registro no servidor apenas no envio explícito.
- **Consequência:** Elimina perda de dados durante escrita extensa mantendo o painel colaborativo e o log de auditoria livres de rascunhos inacabados.

### ADR-007 — Motor Determinístico Client-Side de Emblemas e Pontuação (`src/lib/badges.ts`)
- **Contexto:** Os emblemas de contribuição e o placar de **Ranking & Pontuação** precisam refletir instantaneamente toda criação de ideia, aplicação de pin, refinamento `3/3`, promoção ao Backlog e sessão registrada, além de suportar filtros interativos por período e especialidade com total auditabilidade.
- **Decisão:** Implementar um motor puro e determinístico em `src/lib/badges.ts` alimentado pelo estado autoritativo já sincronizado em tempo real (`users`, `cards`, `pins`, `votingState.sessions`), sem criar tabelas paralelas de pontuação sujeitas a dessincronização.
- **Consequência:** Zero sobrecarga de schema ou migração, atualização em tempo real (`< 50 ms` via `useMemo`) em todas as listas de participantes e garantia matemática de que cada ponto exibido corresponde diretamente aos cards e sessões auditáveis no banco.
