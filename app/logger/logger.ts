export type LogSeverity = 'debug' | 'info' | 'log' | 'warn' | 'error';

export type Log = {
  severity: LogSeverity;
  user?: string;
  module?: string;
  message: string;
  details?: string;
  stack?: string;
  timestamp: number;
};

type LoggerD = {
  user?: string;
  module?: string;
  error?: unknown;
  err?: unknown;
  e?: unknown;
  details?: string;
  timestamp?: number;
};

export function logger(
  severity: LogSeverity,
  message: string,
  { user, module, error, err, e, details, timestamp }: LoggerD,
) {
  if (!error) error = err || e;
  let callStack: string | undefined;
  if (error instanceof Error) {
    callStack = error.stack;
  }
  if (!details && error) {
    try {
      details = JSON.stringify(error, null, 2);
    } catch (jsonStringifyError) {
      details = `(Note: Error on JSON.stringify the error object: ${jsonStringifyError})`;
    }
  }

  const consoleMessage = [
    [user && `[user:${user}]`, module && `[${module}]`].filter(m => m).join(''),
    message,
    details && `(Details: ${details})`,
  ]
    .filter(m => m)
    .join(' ');
  const consoleArgs: Array<any> = [consoleMessage];
  if (error) {
    consoleArgs.push(error);
  }

  switch (severity) {
    case 'debug':
      console.debug(...consoleArgs);
      break;
    case 'info':
      console.info(...consoleArgs);
      break;
    case 'log':
      console.log(...consoleArgs);
      break;
    case 'warn':
      console.warn(...consoleArgs);
      break;
    case 'error':
      console.error(...consoleArgs);
      break;
    default: {
      const s: never = severity;
      throw new Error(`Unknown severity ${s}`);
    }
  }
}

logger.debug = logger.bind(null, 'debug');
logger.info = logger.bind(null, 'info');
logger.log = logger.bind(null, 'log');
logger.warn = logger.bind(null, 'warn');
logger.error = logger.bind(null, 'error');

logger.for = function (t: { user?: string; module?: string }): typeof logger {
  function l(severity: LogSeverity, message: string, tt: LoggerD) {
    return logger(severity, message, { ...t, ...tt });
  }

  l.debug = l.bind(null, 'debug');
  l.info = l.bind(null, 'info');
  l.log = l.bind(null, 'log');
  l.warn = l.bind(null, 'warn');
  l.error = l.bind(null, 'error');
  l.for = logger.for;

  return l;
};

export default logger;
