import { Context } from '@deps/data-storage-couchdb/functions/types';

import appLogger, { getLevelsToLog } from '@app/logger';

export type GetContextArgs = {
  db: PouchDB.Database;
  logger?: typeof appLogger;
};

export default function getContext({
  db,
  logger = appLogger,
}: GetContextArgs): Context {
  return {
    dbType: 'pouchdb',
    db,
    logger,
    logLevels: getLevelsToLog,
  };
}
