import // Database,
// getDatabase,
// getLogsDatabase,
// LogsDatabase,
'../pouchdb';

import { useEffect, useMemo } from 'react';

import { actions, selectors, useAppDispatch, useAppSelector } from '@app/redux';

import {
  AppDatabase,
  currentCachedDbSelector,
  getCurrentAppDB,
} from '../app_db';

type ReturnType = {
  db: AppDatabase | null;
  // logsDB: LogsDatabase | null;
};

export default function useDB(): ReturnType {
  const dispatch = useAppDispatch();
  const currentDbName = useAppSelector(selectors.profiles.currentDbName);
  // const currentLogsDbName = useAppSelector(
  //   selectors.profiles.currentLogsDbName,
  // );

  const db = useAppSelector(currentCachedDbSelector) || null;
  // const logsDB = useAppSelector(s => selectors.cache.cache(s)?._logsDB) || null;

  useEffect(() => {
    if (db) return;
    if (!currentDbName) return;

    // This will cache the database in the redux store, thus triggering a re-render.
    getCurrentAppDB().catch(e => {
      // console.warn(e);
      throw e;
    });
  }, [currentDbName, db, dispatch]);

  // useEffect(() => {
  //   if (logsDB) return;
  //   if (!currentLogsDbName) return;

  //   (async () => {
  //     await new Promise(resolve => setTimeout(resolve, 100));
  //     let database;
  //     let dbOk = false;
  //     // WORKAROUND: To prevent the following errors on the first call:
  //     // * SQL execution error: UNIQUE constraint failed: local-store.id
  //     // * web_sql_went_bad
  //     while (!dbOk) {
  //       database = await getLogsDatabase(currentLogsDbName);
  //       try {
  //         await database.allDocs({ include_docs: true, limit: 1 });
  //         dbOk = true;
  //       } catch (e) {
  //         console.warn('[useDB] DB not ok, will retry...', e);
  //         await new Promise(resolve => setTimeout(resolve, 100));
  //       }
  //     }

  //     dispatch(actions.cache.set(['_logsDB', database]));
  //   })();
  // }, [currentLogsDbName, logsDB, dispatch]);

  return useMemo(
    () => ({
      db,
      // logsDB,
    }),
    [
      db,
      // logsDB,
    ],
  ) as any;
}
