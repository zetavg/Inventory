export const LOG_LEVELS = [
  'debug',
  'info',
  'log',
  'success',
  'warn',
  'error',
] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export type Log = {
  level: LogLevel;
  user?: string;
  module?: string;
  message: string;
  details?: string;
  stack?: string;
  timestamp: number;
};
