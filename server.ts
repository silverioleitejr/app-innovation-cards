import crypto from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import {
  appendAuditLog,
  appendSessionCardActivity,
  createNewVotingSession,
  db,
  getAllPinsByCard,
  getPinsForCard,
  getVotingSessions,
  getVotingState,
  hashPassword,
  normalizeEmail,
  saveVotingState,
  seedAdditionalPitchCardsOnce,
  seedInitialData,
  seedInitialPinsIfEmpty,
  serializeAudit,
  serializeCard,
  serializeUser,
  updateVotingSession,
  verifyPassword,
} from './db/db.ts';
import {
  computeTopVotedIdeas,
  EFFORT_SIZES,
  IMPLEMENTATION_MODELS,
  PIN_META,
  PIN_TYPES,
  ROLES,
  SPECIALTIES,
  validateBacklogGate,
  type EffortSize,
  type IdeaCard,
  type ImplementationModel,
  type PinType,
  type PresenceUser,
  type Role,
  type Specialty,
  type Stage,
  type User,
  type VotingState,
} from './src/types.ts';

seedInitialData();
seedInitialPinsIfEmpty();
seedAdditionalPitchCardsOnce();

const app = express();
app.use(express.json({ limit: '2mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

interface ConnectedClient {
  ws: WebSocket;
  clientId: string;
  user: User;
  view: string;
}

const clients = new Map<string, ConnectedClient>();

function getPresenceList(): PresenceUser[] {
  return Array.from(clients.values()).map((c) => ({
    clientId: c.clientId,
    userId: c.user.id,
    name: c.user.name,
    email: c.user.email,
    role: c.user.role,
    specialty: c.user.specialty,
    cursorColor: c.user.cursorColor,
    view: c.view,
  }));
}

function broadcastEvent(event: Record<string, unknown>, excludeClientId?: string): void {
  const payload = JSON.stringify(event);
  for (const [id, client] of clients.entries()) {
    if (excludeClientId && id === excludeClientId) continue;
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

function getUserByToken(token: string | null | undefined): User | null {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.userId
       WHERE s.token = ? AND s.expiresAt > ? AND u.active = 1`
    )
    .get(token, new Date().toISOString()) as Record<string, unknown> | undefined;
  if (!row) return null;
  return serializeUser(row, row.role === 'ADMIN');
}

function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    'INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)'
  ).run(token, userId, now.toISOString(), expiresAt);
  return token;
}

function extractToken(req: express.Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}

interface AuthedRequest extends express.Request {
  user?: User;
  token?: string;
}

function requireAuth(
  req: AuthedRequest,
  res: express.Response,
  next: express.NextFunction
): void {
  const token = extractToken(req);
  const user = getUserByToken(token);
  if (!user || !token) {
    res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
    return;
  }
  req.user = user;
  req.token = token;
  next();
}

// ============================================================================
// WebSocket Hub (Presence + Ephemeral Cursors + Board Live Sync)
// ============================================================================
wss.on('connection', (ws, req) => {
  const url = new URL(req.url ?? '/ws', 'http://localhost:3000');
  const token = url.searchParams.get('token');
  const user = getUserByToken(token);

  if (!user) {
    ws.close(4001, 'Unauthorized');
    return;
  }

  const clientId = crypto.randomUUID();
  const client: ConnectedClient = {
    ws,
    clientId,
    user,
    view: 'board',
  };
  clients.set(clientId, client);

  // Send welcome + current presence list
  ws.send(
    JSON.stringify({
      type: 'ws:connected',
      clientId,
      presence: getPresenceList(),
    })
  );

  broadcastEvent(
    {
      type: 'presence:sync',
      presence: getPresenceList(),
    },
    clientId
  );

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as {
        type: string;
        x?: number;
        y?: number;
        view?: string;
      };

      // RN-03.1: Cursor movement is strictly ephemeral, NEVER persisted
      if (msg.type === 'cursor:move' && typeof msg.x === 'number' && typeof msg.y === 'number') {
        const clampedX = Math.max(0, Math.min(100, msg.x));
        const clampedY = Math.max(0, Math.min(100, msg.y));
        const view = typeof msg.view === 'string' ? msg.view : client.view;
        client.view = view;
        broadcastEvent(
          {
            type: 'cursor:moved',
            cursor: {
              clientId,
              userId: client.user.id,
              name: client.user.name,
              cursorColor: client.user.cursorColor,
              x: clampedX,
              y: clampedY,
              view,
              updatedAt: Date.now(),
            },
          },
          clientId
        );
      } else if (msg.type === 'view:change' && typeof msg.view === 'string') {
        client.view = msg.view;
        broadcastEvent({
          type: 'presence:sync',
          presence: getPresenceList(),
        });
      }
    } catch {
      // Ignore malformed ephemeral messages
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    broadcastEvent({
      type: 'cursor:left',
      clientId,
    });
    broadcastEvent({
      type: 'presence:sync',
      presence: getPresenceList(),
    });
  });
});

// ============================================================================
// [RF-01] Authentication Routes (Local, Self-Register, Federated SSO Link)
// ============================================================================

app.get('/api/auth/demo-accounts', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT id, name, email, role, specialty, cursorColor, federatedProvider
       FROM users WHERE active = 1 ORDER BY
       CASE role WHEN 'ADMIN' THEN 1 WHEN 'FACILITATOR' THEN 2 WHEN 'MEMBER' THEN 3 ELSE 4 END, name ASC`
    )
    .all();
  res.json({ accounts: rows });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: 'Informe e-mail corporativo e senha.' });
    return;
  }

  const normalized = normalizeEmail(email);
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalized) as
    | Record<string, unknown>
    | undefined;

  if (!row) {
    res.status(401).json({ error: 'Credenciais inválidas.' });
    return;
  }

  if (!row.active) {
    res.status(403).json({ error: 'Esta conta está inativa. Contate o Administrador.' });
    return;
  }

  const valid = verifyPassword(password, String(row.passwordHash), String(row.passwordSalt));
  if (!valid) {
    res.status(401).json({ error: 'Credenciais inválidas.' });
    return;
  }

  const user = serializeUser(row, row.role === 'ADMIN');
  let token = '';

  const tx = db.transaction(() => {
    token = createSession(user.id);
    appendAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'AUTH_LOGIN',
      entityType: 'AUTH',
      entityId: user.id,
      entityLabel: `${user.name} (${user.email})`,
      beforeState: null,
      afterState: { method: 'local', role: user.role },
    });
  });
  tx();

  res.json({ token, user });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, specialty } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    specialty?: string;
  };

  if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
    res
      .status(400)
      .json({ error: 'Preencha nome completo, e-mail válido e senha com ao menos 6 caracteres.' });
    return;
  }

  const normalized = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    res.status(400).json({ error: 'Formato de e-mail inválido.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalized);
  if (existing) {
    res.status(409).json({
      error: 'Este e-mail já está cadastrado. Utilize o login local ou acesso federado SSO.',
    });
    return;
  }

  const validSpecialty: Specialty = SPECIALTIES.includes(specialty as Specialty)
    ? (specialty as Specialty)
    : 'Engenharia de Dados';

  const palette = ['#0b41cd', '#0f766e', '#6d28d9', '#b45309', '#0369a1', '#be123c'];
  const cursorColor = palette[Math.floor(Math.random() * palette.length)];
  const now = new Date().toISOString();
  const id = `usr-${crypto.randomUUID().slice(0, 8)}`;
  const { hash, salt } = hashPassword(password);

  let user!: User;
  let token = '';

  const tx = db.transaction(() => {
    // RN-01.3: Self-registered accounts receive MEMBER role by default
    db.prepare(
      `INSERT INTO users (
        id, name, email, passwordHash, passwordSalt, passwordChangedByUser,
        role, specialty, cursorColor, active, federatedProvider, federatedSub, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, 1, 'MEMBER', ?, ?, 1, NULL, NULL, ?, ?)`
    ).run(id, name.trim(), normalized, hash, salt, validSpecialty, cursorColor, now, now);

    const inserted = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<
      string,
      unknown
    >;
    user = serializeUser(inserted, false);
    token = createSession(user.id);

    appendAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'AUTH_REGISTER',
      entityType: 'USER',
      entityId: user.id,
      entityLabel: `${user.name} (${user.email})`,
      beforeState: null,
      afterState: {
        email: user.email,
        role: user.role,
        specialty: user.specialty,
        method: 'self_register',
      },
    });
  });
  tx();

  broadcastEvent({ type: 'users:updated' });
  res.status(201).json({ token, user });
});

app.post('/api/auth/federated', (req, res) => {
  const { email, name, provider } = req.body as {
    email?: string;
    name?: string;
    provider?: string;
  };

  if (!email?.trim()) {
    res.status(400).json({ error: 'Informe o e-mail corporativo para autenticação federada.' });
    return;
  }

  // RN-01.1: Normalized lowercase email is the unique key
  const normalized = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    res.status(400).json({ error: 'E-mail corporativo inválido.' });
    return;
  }

  const chosenProvider =
    provider === 'Google Workspace' ? 'Google Workspace' : 'Microsoft Entra ID';
  const now = new Date().toISOString();

  const existingRow = db.prepare('SELECT * FROM users WHERE email = ?').get(normalized) as
    | Record<string, unknown>
    | undefined;

  if (existingRow && !existingRow.active) {
    res.status(403).json({ error: 'Esta conta está inativa. Contate o Administrador.' });
    return;
  }

  let user!: User;
  let token = '';
  let linkedExisting = false;

  const tx = db.transaction(() => {
    if (existingRow) {
      // RN-01.2: Automatically unify/link federated identity to existing seeded account
      // preserving role, specialty, and cursorColor without duplicating the account
      const beforeProvider = existingRow.federatedProvider
        ? String(existingRow.federatedProvider)
        : null;
      const isNewLink = beforeProvider !== chosenProvider;
      linkedExisting = true;

      db.prepare(
        `UPDATE users SET federatedProvider = ?, federatedSub = ?, updatedAt = ? WHERE id = ?`
      ).run(chosenProvider, `sso-${existingRow.id}`, now, existingRow.id);

      const updatedRow = db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get(existingRow.id) as Record<string, unknown>;
      user = serializeUser(updatedRow, updatedRow.role === 'ADMIN');
      token = createSession(user.id);

      appendAuditLog({
        actorId: user.id,
        actorName: user.name,
        actorEmail: user.email,
        actorRole: user.role,
        action: isNewLink ? 'AUTH_FEDERATED_LINK' : 'AUTH_LOGIN',
        entityType: 'AUTH',
        entityId: user.id,
        entityLabel: `${user.name} (${user.email})`,
        beforeState: isNewLink
          ? { federatedProvider: beforeProvider, role: user.role, specialty: user.specialty }
          : null,
        afterState: {
          federatedProvider: chosenProvider,
          rolePreserved: user.role,
          specialtyPreserved: user.specialty,
          accountUnified: true,
        },
      });
    } else {
      // First-time federated user without seed record -> default MEMBER
      const id = `usr-${crypto.randomUUID().slice(0, 8)}`;
      const inferredName =
        name?.trim() ||
        normalized
          .split('@')[0]
          .split(/[._-]+/)
          .filter(Boolean)
          .map((part) => part[0].toUpperCase() + part.slice(1))
          .join(' ');
      const { hash, salt } = hashPassword(crypto.randomBytes(16).toString('hex'));

      db.prepare(
        `INSERT INTO users (
          id, name, email, passwordHash, passwordSalt, passwordChangedByUser,
          role, specialty, cursorColor, active, federatedProvider, federatedSub, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, 0, 'MEMBER', 'Engenharia de Dados', '#0b41cd', 1, ?, ?, ?, ?)`
      ).run(id, inferredName, normalized, hash, salt, chosenProvider, `sso-${id}`, now, now);

      const inserted = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<
        string,
        unknown
      >;
      user = serializeUser(inserted, false);
      token = createSession(user.id);

      appendAuditLog({
        actorId: user.id,
        actorName: user.name,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'AUTH_REGISTER',
        entityType: 'USER',
        entityId: user.id,
        entityLabel: `${user.name} (${user.email})`,
        beforeState: null,
        afterState: {
          email: user.email,
          role: user.role,
          federatedProvider: chosenProvider,
        },
      });
    }
  });
  tx();

  broadcastEvent({ type: 'users:updated' });
  res.json({
    token,
    user,
    unifiedMessage: linkedExisting
      ? `Identidade ${chosenProvider} vinculada automaticamente à conta existente com papel ${user.role} preservado.`
      : `Conta corporativa criada via ${chosenProvider} com papel inicial MEMBER.`,
  });
});

app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/logout', requireAuth, (req: AuthedRequest, res) => {
  if (req.token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token);
  }
  res.json({ ok: true });
});

app.post('/api/auth/password', requireAuth, (req: AuthedRequest, res) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    return;
  }

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as Record<
    string,
    unknown
  >;

  if (currentPassword && !verifyPassword(currentPassword, String(row.passwordHash), String(row.passwordSalt))) {
    res.status(401).json({ error: 'Senha atual incorreta.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    // RN-02.2: Mark passwordChangedByUser = 1 so batch seed never overwrites it
    db.prepare(
      'UPDATE users SET passwordHash = ?, passwordSalt = ?, passwordChangedByUser = 1, updatedAt = ? WHERE id = ?'
    ).run(hash, salt, now, req.user!.id);

    appendAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: req.user!.id,
      entityLabel: `${req.user!.name} (alteração de senha própria)`,
      beforeState: { passwordChangedByUser: Boolean(row.passwordChangedByUser) },
      afterState: { passwordChangedByUser: true },
    });
  });
  tx();

  res.json({ ok: true, message: 'Senha atualizada e protegida contra sobrescrita em cargas futuras.' });
});

// ============================================================================
// [RF-03, RF-04, RF-05] Collaborative Innovation Board & Cards API
// ============================================================================

app.get('/api/cards', requireAuth, (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM cards ORDER BY orderIndex ASC, updatedAt DESC')
    .all() as Record<string, unknown>[];
  const pinsByCard = getAllPinsByCard();
  res.json({
    cards: rows.map((row) => serializeCard(row, pinsByCard.get(String(row.id)) ?? [])),
  });
});

app.post('/api/cards', requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  // RN-03.2: VIEWER cannot mutate cards
  if (user.role === 'VIEWER') {
    res.status(403).json({
      error: 'Participantes com perfil Observador (VIEWER) possuem acesso somente leitura.',
    });
    return;
  }

  const body = req.body as Partial<IdeaCard>;
  if (!body.title || !body.title.trim()) {
    res.status(400).json({ error: 'O título da iniciativa é obrigatório.' });
    return;
  }

  const discipline: Specialty = SPECIALTIES.includes(body.discipline as Specialty)
    ? (body.discipline as Specialty)
    : user.specialty;

  const effort: EffortSize = EFFORT_SIZES.includes(body.effort as EffortSize)
    ? (body.effort as EffortSize)
    : 'M';

  const implementationModel: ImplementationModel = IMPLEMENTATION_MODELS.includes(
    body.implementationModel as ImplementationModel
  )
    ? (body.implementationModel as ImplementationModel)
    : 'In-House';

  const requestedStage: Stage =
    body.stage && ['PITCH', 'EVALUATION', 'BACKLOG'].includes(body.stage)
      ? body.stage
      : 'PITCH';

  // Enforce Backlog Quality Gate + Role Gate even on direct creation
  if (requestedStage === 'BACKLOG') {
    if (user.role !== 'ADMIN' && user.role !== 'FACILITATOR') {
      res.status(403).json({
        error: 'Apenas Administradores e Facilitadores podem promover iniciativas ao Backlog.',
      });
      return;
    }
    const gate = validateBacklogGate(body);
    if (!gate.valid) {
      res.status(422).json({
        error: 'Trava de qualidade: preencha os campos obrigatórios de refinamento antes de promover ao Backlog.',
        missingFields: gate.missingFields,
      });
      return;
    }
  }

  const now = new Date().toISOString();
  const id = `card-${crypto.randomUUID().slice(0, 8)}`;
  const countInStage = (
    db.prepare('SELECT COUNT(*) as c FROM cards WHERE stage = ?').get(requestedStage) as {
      c: number;
    }
  ).c;

  // Map effort to sensible default matrix X coordinate
  const defaultX = effort === 'P' ? 24 : effort === 'M' ? 44 : effort === 'G' ? 68 : 84;
  const posX = typeof body.posX === 'number' ? Math.max(4, Math.min(96, body.posX)) : defaultX;
  const posY = typeof body.posY === 'number' ? Math.max(6, Math.min(94, body.posY)) : 30;

  let created!: IdeaCard;
  let updatedVoting: VotingState | null = null;

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO cards (
        id, title, discipline, painOpportunity, proposedSolution, expectedBenefit,
        implementationModel, effort, technicalArchitecture, prerequisitesDependencies,
        securityPrivacyRisks, mvpSuccessCriteria, technicalLead, stage,
        posX, posY, orderIndex, authorId, authorName, version, createdAt, updatedAt
      ) VALUES (
        @id, @title, @discipline, @painOpportunity, @proposedSolution, @expectedBenefit,
        @implementationModel, @effort, @technicalArchitecture, @prerequisitesDependencies,
        @securityPrivacyRisks, @mvpSuccessCriteria, @technicalLead, @stage,
        @posX, @posY, @orderIndex, @authorId, @authorName, 1, @createdAt, @updatedAt
      )`
    ).run({
      id,
      title: body.title!.trim(),
      discipline,
      painOpportunity: (body.painOpportunity ?? '').trim(),
      proposedSolution: (body.proposedSolution ?? '').trim(),
      expectedBenefit: (body.expectedBenefit ?? '').trim(),
      implementationModel,
      effort,
      technicalArchitecture: (body.technicalArchitecture ?? '').trim(),
      prerequisitesDependencies: (body.prerequisitesDependencies ?? '').trim(),
      securityPrivacyRisks: (body.securityPrivacyRisks ?? '').trim(),
      mvpSuccessCriteria: (body.mvpSuccessCriteria ?? '').trim(),
      technicalLead: (body.technicalLead ?? '').trim(),
      stage: requestedStage,
      posX,
      posY,
      orderIndex: countInStage,
      authorId: user.id,
      authorName: user.name,
      createdAt: now,
      updatedAt: now,
    });

    const row = db.prepare('SELECT * FROM cards WHERE id = ?').get(id) as Record<string, unknown>;
    created = serializeCard(row);

    const activeVoting = getVotingState();
    if (activeVoting.currentSessionId) {
      appendSessionCardActivity(activeVoting.currentSessionId, 'newCardIds', [created.id]);
      if (created.stage === 'EVALUATION') {
        appendSessionCardActivity(activeVoting.currentSessionId, 'evaluatedCardIds', [created.id]);
      } else if (created.stage === 'BACKLOG') {
        appendSessionCardActivity(activeVoting.currentSessionId, 'backlogCardIds', [created.id]);
      }
      updatedVoting = getVotingState();
    }

    appendAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CARD_CREATED',
      entityType: 'CARD',
      entityId: created.id,
      entityLabel: created.title,
      beforeState: null,
      afterState: {
        title: created.title,
        discipline: created.discipline,
        effort: created.effort,
        stage: created.stage,
        implementationModel: created.implementationModel,
      },
    });
  });
  tx();

  broadcastEvent({ type: 'card:created', card: created });
  if (updatedVoting) {
    broadcastEvent({ type: 'voting:updated', voting: updatedVoting });
  }
  res.status(201).json({ card: created });
});

app.put('/api/cards/:id', requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  if (user.role === 'VIEWER') {
    res.status(403).json({ error: 'Perfil Observador (VIEWER) não pode editar cartões.' });
    return;
  }

  const existingRow = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!existingRow) {
    res.status(404).json({ error: 'Cartão não encontrado.' });
    return;
  }

  const existing = serializeCard(existingRow);

  // RN-04.2: MEMBER may only edit their own cards
  if (user.role === 'MEMBER' && existing.authorId !== user.id) {
    res.status(403).json({
      error: 'Membros colaboradores só podem editar cartões de sua própria autoria.',
    });
    return;
  }

  const body = req.body as Partial<IdeaCard>;
  const nextTitle = body.title !== undefined ? body.title.trim() : existing.title;
  if (!nextTitle) {
    res.status(400).json({ error: 'O título da iniciativa é obrigatório.' });
    return;
  }

  const nextStage: Stage =
    body.stage && ['PITCH', 'EVALUATION', 'BACKLOG'].includes(body.stage)
      ? body.stage
      : existing.stage;

  const merged = {
    title: nextTitle,
    discipline: SPECIALTIES.includes(body.discipline as Specialty)
      ? (body.discipline as Specialty)
      : existing.discipline,
    painOpportunity:
      body.painOpportunity !== undefined ? body.painOpportunity.trim() : existing.painOpportunity,
    proposedSolution:
      body.proposedSolution !== undefined
        ? body.proposedSolution.trim()
        : existing.proposedSolution,
    expectedBenefit:
      body.expectedBenefit !== undefined ? body.expectedBenefit.trim() : existing.expectedBenefit,
    implementationModel: IMPLEMENTATION_MODELS.includes(
      body.implementationModel as ImplementationModel
    )
      ? (body.implementationModel as ImplementationModel)
      : existing.implementationModel,
    effort: EFFORT_SIZES.includes(body.effort as EffortSize)
      ? (body.effort as EffortSize)
      : existing.effort,
    technicalArchitecture:
      body.technicalArchitecture !== undefined
        ? body.technicalArchitecture.trim()
        : existing.technicalArchitecture,
    prerequisitesDependencies:
      body.prerequisitesDependencies !== undefined
        ? body.prerequisitesDependencies.trim()
        : existing.prerequisitesDependencies,
    securityPrivacyRisks:
      body.securityPrivacyRisks !== undefined
        ? body.securityPrivacyRisks.trim()
        : existing.securityPrivacyRisks,
    mvpSuccessCriteria:
      body.mvpSuccessCriteria !== undefined
        ? body.mvpSuccessCriteria.trim()
        : existing.mvpSuccessCriteria,
    technicalLead:
      body.technicalLead !== undefined ? body.technicalLead.trim() : existing.technicalLead,
    stage: nextStage,
    posX:
      typeof body.posX === 'number' ? Math.max(4, Math.min(96, body.posX)) : existing.posX,
    posY:
      typeof body.posY === 'number' ? Math.max(6, Math.min(94, body.posY)) : existing.posY,
  };

  // RN-05.1 & RN-05.3: Quality Gate for Backlog
  if (merged.stage === 'BACKLOG') {
    if (existing.stage !== 'BACKLOG' && user.role !== 'ADMIN' && user.role !== 'FACILITATOR') {
      res.status(403).json({
        error: 'Apenas Facilitadores ou Administradores podem promover uma iniciativa ao Backlog.',
      });
      return;
    }
    const gate = validateBacklogGate(merged);
    if (!gate.valid) {
      res.status(422).json({
        error:
          'Trava de qualidade do Backlog: os 3 campos obrigatórios de refinamento precisam estar preenchidos.',
        missingFields: gate.missingFields,
      });
      return;
    }
  }

  const now = new Date().toISOString();
  let updated!: IdeaCard;

  // Compute exact changed diff for clean audit inspection
  const beforeDiff: Record<string, unknown> = {};
  const afterDiff: Record<string, unknown> = {};
  const trackedFields: (keyof typeof merged)[] = [
    'title',
    'discipline',
    'painOpportunity',
    'proposedSolution',
    'expectedBenefit',
    'implementationModel',
    'effort',
    'technicalArchitecture',
    'prerequisitesDependencies',
    'securityPrivacyRisks',
    'mvpSuccessCriteria',
    'technicalLead',
    'stage',
  ];

  for (const field of trackedFields) {
    if (existing[field] !== merged[field]) {
      beforeDiff[field] = existing[field];
      afterDiff[field] = merged[field];
    }
  }

  const stageChanged = existing.stage !== merged.stage;

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE cards SET
        title = @title,
        discipline = @discipline,
        painOpportunity = @painOpportunity,
        proposedSolution = @proposedSolution,
        expectedBenefit = @expectedBenefit,
        implementationModel = @implementationModel,
        effort = @effort,
        technicalArchitecture = @technicalArchitecture,
        prerequisitesDependencies = @prerequisitesDependencies,
        securityPrivacyRisks = @securityPrivacyRisks,
        mvpSuccessCriteria = @mvpSuccessCriteria,
        technicalLead = @technicalLead,
        stage = @stage,
        posX = @posX,
        posY = @posY,
        version = version + 1,
        updatedAt = @updatedAt
      WHERE id = @id`
    ).run({ ...merged, id: existing.id, updatedAt: now });

    const row = db.prepare('SELECT * FROM cards WHERE id = ?').get(existing.id) as Record<
      string,
      unknown
    >;
    updated = serializeCard(row);

    if (Object.keys(afterDiff).length > 0) {
      appendAuditLog({
        actorId: user.id,
        actorName: user.name,
        actorEmail: user.email,
        actorRole: user.role,
        action: stageChanged ? 'CARD_STAGE_CHANGED' : 'CARD_UPDATED',
        entityType: 'CARD',
        entityId: updated.id,
        entityLabel: updated.title,
        beforeState: beforeDiff,
        afterState: afterDiff,
      });
    }
  });
  tx();

  broadcastEvent({ type: 'card:updated', card: updated });
  res.json({ card: updated });
});

app.patch('/api/cards/:id/move', requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  if (user.role === 'VIEWER') {
    res.status(403).json({
      error: 'Participantes Observadores (VIEWER) não podem mover cartões no painel.',
    });
    return;
  }

  const existingRow = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!existingRow) {
    res.status(404).json({ error: 'Cartão não encontrado.' });
    return;
  }
  const existing = serializeCard(existingRow);

  const { stage, posX, posY, orderIndex } = req.body as {
    stage?: Stage;
    posX?: number;
    posY?: number;
    orderIndex?: number;
  };

  const targetStage: Stage =
    stage && ['PITCH', 'EVALUATION', 'BACKLOG'].includes(stage)
      ? stage
      : existing.stage;

  // RN-05.1, RN-05.2, RN-05.3: Quality Gate & Role Gate on promotion to Backlog
  if (targetStage === 'BACKLOG' && existing.stage !== 'BACKLOG') {
    if (user.role !== 'ADMIN' && user.role !== 'FACILITATOR') {
      res.status(403).json({
        error:
          'Promoção ao Backlog bloqueada: apenas Facilitadores ou Administradores podem aprovar a entrada no Backlog.',
        code: 'ROLE_GATE_BLOCKED',
      });
      return;
    }

    const gate = validateBacklogGate(existing);
    if (!gate.valid) {
      res.status(422).json({
        error: `Promoção ao Backlog bloqueada pela trava de qualidade. Preencha: ${gate.missingFields.join(', ')}.`,
        code: 'QUALITY_GATE_BLOCKED',
        missingFields: gate.missingFields,
      });
      return;
    }
  }

  const nextPosX =
    typeof posX === 'number' ? Math.round(Math.max(4, Math.min(96, posX))) : existing.posX;
  const nextPosY =
    typeof posY === 'number' ? Math.round(Math.max(6, Math.min(94, posY))) : existing.posY;
  const nextOrder = typeof orderIndex === 'number' ? orderIndex : existing.orderIndex;

  const stageChanged = existing.stage !== targetStage;
  const posChanged = existing.posX !== nextPosX || existing.posY !== nextPosY;

  if (!stageChanged && !posChanged && existing.orderIndex === nextOrder) {
    res.json({ card: existing });
    return;
  }

  const now = new Date().toISOString();
  let updated!: IdeaCard;
  let updatedVoting: VotingState | null = null;

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE cards SET
        stage = ?, posX = ?, posY = ?, orderIndex = ?, version = version + 1, updatedAt = ?
       WHERE id = ?`
    ).run(targetStage, nextPosX, nextPosY, nextOrder, now, existing.id);

    const row = db.prepare('SELECT * FROM cards WHERE id = ?').get(existing.id) as Record<
      string,
      unknown
    >;
    updated = serializeCard(row);

    if (stageChanged) {
      const activeVoting = getVotingState();
      if (activeVoting.currentSessionId) {
        if (targetStage === 'EVALUATION') {
          appendSessionCardActivity(activeVoting.currentSessionId, 'evaluatedCardIds', [
            updated.id,
          ]);
          updatedVoting = getVotingState();
        } else if (targetStage === 'BACKLOG') {
          appendSessionCardActivity(activeVoting.currentSessionId, 'backlogCardIds', [updated.id]);
          updatedVoting = getVotingState();
        }
      }
    }

    appendAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      action: stageChanged ? 'CARD_STAGE_CHANGED' : 'CARD_MOVED',
      entityType: 'CARD',
      entityId: updated.id,
      entityLabel: updated.title,
      beforeState: {
        stage: existing.stage,
        posX: existing.posX,
        posY: existing.posY,
      },
      afterState: {
        stage: updated.stage,
        posX: updated.posX,
        posY: updated.posY,
        ...(targetStage === 'BACKLOG' && stageChanged
          ? { qualityGate: 'APPROVED (3/3 critérios preenchidos)' }
          : {}),
      },
    });
  });
  tx();

  broadcastEvent({ type: 'card:moved', card: updated });
  if (updatedVoting) {
    broadcastEvent({ type: 'voting:updated', voting: updatedVoting });
  }
  res.json({ card: updated });
});

app.delete('/api/cards/:id', requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  if (user.role === 'VIEWER') {
    res.status(403).json({ error: 'Perfil Observador (VIEWER) não pode excluir cartões.' });
    return;
  }

  const existingRow = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!existingRow) {
    res.status(404).json({ error: 'Cartão não encontrado.' });
    return;
  }
  const existing = serializeCard(existingRow);

  if (user.role === 'MEMBER' && existing.authorId !== user.id) {
    res.status(403).json({
      error: 'Membros colaboradores só podem excluir cartões de sua própria autoria.',
    });
    return;
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM cards WHERE id = ?').run(existing.id);

    appendAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CARD_DELETED',
      entityType: 'CARD',
      entityId: existing.id,
      entityLabel: existing.title,
      beforeState: {
        title: existing.title,
        stage: existing.stage,
        discipline: existing.discipline,
        authorName: existing.authorName,
      },
      afterState: null,
    });
  });
  tx();

  broadcastEvent({ type: 'card:deleted', cardId: existing.id });
  res.json({ ok: true, cardId: existing.id });
});

app.post('/api/cards/:id/pins/toggle', requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  if (user.role === 'VIEWER') {
    res.status(403).json({
      error: 'Participantes com perfil Observador (VIEWER) possuem acesso somente leitura.',
    });
    return;
  }

  const { pinType } = req.body as { pinType?: string };
  if (!pinType || !PIN_TYPES.includes(pinType as PinType)) {
    res.status(400).json({ error: 'Tipo de pin inválido.' });
    return;
  }
  const validPinType = pinType as PinType;

  const existingRow = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!existingRow) {
    res.status(404).json({ error: 'Cartão não encontrado.' });
    return;
  }

  const cardId = String(existingRow.id);
  const cardTitle = String(existingRow.title);
  const now = new Date().toISOString();

  let updated!: IdeaCard;
  let updatedVoting: VotingState | null = null;
  let operation: 'anexado' | 'substituido' | 'removido' = 'anexado';
  let errorResponse: { status: number; code: string; error: string } | null = null;

  const tx = db.transaction(() => {
    const votingState = getVotingState();
    const beforePins = getPinsForCard(cardId);
    const existingUserPin = beforePins.find((p) => p.userId === user.id);

    const involvesVotePlus =
      validPinType === 'vote_plus' || existingUserPin?.pinType === 'vote_plus';

    // Rule (a): Voto +1 can only be applied, removed, or replaced while status is VOTAÇÃO ABERTA
    if (involvesVotePlus && (!votingState.votingOpen || !votingState.currentSessionId)) {
      errorResponse = {
        status: 423,
        code: 'VOTING_CLOSED',
        error:
          validPinType === 'vote_plus'
            ? 'O pin Voto +1 somente pode ser aplicado quando o status do painel for VOTAÇÃO ABERTA.'
            : 'A votação está fechada. Não é possível alterar ou remover o pin Voto +1 após o encerramento.',
      };
      return;
    }

    // Rule (c): Clicking the exact same active pin removes it
    if (existingUserPin && existingUserPin.pinType === validPinType) {
      db.prepare('DELETE FROM card_pins WHERE cardId = ? AND userId = ?').run(cardId, user.id);
      operation = 'removido';
    } else {
      // Rule (b): Validate before applying Voto +1 — max 1 card per user per open voting session
      if (validPinType === 'vote_plus') {
        const otherVote = db
          .prepare(
            `SELECT cp.cardId, c.title
             FROM card_pins cp
             JOIN cards c ON c.id = cp.cardId
             WHERE cp.userId = ? AND cp.pinType = 'vote_plus' AND cp.cardId != ?
             LIMIT 1`
          )
          .get(user.id, cardId) as { cardId: string; title: string } | undefined;

        if (otherVote) {
          const sessionTag = votingState.currentSessionNumber
            ? ` (Sessão #${votingState.currentSessionNumber})`
            : '';
          errorResponse = {
            status: 409,
            code: 'VOTE_SESSION_LIMIT_REACHED',
            error: `Você já usou seu Voto +1 nesta votação${sessionTag} no card "${otherVote.title}". Remova ou substitua o pin naquele card para votar em outro.`,
          };
          return;
        }
      }

      const sessionIdForPin =
        validPinType === 'vote_plus' ? votingState.currentSessionId : null;

      if (existingUserPin) {
        // Rule (c): Direct swap/replacement of user's pin on this card
        db.prepare(
          'UPDATE card_pins SET pinType = ?, votingSessionId = ?, createdAt = ? WHERE cardId = ? AND userId = ?'
        ).run(validPinType, sessionIdForPin, now, cardId, user.id);
        operation = 'substituido';
      } else {
        db.prepare(
          'INSERT INTO card_pins (cardId, userId, userName, pinType, votingSessionId, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(cardId, user.id, user.name, validPinType, sessionIdForPin, now);
        operation = 'anexado';
      }
    }

    const afterPins = getPinsForCard(cardId);
    updated = serializeCard(existingRow, afterPins);

    // Sync active session totalVotes & votedCardIds when Voto +1 changes
    if (involvesVotePlus && votingState.currentSessionId) {
      const totalVotes = (
        db
          .prepare("SELECT COUNT(*) as c FROM card_pins WHERE pinType = 'vote_plus'")
          .get() as { c: number }
      ).c;
      const votedCardIds = (
        db
          .prepare("SELECT DISTINCT cardId FROM card_pins WHERE pinType = 'vote_plus'")
          .all() as Array<{ cardId: string }>
      ).map((r) => r.cardId);
      updateVotingSession(votingState.currentSessionId, { totalVotes, votedCardIds });
      updatedVoting = getVotingState();
    }

    const beforeCount = beforePins.filter((p) => p.pinType === validPinType).length;
    const afterCount = afterPins.filter((p) => p.pinType === validPinType).length;
    const sessionLabel =
      involvesVotePlus && votingState.currentSessionNumber
        ? `Sessão #${votingState.currentSessionNumber} (${votingState.currentSessionId})`
        : undefined;

    appendAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'CARD_PIN_TOGGLED',
      entityType: 'CARD',
      entityId: cardId,
      entityLabel: cardTitle,
      beforeState: {
        pinAnterior: existingUserPin ? PIN_META[existingUserPin.pinType].label : null,
        pinAlvo: PIN_META[validPinType].label,
        totalDoTipo: beforeCount,
        ...(sessionLabel ? { sessaoVotacao: sessionLabel } : {}),
      },
      afterState: {
        pin: operation === 'removido' ? null : PIN_META[validPinType].label,
        operacao: operation,
        totalDoTipo: afterCount,
        ...(sessionLabel ? { sessaoVotacao: sessionLabel } : {}),
      },
    });
  });
  tx();

  if (errorResponse) {
    const err = errorResponse as { status: number; code: string; error: string };
    res.status(err.status).json({
      error: err.error,
      code: err.code,
    });
    return;
  }

  broadcastEvent({ type: 'card:updated', card: updated });
  if (updatedVoting) {
    broadcastEvent({ type: 'voting:updated', voting: updatedVoting });
  }
  res.json({ card: updated, operation, ...(updatedVoting ? { voting: updatedVoting } : {}) });
});

// ============================================================================
// Voting Lifecycle Controls (ADMIN), Persistent Voting Sessions & Top 5 Tally
// ============================================================================

function loadAllSerializedCards(): IdeaCard[] {
  const rows = db
    .prepare('SELECT * FROM cards ORDER BY orderIndex ASC, createdAt ASC')
    .all() as Record<string, unknown>[];
  const pinsByCard = getAllPinsByCard();
  return rows.map((row) => serializeCard(row, pinsByCard.get(String(row.id)) ?? []));
}

function captureSessionParticipantsSnapshot(triggeringAdminId: string): {
  presentUserIds: string[];
  absentUserIds: string[];
} {
  const activeUsers = db
    .prepare('SELECT id FROM users WHERE active = 1 ORDER BY name ASC')
    .all() as Array<{ id: string }>;

  const presentSet = new Set<string>([triggeringAdminId]);

  // Real-time connected WebSocket participants
  for (const client of clients.values()) {
    presentSet.add(client.user.id);
  }

  // Logged-in users with active non-expired auth sessions
  const loggedInRows = db
    .prepare('SELECT DISTINCT userId FROM sessions WHERE expiresAt > ?')
    .all(new Date().toISOString()) as Array<{ userId: string }>;
  for (const row of loggedInRows) {
    presentSet.add(row.userId);
  }

  const presentUserIds: string[] = [];
  const absentUserIds: string[] = [];
  for (const u of activeUsers) {
    if (presentSet.has(u.id)) {
      presentUserIds.push(u.id);
    } else {
      absentUserIds.push(u.id);
    }
  }
  return { presentUserIds, absentUserIds };
}

function captureStageCountsSnapshot(): {
  pitch: number;
  evaluation: number;
  backlog: number;
} {
  const rows = db
    .prepare('SELECT stage, COUNT(*) as c FROM cards GROUP BY stage')
    .all() as Array<{ stage: string; c: number }>;
  const map = new Map(rows.map((r) => [r.stage, r.c]));
  return {
    pitch: map.get('PITCH') ?? 0,
    evaluation: map.get('EVALUATION') ?? 0,
    backlog: map.get('BACKLOG') ?? 0,
  };
}

app.get('/api/sessions', requireAuth, (req: AuthedRequest, res) => {
  const { date, dateFrom, dateTo, status } = req.query as Record<string, string | undefined>;
  const sessions = getVotingSessions(100, {
    date: date?.trim() || undefined,
    dateFrom: dateFrom?.trim() || undefined,
    dateTo: dateTo?.trim() || undefined,
    status: status === 'OPEN' || status === 'CLOSED' ? status : undefined,
  });
  res.json({ sessions });
});

app.get('/api/voting', requireAuth, (_req: AuthedRequest, res) => {
  res.json({ voting: getVotingState() });
});

app.post('/api/voting/open', requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Apenas Administradores podem abrir a votação.' });
    return;
  }

  const before = getVotingState();
  if (before.votingOpen && before.currentSessionId) {
    res.json({
      voting: before,
      cards: loadAllSerializedCards(),
      message: `A Sessão #${before.currentSessionNumber ?? 1} já está aberta.`,
    });
    return;
  }

  const { presentUserIds, absentUserIds } = captureSessionParticipantsSnapshot(user.id);
  const stageCounts = captureStageCountsSnapshot();

  let updated!: VotingState;
  let newSessionNumber = 1;
  let clearedVotesCount = 0;

  const tx = db.transaction(() => {
    // Archive previous session's Voto +1 pins cleanly and start fresh for the new session
    const deleteInfo = db.prepare("DELETE FROM card_pins WHERE pinType = 'vote_plus'").run();
    clearedVotesCount = deleteInfo.changes;

    const newSession = createNewVotingSession({
      openedById: user.id,
      openedBy: user.name,
      presentUserIds,
      absentUserIds,
      initialPitchCount: stageCounts.pitch,
      initialEvaluationCount: stageCounts.evaluation,
      initialBacklogCount: stageCounts.backlog,
    });
    newSessionNumber = newSession.sessionNumber;

    updated = saveVotingState({
      votingOpen: true,
      currentSessionId: newSession.id,
      talliedAt: null,
      topIdeas: [],
      updatedBy: user.name,
    });

    appendAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'VOTING_OPENED',
      entityType: 'VOTING',
      entityId: newSession.id,
      entityLabel: `Sessão de Votação #${newSession.sessionNumber}`,
      beforeState: {
        votingOpen: before.votingOpen,
        sessaoAnterior: before.currentSessionNumber
          ? `Sessão #${before.currentSessionNumber}`
          : null,
      },
      afterState: {
        votingOpen: true,
        sessaoId: newSession.id,
        sessaoNumero: newSession.sessionNumber,
        dataSessao: newSession.sessionDate,
        adminResponsavelId: user.id,
        participantesPresentesIds: presentUserIds,
        participantesAusentesIds: absentUserIds,
        cardsIdeia: stageCounts.pitch,
        cardsAvaliacao: stageCounts.evaluation,
        cardsBacklog: stageCounts.backlog,
        votosAnterioresArquivados: clearedVotesCount,
      },
    });
  });
  tx();

  const refreshedCards = loadAllSerializedCards();
  broadcastEvent({ type: 'cards:sync', cards: refreshedCards });
  broadcastEvent({ type: 'voting:updated', voting: updated });

  res.json({
    voting: updated,
    cards: refreshedCards,
    message: `Votação aberta — Sessão #${newSessionNumber} registrada (${presentUserIds.length} presente(s), ${absentUserIds.length} ausente(s)).`,
  });
});

app.post('/api/voting/close', requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Apenas Administradores podem fechar a votação.' });
    return;
  }

  const before = getVotingState();
  const allCards = loadAllSerializedCards();
  const snapshotTopIdeas = computeTopVotedIdeas(allCards, 5);
  const totalVotes = (
    db.prepare("SELECT COUNT(*) as c FROM card_pins WHERE pinType = 'vote_plus'").get() as {
      c: number;
    }
  ).c;
  const votedCardIds = (
    db
      .prepare("SELECT DISTINCT cardId FROM card_pins WHERE pinType = 'vote_plus'")
      .all() as Array<{ cardId: string }>
  ).map((r) => r.cardId);
  const now = new Date().toISOString();
  let updated!: VotingState;

  const tx = db.transaction(() => {
    if (before.currentSessionId) {
      updateVotingSession(before.currentSessionId, {
        status: 'CLOSED',
        closedBy: user.name,
        closedAt: now,
        totalVotes,
        votedCardIds,
        topIdeas: before.topIdeas.length > 0 ? before.topIdeas : snapshotTopIdeas,
      });
    }

    updated = saveVotingState({
      votingOpen: false,
      updatedBy: user.name,
    });

    appendAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'VOTING_CLOSED',
      entityType: 'VOTING',
      entityId: before.currentSessionId ?? 'board-voting',
      entityLabel: before.currentSessionNumber
        ? `Sessão de Votação #${before.currentSessionNumber}`
        : 'Sessão de Votação',
      beforeState: {
        votingOpen: before.votingOpen,
        sessaoNumero: before.currentSessionNumber,
      },
      afterState: {
        votingOpen: false,
        sessaoNumero: before.currentSessionNumber,
        totalVotosRegistrados: totalVotes,
        ideiasVotadas: votedCardIds.length,
      },
    });
  });
  tx();

  broadcastEvent({ type: 'voting:updated', voting: updated });
  res.json({
    voting: updated,
    message: `Votação fechada${
      before.currentSessionNumber ? ` (Sessão #${before.currentSessionNumber})` : ''
    }. O pin Voto +1 está bloqueado até nova abertura.`,
  });
});

app.post('/api/voting/tally', requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Apenas Administradores podem apurar os votos.' });
    return;
  }

  const before = getVotingState();
  const allCards = loadAllSerializedCards();
  const topIdeas = computeTopVotedIdeas(allCards, 5);
  const totalVotes = (
    db.prepare("SELECT COUNT(*) as c FROM card_pins WHERE pinType = 'vote_plus'").get() as {
      c: number;
    }
  ).c;
  const votedCardIds = (
    db
      .prepare("SELECT DISTINCT cardId FROM card_pins WHERE pinType = 'vote_plus'")
      .all() as Array<{ cardId: string }>
  ).map((r) => r.cardId);
  const now = new Date().toISOString();
  let updated!: VotingState;

  const tx = db.transaction(() => {
    if (before.currentSessionId) {
      updateVotingSession(before.currentSessionId, {
        talliedAt: now,
        totalVotes,
        votedCardIds,
        topIdeas,
      });
    }

    updated = saveVotingState({
      talliedAt: now,
      topIdeas,
      updatedBy: user.name,
    });

    appendAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'VOTING_TALLIED',
      entityType: 'VOTING',
      entityId: before.currentSessionId ?? 'board-voting',
      entityLabel: `Apuração Sessão #${before.currentSessionNumber ?? 1} (Top ${topIdeas.length})`,
      beforeState: {
        sessaoNumero: before.currentSessionNumber,
        talliedAt: before.talliedAt,
        topIdeas: before.topIdeas.map((i) => `${i.title} (${i.score})`),
      },
      afterState: {
        sessaoNumero: before.currentSessionNumber,
        talliedAt: now,
        totalVotosOficiais: totalVotes,
        topIdeas: topIdeas.map((i) => `${i.title} (${i.score} Voto +1)`),
      },
    });
  });
  tx();

  broadcastEvent({ type: 'voting:updated', voting: updated });
  res.json({
    voting: updated,
    message:
      topIdeas.length > 0
        ? `Apuração da Sessão #${before.currentSessionNumber ?? 1} concluída: ${topIdeas.length} ideia(s) com Voto +1 ranqueada(s).`
        : 'Apuração concluída: nenhum card recebeu pin Voto +1 nesta sessão.',
  });
});

app.post('/api/voting/move-elected', requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'ADMIN') {
    res.status(403).json({
      error: 'Apenas Administradores podem mover as ideias eleitas para Avaliação.',
    });
    return;
  }

  const currentVoting = getVotingState();
  const allCards = loadAllSerializedCards();
  const rankedSource =
    currentVoting.topIdeas.length > 0
      ? currentVoting.topIdeas
      : computeTopVotedIdeas(allCards, 5);

  const cardById = new Map(allCards.map((c) => [c.id, c]));
  const eligiblePitchCards = rankedSource
    .map((item) => cardById.get(item.cardId))
    .filter((c): c is IdeaCard => Boolean(c && c.stage === 'PITCH'));

  if (eligiblePitchCards.length === 0) {
    res.json({
      movedCards: [],
      voting: currentVoting,
      message:
        rankedSource.length === 0
          ? 'Nenhuma ideia com Voto +1 encontrada para mover. Apure os votos após receber Voto +1.'
          : 'Todas as ideias eleitas do Top 5 já estão em Avaliação ou Backlog.',
    });
    return;
  }

  const now = new Date().toISOString();
  const movedCards: IdeaCard[] = [];
  let updatedVoting!: VotingState;

  const tx = db.transaction(() => {
    let evalCount = (
      db.prepare("SELECT COUNT(*) as c FROM cards WHERE stage = 'EVALUATION'").get() as {
        c: number;
      }
    ).c;

    for (const card of eligiblePitchCards) {
      db.prepare(
        `UPDATE cards SET stage = 'EVALUATION', orderIndex = ?, version = version + 1, updatedAt = ? WHERE id = ?`
      ).run(evalCount, now, card.id);
      evalCount += 1;

      const updatedRow = db.prepare('SELECT * FROM cards WHERE id = ?').get(card.id) as Record<
        string,
        unknown
      >;
      const updatedCard = serializeCard(updatedRow);
      movedCards.push(updatedCard);

      appendAuditLog({
        actorId: user.id,
        actorName: user.name,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'CARD_STAGE_CHANGED',
        entityType: 'CARD',
        entityId: updatedCard.id,
        entityLabel: updatedCard.title,
        beforeState: { stage: card.stage },
        afterState: {
          stage: 'EVALUATION',
          origem: `Eleito na Sessão #${currentVoting.currentSessionNumber ?? 1} (Top 5)`,
        },
      });
    }

    const refreshedCards = loadAllSerializedCards();
    const refreshedTopIdeas = computeTopVotedIdeas(refreshedCards, 5);
    const totalVotes = (
      db.prepare("SELECT COUNT(*) as c FROM card_pins WHERE pinType = 'vote_plus'").get() as {
        c: number;
      }
    ).c;

    if (currentVoting.currentSessionId) {
      const currentSession = currentVoting.sessions.find(
        (s) => s.id === currentVoting.currentSessionId
      );
      const existingMoved = currentSession?.movedCardTitles ?? [];
      const mergedMoved = Array.from(
        new Set([...existingMoved, ...movedCards.map((c) => c.title)])
      );
      const existingEvaluatedIds = currentSession?.evaluatedCardIds ?? [];
      const mergedEvaluatedIds = Array.from(
        new Set([...existingEvaluatedIds, ...movedCards.map((c) => c.id)])
      );
      updateVotingSession(currentVoting.currentSessionId, {
        talliedAt: now,
        totalVotes,
        topIdeas: refreshedTopIdeas,
        movedCardTitles: mergedMoved,
        evaluatedCardIds: mergedEvaluatedIds,
      });
    }

    updatedVoting = saveVotingState({
      talliedAt: now,
      topIdeas: refreshedTopIdeas,
      updatedBy: user.name,
    });

    appendAuditLog({
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'VOTING_MOVED_TO_EVALUATION',
      entityType: 'VOTING',
      entityId: currentVoting.currentSessionId ?? 'board-voting',
      entityLabel: `Sessão #${currentVoting.currentSessionNumber ?? 1}: ${movedCards.length} eleita(s) para Avaliação`,
      beforeState: { stage: 'PITCH', cards: movedCards.map((c) => c.title) },
      afterState: { stage: 'EVALUATION', cards: movedCards.map((c) => c.title) },
    });
  });
  tx();

  for (const card of movedCards) {
    broadcastEvent({ type: 'card:moved', card });
  }
  broadcastEvent({ type: 'voting:updated', voting: updatedVoting });

  res.json({
    movedCards,
    voting: updatedVoting,
    message: `${movedCards.length} ideia(s) eleita(s) da Sessão #${
      currentVoting.currentSessionNumber ?? 1
    } movida(s) para Avaliação Técnica & Valor.`,
  });
});

// ============================================================================
// [RF-02] User Directory & Idempotent Batch Import (ADMIN)
// ============================================================================

app.get('/api/users', requireAuth, (req: AuthedRequest, res) => {
  const isAdmin = req.user!.role === 'ADMIN';
  const rows = db.prepare('SELECT * FROM users ORDER BY name ASC').all() as Record<
    string,
    unknown
  >[];
  res.json({
    users: rows.map((r) => serializeUser(r, isAdmin)),
  });
});

app.post('/api/users', requireAuth, (req: AuthedRequest, res) => {
  if (req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Apenas Administradores podem cadastrar usuários.' });
    return;
  }

  const { name, email, role, specialty, cursorColor, initialPassword } = req.body as {
    name?: string;
    email?: string;
    role?: Role;
    specialty?: Specialty;
    cursorColor?: string;
    initialPassword?: string;
  };

  if (!name?.trim() || !email?.trim()) {
    res.status(400).json({ error: 'Nome completo e e-mail são obrigatórios.' });
    return;
  }

  const normalized = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    res.status(400).json({ error: 'Formato de e-mail inválido.' });
    return;
  }

  if (!role || !ROLES.includes(role)) {
    res.status(400).json({ error: 'Papel de acesso inválido.' });
    return;
  }

  if (!specialty || !SPECIALTIES.includes(specialty)) {
    res.status(400).json({ error: 'Especialidade técnica inválida.' });
    return;
  }

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(normalized);
  if (exists) {
    res.status(409).json({ error: 'Já existe um participante cadastrado com este e-mail.' });
    return;
  }

  const color =
    cursorColor && /^#[0-9a-fA-F]{6}$/.test(cursorColor) ? cursorColor : '#0b41cd';
  const id = `usr-${crypto.randomUUID().slice(0, 8)}`;
  const { hash, salt } = hashPassword(initialPassword?.trim() || 'og1@2026');
  const now = new Date().toISOString();

  let created!: User;

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO users (
        id, name, email, passwordHash, passwordSalt, passwordChangedByUser,
        role, specialty, cursorColor, active, federatedProvider, federatedSub, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, 1, NULL, NULL, ?, ?)`
    ).run(id, name.trim(), normalized, hash, salt, role, specialty, color, now, now);

    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown>;
    created = serializeUser(row, true);

    appendAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: created.id,
      entityLabel: `${created.name} (${created.email})`,
      beforeState: null,
      afterState: {
        name: created.name,
        email: created.email,
        role: created.role,
        specialty: created.specialty,
        cursorColor: created.cursorColor,
      },
    });
  });
  tx();

  broadcastEvent({ type: 'users:updated' });
  res.status(201).json({ user: created });
});

app.put('/api/users/:id', requireAuth, (req: AuthedRequest, res) => {
  if (req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Apenas Administradores podem editar usuários.' });
    return;
  }

  const existingRow = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;
  if (!existingRow) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return;
  }
  const existing = serializeUser(existingRow, true);

  const { name, role, specialty, cursorColor, active } = req.body as Partial<User>;
  const nextName = name !== undefined ? name.trim() : existing.name;
  const nextRole = role && ROLES.includes(role) ? role : existing.role;
  const nextSpecialty =
    specialty && SPECIALTIES.includes(specialty) ? specialty : existing.specialty;
  const nextColor =
    cursorColor && /^#[0-9a-fA-F]{6}$/.test(cursorColor) ? cursorColor : existing.cursorColor;
  const nextActive = typeof active === 'boolean' ? active : existing.active;

  if (existing.id === req.user!.id && (!nextActive || nextRole !== 'ADMIN')) {
    res.status(400).json({
      error: 'Você não pode inativar ou remover o papel de Administrador da sua própria conta.',
    });
    return;
  }

  const now = new Date().toISOString();
  let updated!: User;

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE users SET name = ?, role = ?, specialty = ?, cursorColor = ?, active = ?, updatedAt = ? WHERE id = ?`
    ).run(nextName, nextRole, nextSpecialty, nextColor, nextActive ? 1 : 0, now, existing.id);

    if (!nextActive) {
      db.prepare('DELETE FROM sessions WHERE userId = ?').run(existing.id);
    }

    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id) as Record<
      string,
      unknown
    >;
    updated = serializeUser(row, true);

    appendAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: updated.id,
      entityLabel: `${updated.name} (${updated.email})`,
      beforeState: {
        name: existing.name,
        role: existing.role,
        specialty: existing.specialty,
        cursorColor: existing.cursorColor,
        active: existing.active,
      },
      afterState: {
        name: updated.name,
        role: updated.role,
        specialty: updated.specialty,
        cursorColor: updated.cursorColor,
        active: updated.active,
      },
    });
  });
  tx();

  broadcastEvent({ type: 'users:updated' });
  res.json({ user: updated });
});

interface BatchUserRow {
  name: string;
  email: string;
  role: Role;
  specialty: Specialty;
  cursorColor: string;
  active?: boolean;
  initialPassword?: string;
}

function parseBatchInput(
  rawContent: string,
  format: 'json' | 'csv'
): { rows: BatchUserRow[]; errors: string[] } {
  const errors: string[] = [];
  const rawObjects: Record<string, unknown>[] = [];

  if (format === 'json') {
    try {
      const parsed = JSON.parse(rawContent);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return { rows: [], errors: ['O JSON deve conter um array não vazio de participantes.'] };
      }
      for (const item of parsed) {
        if (typeof item !== 'object' || item === null) {
          errors.push('Todos os itens do array JSON devem ser objetos válidos.');
        } else {
          rawObjects.push(item as Record<string, unknown>);
        }
      }
    } catch (err) {
      return {
        rows: [],
        errors: [`JSON malformado: ${(err as Error).message}`],
      };
    }
  } else {
    const lines = rawContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      return {
        rows: [],
        errors: ['O CSV deve conter cabeçalho e ao menos uma linha de participante.'],
      };
    }
    const headers = lines[0].split(',').map((h) => h.trim());
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      if (cols.length !== headers.length) {
        errors.push(`Linha ${i + 1}: número de colunas (${cols.length}) diverge do cabeçalho (${headers.length}).`);
        continue;
      }
      const obj: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx];
      });
      rawObjects.push(obj);
    }
  }

  if (errors.length > 0) {
    return { rows: [], errors };
  }

  const seenEmails = new Set<string>();
  const validated: BatchUserRow[] = [];

  rawObjects.forEach((obj, idx) => {
    const lineNum = idx + 1;
    const name = String(obj.name ?? obj.nome ?? '').trim();
    const email = normalizeEmail(String(obj.email ?? ''));
    const role = String(obj.role ?? obj.papel ?? '').trim().toUpperCase() as Role;
    const specialty = String(obj.specialty ?? obj.especialidade ?? '').trim() as Specialty;
    const cursorColor = String(obj.cursorColor ?? obj.cor ?? '#0b41cd').trim();
    const activeRaw = obj.active ?? obj.ativo;
    const active =
      activeRaw === undefined || activeRaw === ''
        ? true
        : activeRaw === true || String(activeRaw).toLowerCase() === 'true' || String(activeRaw) === '1';

    if (!name) {
      errors.push(`Registro #${lineNum}: campo "name" (nome completo) é obrigatório.`);
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Registro #${lineNum}: e-mail "${email || '(vazio)'}" inválido.`);
    } else if (seenEmails.has(email)) {
      errors.push(`Registro #${lineNum}: e-mail duplicado no arquivo ("${email}").`);
    } else {
      seenEmails.add(email);
    }

    if (!ROLES.includes(role)) {
      errors.push(
        `Registro #${lineNum} (${email || 'sem e-mail'}): papel "${role}" inválido. Aceitos: ${ROLES.join(', ')}.`
      );
    }
    if (!SPECIALTIES.includes(specialty)) {
      errors.push(
        `Registro #${lineNum} (${email || 'sem e-mail'}): especialidade "${specialty}" inválida. Aceitas: ${SPECIALTIES.join(', ')}.`
      );
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(cursorColor)) {
      errors.push(
        `Registro #${lineNum} (${email || 'sem e-mail'}): cor de cursor "${cursorColor}" deve estar no formato hexadecimal (#RRGGBB).`
      );
    }

    validated.push({
      name,
      email,
      role,
      specialty,
      cursorColor,
      active,
      initialPassword: obj.initialPassword ? String(obj.initialPassword) : undefined,
    });
  });

  return { rows: errors.length === 0 ? validated : [], errors };
}

app.post('/api/users/batch-import', requireAuth, (req: AuthedRequest, res) => {
  if (req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Apenas Administradores podem executar carga inicial em lote.' });
    return;
  }

  const { content, format } = req.body as { content?: string; format?: 'json' | 'csv' };
  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Forneça o conteúdo JSON ou CSV para a carga em lote.' });
    return;
  }

  const detectedFormat: 'json' | 'csv' =
    format === 'csv' || (!format && !content.trim().startsWith('[')) ? 'csv' : 'json';

  // RN-02.3: Validate ALL rows before mutating anything (atomic all-or-nothing)
  const { rows, errors } = parseBatchInput(content, detectedFormat);
  if (errors.length > 0) {
    res.status(422).json({
      error:
        'Carga abortada: foram encontrados erros no arquivo. Nenhuma alteração parcial foi aplicada (RN-02.3).',
      validationErrors: errors,
    });
    return;
  }

  const now = new Date().toISOString();
  let createdCount = 0;
  let updatedCount = 0;
  let passwordsPreservedCount = 0;

  const tx = db.transaction(() => {
    const beforeSummary: Array<{ email: string; role: string; specialty: string }> = [];
    const afterSummary: Array<{ email: string; role: string; specialty: string; status: string }> = [];

    for (const item of rows) {
      const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(item.email) as
        | Record<string, unknown>
        | undefined;

      if (existing) {
        // RN-02.1 & RN-02.2: Idempotent update preserving user-changed passwords
        beforeSummary.push({
          email: String(existing.email),
          role: String(existing.role),
          specialty: String(existing.specialty),
        });

        const passwordAlreadyChanged = Boolean(existing.passwordChangedByUser);
        if (passwordAlreadyChanged) {
          passwordsPreservedCount++;
        }

        db.prepare(
          `UPDATE users SET name = ?, role = ?, specialty = ?, cursorColor = ?, active = ?, updatedAt = ? WHERE id = ?`
        ).run(
          item.name,
          item.role,
          item.specialty,
          item.cursorColor,
          item.active === false ? 0 : 1,
          now,
          existing.id
        );

        updatedCount++;
        afterSummary.push({
          email: item.email,
          role: item.role,
          specialty: item.specialty,
          status: passwordAlreadyChanged ? 'atualizado (senha preservada)' : 'atualizado',
        });
      } else {
        const id = `usr-${crypto.randomUUID().slice(0, 8)}`;
        const { hash, salt } = hashPassword(item.initialPassword || 'og1@2026');
        db.prepare(
          `INSERT INTO users (
            id, name, email, passwordHash, passwordSalt, passwordChangedByUser,
            role, specialty, cursorColor, active, federatedProvider, federatedSub, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, NULL, NULL, ?, ?)`
        ).run(
          id,
          item.name,
          item.email,
          hash,
          salt,
          item.role,
          item.specialty,
          item.cursorColor,
          item.active === false ? 0 : 1,
          now,
          now
        );

        createdCount++;
        afterSummary.push({
          email: item.email,
          role: item.role,
          specialty: item.specialty,
          status: 'criado',
        });
      }
    }

    appendAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      action: 'USER_BATCH_IMPORT',
      entityType: 'USER',
      entityId: `batch-${Date.now()}`,
      entityLabel: `Carga em lote (${createdCount} criados, ${updatedCount} atualizados)`,
      beforeState: beforeSummary.length > 0 ? { existingUsersBefore: beforeSummary } : null,
      afterState: {
        createdCount,
        updatedCount,
        passwordsPreservedCount,
        processed: afterSummary,
      },
    });
  });
  tx();

  broadcastEvent({ type: 'users:updated' });
  res.json({
    ok: true,
    createdCount,
    updatedCount,
    passwordsPreservedCount,
    message: `Carga idempotente concluída: ${createdCount} novo(s), ${updatedCount} atualizado(s)${
      passwordsPreservedCount > 0
        ? ` (${passwordsPreservedCount} senha(s) alterada(s) pelo usuário preservada(s))`
        : ''
    }.`,
  });
});

// ============================================================================
// [RF-06] Immutable Audit Trail API (ADMIN & FACILITATOR ONLY — Append-Only)
// ============================================================================

app.get('/api/audit', requireAuth, (req: AuthedRequest, res) => {
  // RN-06.3: Only ADMIN and FACILITATOR may inspect the audit trail
  if (req.user!.role !== 'ADMIN' && req.user!.role !== 'FACILITATOR') {
    res.status(403).json({
      error: 'Acesso negado: apenas Administradores e Facilitadores podem consultar a trilha de auditoria.',
    });
    return;
  }

  const { action, actorId, entityType, search } = req.query as Record<string, string | undefined>;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (action && action !== 'ALL') {
    conditions.push('action = ?');
    params.push(action);
  }
  if (actorId && actorId !== 'ALL') {
    conditions.push('actorId = ?');
    params.push(actorId);
  }
  if (entityType && entityType !== 'ALL') {
    conditions.push('entityType = ?');
    params.push(entityType);
  }
  if (search && search.trim()) {
    conditions.push(
      '(entityLabel LIKE ? OR actorName LIKE ? OR actorEmail LIKE ? OR beforeState LIKE ? OR afterState LIKE ?)'
    );
    const q = `%${search.trim()}%`;
    params.push(q, q, q, q, q);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db
    .prepare(`SELECT * FROM audit_logs ${where} ORDER BY id DESC LIMIT 250`)
    .all(...params) as Record<string, unknown>[];

  const totalCount = (db.prepare('SELECT COUNT(*) as c FROM audit_logs').get() as { c: number }).c;

  res.json({
    logs: rows.map(serializeAudit),
    totalCount,
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ============================================================================
// Vite Dev Middleware or Static Production Build
// ============================================================================
function getCliArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  const prefix = `${flag}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  let viteServer: { close: () => Promise<void> } | null = null;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      plugins: [
        {
          name: 'disable-vite-client-ws',
          transform(code, id) {
            const cleanId = id.split(/[?#]/)[0].replace(/\\/g, '/');
            if (cleanId.endsWith('vite/dist/client/client.mjs')) {
              return code.replace(
                'transport.connect(createHMRHandler(handleMessage));',
                '/* HMR WebSocket disabled (ws: false, hmr: false) */'
              );
            }
          },
        },
      ],
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    viteServer = vite;
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const cliPort = Number(getCliArg('--port'));
  const envPort = Number(process.env.PORT);
  const nginxPort = Number(process.env.NGINX_PORT);
  const PORT =
    Number.isFinite(cliPort) && cliPort > 0
      ? cliPort
      : Number.isFinite(envPort) && envPort > 0 && envPort !== nginxPort
      ? envPort
      : 3000;
  const HOST = getCliArg('--host') || '0.0.0.0';

  const shutdown = () => {
    wss.close();
    server.close(() => {
      Promise.resolve(viteServer?.close())
        .catch(() => {})
        .finally(() => {
          try {
            db.close();
          } catch {
            // Ignore close error
          }
          process.exit(0);
        });
    });
    setTimeout(() => process.exit(0), 2000).unref();
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  server.listen(PORT, HOST, () => {
    console.log(`Innovation Board running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
