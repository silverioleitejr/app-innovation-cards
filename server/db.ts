import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  AuditAction,
  AuditLogEntry,
  CardPin,
  EffortSize,
  IdeaCard,
  ImplementationModel,
  PinType,
  RankedIdea,
  Role,
  SessionCardRef,
  SessionParticipantRef,
  Specialty,
  Stage,
  User,
  VotingSessionRecord,
  VotingState,
} from '../src/types.ts';
import { ApiError } from '../src/lib/api.ts';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'innovation-board.db');

function openDatabase(): Database.Database {
  const tryOpen = () => {
    const instance = new Database(dbPath);
    instance.pragma('busy_timeout = 5000');
    const check = instance.pragma('quick_check', { simple: true });
    if (check !== 'ok') {
      instance.close();
      throw new Error(`SQLite quick_check failed: ${String(check)}`);
    }
    instance.pragma('journal_mode = DELETE');
    instance.pragma('foreign_keys = ON');
    return instance;
  };

  try {
    return tryOpen();
  } catch (err) {
    console.warn('Recovering corrupted SQLite database file:', err);
    for (const suffix of ['', '-wal', '-shm']) {
      const target = `${dbPath}${suffix}`;
      if (fs.existsSync(target)) {
        try {
          fs.unlinkSync(target);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    return tryOpen();
  }
}

export const db = openDatabase();

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    passwordSalt TEXT NOT NULL,
    passwordChangedByUser INTEGER NOT NULL DEFAULT 0,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'FACILITATOR', 'MEMBER', 'VIEWER')),
    specialty TEXT NOT NULL,
    cursorColor TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    federatedProvider TEXT,
    federatedSub TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    discipline TEXT NOT NULL,
    painOpportunity TEXT NOT NULL DEFAULT '',
    proposedSolution TEXT NOT NULL DEFAULT '',
    expectedBenefit TEXT NOT NULL DEFAULT '',
    implementationModel TEXT NOT NULL DEFAULT 'In-House',
    effort TEXT NOT NULL DEFAULT 'M',
    technicalArchitecture TEXT NOT NULL DEFAULT '',
    prerequisitesDependencies TEXT NOT NULL DEFAULT '',
    securityPrivacyRisks TEXT NOT NULL DEFAULT '',
    mvpSuccessCriteria TEXT NOT NULL DEFAULT '',
    technicalLead TEXT NOT NULL DEFAULT '',
    stage TEXT NOT NULL CHECK(stage IN ('PITCH', 'EVALUATION', 'REFINEMENT', 'BACKLOG')),
    posX REAL NOT NULL DEFAULT 50,
    posY REAL NOT NULL DEFAULT 50,
    orderIndex INTEGER NOT NULL DEFAULT 0,
    authorId TEXT NOT NULL,
    authorName TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    actorId TEXT,
    actorName TEXT NOT NULL,
    actorEmail TEXT NOT NULL,
    actorRole TEXT NOT NULL,
    action TEXT NOT NULL,
    entityType TEXT NOT NULL,
    entityId TEXT NOT NULL,
    entityLabel TEXT NOT NULL,
    beforeState TEXT,
    afterState TEXT,
    integrityHash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS card_pins (
    cardId TEXT NOT NULL,
    userId TEXT NOT NULL,
    userName TEXT NOT NULL,
    pinType TEXT NOT NULL CHECK(pinType IN ('vote_plus', 'applause', 'thumbs_up', 'thumbs_down', 'heart')),
    createdAt TEXT NOT NULL,
    PRIMARY KEY (cardId, userId),
    FOREIGN KEY(cardId) REFERENCES cards(id) ON DELETE CASCADE
  );

  DELETE FROM card_pins
  WHERE rowid NOT IN (
    SELECT MIN(rowid) FROM card_pins GROUP BY cardId, userId
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_card_pins_one_per_user
  ON card_pins(cardId, userId);

  CREATE TABLE IF NOT EXISTS board_voting_state (
    id TEXT PRIMARY KEY CHECK(id = 'default'),
    votingOpen INTEGER NOT NULL DEFAULT 1,
    talliedAt TEXT,
    topIdeasJson TEXT NOT NULL DEFAULT '[]',
    updatedAt TEXT NOT NULL,
    updatedBy TEXT
  );

  INSERT OR IGNORE INTO board_voting_state (id, votingOpen, talliedAt, topIdeasJson, updatedAt, updatedBy)
  VALUES ('default', 1, NULL, '[]', datetime('now'), NULL);

  CREATE TABLE IF NOT EXISTS voting_sessions (
    id TEXT PRIMARY KEY,
    sessionNumber INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('OPEN', 'CLOSED')),
    openedBy TEXT NOT NULL,
    openedAt TEXT NOT NULL,
    closedBy TEXT,
    closedAt TEXT,
    talliedAt TEXT,
    totalVotes INTEGER NOT NULL DEFAULT 0,
    topIdeasJson TEXT NOT NULL DEFAULT '[]',
    movedCardTitlesJson TEXT NOT NULL DEFAULT '[]'
  );

  UPDATE cards SET stage = 'EVALUATION' WHERE stage = 'REFINEMENT';
`);

// Schema migrations for existing SQLite databases
{
  const pinCols = db.prepare('PRAGMA table_info(card_pins)').all() as Array<{ name: string }>;
  if (!pinCols.some((c) => c.name === 'votingSessionId')) {
    db.exec('ALTER TABLE card_pins ADD COLUMN votingSessionId TEXT;');
  }

  const votingCols = db
    .prepare('PRAGMA table_info(board_voting_state)')
    .all() as Array<{ name: string }>;
  if (!votingCols.some((c) => c.name === 'currentSessionId')) {
    db.exec('ALTER TABLE board_voting_state ADD COLUMN currentSessionId TEXT;');
  }

  const sessionCols = db
    .prepare('PRAGMA table_info(voting_sessions)')
    .all() as Array<{ name: string }>;
  const hasSessionCol = (name: string) => sessionCols.some((c) => c.name === name);

  if (!hasSessionCol('sessionDate')) {
    db.exec('ALTER TABLE voting_sessions ADD COLUMN sessionDate TEXT;');
  }
  if (!hasSessionCol('openedById')) {
    db.exec('ALTER TABLE voting_sessions ADD COLUMN openedById TEXT;');
  }
  if (!hasSessionCol('presentUserIdsJson')) {
    db.exec("ALTER TABLE voting_sessions ADD COLUMN presentUserIdsJson TEXT NOT NULL DEFAULT '[]';");
  }
  if (!hasSessionCol('absentUserIdsJson')) {
    db.exec("ALTER TABLE voting_sessions ADD COLUMN absentUserIdsJson TEXT NOT NULL DEFAULT '[]';");
  }
  if (!hasSessionCol('initialPitchCount')) {
    db.exec('ALTER TABLE voting_sessions ADD COLUMN initialPitchCount INTEGER NOT NULL DEFAULT 0;');
  }
  if (!hasSessionCol('initialEvaluationCount')) {
    db.exec(
      'ALTER TABLE voting_sessions ADD COLUMN initialEvaluationCount INTEGER NOT NULL DEFAULT 0;'
    );
  }
  if (!hasSessionCol('initialBacklogCount')) {
    db.exec('ALTER TABLE voting_sessions ADD COLUMN initialBacklogCount INTEGER NOT NULL DEFAULT 0;');
  }
  if (!hasSessionCol('newCardIdsJson')) {
    db.exec("ALTER TABLE voting_sessions ADD COLUMN newCardIdsJson TEXT NOT NULL DEFAULT '[]';");
  }
  if (!hasSessionCol('votedCardIdsJson')) {
    db.exec("ALTER TABLE voting_sessions ADD COLUMN votedCardIdsJson TEXT NOT NULL DEFAULT '[]';");
  }
  if (!hasSessionCol('evaluatedCardIdsJson')) {
    db.exec(
      "ALTER TABLE voting_sessions ADD COLUMN evaluatedCardIdsJson TEXT NOT NULL DEFAULT '[]';"
    );
  }
  if (!hasSessionCol('backlogCardIdsJson')) {
    db.exec("ALTER TABLE voting_sessions ADD COLUMN backlogCardIdsJson TEXT NOT NULL DEFAULT '[]';");
  }

  // Ensure a baseline session exists if voting is currently open and no session was recorded yet
  const stateRow = db
    .prepare(
      'SELECT votingOpen, currentSessionId, updatedAt, updatedBy FROM board_voting_state WHERE id = ?'
    )
    .get('default') as Record<string, unknown> | undefined;
  const sessionCount = (
    db.prepare('SELECT COUNT(*) as c FROM voting_sessions').get() as { c: number }
  ).c;

  if (stateRow && sessionCount === 0) {
    const isOpen = Boolean(stateRow.votingOpen);
    const nowIso = new Date().toISOString();
    const openedAt = stateRow.updatedAt ? String(stateRow.updatedAt) : nowIso;
    const sessionDate = openedAt.slice(0, 10);
    const initialSessionId = 'vsession-001';
    const initialVotes = (
      db.prepare("SELECT COUNT(*) as c FROM card_pins WHERE pinType = 'vote_plus'").get() as {
        c: number;
      }
    ).c;
    const votedRows = db
      .prepare("SELECT DISTINCT cardId FROM card_pins WHERE pinType = 'vote_plus'")
      .all() as Array<{ cardId: string }>;
    const stageRows = db
      .prepare('SELECT stage, COUNT(*) as c FROM cards GROUP BY stage')
      .all() as Array<{ stage: string; c: number }>;
    const stageMap = new Map(stageRows.map((r) => [r.stage, r.c]));

    db.prepare(
      `INSERT INTO voting_sessions (
        id, sessionNumber, sessionDate, status, openedById, openedBy, openedAt, closedBy, closedAt,
        talliedAt, totalVotes, presentUserIdsJson, absentUserIdsJson,
        initialPitchCount, initialEvaluationCount, initialBacklogCount,
        newCardIdsJson, votedCardIdsJson, evaluatedCardIdsJson, backlogCardIdsJson,
        topIdeasJson, movedCardTitlesJson
      ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, '[]', ?, '[]', '[]', '[]', '[]')`
    ).run(
      initialSessionId,
      sessionDate,
      isOpen ? 'OPEN' : 'CLOSED',
      'usr-admin-silverio',
      stateRow.updatedBy ? String(stateRow.updatedBy) : 'Silverio Leite Jr',
      openedAt,
      isOpen ? null : stateRow.updatedBy ? String(stateRow.updatedBy) : 'Silverio Leite Jr',
      isOpen ? null : nowIso,
      initialVotes,
      JSON.stringify(['usr-admin-silverio']),
      '[]',
      stageMap.get('PITCH') ?? 0,
      stageMap.get('EVALUATION') ?? 0,
      stageMap.get('BACKLOG') ?? 0,
      JSON.stringify(votedRows.map((r) => r.cardId))
    );

    db.prepare("UPDATE board_voting_state SET currentSessionId = ? WHERE id = 'default'").run(
      initialSessionId
    );
    db.prepare(
      "UPDATE card_pins SET votingSessionId = ? WHERE pinType = 'vote_plus' AND votingSessionId IS NULL"
    ).run(initialSessionId);
  }

  // Backfill sessionDate / openedById / stage counts on pre-existing rows created before this migration
  const unbackfilled = db
    .prepare('SELECT id, openedAt, openedBy, votedCardIdsJson FROM voting_sessions WHERE sessionDate IS NULL')
    .all() as Array<Record<string, unknown>>;
  if (unbackfilled.length > 0) {
    const activeUsers = db
      .prepare('SELECT id FROM users WHERE active = 1 ORDER BY name ASC')
      .all() as Array<{ id: string }>;
    const stageRows = db
      .prepare('SELECT stage, COUNT(*) as c FROM cards GROUP BY stage')
      .all() as Array<{ stage: string; c: number }>;
    const stageMap = new Map(stageRows.map((r) => [r.stage, r.c]));
    const votedRows = db
      .prepare("SELECT DISTINCT cardId FROM card_pins WHERE pinType = 'vote_plus'")
      .all() as Array<{ cardId: string }>;
    const defaultPresent = activeUsers.some((u) => u.id === 'usr-admin-silverio')
      ? ['usr-admin-silverio']
      : activeUsers.slice(0, 1).map((u) => u.id);
    const defaultAbsent = activeUsers
      .map((u) => u.id)
      .filter((id) => !defaultPresent.includes(id));

    for (const s of unbackfilled) {
      const openedAtStr = String(s.openedAt ?? new Date().toISOString());
      const dateStr = openedAtStr.slice(0, 10);
      db.prepare(
        `UPDATE voting_sessions
         SET sessionDate = ?,
             openedById = COALESCE(openedById, ?),
             presentUserIdsJson = CASE WHEN presentUserIdsJson = '[]' THEN ? ELSE presentUserIdsJson END,
             absentUserIdsJson = CASE WHEN absentUserIdsJson = '[]' THEN ? ELSE absentUserIdsJson END,
             initialPitchCount = CASE WHEN initialPitchCount = 0 AND initialEvaluationCount = 0 AND initialBacklogCount = 0 THEN ? ELSE initialPitchCount END,
             initialEvaluationCount = CASE WHEN initialPitchCount = 0 AND initialEvaluationCount = 0 AND initialBacklogCount = 0 THEN ? ELSE initialEvaluationCount END,
             initialBacklogCount = CASE WHEN initialPitchCount = 0 AND initialEvaluationCount = 0 AND initialBacklogCount = 0 THEN ? ELSE initialBacklogCount END,
             votedCardIdsJson = CASE WHEN votedCardIdsJson = '[]' THEN ? ELSE votedCardIdsJson END
         WHERE id = ?`
      ).run(
        dateStr,
        defaultPresent[0] ?? 'usr-admin-silverio',
        JSON.stringify(defaultPresent),
        JSON.stringify(defaultAbsent),
        stageMap.get('PITCH') ?? 0,
        stageMap.get('EVALUATION') ?? 0,
        stageMap.get('BACKLOG') ?? 0,
        JSON.stringify(votedRows.map((r) => r.cardId)),
        String(s.id)
      );
    }
  }

  // Enforce Rule (b) hygiene on any pre-existing data: max 1 vote_plus per user across the board
  db.exec(`
    DELETE FROM card_pins
    WHERE pinType = 'vote_plus'
      AND rowid NOT IN (
        SELECT MIN(rowid) FROM card_pins WHERE pinType = 'vote_plus' GROUP BY userId
      );
  `);
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt ?? crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { hash, salt: actualSalt };
}

export function verifyPassword(password: string, storedHash: string, storedSalt: string): boolean {
  const { hash } = hashPassword(password, storedSalt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function serializeUser(row: Record<string, unknown>, includeAdminFields = false): User {
  const base: User = {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: row.role as Role,
    specialty: row.specialty as Specialty,
    cursorColor: String(row.cursorColor),
    active: Boolean(row.active),
    federatedProvider: row.federatedProvider ? String(row.federatedProvider) : null,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
  if (includeAdminFields) {
    base.passwordChangedByUser = Boolean(row.passwordChangedByUser);
  }
  return base;
}

export function getPinsForCard(cardId: string): CardPin[] {
  const rows = db
    .prepare(
      'SELECT cardId, userId, userName, pinType, votingSessionId, createdAt FROM card_pins WHERE cardId = ? ORDER BY createdAt ASC'
    )
    .all(cardId) as Record<string, unknown>[];
  return rows.map((r) => ({
    cardId: String(r.cardId),
    userId: String(r.userId),
    userName: String(r.userName),
    pinType: r.pinType as PinType,
    votingSessionId: r.votingSessionId ? String(r.votingSessionId) : null,
    createdAt: String(r.createdAt),
  }));
}

export function getAllPinsByCard(): Map<string, CardPin[]> {
  const rows = db
    .prepare(
      'SELECT cardId, userId, userName, pinType, votingSessionId, createdAt FROM card_pins ORDER BY createdAt ASC'
    )
    .all() as Record<string, unknown>[];
  const map = new Map<string, CardPin[]>();
  for (const r of rows) {
    const pin: CardPin = {
      cardId: String(r.cardId),
      userId: String(r.userId),
      userName: String(r.userName),
      pinType: r.pinType as PinType,
      votingSessionId: r.votingSessionId ? String(r.votingSessionId) : null,
      createdAt: String(r.createdAt),
    };
    const list = map.get(pin.cardId);
    if (list) {
      list.push(pin);
    } else {
      map.set(pin.cardId, [pin]);
    }
  }
  return map;
}

export function serializeCard(row: Record<string, unknown>, preloadedPins?: CardPin[]): IdeaCard {
  const id = String(row.id);
  return {
    id,
    title: String(row.title),
    discipline: row.discipline as Specialty,
    painOpportunity: String(row.painOpportunity ?? ''),
    proposedSolution: String(row.proposedSolution ?? ''),
    expectedBenefit: String(row.expectedBenefit ?? ''),
    implementationModel: (row.implementationModel as ImplementationModel) ?? 'In-House',
    effort: (row.effort as EffortSize) ?? 'M',
    technicalArchitecture: String(row.technicalArchitecture ?? ''),
    prerequisitesDependencies: String(row.prerequisitesDependencies ?? ''),
    securityPrivacyRisks: String(row.securityPrivacyRisks ?? ''),
    mvpSuccessCriteria: String(row.mvpSuccessCriteria ?? ''),
    technicalLead: String(row.technicalLead ?? ''),
    stage: row.stage as Stage,
    posX: Number(row.posX ?? 50),
    posY: Number(row.posY ?? 50),
    orderIndex: Number(row.orderIndex ?? 0),
    authorId: String(row.authorId),
    authorName: String(row.authorName),
    pins: preloadedPins ?? getPinsForCard(id),
    version: Number(row.version ?? 1),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

export function serializeAudit(row: Record<string, unknown>): AuditLogEntry {
  return {
    id: Number(row.id),
    timestamp: String(row.timestamp),
    actorId: row.actorId ? String(row.actorId) : null,
    actorName: String(row.actorName),
    actorEmail: String(row.actorEmail),
    actorRole: String(row.actorRole),
    action: row.action as AuditAction,
    entityType: row.entityType as 'AUTH' | 'USER' | 'CARD' | 'VOTING',
    entityId: String(row.entityId),
    entityLabel: String(row.entityLabel),
    beforeState: row.beforeState ? JSON.parse(String(row.beforeState)) : null,
    afterState: row.afterState ? JSON.parse(String(row.afterState)) : null,
    integrityHash: String(row.integrityHash),
  };
}

function parseStringArray(raw: unknown): string[] {
  try {
    const parsed = JSON.parse(String(raw ?? '[]'));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parseUtcTimestamp(iso: string): number {
  const trimmed = iso.trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return Date.parse(`${trimmed.replace(' ', 'T')}Z`);
  }
  return Date.parse(trimmed);
}

function computeDurationMinutes(openedAt: string, closedAt: string | null): number {
  const startMs = parseUtcTimestamp(openedAt);
  const endMs = closedAt ? parseUtcTimestamp(closedAt) : Date.now();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return 0;
  return Math.max(0, Math.round((endMs - startMs) / 60000));
}

function serializeVotingSession(row: Record<string, unknown>): VotingSessionRecord {
  let topIdeas: RankedIdea[] = [];
  try {
    const parsed = JSON.parse(String(row.topIdeasJson ?? '[]'));
    if (Array.isArray(parsed)) topIdeas = parsed as RankedIdea[];
  } catch {
    topIdeas = [];
  }

  const openedAt = String(row.openedAt);
  const closedAt = row.closedAt ? String(row.closedAt) : null;
  const sessionDate = row.sessionDate ? String(row.sessionDate) : openedAt.slice(0, 10);

  return {
    id: String(row.id),
    sessionNumber: Number(row.sessionNumber),
    sessionDate,
    status: row.status === 'OPEN' ? 'OPEN' : 'CLOSED',
    openedById: row.openedById ? String(row.openedById) : null,
    openedBy: String(row.openedBy),
    openedAt,
    closedBy: row.closedBy ? String(row.closedBy) : null,
    closedAt,
    durationMinutes: computeDurationMinutes(openedAt, closedAt),
    talliedAt: row.talliedAt ? String(row.talliedAt) : null,
    totalVotes: Number(row.totalVotes ?? 0),
    presentUserIds: parseStringArray(row.presentUserIdsJson),
    absentUserIds: parseStringArray(row.absentUserIdsJson),
    initialPitchCount: Number(row.initialPitchCount ?? 0),
    initialEvaluationCount: Number(row.initialEvaluationCount ?? 0),
    initialBacklogCount: Number(row.initialBacklogCount ?? 0),
    newCardIds: parseStringArray(row.newCardIdsJson),
    votedCardIds: parseStringArray(row.votedCardIdsJson),
    evaluatedCardIds: parseStringArray(row.evaluatedCardIdsJson),
    backlogCardIds: parseStringArray(row.backlogCardIdsJson),
    topIdeas,
    movedCardTitles: parseStringArray(row.movedCardTitlesJson),
  };
}

export function enrichVotingSessions(sessions: VotingSessionRecord[]): VotingSessionRecord[] {
  if (sessions.length === 0) return [];

  const userRows = db
    .prepare('SELECT id, name, email, role, specialty, cursorColor FROM users')
    .all() as Array<Record<string, unknown>>;
  const userMap = new Map<string, SessionParticipantRef>();
  for (const u of userRows) {
    userMap.set(String(u.id), {
      id: String(u.id),
      name: String(u.name),
      email: String(u.email),
      role: u.role as Role,
      specialty: u.specialty as Specialty,
      cursorColor: String(u.cursorColor),
    });
  }

  const cardRows = db
    .prepare('SELECT id, title, stage FROM cards')
    .all() as Array<{ id: string; title: string; stage: Stage }>;
  const cardMap = new Map<string, { id: string; title: string; stage: Stage }>();
  for (const c of cardRows) {
    cardMap.set(c.id, c);
  }

  // Fallback titles for any card that may have been deleted after being logged
  const auditCardRows = db
    .prepare("SELECT entityId, entityLabel FROM audit_logs WHERE entityType = 'CARD' ORDER BY id DESC")
    .all() as Array<{ entityId: string; entityLabel: string }>;
  const auditTitleMap = new Map<string, string>();
  for (const a of auditCardRows) {
    if (!auditTitleMap.has(a.entityId)) {
      auditTitleMap.set(a.entityId, a.entityLabel);
    }
  }

  // Live vote_plus counts grouped by votingSessionId and cardId
  const liveVoteRows = db
    .prepare(
      `SELECT votingSessionId, cardId, COUNT(*) as votes
       FROM card_pins
       WHERE pinType = 'vote_plus'
       GROUP BY votingSessionId, cardId`
    )
    .all() as Array<{ votingSessionId: string | null; cardId: string; votes: number }>;

  const liveVotesBySession = new Map<string, Map<string, number>>();
  for (const r of liveVoteRows) {
    if (!r.votingSessionId) continue;
    let map = liveVotesBySession.get(r.votingSessionId);
    if (!map) {
      map = new Map<string, number>();
      liveVotesBySession.set(r.votingSessionId, map);
    }
    map.set(r.cardId, r.votes);
  }

  const resolveCards = (ids: string[], votesLookup?: Map<string, number>): SessionCardRef[] => {
    const unique = Array.from(new Set(ids));
    return unique.map((id) => {
      const live = cardMap.get(id);
      return {
        id,
        title: live?.title ?? auditTitleMap.get(id) ?? id,
        stage: live?.stage,
        votes: votesLookup?.get(id),
      };
    });
  };

  const resolveParticipants = (ids: string[]): SessionParticipantRef[] => {
    const unique = Array.from(new Set(ids));
    return unique.map((id) => {
      const u = userMap.get(id);
      if (u) return u;
      return {
        id,
        name: id,
        email: '',
        role: 'MEMBER' as Role,
        specialty: 'Engenharia de Dados' as Specialty,
        cursorColor: '#544f4f',
      };
    });
  };

  return sessions.map((session) => {
    const topVotesMap = new Map<string, number>();
    for (const t of session.topIdeas) {
      topVotesMap.set(t.cardId, t.score);
    }
    const liveSessionVotes = liveVotesBySession.get(session.id);
    if (liveSessionVotes) {
      for (const [cid, count] of liveSessionVotes.entries()) {
        topVotesMap.set(cid, count);
      }
    }

    const effectiveVotedIds = Array.from(
      new Set([
        ...session.votedCardIds,
        ...session.topIdeas.map((t) => t.cardId),
        ...(liveSessionVotes ? Array.from(liveSessionVotes.keys()) : []),
      ])
    );

    return {
      ...session,
      votedCardIds: effectiveVotedIds,
      presentParticipants: resolveParticipants(session.presentUserIds),
      absentParticipants: resolveParticipants(session.absentUserIds),
      newIdeas: resolveCards(session.newCardIds),
      votedIdeas: resolveCards(effectiveVotedIds, topVotesMap),
      evaluatedIdeas: resolveCards(session.evaluatedCardIds),
      backlogIdeas: resolveCards(session.backlogCardIds),
    };
  });
}

export function getVotingSessions(
  limit = 50,
  filters?: { date?: string; dateFrom?: string; dateTo?: string; status?: 'OPEN' | 'CLOSED' }
): VotingSessionRecord[] {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.date) {
    conditions.push('sessionDate = ?');
    params.push(filters.date);
  }
  if (filters?.dateFrom) {
    conditions.push('sessionDate >= ?');
    params.push(filters.dateFrom);
  }
  if (filters?.dateTo) {
    conditions.push('sessionDate <= ?');
    params.push(filters.dateTo);
  }
  if (filters?.status === 'OPEN' || filters?.status === 'CLOSED') {
    conditions.push('status = ?');
    params.push(filters.status);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db
    .prepare(`SELECT * FROM voting_sessions ${where} ORDER BY sessionNumber DESC LIMIT ?`)
    .all(...params, limit) as Record<string, unknown>[];

  return enrichVotingSessions(rows.map(serializeVotingSession));
}

export function createNewVotingSession(params: {
  openedById: string;
  openedBy: string;
  presentUserIds: string[];
  absentUserIds: string[];
  initialPitchCount: number;
  initialEvaluationCount: number;
  initialBacklogCount: number;
}): VotingSessionRecord {
  const maxRow = db
    .prepare('SELECT COALESCE(MAX(sessionNumber), 0) as maxNum FROM voting_sessions')
    .get() as { maxNum: number };
  const nextNumber = maxRow.maxNum + 1;
  const id = `vsession-${String(nextNumber).padStart(3, '0')}`;
  const now = new Date().toISOString();
  const sessionDate = now.slice(0, 10);

  db.prepare(
    `INSERT INTO voting_sessions (
      id, sessionNumber, sessionDate, status, openedById, openedBy, openedAt, closedBy, closedAt,
      talliedAt, totalVotes, presentUserIdsJson, absentUserIdsJson,
      initialPitchCount, initialEvaluationCount, initialBacklogCount,
      newCardIdsJson, votedCardIdsJson, evaluatedCardIdsJson, backlogCardIdsJson,
      topIdeasJson, movedCardTitlesJson
    ) VALUES (?, ?, ?, 'OPEN', ?, ?, ?, NULL, NULL, NULL, 0, ?, ?, ?, ?, ?, '[]', '[]', '[]', '[]', '[]', '[]')`
  ).run(
    id,
    nextNumber,
    sessionDate,
    params.openedById,
    params.openedBy,
    now,
    JSON.stringify(Array.from(new Set(params.presentUserIds))),
    JSON.stringify(Array.from(new Set(params.absentUserIds))),
    params.initialPitchCount,
    params.initialEvaluationCount,
    params.initialBacklogCount
  );

  const row = db
    .prepare('SELECT * FROM voting_sessions WHERE id = ?')
    .get(id) as Record<string, unknown>;
  return enrichVotingSessions([serializeVotingSession(row)])[0];
}

export function updateVotingSession(
  sessionId: string,
  patch: {
    status?: 'OPEN' | 'CLOSED';
    closedBy?: string | null;
    closedAt?: string | null;
    talliedAt?: string | null;
    totalVotes?: number;
    topIdeas?: RankedIdea[];
    movedCardTitles?: string[];
    newCardIds?: string[];
    votedCardIds?: string[];
    evaluatedCardIds?: string[];
    backlogCardIds?: string[];
  }
): VotingSessionRecord | null {
  const existingRow = db
    .prepare('SELECT * FROM voting_sessions WHERE id = ?')
    .get(sessionId) as Record<string, unknown> | undefined;
  if (!existingRow) return null;
  const current = serializeVotingSession(existingRow);

  const nextStatus = patch.status ?? current.status;
  const nextClosedBy = patch.closedBy !== undefined ? patch.closedBy : current.closedBy;
  const nextClosedAt = patch.closedAt !== undefined ? patch.closedAt : current.closedAt;
  const nextTalliedAt = patch.talliedAt !== undefined ? patch.talliedAt : current.talliedAt;
  const nextTotalVotes = patch.totalVotes !== undefined ? patch.totalVotes : current.totalVotes;
  const nextTopIdeas = patch.topIdeas !== undefined ? patch.topIdeas : current.topIdeas;
  const nextMoved =
    patch.movedCardTitles !== undefined ? patch.movedCardTitles : current.movedCardTitles;
  const nextNewCardIds =
    patch.newCardIds !== undefined ? Array.from(new Set(patch.newCardIds)) : current.newCardIds;
  const nextVotedCardIds =
    patch.votedCardIds !== undefined
      ? Array.from(new Set(patch.votedCardIds))
      : current.votedCardIds;
  const nextEvaluatedCardIds =
    patch.evaluatedCardIds !== undefined
      ? Array.from(new Set(patch.evaluatedCardIds))
      : current.evaluatedCardIds;
  const nextBacklogCardIds =
    patch.backlogCardIds !== undefined
      ? Array.from(new Set(patch.backlogCardIds))
      : current.backlogCardIds;

  db.prepare(
    `UPDATE voting_sessions
     SET status = ?, closedBy = ?, closedAt = ?, talliedAt = ?,
         totalVotes = ?, topIdeasJson = ?, movedCardTitlesJson = ?,
         newCardIdsJson = ?, votedCardIdsJson = ?, evaluatedCardIdsJson = ?, backlogCardIdsJson = ?
     WHERE id = ?`
  ).run(
    nextStatus,
    nextClosedBy,
    nextClosedAt,
    nextTalliedAt,
    nextTotalVotes,
    JSON.stringify(nextTopIdeas),
    JSON.stringify(nextMoved),
    JSON.stringify(nextNewCardIds),
    JSON.stringify(nextVotedCardIds),
    JSON.stringify(nextEvaluatedCardIds),
    JSON.stringify(nextBacklogCardIds),
    sessionId
  );

  const updatedRow = db
    .prepare('SELECT * FROM voting_sessions WHERE id = ?')
    .get(sessionId) as Record<string, unknown>;
  return enrichVotingSessions([serializeVotingSession(updatedRow)])[0];
}

export function appendSessionCardActivity(
  sessionId: string,
  field: 'newCardIds' | 'evaluatedCardIds' | 'backlogCardIds',
  cardIds: string[]
): VotingSessionRecord | null {
  if (!sessionId || cardIds.length === 0) return null;
  const existingRow = db
    .prepare('SELECT * FROM voting_sessions WHERE id = ?')
    .get(sessionId) as Record<string, unknown> | undefined;
  if (!existingRow) return null;
  const current = serializeVotingSession(existingRow);
  const merged = Array.from(new Set([...current[field], ...cardIds]));
  return updateVotingSession(sessionId, { [field]: merged });
}

export function getVotingState(): VotingState {
  const row = db
    .prepare(
      'SELECT votingOpen, currentSessionId, talliedAt, topIdeasJson, updatedAt, updatedBy FROM board_voting_state WHERE id = ?'
    )
    .get('default') as Record<string, unknown> | undefined;

  const sessions = getVotingSessions(25);

  if (!row) {
    return {
      votingOpen: true,
      currentSessionId: sessions[0]?.id ?? null,
      currentSessionNumber: sessions[0]?.sessionNumber ?? null,
      talliedAt: null,
      topIdeas: [],
      sessions,
      updatedAt: new Date().toISOString(),
      updatedBy: null,
    };
  }

  let topIdeas: RankedIdea[] = [];
  try {
    const parsed = JSON.parse(String(row.topIdeasJson ?? '[]'));
    if (Array.isArray(parsed)) {
      topIdeas = parsed as RankedIdea[];
    }
  } catch {
    topIdeas = [];
  }

  const currentSessionId = row.currentSessionId
    ? String(row.currentSessionId)
    : sessions[0]?.id ?? null;
  const matchedSession = sessions.find((s) => s.id === currentSessionId) ?? sessions[0] ?? null;

  return {
    votingOpen: Boolean(row.votingOpen),
    currentSessionId: matchedSession?.id ?? currentSessionId,
    currentSessionNumber: matchedSession?.sessionNumber ?? null,
    talliedAt: row.talliedAt ? String(row.talliedAt) : null,
    topIdeas,
    sessions,
    updatedAt: String(row.updatedAt),
    updatedBy: row.updatedBy ? String(row.updatedBy) : null,
  };
}

export function saveVotingState(patch: {
  votingOpen?: boolean;
  currentSessionId?: string | null;
  talliedAt?: string | null;
  topIdeas?: RankedIdea[];
  updatedBy?: string | null;
}): VotingState {
  const current = getVotingState();
  const nextVotingOpen = patch.votingOpen !== undefined ? patch.votingOpen : current.votingOpen;
  const nextSessionId =
    patch.currentSessionId !== undefined ? patch.currentSessionId : current.currentSessionId;
  const nextTalliedAt = patch.talliedAt !== undefined ? patch.talliedAt : current.talliedAt;
  const nextTopIdeas = patch.topIdeas !== undefined ? patch.topIdeas : current.topIdeas;
  const nextUpdatedBy = patch.updatedBy !== undefined ? patch.updatedBy : current.updatedBy;
  const now = new Date().toISOString();

  db.prepare(
    `UPDATE board_voting_state
     SET votingOpen = ?, currentSessionId = ?, talliedAt = ?, topIdeasJson = ?, updatedAt = ?, updatedBy = ?
     WHERE id = 'default'`
  ).run(
    nextVotingOpen ? 1 : 0,
    nextSessionId,
    nextTalliedAt,
    JSON.stringify(nextTopIdeas),
    now,
    nextUpdatedBy
  );

  return getVotingState();
}

interface AuditInsertInput {
  actorId: string | null;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: AuditAction;
  entityType: 'AUTH' | 'USER' | 'CARD' | 'VOTING';
  entityId: string;
  entityLabel: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  timestamp?: string;
}

const getLastHashStmt = db.prepare('SELECT integrityHash FROM audit_logs ORDER BY id DESC LIMIT 1');
const insertAuditStmt = db.prepare(`
  INSERT INTO audit_logs (
    timestamp, actorId, actorName, actorEmail, actorRole,
    action, entityType, entityId, entityLabel, beforeState, afterState, integrityHash
  ) VALUES (
    @timestamp, @actorId, @actorName, @actorEmail, @actorRole,
    @action, @entityType, @entityId, @entityLabel, @beforeState, @afterState, @integrityHash
  )
`);

/**
 * Append-only immutable audit logger with chained SHA-256 integrity hash.
 * Always called inside a SQLite transaction alongside the business mutation (RN-06.2).
 */
export function appendAuditLog(input: AuditInsertInput): void {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const prevRow = getLastHashStmt.get() as { integrityHash: string } | undefined;
  const prevHash = prevRow?.integrityHash ?? 'GENESIS_OG1_DATAFLOW';

  const beforeJson = input.beforeState ? JSON.stringify(input.beforeState) : null;
  const afterJson = input.afterState ? JSON.stringify(input.afterState) : null;

  const payload = [
    prevHash,
    timestamp,
    input.actorId ?? '',
    input.actorEmail,
    input.action,
    input.entityType,
    input.entityId,
    beforeJson ?? '',
    afterJson ?? '',
  ].join('|');

  const integrityHash = crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16);

  insertAuditStmt.run({
    timestamp,
    actorId: input.actorId,
    actorName: input.actorName,
    actorEmail: input.actorEmail,
    actorRole: input.actorRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    entityLabel: input.entityLabel,
    beforeState: beforeJson,
    afterState: afterJson,
    integrityHash,
  });
}

export function seedInitialData(): void {
  const countRow = db.prepare('SELECT COUNT(*) as total FROM users').get() as { total: number };
  if (countRow.total > 0) {
    return;
  }

  const now = new Date();
  const iso = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000).toISOString();

  const initialUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: Role;
    specialty: Specialty;
    cursorColor: string;
    federatedProvider: string | null;
  }> = [
    {
      id: 'usr-admin-silverio',
      name: 'Silverio Leite Jr',
      email: 'silverio.leitejr@og1.com.br',
      role: 'ADMIN',
      specialty: 'Governança / FinOps',
      cursorColor: '#0b41cd',
      federatedProvider: 'Microsoft Entra ID',
    },
    {
      id: 'usr-fac-camila',
      name: 'Camila Rocha',
      email: 'camila.rocha@og1.com.br',
      role: 'FACILITATOR',
      specialty: 'Engenharia de Dados',
      cursorColor: '#0f766e',
      federatedProvider: 'Microsoft Entra ID',
    },
    {
      id: 'usr-mem-rafael',
      name: 'Rafael Mendes',
      email: 'rafael.mendes@og1.com.br',
      role: 'MEMBER',
      specialty: 'IA / GenAI',
      cursorColor: '#6d28d9',
      federatedProvider: null,
    },
    {
      id: 'usr-mem-lucas',
      name: 'Lucas Oliveira',
      email: 'lucas.oliveira@og1.com.br',
      role: 'MEMBER',
      specialty: 'Analytics / BI',
      cursorColor: '#b45309',
      federatedProvider: null,
    },
    {
      id: 'usr-view-beatriz',
      name: 'Beatriz Nogueira',
      email: 'beatriz.nogueira@og1.com.br',
      role: 'VIEWER',
      specialty: 'Governança / FinOps',
      cursorColor: '#be123c',
      federatedProvider: 'Google Workspace',
    },
    {
      id: 'usr-fac-marina',
      name: 'Marina Costa',
      email: 'marina.costa@og1.com.br',
      role: 'FACILITATOR',
      specialty: 'IA / GenAI',
      cursorColor: '#0369a1',
      federatedProvider: null,
    },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (
      id, name, email, passwordHash, passwordSalt, passwordChangedByUser,
      role, specialty, cursorColor, active, federatedProvider, federatedSub, createdAt, updatedAt
    ) VALUES (
      @id, @name, @email, @passwordHash, @passwordSalt, 0,
      @role, @specialty, @cursorColor, 1, @federatedProvider, @federatedSub, @createdAt, @updatedAt
    )
  `);

  const insertCard = db.prepare(`
    INSERT INTO cards (
      id, title, discipline, painOpportunity, proposedSolution, expectedBenefit,
      implementationModel, effort, technicalArchitecture, prerequisitesDependencies,
      securityPrivacyRisks, mvpSuccessCriteria, technicalLead, stage,
      posX, posY, orderIndex, authorId, authorName, version, createdAt, updatedAt
    ) VALUES (
      @id, @title, @discipline, @painOpportunity, @proposedSolution, @expectedBenefit,
      @implementationModel, @effort, @technicalArchitecture, @prerequisitesDependencies,
      @securityPrivacyRisks, @mvpSuccessCriteria, @technicalLead, @stage,
      @posX, @posY, @orderIndex, @authorId, @authorName, 1, @createdAt, @updatedAt
    )
  `);

  const seedTx = db.transaction(() => {
    for (const u of initialUsers) {
      try {
        const { hash, salt } = hashPassword('og1@2026');
        insertUser.run({
          ...u,
          email: normalizeEmail(u.email),
          passwordHash: hash,
          passwordSalt: salt,
          federatedSub: u.federatedProvider ? `sso-${u.id}` : null,
          createdAt: iso(240),
          updatedAt: iso(240),
        });
      } catch (err) {
        console.error(`Erro ao inserir usuário ${u.email}:`, err);
        throw new Error(`Não foi possível criar usuário '${u.email}'. Verifique se este e-mail já está cadastrado.`);
      }
    }

    appendAuditLog({
      actorId: 'usr-admin-silverio',
      actorName: 'Silverio Leite Jr',
      actorEmail: 'silverio.leitejr@og1.com.br',
      actorRole: 'ADMIN',
      action: 'USER_BATCH_IMPORT',
      entityType: 'USER',
      entityId: 'seed-initial-q4',
      entityLabel: 'Carga inicial de participantes (6 contas)',
      beforeState: null,
      afterState: {
        createdCount: 6,
        updatedCount: 0,
        roles: { ADMIN: 1, FACILITATOR: 2, MEMBER: 2, VIEWER: 1 },
      },
      timestamp: iso(235),
    });

    const initialCards: Omit<IdeaCard, 'version' | 'pins'>[] = [
      {
        id: 'card-01',
        title: 'Copiloto SQL com Lineage Automático para Analistas de Negócio',
        discipline: 'IA / GenAI',
        painOpportunity:
          'Analistas de negócio aguardam até 4 dias por consultas ad-hoc no Lakehouse e desconhecem a origem exata de cada tabela certificada.',
        proposedSolution:
          'Assistente conversacional conectado ao catálogo de metadados que traduz perguntas em SQL validado, exibindo a linhagem das tabelas utilizadas.',
        expectedBenefit:
          'Redução de 60% na fila de tickets ad-hoc para o time de BI e aumento da autonomia analítica com governança.',
        implementationModel: 'In-House',
        effort: 'M',
        technicalArchitecture: '',
        prerequisitesDependencies: '',
        securityPrivacyRisks: '',
        mvpSuccessCriteria: '',
        technicalLead: '',
        stage: 'PITCH',
        posX: 35,
        posY: 32,
        orderIndex: 0,
        authorId: 'usr-mem-rafael',
        authorName: 'Rafael Mendes',
        createdAt: iso(180),
        updatedAt: iso(180),
      },
      {
        id: 'card-02',
        title: 'Detecção Preditiva de Quebra de Schema em Pipelines CDC',
        discipline: 'Engenharia de Dados',
        painOpportunity:
          'Alterações não comunicadas em bancos transacionais quebram cargas noturnas e atrasam painéis executivos às 08h.',
        proposedSolution:
          'Camada de contratos de dados com validação automática de drift de schema no barramento de ingestão e alertas antecipados.',
        expectedBenefit:
          'Queda de 85% nos incidentes P1 de ingestão matinal e garantia de SLA de atualização antes da abertura do expediente.',
        implementationModel: 'In-House',
        effort: 'P',
        technicalArchitecture: '',
        prerequisitesDependencies: '',
        securityPrivacyRisks: '',
        mvpSuccessCriteria: '',
        technicalLead: '',
        stage: 'PITCH',
        posX: 28,
        posY: 25,
        orderIndex: 1,
        authorId: 'usr-fac-camila',
        authorName: 'Camila Rocha',
        createdAt: iso(165),
        updatedAt: iso(165),
      },
      {
        id: 'card-03',
        title: 'Painel FinOps de Ociosidade em Clusters Lakehouse',
        discipline: 'Governança / FinOps',
        painOpportunity:
          'Clusters de processamento permanecem provisionados fora do horário de pico sem visibilidade de custo por squad.',
        proposedSolution:
          'Coleta automatizada de billing tags e telemetria de uso de compute com recomendações semanais de rightsizing e auto-pause.',
        expectedBenefit:
          'Economia estimada de 22% no gasto mensal de nuvem analítica já nos primeiros 60 dias de operação.',
        implementationModel: 'In-House',
        effort: 'P',
        technicalArchitecture:
          'Ingestão diária da API de billing via Cloud Functions para tabela particionada + alertas no Slack por centro de custo.',
        prerequisitesDependencies: 'Padronização das tags de squad nos clusters de produção e homologação.',
        securityPrivacyRisks: 'Acesso somente leitura às APIs de faturamento com segregação por perfil gestor.',
        mvpSuccessCriteria: '',
        technicalLead: 'Silverio Leite Jr',
        stage: 'EVALUATION',
        posX: 24,
        posY: 22,
        orderIndex: 0,
        authorId: 'usr-admin-silverio',
        authorName: 'Silverio Leite Jr',
        createdAt: iso(150),
        updatedAt: iso(130),
      },
      {
        id: 'card-04',
        title: 'Camada Semântica Unificada para KPIs Comerciais',
        discipline: 'Analytics / BI',
        painOpportunity:
          'Diretorias diferentes apresentam números divergentes de margem líquida e churn por cálculos duplicados em relatórios locais.',
        proposedSolution:
          'Definição centralizada de métricas versionadas em Git (Semantic Layer) consumida por Power BI, Looker e notebooks.',
        expectedBenefit:
          'Eliminação de divergências em reuniões de diretoria e redução de retrabalho na manutenção de fórmulas DAX/SQL.',
        implementationModel: 'Híbrido',
        effort: 'G',
        technicalArchitecture: '',
        prerequisitesDependencies: 'Alinhamento do glossário de métricas entre Finanças, Comercial e Operações.',
        securityPrivacyRisks: 'Aplicação de Row-Level Security (RLS) herdada da camada semântica.',
        mvpSuccessCriteria: '',
        technicalLead: '',
        stage: 'EVALUATION',
        posX: 74,
        posY: 26,
        orderIndex: 1,
        authorId: 'usr-mem-lucas',
        authorName: 'Lucas Oliveira',
        createdAt: iso(140),
        updatedAt: iso(120),
      },
      {
        id: 'card-05',
        title: 'Anonimização Automatizada de PII em Camada Bronze (LGPD)',
        discipline: 'Governança / FinOps',
        painOpportunity:
          'Ambientes de desenvolvimento e ciência de dados demandam extração manual de dados mascarados, atrasando experimentos em semanas.',
        proposedSolution:
          'Pipeline de classificação automática de colunas sensíveis (CPF, e-mail, telefone) com tokenização determinística na zona de staging.',
        expectedBenefit:
          'Conformidade auditável com LGPD e provisionamento de datasets seguros para squads de IA em menos de 1 hora.',
        implementationModel: 'In-House',
        effort: 'M',
        technicalArchitecture:
          'Job Spark/dbt com detector DLP integrado ao Unity Catalog + cofre KMS dedicado para chaves de tokenização por domínio.',
        prerequisitesDependencies:
          'Mapeamento das 15 tabelas prioritárias de clientes e aprovação do DPO sobre o algoritmo de pseudonimização.',
        securityPrivacyRisks:
          'Risco de reidentificação indireta por cruzamento de chaves; mitigado com rotação trimestral de salt e auditoria de acesso.',
        mvpSuccessCriteria:
          '100% das colunas PII das 15 tabelas prioritárias tokenizadas automaticamente com latência adicional < 8% e aprovação do DPO.',
        technicalLead: 'Camila Rocha',
        stage: 'EVALUATION',
        posX: 46,
        posY: 18,
        orderIndex: 2,
        authorId: 'usr-fac-camila',
        authorName: 'Camila Rocha',
        createdAt: iso(115),
        updatedAt: iso(60),
      },
      {
        id: 'card-06',
        title: 'Agente de Triagem de Incidentes de Qualidade de Dados',
        discipline: 'IA / GenAI',
        painOpportunity:
          'Plantonistas gastam mais de 45 minutos investigando logs dispersos para encontrar a causa raiz de falhas de completude.',
        proposedSolution:
          'Agente que correlaciona falhas de testes de qualidade, commits recentes e lineage para sugerir causa raiz e owner provável.',
        expectedBenefit:
          'Redução do MTTR de incidentes de dados de 45 min para menos de 12 min nas cargas críticas.',
        implementationModel: 'Híbrido',
        effort: 'G',
        technicalArchitecture:
          'Orquestrador orientado a eventos conectado ao catálogo de lineage, logs do Airflow e base histórica de post-mortems.',
        prerequisitesDependencies: 'Instrumentação padronizada de eventos de falha nos DAGs críticos.',
        securityPrivacyRisks: 'Mascaramento obrigatório de amostras de dados antes de envio ao modelo.',
        mvpSuccessCriteria: '',
        technicalLead: '',
        stage: 'EVALUATION',
        posX: 66,
        posY: 38,
        orderIndex: 3,
        authorId: 'usr-mem-rafael',
        authorName: 'Rafael Mendes',
        createdAt: iso(105),
        updatedAt: iso(45),
      },
      {
        id: 'card-07',
        title: 'Catálogo Federado de Data Products com SLA em Tempo Real',
        discipline: 'Engenharia de Dados',
        painOpportunity:
          'Consumidores de dados não sabem quais tabelas estão prontas para uso produtivo nem o nível de frescor garantido.',
        proposedSolution:
          'Portal interno de Data Products com contratos de SLA publicados, indicadores de frescor e fluxo de solicitação de acesso.',
        expectedBenefit:
          'Aumento na reutilização de ativos analíticos e redução de 40% na criação de pipelines redundantes.',
        implementationModel: 'In-House',
        effort: 'G',
        technicalArchitecture:
          'Metadata Graph sobre OpenMetadata federado por domínio, integrado ao CI/CD de pipelines para publicação automática de contratos.',
        prerequisitesDependencies:
          'Definição do template de contrato de Data Product e indicação de Data Owners nos 4 domínios centrais.',
        securityPrivacyRisks:
          'Controle de acesso RBAC integrado ao diretório corporativo; nenhum dado bruto exposto no catálogo.',
        mvpSuccessCriteria:
          '12 Data Products críticos catalogados com SLA monitorado automaticamente e >= 80% de adoção ativa pelos analistas no 1º trimestre.',
        technicalLead: 'Camila Rocha',
        stage: 'BACKLOG',
        posX: 68,
        posY: 20,
        orderIndex: 0,
        authorId: 'usr-fac-camila',
        authorName: 'Camila Rocha',
        createdAt: iso(95),
        updatedAt: iso(30),
      },
      {
        id: 'card-08',
        title: 'Self-Service BI com Governança de Métricas Certificadas',
        discipline: 'Analytics / BI',
        painOpportunity:
          'Áreas de negócio criam planilhas paralelas por lentidão na fila de novos painéis executivos.',
        proposedSolution:
          'Workspace self-service sobre datasets certificados com selo de governança, templates corporativos e monitoramento de uso.',
        expectedBenefit:
          'Tempo de entrega de análises táticas reduzido de 2 semanas para 2 dias mantendo fonte única da verdade.',
        implementationModel: 'SaaS / Managed',
        effort: 'M',
        technicalArchitecture:
          'Modelos semânticos certificados com publicação controlada por pipeline de promoção (Dev -> QA -> Prod) e auditoria de queries.',
        prerequisitesDependencies:
          'Treinamento de 20 power users das áreas Financeira e Comercial e publicação dos 3 datasets base.',
        securityPrivacyRisks:
          'Bloqueio de exportação irrestrita de dados granulares e aplicação de sensibilidade por perfil de usuário.',
        mvpSuccessCriteria:
          '20 power users habilitados, 3 domínios certificados em produção e redução de 50% nos pedidos de extração manual em 60 dias.',
        technicalLead: 'Lucas Oliveira',
        stage: 'BACKLOG',
        posX: 38,
        posY: 24,
        orderIndex: 1,
        authorId: 'usr-mem-lucas',
        authorName: 'Lucas Oliveira',
        createdAt: iso(85),
        updatedAt: iso(20),
      },
    ];

    for (const c of initialCards) {
      insertCard.run(c);
    }

    appendAuditLog({
      actorId: 'usr-fac-camila',
      actorName: 'Camila Rocha',
      actorEmail: 'camila.rocha@og1.com.br',
      actorRole: 'FACILITATOR',
      action: 'CARD_STAGE_CHANGED',
      entityType: 'CARD',
      entityId: 'card-07',
      entityLabel: 'Catálogo Federado de Data Products com SLA em Tempo Real',
      beforeState: {
        stage: 'REFINEMENT',
        technicalLead: 'Camila Rocha',
      },
      afterState: {
        stage: 'BACKLOG',
        technicalLead: 'Camila Rocha',
        qualityGate: 'APPROVED (3/3 critérios preenchidos)',
      },
      timestamp: iso(30),
    });

    appendAuditLog({
      actorId: 'usr-admin-silverio',
      actorName: 'Silverio Leite Jr',
      actorEmail: 'silverio.leitejr@og1.com.br',
      actorRole: 'ADMIN',
      action: 'CARD_STAGE_CHANGED',
      entityType: 'CARD',
      entityId: 'card-08',
      entityLabel: 'Self-Service BI com Governança de Métricas Certificadas',
      beforeState: {
        stage: 'REFINEMENT',
        technicalLead: 'Lucas Oliveira',
      },
      afterState: {
        stage: 'BACKLOG',
        technicalLead: 'Lucas Oliveira',
        qualityGate: 'APPROVED (3/3 critérios preenchidos)',
      },
      timestamp: iso(20),
    });
  });

  seedTx();
}

export function seedInitialPinsIfEmpty(): void {
  const pinCount = (db.prepare('SELECT COUNT(*) as total FROM card_pins').get() as { total: number })
    .total;
  if (pinCount > 0) return;

  const existingCardIds = new Set(
    (db.prepare('SELECT id FROM cards').all() as Array<{ id: string }>).map((r) => r.id)
  );
  if (existingCardIds.size === 0) return;

  const now = new Date().toISOString();
  const starterPins: Array<{ cardId: string; userId: string; userName: string; pinType: PinType }> = [
    { cardId: 'card-01', userId: 'usr-fac-camila', userName: 'Camila Rocha', pinType: 'vote_plus' },
    { cardId: 'card-01', userId: 'usr-admin-silverio', userName: 'Silverio Leite Jr', pinType: 'applause' },
    { cardId: 'card-03', userId: 'usr-fac-camila', userName: 'Camila Rocha', pinType: 'thumbs_up' },
    { cardId: 'card-05', userId: 'usr-admin-silverio', userName: 'Silverio Leite Jr', pinType: 'vote_plus' },
    { cardId: 'card-05', userId: 'usr-mem-rafael', userName: 'Rafael Mendes', pinType: 'heart' },
    { cardId: 'card-07', userId: 'usr-mem-lucas', userName: 'Lucas Oliveira', pinType: 'applause' },
  ];

  const insertPin = db.prepare(
    `INSERT OR IGNORE INTO card_pins (cardId, userId, userName, pinType, createdAt)
     VALUES (@cardId, @userId, @userName, @pinType, @createdAt)`
  );

  const tx = db.transaction(() => {
    for (const p of starterPins) {
      if (existingCardIds.has(p.cardId)) {
        insertPin.run({ ...p, createdAt: now });
      }
    }
  });
  tx();
}

export function seedAdditionalPitchCardsOnce(): void {
  const alreadySeeded = db
    .prepare("SELECT id FROM audit_logs WHERE entityId = 'card-09' LIMIT 1")
    .get();
  const existingCard09 = db.prepare("SELECT id FROM cards WHERE id = 'card-09'").get();
  if (alreadySeeded || existingCard09) {
    return;
  }

  const now = new Date();
  const iso = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000).toISOString();

  const currentPitchCount = (
    db.prepare("SELECT COUNT(*) as total FROM cards WHERE stage = 'PITCH'").get() as {
      total: number;
    }
  ).total;

  const newCards: Omit<IdeaCard, 'version' | 'pins'>[] = [
    // 4 cards de Engenharia de Dados
    {
      id: 'card-09',
      title: 'Ingestão Streaming Zero-Copy via Iceberg para Eventos de Pagamento',
      discipline: 'Engenharia de Dados',
      painOpportunity:
        'Reconciliação de transações financeiras depende de cargas batch noturnas com atraso de até 14 horas para detecção de divergências.',
      proposedSolution:
        'Pipeline de ingestão streaming gravando diretamente em tabelas Apache Iceberg com evolução segura de schema e latência sub-minuto.',
      expectedBenefit:
        'Redução de 90% na latência de reconciliação financeira e eliminação de duplicação de dados entre zonas raw e curated.',
      implementationModel: 'In-House',
      effort: 'G',
      technicalArchitecture: '',
      prerequisitesDependencies: '',
      securityPrivacyRisks: '',
      mvpSuccessCriteria: '',
      technicalLead: '',
      stage: 'PITCH',
      posX: 68,
      posY: 22,
      orderIndex: currentPitchCount + 0,
      authorId: 'usr-fac-camila',
      authorName: 'Camila Rocha',
      createdAt: iso(19),
      updatedAt: iso(19),
    },
    {
      id: 'card-10',
      title: 'Observabilidade de Latência Ponta a Ponta em Pipelines Spark/dbt',
      discipline: 'Engenharia de Dados',
      painOpportunity:
        'Gargalos em jobs intermediários só são descobertos quando o SLA final do dashboard executivo é violado.',
      proposedSolution:
        'Instrumentação OpenLineage capturando tempo de execução, volume processado e atraso por tabela em cada etapa do DAG.',
      expectedBenefit:
        'Identificação proativa de degradação de performance e redução de 45% no tempo de diagnóstico de atrasos.',
      implementationModel: 'Híbrido',
      effort: 'M',
      technicalArchitecture: '',
      prerequisitesDependencies: '',
      securityPrivacyRisks: '',
      mvpSuccessCriteria: '',
      technicalLead: '',
      stage: 'PITCH',
      posX: 44,
      posY: 28,
      orderIndex: currentPitchCount + 1,
      authorId: 'usr-fac-camila',
      authorName: 'Camila Rocha',
      createdAt: iso(18),
      updatedAt: iso(18),
    },
    {
      id: 'card-11',
      title: 'Orquestração Orientada a Eventos com Auto-Recovery de Cargas Críticas',
      discipline: 'Engenharia de Dados',
      painOpportunity:
        'Falhas transitórias de rede ou throttling em APIs externas exigem reprocessamento manual pelo time de plantão.',
      proposedSolution:
        'Orquestrador orientado a eventos com backoff inteligente, dead-letter queue e replay automático idempotente das partições afetadas.',
      expectedBenefit:
        'Queda de 70% em acionamentos manuais fora do horário comercial e maior resiliência dos fluxos regulatórios.',
      implementationModel: 'In-House',
      effort: 'M',
      technicalArchitecture: '',
      prerequisitesDependencies: '',
      securityPrivacyRisks: '',
      mvpSuccessCriteria: '',
      technicalLead: '',
      stage: 'PITCH',
      posX: 48,
      posY: 34,
      orderIndex: currentPitchCount + 2,
      authorId: 'usr-admin-silverio',
      authorName: 'Silverio Leite Jr',
      createdAt: iso(17),
      updatedAt: iso(17),
    },
    {
      id: 'card-12',
      title: 'Compactação Inteligente de Small Files no Data Lakehouse',
      discipline: 'Engenharia de Dados',
      painOpportunity:
        'Partições com milhares de arquivos Parquet minúsculos degradam consultas analíticas e inflam o custo de leitura em nuvem.',
      proposedSolution:
        'Rotina automatizada de manutenção que monitora fragmentação por tabela e agenda compactação e Z-Ordering fora do horário de pico.',
      expectedBenefit:
        'Consultas analíticas até 3x mais rápidas e economia estimada de 18% no custo de I/O e compute do Lakehouse.',
      implementationModel: 'In-House',
      effort: 'P',
      technicalArchitecture: '',
      prerequisitesDependencies: '',
      securityPrivacyRisks: '',
      mvpSuccessCriteria: '',
      technicalLead: '',
      stage: 'PITCH',
      posX: 22,
      posY: 26,
      orderIndex: currentPitchCount + 3,
      authorId: 'usr-fac-camila',
      authorName: 'Camila Rocha',
      createdAt: iso(16),
      updatedAt: iso(16),
    },

    // 2 cards de Analytics / BI
    {
      id: 'card-13',
      title: 'Painel Executivo de Margem e Retenção em Tempo Quase Real',
      discipline: 'Analytics / BI',
      painOpportunity:
        'A diretoria comercial acompanha margem por canal e churn apenas no fechamento mensal, sem visibilidade intra-semana.',
      proposedSolution:
        'Painel unificado sobre camada semântica certificada com atualização horária, drill-down por região e comparativo de metas.',
      expectedBenefit:
        'Ações comerciais corretivas na mesma semana e aumento projetado de 4% na retenção de contas estratégicas.',
      implementationModel: 'In-House',
      effort: 'M',
      technicalArchitecture: '',
      prerequisitesDependencies: '',
      securityPrivacyRisks: '',
      mvpSuccessCriteria: '',
      technicalLead: '',
      stage: 'PITCH',
      posX: 42,
      posY: 20,
      orderIndex: currentPitchCount + 4,
      authorId: 'usr-mem-lucas',
      authorName: 'Lucas Oliveira',
      createdAt: iso(15),
      updatedAt: iso(15),
    },
    {
      id: 'card-14',
      title: 'Alertas Automáticos de Anomalia em KPIs Comerciais no Teams',
      discipline: 'Analytics / BI',
      painOpportunity:
        'Quedas abruptas de conversão ou ticket médio passam despercebidas até a reunião semanal de acompanhamento.',
      proposedSolution:
        'Detector estatístico de desvios fora da sazonalidade integrado aos datasets de BI com alertas contextuais enviados ao Microsoft Teams.',
      expectedBenefit:
        'Detecção de quedas operacionais em minutos e redução do tempo de reação das lideranças comerciais.',
      implementationModel: 'SaaS / Managed',
      effort: 'P',
      technicalArchitecture: '',
      prerequisitesDependencies: '',
      securityPrivacyRisks: '',
      mvpSuccessCriteria: '',
      technicalLead: '',
      stage: 'PITCH',
      posX: 25,
      posY: 30,
      orderIndex: currentPitchCount + 5,
      authorId: 'usr-mem-lucas',
      authorName: 'Lucas Oliveira',
      createdAt: iso(14),
      updatedAt: iso(14),
    },

    // 4 cards de IA / GenAI
    {
      id: 'card-15',
      title: 'RAG Corporativo sobre Contratos e Políticas Internas com Citações',
      discipline: 'IA / GenAI',
      painOpportunity:
        'Equipes jurídicas, comerciais e de governança perdem horas procurando cláusulas e normas em centenas de PDFs dispersos.',
      proposedSolution:
        'Busca semântica e assistente RAG indexando documentos versionados com respostas fundamentadas e link direto para o trecho original.',
      expectedBenefit:
        'Redução de 65% no tempo de consulta a políticas e contratos, com rastreabilidade completa das fontes citadas.',
      implementationModel: 'In-House',
      effort: 'M',
      technicalArchitecture: '',
      prerequisitesDependencies: '',
      securityPrivacyRisks: '',
      mvpSuccessCriteria: '',
      technicalLead: '',
      stage: 'PITCH',
      posX: 46,
      posY: 22,
      orderIndex: currentPitchCount + 6,
      authorId: 'usr-mem-rafael',
      authorName: 'Rafael Mendes',
      createdAt: iso(13),
      updatedAt: iso(13),
    },
    {
      id: 'card-16',
      title: 'Gerador Automático de Documentação e Testes de Qualidade dbt via LLM',
      discipline: 'IA / GenAI',
      painOpportunity:
        'Modelos dbt crescem sem descrições de colunas nem testes de integridade, elevando o risco de regressões em produção.',
      proposedSolution:
        'Integração no CI/CD que analisa Pull Requests SQL e sugere automaticamente arquivos schema.yml com descrições e testes unitários.',
      expectedBenefit:
        'Cobertura de documentação e testes acima de 90% nos novos modelos com mínimo esforço manual dos engenheiros.',
      implementationModel: 'In-House',
      effort: 'P',
      technicalArchitecture: '',
      prerequisitesDependencies: '',
      securityPrivacyRisks: '',
      mvpSuccessCriteria: '',
      technicalLead: '',
      stage: 'PITCH',
      posX: 26,
      posY: 24,
      orderIndex: currentPitchCount + 7,
      authorId: 'usr-fac-marina',
      authorName: 'Marina Costa',
      createdAt: iso(12),
      updatedAt: iso(12),
    },
    {
      id: 'card-17',
      title: 'Classificador Inteligente de Chamados N1 com Roteamento Preditivo',
      discipline: 'IA / GenAI',
      painOpportunity:
        'Mais de 35% dos chamados de dados são redirecionados entre filas múltiplas vezes antes de chegar ao squad responsável.',
      proposedSolution:
        'Modelo de classificação e extração de entidades que categoriza o incidente, identifica o ativo de dados e roteia com sugestão de runbook.',
      expectedBenefit:
        'Redução de 50% no tempo de triagem inicial e melhoria expressiva no SLA de atendimento interno.',
      implementationModel: 'Híbrido',
      effort: 'M',
      technicalArchitecture: '',
      prerequisitesDependencies: '',
      securityPrivacyRisks: '',
      mvpSuccessCriteria: '',
      technicalLead: '',
      stage: 'PITCH',
      posX: 45,
      posY: 32,
      orderIndex: currentPitchCount + 8,
      authorId: 'usr-mem-rafael',
      authorName: 'Rafael Mendes',
      createdAt: iso(11),
      updatedAt: iso(11),
    },
    {
      id: 'card-18',
      title: 'Simulador Conversacional de Cenários Financeiros (What-If GenAI)',
      discipline: 'IA / GenAI',
      painOpportunity:
        'Simulações de sensibilidade de receita, câmbio e custo exigem manipulação manual de planilhas complexas pelo time de FP&A.',
      proposedSolution:
        'Interface conversacional conectada a modelos determinísticos de projeção que traduz cenários em simulações auditáveis e gráficos comparativos.',
      expectedBenefit:
        'Ciclo de planejamento orçamentário 4x mais ágil com cenários comparáveis ao vivo durante reuniões executivas.',
      implementationModel: 'Híbrido',
      effort: 'G',
      technicalArchitecture: '',
      prerequisitesDependencies: '',
      securityPrivacyRisks: '',
      mvpSuccessCriteria: '',
      technicalLead: '',
      stage: 'PITCH',
      posX: 72,
      posY: 24,
      orderIndex: currentPitchCount + 9,
      authorId: 'usr-fac-marina',
      authorName: 'Marina Costa',
      createdAt: iso(10),
      updatedAt: iso(10),
    },
  ];

  const insertCard = db.prepare(`
    INSERT OR IGNORE INTO cards (
      id, title, discipline, painOpportunity, proposedSolution, expectedBenefit,
      implementationModel, effort, technicalArchitecture, prerequisitesDependencies,
      securityPrivacyRisks, mvpSuccessCriteria, technicalLead, stage,
      posX, posY, orderIndex, authorId, authorName, version, createdAt, updatedAt
    ) VALUES (
      @id, @title, @discipline, @painOpportunity, @proposedSolution, @expectedBenefit,
      @implementationModel, @effort, @technicalArchitecture, @prerequisitesDependencies,
      @securityPrivacyRisks, @mvpSuccessCriteria, @technicalLead, @stage,
      @posX, @posY, @orderIndex, @authorId, @authorName, 1, @createdAt, @updatedAt
    )
  `);

  const tx = db.transaction(() => {
    for (const c of newCards) {
      try {
        const info = insertCard.run(c);
        if (info.changes > 0) {
          appendAuditLog({
            actorId: c.authorId,
            actorName: c.authorName,
            actorEmail:
              c.authorId === 'usr-fac-camila'
                ? 'camila.rocha@og1.com.br'
                : c.authorId === 'usr-admin-silverio'
                ? 'silverio.leitejr@og1.com.br'
                : c.authorId === 'usr-mem-lucas'
                ? 'lucas.oliveira@og1.com.br'
                : c.authorId === 'usr-mem-rafael'
                ? 'rafael.mendes@og1.com.br'
                : 'marina.costa@og1.com.br',
            actorRole:
              c.authorId === 'usr-admin-silverio'
                ? 'ADMIN'
                : c.authorId.startsWith('usr-fac-')
                ? 'FACILITATOR'
                : 'MEMBER',
            action: 'CARD_CREATED',
            entityType: 'CARD',
            entityId: c.id,
            entityLabel: c.title,
            beforeState: null,
            afterState: {
              title: c.title,
              discipline: c.discipline,
              effort: c.effort,
              stage: c.stage,
              implementationModel: c.implementationModel,
            },
            timestamp: c.createdAt,
          });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro desconhecido ao inserir card';
        throw new ApiError(`Erro ao criar card "${c.title}": ${message}`, 500, {
          code: 'CONSTRAINT_ERROR',
          missingFields: [],
        });
      }
    }
  });
  tx();
}

