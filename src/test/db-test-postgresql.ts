/**
 * PostgreSQL Connection Diagnostic Script (`src/test/db-test-postgresql.ts`).
 *
 * Validates PostgreSQL connection parameters configured in `.env` using Kysely
 * (`PostgresDialect`) and `pg.Pool`, masking all sensitive credentials in output.
 *
 * Usage:
 *   npx tsx src/test/db-test-postgresql.ts
 *   npm run test:db:pg
 */
import 'dotenv/config';
import { Kysely, PostgresDialect, sql } from 'kysely';
import pg from 'pg';
import { resolveDatabaseConfig } from '../../db/kysely.ts';
import type { DatabaseSchema } from '../../db/schema.ts';

function maskConnectionString(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    if (parsed.password) {
      parsed.password = '********';
    }
    return parsed.toString();
  } catch {
    return urlStr.replace(/:([^:@/]+)@/, ':********@');
  }
}

async function runPostgresConnectionTest(): Promise<void> {
  console.log('==============================================================');
  console.log(' TESTE DE CONEXAO POSTGRESQL (Kysely + pg.Pool)');
  console.log('==============================================================');

  const config = resolveDatabaseConfig();
  const pgCfg = config.postgres;

  const hasConnectionString = Boolean(pgCfg.connectionString);
  const hasDiscreteParams = Boolean(pgCfg.host && pgCfg.database && pgCfg.user);

  console.log(`- APP_ENV atual no .env : ${process.env.APP_ENV || '(nao definido -> default DEV)'}`);
  console.log(`- Modo de configuracao  : ${hasConnectionString ? 'DATABASE_URL / Connection String' : hasDiscreteParams ? 'Variaveis discretas (DB_HOST / DB_NAME / DB_USER)' : 'INCOMPLETO'}`);

  if (hasConnectionString && pgCfg.connectionString) {
    console.log(`- Connection String     : ${maskConnectionString(pgCfg.connectionString)}`);
  } else {
    console.log(`- Host                  : ${pgCfg.host || '(ausente)'}`);
    console.log(`- Porta                 : ${pgCfg.port}`);
    console.log(`- Database              : ${pgCfg.database || '(ausente)'}`);
    console.log(`- Usuario               : ${pgCfg.user || '(ausente)'}`);
    console.log(`- Senha                 : ${pgCfg.password ? '******** (configurada)' : '(ausente/vazia)'}`);
  }
  console.log(`- SSL                   : ${pgCfg.ssl ? 'ATIVO (rejectUnauthorized: false)' : 'INATIVO'}`);
  console.log(`- Pool Max              : ${pgCfg.maxPool}`);
  console.log('--------------------------------------------------------------');

  if (!hasConnectionString && !hasDiscreteParams) {
    console.error('[ERRO] Parametros PostgreSQL ausentes no arquivo .env.');
    console.error('Configure DATABASE_URL ou (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD) no .env.');
    process.exit(1);
  }

  const poolConfig: pg.PoolConfig = hasConnectionString
    ? {
        connectionString: pgCfg.connectionString,
        ssl: pgCfg.ssl ? { rejectUnauthorized: false } : undefined,
        max: 2,
        connectionTimeoutMillis: 10000,
      }
    : {
        host: pgCfg.host,
        port: pgCfg.port,
        database: pgCfg.database,
        user: pgCfg.user,
        password: pgCfg.password,
        ssl: pgCfg.ssl ? { rejectUnauthorized: false } : undefined,
        max: 2,
        connectionTimeoutMillis: 10000,
      };

  const pool = new pg.Pool(poolConfig);
  const kysely = new Kysely<DatabaseSchema>({
    dialect: new PostgresDialect({ pool }),
  });

  const startedAt = Date.now();
  try {
    const pingResult = await sql<{
      current_database: string;
      current_user: string;
      server_version: string;
      server_time: string;
    }>`
      SELECT
        current_database() AS current_database,
        current_user AS current_user,
        version() AS server_version,
        NOW()::text AS server_time
    `.execute(kysely);

    const latencyMs = Date.now() - startedAt;
    const info = pingResult.rows[0];

    const tablesResult = await sql<{ table_name: string }>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name ASC
    `.execute(kysely);

    const tableNames = tablesResult.rows.map((r) => r.table_name);

    console.log('[SUCESSO] Conexao estabelecida e validada via Kysely!');
    console.log(`- Latencia do ping      : ${latencyMs} ms`);
    console.log(`- Banco conectado       : ${info?.current_database}`);
    console.log(`- Usuario autenticado   : ${info?.current_user}`);
    console.log(`- Horario do servidor   : ${info?.server_time}`);
    console.log(`- Versao PostgreSQL     : ${info?.server_version?.split(',')[0]}`);
    console.log(
      `- Tabelas publicas (${tableNames.length}) : ${tableNames.length > 0 ? tableNames.join(', ') : '(nenhuma tabela criada ainda)'}`
    );
    console.log('==============================================================');
  } catch (err: unknown) {
    const latencyMs = Date.now() - startedAt;
    const pgErr = err as { code?: string; message?: string; address?: string; port?: number };
    console.error(`[FALHA] Nao foi possivel conectar ao PostgreSQL (${latencyMs} ms).`);
    console.error(`- Codigo do erro        : ${pgErr.code || 'DESCONHECIDO'}`);
    console.error(`- Mensagem              : ${pgErr.message || String(err)}`);

    if (pgErr.code === 'ECONNREFUSED') {
      console.error('- Diagnostico           : Servidor PostgreSQL recusou conexao no host/porta informados.');
    } else if (pgErr.code === '28P01' || pgErr.code === '28000') {
      console.error('- Diagnostico           : Falha de autenticacao (usuario ou senha invalidos no .env).');
    } else if (pgErr.code === '3D000') {
      console.error('- Diagnostico           : O database informado nao existe na instancia PostgreSQL.');
    } else if (pgErr.code === 'ENOTFOUND') {
      console.error('- Diagnostico           : Host PostgreSQL nao encontrado no DNS.');
    } else if (/SSL|TLS/i.test(String(pgErr.message))) {
      console.error('- Diagnostico           : O servidor exige ou rejeitou SSL. Ajuste DB_SSL="true" ou DB_SSL="false" no .env.');
    }
    console.log('==============================================================');
    process.exitCode = 1;
  } finally {
    await kysely.destroy().catch(() => {});
  }
}

runPostgresConnectionTest();
