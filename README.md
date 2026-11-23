<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/dafe8179-dec9-4c37-8401-502750b21258

## Run Locally

**Prerequisites:** Node.js (v22 or superior) and `tsx` (v4.x)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the `.env.example` file and set your Gemini API key:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and set:

```env
GEMINI_API_KEY=sua-chave-da-google-ai-studio
APP_URL=http://localhost:3000
```

**Note:** The AI Studio automatically injects `GEMINI_API_KEY` at runtime from user secrets. If you're running locally, you need to provide it in the `.env.local` file.

### 3. Initialize the Database and Seed Data

The application automatically initializes the SQLite database on first run. The following seed functions are executed:

- `seedInitialData()` - Carga inicial de usuários e cartões
- `seedInitialPinsIfEmpty()` - Pins iniciais se não existirem
- `seedAdditionalPitchCardsOnce()` - Cartões adicionais de pitch

### 4. Run the Application

```bash
npm run dev
```

This starts the development server with:
- **Vite** dev server on port `3000`
- **Express** API on port `3000`
- **WebSocket** server on `/ws` endpoint
- **Vite middleware** for HMR and SPA serving

The console will show when the server is ready.

### 4. Access the Application

Once the server is running, access:

- **Frontend (SPA):** http://localhost:3000
  - Innovation Board collaborative board
  - Login, auto-register, or federated login
  
- **Health Check:** http://localhost:3000/api/health
  - Returns `{ "status": "ok" }` if the server is running correctly
  
- **API Base:** http://localhost:3000/api/*
  - All REST API endpoints
  
- **WebSocket:** ws://localhost:3000/ws
  - Real-time collaboration (presence, cursors, card mutations)
  
- **AI Studio:** https://ai.studio/apps/dafe8179-dec9-4c37-8401-502750b21258
  - View and manage the app in Google AI Studio

### 5. Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (Vite + Express + WS) |
| `npm run start` | Start production server (node server.js) |
| `npm run build` | Build for production (`vite build`) |
| `npm run preview` | Preview production build |
| `npm run lint` | Run TypeScript typecheck (`tsc --noEmit`) |
| `npm run test` | Run tests (configured in package.json) |

### 6. Project Structure

```
C:\@projetos\app-innovation-cards/
├─ .env.example          # Environment variables template
├─ .gitignore
├─ index.html
├─ metadata.json
├─ package.json
├─ PRD.md                # Product Requirements Document
├─ README.md             # This file
├─ SAD.md                # Architecture & Stack decisions
├─ server.ts             # Main Express + WebSocket server
├─ src/
│  ├─ App.tsx           # App orchestration + optimistic updates
│  ├─ components/       # React UI components
│  ├─ hooks/            # Custom React hooks (useRealtimeBoard, api.ts)
│  └─ lib/              # Utility functions (api.ts, exportTopIdeas.ts)
├─ data/                 # SQLite database (innovation-board.db)
├─ bun.lock
├─ tsconfig.json
└─ vite.config.ts
```

### 7. Development Flow

Following **Spec-Driven Development (SDD)**:

1. **Explore**: Check `TO-DO.md` for current tasks and SDD package status
2. **Plan**: Review `PRD.md` for requirements, `GUIDELINE.md` for methodology
3. **Execute**: Implement features following the `AGENTS.md` operational contract
4. **Verify**: Run `npm run lint` and `npm run test`
5. **Deliver**: Update `TO-DO.md` and create PR with Conventional Commits

### 8. Access Credentials

- **Demo accounts** are automatically seeded on first run
- **Login**: Use the auth screen or federated login (Microsoft Entra ID, Google Workspace)
- **Auto-registration**: New users receive default `MEMBER` role on first login

### 9. Server Architecture

The application uses a **monolithic modular full-stack** architecture on a single process (port 3000):

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 1. Apresentação (React SPA)                                       │
│    BoardFunnelView, MatrixCanvasView, SessionsView, UsersAdminView    │
├────────────────────────────────────────────────────────────────────────────┤
│ 2. Estado, Tempo Real e Cliente HTTP                               │
│    App.tsx, useRealtimeBoard.ts, api.ts                             │
├────────────────────────────────────────────────────────────────────────────┤
│ 3. Aplicação, Domínio e API                                       │
│    server.ts, types.ts                                              │
│    RBAC, Motor de Regras, Votação, Snapshot de Sessões              │
├────────────────────────────────────────────────────────────────────────────┤
│ 4. Persistência e Auditoria                                       │
│    server/db.ts — SQLite ACID                                       │
│    users, sessions, cards, card_pins, board_voting_state             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

**Dúvidas?** Consulte `SAD.md` (arquitetura), `PRD.md` (requisitos) e `GUIDELINE.md` (metodologia).