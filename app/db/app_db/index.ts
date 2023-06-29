import appLogger from '@app/logger';

import type { RootState } from '@app/redux';
import { actions, selectors, store } from '@app/redux';
import { getCurrentDbName } from '@app/features/profiles';

import { getPouchDBDatabase } from '../pouchdb';

// TODO
export type AppDatabase = any;

/**
 * Get an application database. This will return a PouchDB database with index and types.
 * @param {string} name Name of the database.
 */
export async function getAppDB(name: string) {
  try {
    const db = await getPouchDBDatabase<AppDatabase>(name);
    // TODO: add index
    return db;
  } catch (e) {
    const logger = appLogger.for({
      module: 'app_db',
      function: 'getAppDB',
    });
    logger.error(e);
    throw e;
  }
}

export const currentCachedDbSelector = (s: RootState) =>
  selectors.cache.cache(s)?._db;

/**
 * Get the current application database.
 */
export async function getCurrentAppDB() {
  const logger = appLogger.for({
    module: 'app_db',
    function: 'getCurrentAppDB',
  });

  const cachedDB = currentCachedDbSelector(store.getState());
  if (cachedDB) return cachedDB;

  const dbName = getCurrentDbName();
  if (!dbName) {
    const e = new Error('Current DB name is null.');
    logger.error(e);
    throw e;
  }
  logger.debug(`Loading database ${dbName}...`);

  let database;
  let dbOk = false;
  let retries = 0;
  // WORKAROUND: To prevent the following errors on the first call:
  // * SQL execution error: UNIQUE constraint failed: local-store.id
  // * web_sql_went_bad
  while (!dbOk) {
    try {
      database = await getAppDB(dbName);
      await database.allDocs({ include_docs: true, limit: 1 });
      dbOk = true;
    } catch (err) {
      if (retries > 10) {
        logger.error(
          `DB "${dbName}" not ok, retries limit exceeded. Giving up.`,
          {
            error: err,
          },
        );
        throw err;
      }
      const retryAfter = 500 + retries * 500;
      logger.warn(
        `DB "${dbName}" not ok, will retry after ${retryAfter} ms...`,
        {
          error: err,
        },
      );
      await new Promise(resolve => setTimeout(resolve, retryAfter));
      retries += 1;
    }
  }

  store.dispatch(actions.cache.set(['_db', database]));
  logger.debug(`Database ${dbName} loaded.`);

  return database;
}

// /**
//  * Delete an application database
//  * @param {string} name Name of the database.
//  */
// export async function deleteAppDB(name: string) {
//   const results = await deletePouchDBDatabase(name);
//   return results;
// }
