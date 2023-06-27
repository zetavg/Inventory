import { QuickSQLite } from 'react-native-quick-sqlite';

import { Log, LOG_LEVELS, LogLevel } from './types';

const logsDBErrors: Array<any> = [];

const LOG_DB_NAME = 'logs.sqlite';
const LOG_DB_CONFIG_TABLE_NAME = 'config';
const LOG_DB_TABLE_NAME = 'logs';
const LOG_DB_LEVELS_TO_LOG_TABLE_NAME = 'logs_level_to_log';

const DEFAULT_LEVELS_TO_LOG: ReadonlyArray<LogLevel> = [
  'info',
  'log',
  'success',
  'warn',
  'error',
];
const DEFAULT_LOGS_TO_KEEP = 1000;

let levelsToLog = DEFAULT_LEVELS_TO_LOG;
let logsToKeep = 1000;

const CREATE_TABLE_SQLS = [
  `
CREATE TABLE IF NOT EXISTS "${LOG_DB_TABLE_NAME}" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT,
  user TEXT,
  module TEXT,
  function TEXT,
  message TEXT,
  details TEXT,
  stack TEXT,
  timestamp UNSIGNED INTEGER
);
`,
  `
CREATE TABLE IF NOT EXISTS "${LOG_DB_CONFIG_TABLE_NAME}" (
  key TEXT PRIMARY KEY,
  value TEXT
);
`,
  `
CREATE TABLE IF NOT EXISTS "${LOG_DB_LEVELS_TO_LOG_TABLE_NAME}" (
  level TEXT PRIMARY KEY
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
  `
CREATE INDEX IF NOT EXISTS "index-function" ON "${LOG_DB_TABLE_NAME}" (function);
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
    fetchLogsToKeep();
    fetchLevelsToLog();
  } catch (e: any) {
    logsDBErrors.push(e);
    console.error(`[LogDB]: ${e}`, e);
  }
}
setupLogsDB();

function fetchLogsToKeep() {
  const { rows } = QuickSQLite.execute(
    LOG_DB_NAME,
    `
      SELECT value FROM "${LOG_DB_CONFIG_TABLE_NAME}" WHERE key = 'logs_to_keep';
    `,
  );
  if (rows?.length) {
    logsToKeep = parseInt(rows.item(0).value, 10);
    if (isNaN(logsToKeep)) {
      logsToKeep = DEFAULT_LOGS_TO_KEEP * 10;
    }
  }
}

function fetchLevelsToLog() {
  const { rows } = QuickSQLite.execute(
    LOG_DB_NAME,
    `
      SELECT level FROM "${LOG_DB_LEVELS_TO_LOG_TABLE_NAME}";
    `,
  );
  if (rows?.length) {
    levelsToLog = rows._array.map(r => r.level);
  }
}

export function getLogsToKeep(): number {
  return logsToKeep;
}

export function setLogsToKeep(n: number) {
  try {
    if (n < 0) return;
    QuickSQLite.execute(
      LOG_DB_NAME,
      `
        INSERT OR REPLACE INTO "${LOG_DB_CONFIG_TABLE_NAME}" (key, value) values
        ('logs_to_keep', '${n}');

      `,
    );
    fetchLogsToKeep();
  } catch (e) {
    logsDBErrors.push(e);
    console.error(`[LogDB]: ${e}`, e);
  }
}

export function getLevelsToLog(): ReadonlyArray<LogLevel> {
  return levelsToLog;
}

export function setLevelsToLog(levels: ReadonlyArray<LogLevel>) {
  levels = levels
    .filter(l => typeof l === 'string')
    .filter((value, index, array) => array.indexOf(value) === index);
  try {
    QuickSQLite.execute(
      LOG_DB_NAME,
      `
        DELETE FROM "${LOG_DB_LEVELS_TO_LOG_TABLE_NAME}";
      `,
    );
    if (levels.length > 0) {
      QuickSQLite.execute(
        LOG_DB_NAME,
        `
          INSERT INTO "${LOG_DB_LEVELS_TO_LOG_TABLE_NAME}" (level) VALUES ${levels.map(
          l => `("${l}")`,
        )};
        `,
      );
    }

    fetchLevelsToLog();
  } catch (e) {
    logsDBErrors.push(e);
    console.error(`[LogDB]: ${e}`, e);
  }
}

export async function insertLog({
  level,
  user,
  module,
  function: fn,
  message,
  details,
  stack,
  timestamp,
}: {
  level?: string;
  user?: string;
  module?: string;
  function?: string;
  message?: string;
  details?: string;
  stack?: string;
  timestamp?: number;
}) {
  try {
    const { insertId } = await QuickSQLite.executeAsync(
      LOG_DB_NAME,
      `
        INSERT INTO "${LOG_DB_TABLE_NAME}" (
          level, user, module, function, message, details, stack, timestamp
        )
        VALUES(
          '${level || ''}',
          '${user || ''}',
          '${module || ''}',
          '${fn || ''}',
          '${message || ''}',
          '${details || ''}',
          '${stack || ''}',
          ${timestamp || 0}
        );
      `,
    );
    if (insertId) {
      const deleteBefore = insertId - getLogsToKeep();
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
  function: fn,
  user,
  search,
}: {
  limit?: number;
  offset?: number;
  levels?: ReadonlyArray<LogLevel>;
  module?: string;
  function?: string;
  user?: string;
  search?: string;
} = {}): Promise<ReadonlyArray<Log> & { count?: number }> {
  try {
    const whereConditions = [
      levels.length > 0 && `level IN (${levels.map(s => `'${s}'`).join(',')})`,
      module && `module = '${module}'`,
      fn && `function = '${fn}'`,
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

        let fn = (r as any).function;
        if (fn && typeof fn !== 'string') {
          fn = '';
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
          function: fn,
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
