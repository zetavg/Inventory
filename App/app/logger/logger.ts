import { Alert } from 'react-native';

import { getLevelsToLog, insertLog } from './logsDB';
import { LogLevel } from './types';

type LoggerD = {
  user?: string;
  module?: string;
  function?: string;
  error?: unknown;
  err?: unknown;
  e?: unknown;
  details?: string;
  timestamp?: number;
  showAlert?: boolean;
};

export function logger(
  level: LogLevel,
  msg: unknown,
  {
    user,
    module,
    function: fn,
    error,
    err,
    e,
    details,
    timestamp,
    showAlert,
  }: LoggerD = {},
) {
  const lLevelsToLog = getLevelsToLog();
  if (level && !lLevelsToLog.includes(level as any)) return;

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
      switch (level) {
        case 'error':
          return 'An Error Occurred';
        case 'warn':
          return 'Warning';
        case 'success':
          return 'Success';
        default:
          return level;
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

  insertLog({
    level,
    user,
    module,
    function: fn,
    message,
    details,
    stack: callStack,
    timestamp,
  });

  const consoleMessage = [
    [
      user && `[user:${user}]`,
      (module || fn) && `[${[module, fn].filter(s => s).join('/')}]`,
    ]
      .filter(m => m)
      .join(''),
    message,
    details && `(Details: ${details})`,
  ]
    .filter(m => m)
    .join(' ');
  const consoleArgs: Array<any> = [consoleMessage];
  if (error) {
    consoleArgs.push(error);
  }

  switch (level) {
    case 'debug':
      console.debug(...consoleArgs);
      break;
    case 'info':
      console.info(...consoleArgs);
      break;
    case 'log':
      console.log(...consoleArgs);
      break;
    case 'success': {
      if (typeof consoleArgs[0] === 'string') {
        consoleArgs[0] = `[success] ${consoleArgs[0]}`;
      }
      console.info(...consoleArgs);
      break;
    }
    case 'warn':
      console.warn(...consoleArgs);
      break;
    case 'error':
      console.error(...consoleArgs);
      break;
    default: {
      const s: never = level; // If this line has type error, that means we have unhandled cases!
      throw new Error(`Unknown level ${s}`);
    }
  }
}

logger.debug = logger.bind(null, 'debug');
logger.info = logger.bind(null, 'info');
logger.log = logger.bind(null, 'log');
logger.success = logger.bind(null, 'success');
logger.warn = logger.bind(null, 'warn');
logger.error = logger.bind(null, 'error');

type LoggerForT = {
  user?: string;
  module?: string;
  function?: string;
};
logger.for = function (t: LoggerForT): typeof logger {
  const ttt = (this as any).forT;
  function l(level: LogLevel, message: unknown, tt?: LoggerD) {
    return logger(level, message, { ...ttt, ...t, ...tt });
  }

  l.debug = l.bind(null, 'debug');
  l.info = l.bind(null, 'info');
  l.log = l.bind(null, 'log');
  l.success = l.bind(null, 'success');
  l.warn = l.bind(null, 'warn');
  l.error = l.bind(null, 'error');
  l.for = logger.for;
  l.off = logger.off;
  l.forT = t;

  return l;
};
logger.off = function (): typeof logger {
  function l(_level: LogLevel, _message: unknown, _tt?: LoggerD) {
    return;
  }

  l.debug = () => {};
  l.info = () => {};
  l.log = () => {};
  l.success = () => {};
  l.warn = () => {};
  l.error = () => {};
  l.for = logger.for;
  l.off = logger.off;

  return l;
};

export default logger;
