import { useEffect, useMemo } from 'react';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import { getDatabase, getLogsDatabase } from '../pouchdb';

export default function useDB() {
  const dispatch = useAppDispatch();
  const currentDbName = useAppSelector(selectors.profiles.currentDbName);
  const currentLogsDbName = useAppSelector(
    selectors.profiles.currentLogsDbName,
  );

  const db = useAppSelector(s => selectors.cache.cache(s)?._db) || null;
  const logsDB = useAppSelector(s => selectors.cache.cache(s)?._logsDB) || null;

  useEffect(() => {
    if (db) return;
    if (!currentDbName) return;

    (async () => {
      // WORKAROUND: Call this two times to prevent the following errors on the first call:
      // * SQL execution error: UNIQUE constraint failed: local-store.id
      // * web_sql_went_bad
      getDatabase(currentDbName);
      await new Promise(resolve => setTimeout(resolve, 100));
      let database;
      let dbOk = false;
      while (!dbOk) {
        database = getDatabase(currentDbName);
        try {
          await database.allDocs({ include_docs: true, limit: 1 });
          dbOk = true;
        } catch (e) {
          console.warn('[useDB] DB not ok, will retry...', e);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      dispatch(actions.cache.set(['_db', database]));
    })();
  }, [currentDbName, db, dispatch]);

  useEffect(() => {
    if (logsDB) return;
    if (!currentLogsDbName) return;

    (async () => {
      // WORKAROUND: Call this two times to prevent the following errors on the first call:
      // * SQL execution error: UNIQUE constraint failed: local-store.id
      // * web_sql_went_bad
      getLogsDatabase(currentLogsDbName);
      await new Promise(resolve => setTimeout(resolve, 100));
      const database = getLogsDatabase(currentLogsDbName);

      dispatch(actions.cache.set(['_logsDB', database]));
    })();
  }, [currentLogsDbName, logsDB, dispatch]);

  return useMemo(
    () => ({
      db,
      logsDB,
    }),
    [db, logsDB],
  );
}
