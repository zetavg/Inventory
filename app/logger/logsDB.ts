import { QuickSQLite } from 'react-native-quick-sqlite';

import { Log, LOG_LEVELS, LogLevel } from './types';

const logsDBErrors: Array<any> = [];

const LOG_DB_NAME = 'logs.sqlite';
const LOG_DB_TABLE_NAME = 'logs';

const logsCountToKeep = 1000;

const CREATE_TABLE_SQLS = [
  `
CREATE TABLE IF NOT EXISTS "${LOG_DB_TABLE_NAME}" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT,
  user TEXT,
  module TEXT,
  message TEXT,
  details TEXT,
  stack TEXT,
  timestamp UNSIGNED INTEGER
);
`,
  `
CREATE INDEX IF NOT EXISTS "index-level" ON "${LOG_DB_TABLE_NAME}" (level);
`,
  `
CREATE INDEX IF NOT EXISTS "index-user" ON "${LOG_DB_TABLE_NAME}" (user);
`,
  `
CREATE INDEX IF NOT EXISTS "index-module" ON "${LOG_DB_TABLE_NAME}" (module);
`,
];

function setupLogsDB() {
  try {
    QuickSQLite.open(LOG_DB_NAME);
    for (const sql of CREATE_TABLE_SQLS) {
      try {
        QuickSQLite.execute(LOG_DB_NAME, sql);
      } catch (e: any) {
        e.message += `, SQL query:\n${sql}`;
        logsDBErrors.push(e);
        console.error(`[LogDB]: ${e}`, e);
        return;
      }
    }
  } catch (e: any) {
    logsDBErrors.push(e);
    console.error(`[LogDB]: ${e}`, e);
  }
}
setupLogsDB();

export async function insertLog(
  level?: string,
  user?: string,
  module?: string,
  message?: string,
  details?: string,
  stack?: string,
  timestamp?: number,
) {
  try {
    const { insertId } = await QuickSQLite.executeAsync(
      LOG_DB_NAME,
      `
        INSERT INTO "${LOG_DB_TABLE_NAME}" (
          level, user, module, message, details, stack, timestamp
        )
        VALUES(
          '${level || ''}',
          '${user || ''}',
          '${module || ''}',
          '${message || ''}',
          '${details || ''}',
          '${stack || ''}',
          ${timestamp || 0}
        );
      `,
    );
    if (insertId) {
      const deleteBefore = insertId - logsCountToKeep;
      if (deleteBefore > 0) {
        await QuickSQLite.executeAsync(
          LOG_DB_NAME,
          `DELETE FROM "${LOG_DB_TABLE_NAME}" WHERE id < ${deleteBefore};`,
        );
      }
    }
  } catch (e) {
    logsDBErrors.push(e);
    console.error(`[LogDB]: ${e}`, e);
  }
}

export async function getLogs({
  limit = 100,
  offset = 0,
  levels = [],
  module,
  user,
  search,
}: {
  limit?: number;
  offset?: number;
  levels?: ReadonlyArray<LogLevel>;
  module?: string;
  user?: string;
  search?: string;
} = {}): Promise<ReadonlyArray<Log> & { count?: number }> {
  try {
    const whereConditions = [
      levels.length > 0 && `level IN (${levels.map(s => `'${s}'`).join(',')})`,
      module && `module = '${module}'`,
      user && `user = '${user}'`,
      search &&
        `(LOWER(message) LIKE '%${search.toLowerCase()}%' OR LOWER(details) LIKE '%${search.toLowerCase()}%' OR LOWER(stack) LIKE '%${search.toLowerCase()}%')`,
    ].filter(w => w);
    let where = '';
    if (whereConditions.length > 0) {
      where = `WHERE ${whereConditions.join(' AND ')}`;
    }
    const { rows } = await QuickSQLite.executeAsync(
      LOG_DB_NAME,
      `
        SELECT * FROM "${LOG_DB_TABLE_NAME}" ${where} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset};
      `,
    );
    const logs = (rows?._array || [])
      .map((r: unknown): Log | null => {
        if (!r || typeof r !== 'object') return null;

        let level = (r as any).level;
        if (!LOG_LEVELS.includes(level)) {
          level = 'log';
        }

        // eslint-disable-next-line @typescript-eslint/no-shadow
        let user = (r as any).user;
        if (user && typeof user !== 'string') {
          user = '';
        }

        // eslint-disable-next-line @typescript-eslint/no-shadow
        let module = (r as any).module;
        if (module && typeof module !== 'string') {
          module = '';
        }

        let message = (r as any).message;
        if (typeof message !== 'string') {
          message = '';
        }

        let details = (r as any).details;
        if (details && typeof details !== 'string') {
          details = '';
        }

        let stack = (r as any).stack;
        if (stack && typeof stack !== 'string') {
          stack = '';
        }

        let timestamp = (r as any).timestamp;
        if (timestamp && typeof timestamp !== 'number') {
          timestamp = 0;
        }

        return {
          level,
          user,
          module,
          message,
          details,
          stack,
          timestamp,
        };
      })
      .filter(l => l);
    try {
      const { rows: rs } = await QuickSQLite.executeAsync(
        LOG_DB_NAME,
        `SELECT COUNT(*) FROM "${LOG_DB_TABLE_NAME}" ${where};`,
      );
      (logs as any).count = rs?._array?.[0]?.['COUNT(*)'] || 0;
    } catch (e) {
      logsDBErrors.push(e);
      console.error(`[LogDB]: ${e}`, e);
    }
    return logs as any;
  } catch (e) {
    logsDBErrors.push(e);
    console.error(`[LogDB]: ${e}`, e);
    const logs: any = [];
    logs.count = 0;
    return logs;
  }
}

export function getLogsDBErrors() {
  return logsDBErrors;
}
