import { Alert } from 'react-native';

import { insertLog } from './logsDB';
import { LogSeverity } from './types';

type LoggerD = {
  user?: string;
  module?: string;
  error?: unknown;
  err?: unknown;
  e?: unknown;
  details?: string;
  timestamp?: number;
  showAlert?: boolean;
};

export function logger(
  severity: LogSeverity,
  msg: unknown,
  { user, module, error, err, e, details, timestamp, showAlert }: LoggerD = {},
) {
  const message: string = (() => {
    if (typeof msg === 'string') {
      return msg;
    }
    if (msg instanceof Error) {
      return msg.message;
    }

    try {
      return JSON.stringify(msg);
    } catch (_) {}

    return '(No message)';
  })();
  if (showAlert) {
    const alertTitle = (() => {
      switch (severity) {
        case 'error':
          return 'An Error Occurred';
        case 'warn':
          return 'Warning';
        default:
          return severity;
      }
    })();
    Alert.alert(alertTitle, message);
  }

  if (!error) error = err || e || (msg instanceof Error ? msg : undefined);
  if (!timestamp) timestamp = new Date().getTime();
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

  insertLog(severity, user, module, message, details, callStack, timestamp);

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
  function l(severity: LogSeverity, message: unknown, tt?: LoggerD) {
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
