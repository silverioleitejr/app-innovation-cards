/**
 * Kysely Database Adapter for Innovation Board.
 *
 * Selects the database engine dynamically from `.env` (`APP_ENV`):
 * - `APP_ENV="DEV"` (default): uses SQLite (`better-sqlite3`) via Kysely `SqliteDialect`.
 * - `APP_ENV="PRD"`: uses PostgreSQL (`pg.Pool`) via Kysely `PostgresDialect` with `.env` DB variables.
 */
import 'dotenv/config';
import type BetterSqlite3 from 'better-sqlite3';
import { CompiledQuery, Kysely, PostgresDialect, SqliteDialect, sql } from 'kysely';
import pg from 'pg';
import type { DatabaseSchema } from './schema.ts';

export type AppEnvironment = 'DEV' | 'PRD';

export interface DatabaseEnvironmentConfig {
  appEnv: AppEnvironment;
  engine: 'sqlite' | 'postgresql';
  sqlitePath: string;
  postgres: {
    connectionString?: string;
    host?: string;
    port: number;
    database?: string;
    user?: string;
    password?: string;
    ssl: boolean;
    maxPool: number;
  };
}

// Configure pg to parse int8 (BIGINT / COUNT) as JavaScript number
pg.types.setTypeParser(20, (val: string) => parseInt(val, 10));

export function resolveDatabaseConfig(): DatabaseEnvironmentConfig {
  const rawEnv = (process.env.APP_ENV || 'DEV').trim().toUpperCase();
  const appEnv: AppEnvironment = rawEnv === 'PRD' || rawEnv === 'PROD' || rawEnv === 'PRODUCTION' ? 'PRD' : 'DEV';

  const sqlitePath = (process.env.SQLITE_DB_PATH || 'db/innovation-board.db').trim();
  const rawConnectionString = (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DB_URL ||
    ''
  ).trim();
  const host = (process.env.DB_HOST || process.env.POSTGRES_HOST || process.env.PGHOST || '').trim() || undefined;
  const port = Number(process.env.DB_PORT || process.env.POSTGRES_PORT || process.env.PGPORT || 5432);
  const database = (
    process.env.DB_NAME ||
    process.env.DB_DATABASE ||
    process.env.POSTGRES_DB ||
    process.env.PGDATABASE ||
    ''
  ).trim() || undefined;
  const user = (
    process.env.DB_USER ||
    process.env.DB_USERNAME ||
    process.env.POSTGRES_USER ||
    process.env.PGUSER ||
    ''
  ).trim() || undefined;
  const password =
    process.env.DB_PASSWORD ??
    process.env.DB_PASS ??
    process.env.POSTGRES_PASSWORD ??
    process.env.PGPASSWORD ??
    undefined;

  const isPlaceholderUrl =
    !rawConnectionString ||
    rawConnectionString.includes('postgres:password@localhost:5432/innovation_board') ||
    (Boolean(host && host !== 'localhost' && host !== '127.0.0.1') && rawConnectionString.includes('localhost'));

  const connectionString = isPlaceholderUrl ? undefined : rawConnectionString;
  const rawSsl = (
    process.env.DB_SSL ||
    process.env.POSTGRES_SSL ||
    process.env.PGSSLMODE ||
    ''
  ).trim().toLowerCase();
  const ssl =
    rawSsl === 'true' ||
    rawSsl === '1' ||
    rawSsl === 'require' ||
    rawSsl === 'verify-full' ||
    Boolean(connectionString?.includes('sslmode=require')) ||
    Boolean(host && (host.includes('supabase.') || host.includes('neon.tech') || host.includes('render.com')));
  const maxPool = Number(process.env.DB_POOL_MAX || 10);

  if (appEnv === 'PRD') {
    const hasUrl = Boolean(connectionString);
    const hasDiscreteVars = Boolean(host && database && user);
    if (!hasUrl && !hasDiscreteVars) {
      throw new Error(
        '[Kysely Adapter] APP_ENV=PRD requires PostgreSQL configuration in .env: set DATABASE_URL or (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD).'
      );
    }
  }

  return {
    appEnv,
    engine: appEnv === 'PRD' ? 'postgresql' : 'sqlite',
    sqlitePath,
    postgres: {
      connectionString,
      host,
      port: Number.isFinite(port) && port > 0 ? port : 5432,
      database,
      user,
      password,
      ssl,
      maxPool: Number.isFinite(maxPool) && maxPool > 0 ? maxPool : 10,
    },
  };
}

let activeKysely: Kysely<DatabaseSchema> | null = null;
let activePgPool: pg.Pool | null = null;
let activeConfig: DatabaseEnvironmentConfig | null = null;

/**
 * Initializes and returns the singleton Kysely<DatabaseSchema> instance.
 * - In `DEV`: binds `SqliteDialect` to the active `better-sqlite3` instance.
 * - In `PRD`: binds `PostgresDialect` to a `pg.Pool` configured from `.env`.
 */
export function createKyselyAdapter(sqliteDb: BetterSqlite3.Database): {
  kysely: Kysely<DatabaseSchema>;
  config: DatabaseEnvironmentConfig;
} {
  if (activeKysely && activeConfig) {
    return { kysely: activeKysely, config: activeConfig };
  }

  const config = resolveDatabaseConfig();
  activeConfig = config;

  if (config.appEnv === 'PRD') {
    const poolConfig: pg.PoolConfig = config.postgres.connectionString
      ? {
          connectionString: config.postgres.connectionString,
          ssl: config.postgres.ssl ? { rejectUnauthorized: false } : undefined,
          max: config.postgres.maxPool,
        }
      : {
          host: config.postgres.host,
          port: config.postgres.port,
          database: config.postgres.database,
          user: config.postgres.user,
          password: config.postgres.password,
          ssl: config.postgres.ssl ? { rejectUnauthorized: false } : undefined,
          max: config.postgres.maxPool,
        };

    activePgPool = new pg.Pool(poolConfig);
    activeKysely = new Kysely<DatabaseSchema>({
      dialect: new PostgresDialect({
        pool: activePgPool,
      }),
    });
  } else {
    activeKysely = new Kysely<DatabaseSchema>({
      dialect: new SqliteDialect({
        database: sqliteDb,
      }),
    });
  }

  return { kysely: activeKysely, config };
}

/**
 * Ensures PostgreSQL schema exists when running in `APP_ENV=PRD` and hydrates
 * existing PostgreSQL records into the runtime engine (or seeds PostgreSQL if empty).
 */
export async function initializePostgresIfPrd(
  kysely: Kysely<DatabaseSchema>,
  sqliteDb: BetterSqlite3.Database,
  config: DatabaseEnvironmentConfig
): Promise<void> {
  if (config.appEnv !== 'PRD') {
    return;
  }

  // Create the 7 canonical tables in PostgreSQL with quoted camelCase identifiers
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "passwordHash" TEXT NOT NULL,
      "passwordSalt" TEXT NOT NULL,
      "passwordChangedByUser" INTEGER NOT NULL DEFAULT 0,
      "role" TEXT NOT NULL CHECK("role" IN ('ADMIN', 'FACILITATOR', 'MEMBER', 'VIEWER')),
      "specialty" TEXT NOT NULL,
      "cursorColor" TEXT NOT NULL,
      "active" INTEGER NOT NULL DEFAULT 1,
      "federatedProvider" TEXT,
      "federatedSub" TEXT,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    );
  `.execute(kysely);

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      "token" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES users("id") ON DELETE CASCADE,
      "createdAt" TEXT NOT NULL,
      "expiresAt" TEXT NOT NULL
    );
  `.execute(kysely);

  await sql`
    CREATE TABLE IF NOT EXISTS cards (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL,
      "discipline" TEXT NOT NULL,
      "painOpportunity" TEXT NOT NULL DEFAULT '',
      "proposedSolution" TEXT NOT NULL DEFAULT '',
      "expectedBenefit" TEXT NOT NULL DEFAULT '',
      "implementationModel" TEXT NOT NULL DEFAULT 'In-House',
      "effort" TEXT NOT NULL DEFAULT 'M',
      "technicalArchitecture" TEXT NOT NULL DEFAULT '',
      "prerequisitesDependencies" TEXT NOT NULL DEFAULT '',
      "securityPrivacyRisks" TEXT NOT NULL DEFAULT '',
      "mvpSuccessCriteria" TEXT NOT NULL DEFAULT '',
      "technicalLead" TEXT NOT NULL DEFAULT '',
      "stage" TEXT NOT NULL CHECK("stage" IN ('PITCH', 'EVALUATION', 'REFINEMENT', 'BACKLOG')),
      "posX" DOUBLE PRECISION NOT NULL DEFAULT 50,
      "posY" DOUBLE PRECISION NOT NULL DEFAULT 50,
      "orderIndex" INTEGER NOT NULL DEFAULT 0,
      "authorId" TEXT NOT NULL,
      "authorName" TEXT NOT NULL,
      "version" INTEGER NOT NULL DEFAULT 1,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    );
  `.execute(kysely);

  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      "id" SERIAL PRIMARY KEY,
      "timestamp" TEXT NOT NULL,
      "actorId" TEXT,
      "actorName" TEXT NOT NULL,
      "actorEmail" TEXT NOT NULL,
      "actorRole" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT NOT NULL,
      "entityLabel" TEXT NOT NULL,
      "beforeState" TEXT,
      "afterState" TEXT,
      "integrityHash" TEXT NOT NULL
    );
  `.execute(kysely);

  await sql`
    CREATE TABLE IF NOT EXISTS card_pins (
      "cardId" TEXT NOT NULL REFERENCES cards("id") ON DELETE CASCADE,
      "userId" TEXT NOT NULL,
      "userName" TEXT NOT NULL,
      "pinType" TEXT NOT NULL CHECK("pinType" IN ('vote_plus', 'applause', 'thumbs_up', 'thumbs_down', 'heart')),
      "votingSessionId" TEXT,
      "createdAt" TEXT NOT NULL,
      PRIMARY KEY ("cardId", "userId")
    );
  `.execute(kysely);

  await sql`
    CREATE TABLE IF NOT EXISTS board_voting_state (
      "id" TEXT PRIMARY KEY CHECK("id" = 'default'),
      "votingOpen" INTEGER NOT NULL DEFAULT 1,
      "currentSessionId" TEXT,
      "talliedAt" TEXT,
      "topIdeasJson" TEXT NOT NULL DEFAULT '[]',
      "updatedAt" TEXT NOT NULL,
      "updatedBy" TEXT
    );
  `.execute(kysely);

  await sql`
    CREATE TABLE IF NOT EXISTS voting_sessions (
      "id" TEXT PRIMARY KEY,
      "sessionNumber" INTEGER NOT NULL,
      "sessionDate" TEXT,
      "status" TEXT NOT NULL CHECK("status" IN ('OPEN', 'CLOSED')),
      "openedById" TEXT,
      "openedBy" TEXT NOT NULL,
      "openedAt" TEXT NOT NULL,
      "closedBy" TEXT,
      "closedAt" TEXT,
      "talliedAt" TEXT,
      "totalVotes" INTEGER NOT NULL DEFAULT 0,
      "presentUserIdsJson" TEXT NOT NULL DEFAULT '[]',
      "absentUserIdsJson" TEXT NOT NULL DEFAULT '[]',
      "initialPitchCount" INTEGER NOT NULL DEFAULT 0,
      "initialEvaluationCount" INTEGER NOT NULL DEFAULT 0,
      "initialBacklogCount" INTEGER NOT NULL DEFAULT 0,
      "newCardIdsJson" TEXT NOT NULL DEFAULT '[]',
      "votedCardIdsJson" TEXT NOT NULL DEFAULT '[]',
      "evaluatedCardIdsJson" TEXT NOT NULL DEFAULT '[]',
      "backlogCardIdsJson" TEXT NOT NULL DEFAULT '[]',
      "topIdeasJson" TEXT NOT NULL DEFAULT '[]',
      "movedCardTitlesJson" TEXT NOT NULL DEFAULT '[]'
    );
  `.execute(kysely);

  // Check if PostgreSQL already has users; if so, hydrate local cache from PostgreSQL, otherwise push initial seed to PostgreSQL
  const pgUsers = await kysely.selectFrom('users').selectAll().execute();
  if (pgUsers.length > 0) {
    const [pgSessions, pgCards, pgPins, pgVotingState, pgVotingSessions, pgAudits] = await Promise.all([
      kysely.selectFrom('sessions').selectAll().execute(),
      kysely.selectFrom('cards').selectAll().execute(),
      kysely.selectFrom('card_pins').selectAll().execute(),
      kysely.selectFrom('board_voting_state').selectAll().execute(),
      kysely.selectFrom('voting_sessions').selectAll().execute(),
      kysely.selectFrom('audit_logs').selectAll().orderBy('id', 'asc').execute(),
    ]);

    const hydrateTx = sqliteDb.transaction(() => {
      sqliteDb.exec('DELETE FROM card_pins; DELETE FROM sessions; DELETE FROM cards; DELETE FROM voting_sessions; DELETE FROM board_voting_state; DELETE FROM audit_logs; DELETE FROM users;');

      const insUser = sqliteDb.prepare(
        `INSERT INTO users (id, name, email, passwordHash, passwordSalt, passwordChangedByUser, role, specialty, cursorColor, active, federatedProvider, federatedSub, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const u of pgUsers) {
        insUser.run(u.id, u.name, u.email, u.passwordHash, u.passwordSalt, u.passwordChangedByUser, u.role, u.specialty, u.cursorColor, u.active, u.federatedProvider, u.federatedSub, u.createdAt, u.updatedAt);
      }

      const insSession = sqliteDb.prepare(`INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)`);
      for (const s of pgSessions) {
        insSession.run(s.token, s.userId, s.createdAt, s.expiresAt);
      }

      const insCard = sqliteDb.prepare(
        `INSERT INTO cards (id, title, discipline, painOpportunity, proposedSolution, expectedBenefit, implementationModel, effort, technicalArchitecture, prerequisitesDependencies, securityPrivacyRisks, mvpSuccessCriteria, technicalLead, stage, posX, posY, orderIndex, authorId, authorName, version, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const c of pgCards) {
        insCard.run(c.id, c.title, c.discipline, c.painOpportunity, c.proposedSolution, c.expectedBenefit, c.implementationModel, c.effort, c.technicalArchitecture, c.prerequisitesDependencies, c.securityPrivacyRisks, c.mvpSuccessCriteria, c.technicalLead, c.stage, c.posX, c.posY, c.orderIndex, c.authorId, c.authorName, c.version, c.createdAt, c.updatedAt);
      }

      const insPin = sqliteDb.prepare(
        `INSERT INTO card_pins (cardId, userId, userName, pinType, votingSessionId, createdAt) VALUES (?, ?, ?, ?, ?, ?)`
      );
      for (const p of pgPins) {
        insPin.run(p.cardId, p.userId, p.userName, p.pinType, p.votingSessionId, p.createdAt);
      }

      const insState = sqliteDb.prepare(
        `INSERT INTO board_voting_state (id, votingOpen, currentSessionId, talliedAt, topIdeasJson, updatedAt, updatedBy) VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      for (const st of pgVotingState) {
        insState.run(st.id, st.votingOpen, st.currentSessionId, st.talliedAt, st.topIdeasJson, st.updatedAt, st.updatedBy);
      }

      const insVs = sqliteDb.prepare(
        `INSERT INTO voting_sessions (id, sessionNumber, sessionDate, status, openedById, openedBy, openedAt, closedBy, closedAt, talliedAt, totalVotes, presentUserIdsJson, absentUserIdsJson, initialPitchCount, initialEvaluationCount, initialBacklogCount, newCardIdsJson, votedCardIdsJson, evaluatedCardIdsJson, backlogCardIdsJson, topIdeasJson, movedCardTitlesJson)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const vs of pgVotingSessions) {
        insVs.run(vs.id, vs.sessionNumber, vs.sessionDate, vs.status, vs.openedById, vs.openedBy, vs.openedAt, vs.closedBy, vs.closedAt, vs.talliedAt, vs.totalVotes, vs.presentUserIdsJson, vs.absentUserIdsJson, vs.initialPitchCount, vs.initialEvaluationCount, vs.initialBacklogCount, vs.newCardIdsJson, vs.votedCardIdsJson, vs.evaluatedCardIdsJson, vs.backlogCardIdsJson, vs.topIdeasJson, vs.movedCardTitlesJson);
      }

      const insAudit = sqliteDb.prepare(
        `INSERT INTO audit_logs (id, timestamp, actorId, actorName, actorEmail, actorRole, action, entityType, entityId, entityLabel, beforeState, afterState, integrityHash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const a of pgAudits) {
        insAudit.run(a.id, a.timestamp, a.actorId, a.actorName, a.actorEmail, a.actorRole, a.action, a.entityType, a.entityId, a.entityLabel, a.beforeState, a.afterState, a.integrityHash);
      }
    });

    hydrateTx();
  } else {
    // Seed PostgreSQL from the initialized local seed data using Kysely
    await syncSnapshotToPostgres(kysely, sqliteDb);
  }
}

/**
 * Synchronizes current state to PostgreSQL using Kysely typed queries when in `APP_ENV=PRD`.
 */
export async function syncSnapshotToPostgres(
  kysely: Kysely<DatabaseSchema>,
  sqliteDb: BetterSqlite3.Database
): Promise<void> {
  const users = sqliteDb.prepare('SELECT * FROM users').all() as DatabaseSchema['users'][];
  for (const u of users) {
    await kysely
      .insertInto('users')
      .values(u)
      .onConflict((oc) => oc.column('id').doUpdateSet(u))
      .execute();
  }

  const cards = sqliteDb.prepare('SELECT * FROM cards').all() as DatabaseSchema['cards'][];
  for (const c of cards) {
    await kysely
      .insertInto('cards')
      .values(c)
      .onConflict((oc) => oc.column('id').doUpdateSet(c))
      .execute();
  }

  const pins = sqliteDb.prepare('SELECT * FROM card_pins').all() as DatabaseSchema['card_pins'][];
  for (const p of pins) {
    await kysely
      .insertInto('card_pins')
      .values(p)
      .onConflict((oc) => oc.columns(['cardId', 'userId']).doUpdateSet(p))
      .execute();
  }

  const states = sqliteDb.prepare('SELECT * FROM board_voting_state').all() as DatabaseSchema['board_voting_state'][];
  for (const st of states) {
    await kysely
      .insertInto('board_voting_state')
      .values(st)
      .onConflict((oc) => oc.column('id').doUpdateSet(st))
      .execute();
  }

  const vSessions = sqliteDb.prepare('SELECT * FROM voting_sessions').all() as DatabaseSchema['voting_sessions'][];
  for (const vs of vSessions) {
    await kysely
      .insertInto('voting_sessions')
      .values(vs)
      .onConflict((oc) => oc.column('id').doUpdateSet(vs))
      .execute();
  }
}

const CAMEL_COLUMNS = [
  'passwordHash',
  'passwordSalt',
  'passwordChangedByUser',
  'cursorColor',
  'federatedProvider',
  'federatedSub',
  'createdAt',
  'updatedAt',
  'userId',
  'expiresAt',
  'painOpportunity',
  'proposedSolution',
  'expectedBenefit',
  'implementationModel',
  'technicalArchitecture',
  'prerequisitesDependencies',
  'securityPrivacyRisks',
  'mvpSuccessCriteria',
  'technicalLead',
  'posX',
  'posY',
  'orderIndex',
  'authorId',
  'authorName',
  'actorId',
  'actorName',
  'actorEmail',
  'actorRole',
  'entityType',
  'entityId',
  'entityLabel',
  'beforeState',
  'afterState',
  'integrityHash',
  'cardId',
  'userName',
  'pinType',
  'votingSessionId',
  'votingOpen',
  'currentSessionId',
  'talliedAt',
  'topIdeasJson',
  'updatedBy',
  'sessionNumber',
  'sessionDate',
  'openedById',
  'openedBy',
  'openedAt',
  'closedBy',
  'closedAt',
  'totalVotes',
  'presentUserIdsJson',
  'absentUserIdsJson',
  'initialPitchCount',
  'initialEvaluationCount',
  'initialBacklogCount',
  'newCardIdsJson',
  'votedCardIdsJson',
  'evaluatedCardIdsJson',
  'backlogCardIdsJson',
  'movedCardTitlesJson',
];

/**
 * Translates a SQLite parameterized mutation (`?`) into PostgreSQL (`$1, $2...`)
 * with quoted camelCase identifiers and executes it through Kysely when `APP_ENV=PRD`.
 */
export function replicateMutationToPostgresIfPrd(sqlText: string, params: unknown[]): void {
  if (!activeKysely || !activeConfig || activeConfig.appEnv !== 'PRD') {
    return;
  }

  const trimmed = sqlText.trim();
  if (!/^(INSERT|UPDATE|DELETE)\b/i.test(trimmed)) {
    return;
  }

  let pgSql = trimmed.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, 'INSERT INTO');
  for (const col of CAMEL_COLUMNS) {
    const regex = new RegExp(`(?<!")\\b${col}\\b(?!")`, 'g');
    pgSql = pgSql.replace(regex, `"${col}"`);
  }

  let paramIndex = 0;
  pgSql = pgSql.replace(/\?/g, () => {
    paramIndex += 1;
    return `$${paramIndex}`;
  });

  if (/INSERT\s+OR\s+IGNORE\s+INTO/i.test(trimmed) && !/ON\s+CONFLICT/i.test(pgSql)) {
    pgSql = `${pgSql.replace(/;$/, '')} ON CONFLICT DO NOTHING`;
  }

  const compiled = CompiledQuery.raw(pgSql, params);
  activeKysely.executeQuery(compiled).catch((err) => {
    console.error('[Kysely PRD] Asynchronous PostgreSQL replication warning:', err);
  });
}

export async function closeKyselyAdapter(): Promise<void> {
  if (activeKysely) {
    await activeKysely.destroy();
    activeKysely = null;
    activePgPool = null;
  }
}
