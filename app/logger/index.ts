export type { Log } from './types';
export { LOG_SEVERITIES } from './types';
import { logger } from './logger';
export { logger };
export { getLogs, getLogsDBErrors } from './logsDB';
export default logger;
