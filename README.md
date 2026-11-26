# Innovation Board

![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=0B1220)
![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-ws_8-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Motion](https://img.shields.io/badge/Motion-12-FFF312?style=for-the-badge&logo=framer&logoColor=0B1220)
![Lucide](https://img.shields.io/badge/Lucide-Icons-F56565?style=for-the-badge&logo=lucide&logoColor=white)
![jsPDF](https://img.shields.io/badge/jsPDF-4.2-EC1C24?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)
![Google GenAI](https://img.shields.io/badge/Google_GenAI-SDK-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)
![SDD](https://img.shields.io/badge/Metodologia-SDD-0B41CD?style=for-the-badge)

Aplicação colaborativa em tempo real para condução de sessões de inovação em **Dados, Analytics e IA**, desenvolvida sob a metodologia **Spec-Driven Development (SDD)**.

- **Repositório:** https://github.com/silverioleitejr/app-innovation-cards
- **Contrato Operacional SDD:** [AGENTS.md](./AGENTS.md) · [docs/GUIDELINE.md](./docs/GUIDELINE.md)
- **Identidade Visual:** [docs/DESIGN.md](./docs/DESIGN.md) · [docs/design-tokens.json](./docs/design-tokens.json)

---

## 1. Visão Geral das Funcionalidades

- **Funil Colaborativo em 3 Etapas (`Painel`):**
  1. `01. Pitch & Ideia` — Registro rápido (inclusive via *Card Inline* clicando diretamente na coluna) e votação da sessão.
  2. `02. Avaliação Técnica & Valor` — Indicador de prontidão (`0/3` a `3/3`) e atalho para a Matriz.
  3. `03. Backlog & Priorização` — Protegida pela **Trava de Qualidade (`3/3`)** (*Arquitetura e Solução Técnica*, *Critérios de Sucesso do MVP* e *Líder Técnico Responsável*).
- **Matriz Esforço × Benefício (`Matriz`):** Posicionamento espacial contínuo `(posX, posY)` em 4 quadrantes (*Ganhos Rápidos*, *Projetos Estruturantes*, *Melhorias Contínuas* e *Icebox*) com cursores remotos ao vivo.
- **Editor Estruturado com Salvamento Automático (`CardDrawer`):** Autosave silencioso no servidor (`900 ms`) para cartões existentes com *flush* ao fechar e rascunho local (`500 ms` em `localStorage`) para novas ideias.
- **Votação Controlada por Sessão e Pins (`Voto +1` + Reações):** Limite de 1 `Voto +1` por participante por sessão aberta, rodapé administrativo (`Abrir/Fechar Votação`, `Apurar Votos`, `Mover Ideias Top 5 → Avaliação Técnica`) e exportação das **Tops 5 Ideias** em `.csv` e `.pdf`.
- **Histórico de Sessões (`Sessões`):** Registro consolidado de data, início/término, duração, presentes/ausentes e links clicáveis por ID para ideias novas, votadas, avaliadas e promovidas ao Backlog.
- **Governança RBAC, Autenticação Híbrida e Auditoria (`Usuários` & `Auditoria`):** Perfis `ADMIN`, `FACILITATOR`, `MEMBER` e `VIEWER`, login local/auto-registro/SSO federado unificado por e-mail, carga em lote atômica (`JSON`/`CSV`) e trilha de auditoria *append-only* encadeada com `SHA-256`.

---

## 2. Stack Tecnológica e Identidade Visual

| Camada | Tecnologia | Papel |
|---|---|---|
| **Runtime & API** | Node.js 22 + Express 4 + `tsx` | Servidor HTTP unificado (`/api/*`) na porta `3000` |
| **Tempo Real** | `ws` (`/ws`) | Presença ao vivo, cursores efêmeros e sincronização de cards/votação |
| **Frontend SPA** | React 19 + TypeScript 7 + Vite 8 | Interface reativa em `middlewareMode` com animações `motion` |
| **Design System** | Tailwind CSS v4 + `docs/DESIGN.md` | Tokens extraídos via `sdd-extract-site-design` (`roche.com`), tipografia `Outfit`, `Plus Jakarta Sans` e `JetBrains Mono` (`tabular-nums`) |
| **Persistência** | SQLite (`better-sqlite3`) | Transações síncronas ACID em `db/db.ts` (`db/innovation-board.db`) |
| **Exportação** | `jspdf` + gerador CSV UTF-8 BOM | Relatórios executivos client-side do ranking Top 5 |

---

## 3. Como Executar Localmente

### Pré-requisitos
- **Node.js** `v22+` e **npm**

### Passo 1 — Instalar dependências

```bash
npm install
```

### Passo 2 — Configurar variáveis de ambiente (opcional)

Copie `.env.example` para `.env` caso necessário (nunca versione `.env`):

```bash
cp .env.example .env
```

### Passo 3 — Iniciar a aplicação

```bash
npm run dev
# ou diretamente:
npx tsx server.ts
```

Na primeira execução, o banco SQLite (`db/innovation-board.db`) é inicializado automaticamente com os *seeds* idempotentes de usuários de demonstração (senha inicial `og1@2026`), cartões e pins.

### Passo 4 — Acessar e validar

- **Aplicação Web:** http://localhost:3000
- **Healthcheck:** http://localhost:3000/api/health (`{"status":"ok"}`)
- **WebSocket:** `ws://localhost:3000/ws`

---

## 4. Scripts Disponíveis

| Script | Comando | Descrição |
|---|---|---|
| `npm run dev` | `tsx server.ts` | Inicia servidor unificado Express + Vite + WebSocket na porta `3000` |
| `npm run build` | `vite build` | Gera o bundle de produção do frontend em `dist/` |
| `npm run lint` | `tsc --noEmit` | Executa verificação global de tipos TypeScript (`0` erros) |
| `npm run start` | `node server.ts` | Executa o servidor em modo de produção |
| `npm run preview` | `vite preview` | Pré-visualiza o build estático gerado |

---

## 5. Estrutura do Projeto e Ordem de Leitura SDD

```text
app-innovation-cards/
├── AGENTS.md                        # Contrato operacional dos agentes (raiz)
├── docs/
│   ├── GUIDELINE.md                 # Metodologia SDD e Ordem de Leitura Canônica (§4)
│   ├── TO-DO.md                     # Matriz de rastreabilidade e status de pacotes/melhorias
│   ├── PRD.md                       # Escopo funcional aprovado (RF-01 a RF-11)
│   ├── SAD.md                       # Arquitetura em camadas, segurança e ADRs (ADR-001..007)
│   ├── ADR.md                       # Índice e registros operacionais de decisões
│   ├── DATABASE-PATTERN.md          # Convenções SQLite, auditoria e transações
│   ├── NAMING-CONVENTION.md         # Convenções de código, banco, branches e commits
│   ├── DESIGN.md                    # Identidade visual e tokens aplicados nas páginas
│   ├── design-tokens.json           # JSON bruto extraído via sdd-extract-site-design
│   ├── GLOSSARY.md                  # Vocabulário oficial de domínio
│   ├── templates/                   # Templates mestres SDD
│   ├── skills/                      # Fonte da verdade das skills SDD (sdd-*)
│   └── sdd/                         # Pacotes de especificação (NN-slug/)
├── .agents/
│   └── skills/                      # Skills publicadas para execução agêntica
├── db/
│   └── db.ts                        # Schema SQLite, migrações idempotentes e seeds
├── src/
│   ├── App.tsx                      # Orquestração de estado, presença e navegação global
│   ├── index.css                    # Variáveis CSS (:root / @theme) de DESIGN.md
│   ├── types.ts                     # Contratos de domínio compartilhados cliente/servidor
│   ├── components/                  # Páginas e modais (Auth, Painel, Matriz, Sessões, Auditoria, Usuários, Drawer)
│   ├── hooks/                       # WebSocket resiliente e hooks compartilhados de pins/voto
│   └── lib/                         # Cliente HTTP autenticado e exportação CSV/PDF
└── server.ts                        # API REST Express, RBAC, motor de votação e hub WebSocket
```

### Ordem de Leitura Canônica (`docs/GUIDELINE.md` §4)
1. `docs/GUIDELINE.md`
2. `AGENTS.md`
3. `docs/TO-DO.md`
4. `docs/PRD.md`
5. `docs/SAD.md`
6. `docs/ADR.md`
7. `docs/DATABASE-PATTERN.md`
8. `docs/NAMING-CONVENTION.md`
9. `docs/DESIGN.md`
10. `docs/sdd/NN-slug/` *(apoio de vocabulário sob demanda: `docs/GLOSSARY.md`)*

---

## 6. Principais Skills SDD Disponíveis

- **`sdd-workflow`:** coordenação das etapas SDD e verificação de gates de aprovação.
- **`sdd-structure-validator`:** auditoria somente-leitura da estrutura de pastas, fundação e pacotes.
- **`sdd-extract-site-design`:** extração determinística de tokens visuais (`extrair_design_tokens`) a partir de uma URL com consolidação em `docs/DESIGN.md`.
- **`sdd-app-start`:** inicialização e verificação automatizada dos serviços definidos em `docs/SAD.md`.
- **`sdd-planner-writer` / `sdd-testcase-writer` / `sdd-developer`:** planejamento técnico, especificação de casos de teste e implementação orientada a specs aprovadas.
