export const LOG_SEVERITIES = [
  'debug',
  'info',
  'log',
  'warn',
  'error',
] as const;

export type LogSeverity = (typeof LOG_SEVERITIES)[number];

export type Log = {
  severity: LogSeverity;
  user?: string;
  module?: string;
  message: string;
  details?: string;
  stack?: string;
  timestamp: number;
};
