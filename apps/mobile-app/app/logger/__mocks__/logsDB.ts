import { Log, LogLevel } from '../types';

const logsDBErrors: Array<any> = [];

const DEFAULT_LEVELS_TO_LOG: ReadonlyArray<LogLevel> = [
  'info',
  'log',
  'success',
  'warn',
  'error',
];

let levelsToLog = DEFAULT_LEVELS_TO_LOG;
let logsToKeep = 1000;

export function getLogsToKeep(): number {
  return logsToKeep;
}

export function setLogsToKeep(n: number) {
  logsToKeep = n;
}

export function getLevelsToLog(): ReadonlyArray<LogLevel> {
  return levelsToLog;
}

export function setLevelsToLog(levels: ReadonlyArray<LogLevel>) {
  levelsToLog = levels
    .filter(l => typeof l === 'string')
    .filter((value, index, array) => array.indexOf(value) === index);
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
}) {}

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
  const r: any = [];
  r.count = 0;
  return r;
}

export function getLogsDBErrors() {
  return logsDBErrors;
}
