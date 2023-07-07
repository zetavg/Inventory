export type { Log, LogLevel } from './types';
export { LOG_LEVELS } from './types';
import { logger } from './logger';
export { logger };
export {
  getLevelsToLog,
  getLogs,
  getLogsDBErrors,
  getLogsToKeep,
  setLevelsToLog,
  setLogsToKeep,
} from './logsDB';
export default logger;
