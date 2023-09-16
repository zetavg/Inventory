import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { diff } from 'deep-object-diff';

import { useDB } from '@app/db';

import useLogger from '@app/hooks/useLogger';

import LPJQ from '@app/LPJQ';

import { getTypeIdStartAndEndKey } from '../pouchdb-utils';
import { DataTypeName } from '../schema';
import { DataTypeWithAdditionalInfo } from '../types';

let ddocUpdating = false;
let ddocUpdatingPromiseResolvers: Array<() => void> = [];
function obtainDdocUpdatingLock(): Promise<void> {
  if (!ddocUpdating) {
    ddocUpdating = true;
    return Promise.resolve();
  }

  return new Promise(resolve => ddocUpdatingPromiseResolvers.push(resolve));
}
function releaseDdocUpdatingLock() {
  if (ddocUpdatingPromiseResolvers.length > 0) {
    const r = ddocUpdatingPromiseResolvers.pop();
    if (r) r();
  } else {
    ddocUpdating = false;
  }
}

export default function useDataCount<T extends DataTypeName>(
  type: T,
  cond?: Partial<DataTypeWithAdditionalInfo<T>>,
  { disable = false }: { disable?: boolean } = {},
): {
  loading: boolean;
  count: number | null;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshing: boolean;
} {
  const logger = useLogger('useDataCount', type);
  // const dbName = useAppSelector(selectors.profiles.currentDbName);
  const { db } = useDB();

  const [count, setCount] = useState<number | null>(null);
  const countRef = useRef(count);
  countRef.current = count;
  const [loading, setLoading] = useState(true);

  const [cachedCond, setCachedCond] = useState(cond);
  useEffect(() => {
    if (Object.keys(diff(cond as any, cachedCond as any)).length > 0) {
      setCachedCond(cond);
    }
  }, [cond, cachedCond]);

  const loadData = useCallback(async () => {
    if (disable) return;

    setLoading(true);

    logger.debug(`Loading data count for ${type}`, {
      details: JSON.stringify({ conditions: cachedCond }, null, 2),
    });

    try {
      // const { rows: r } = await QuickSQLite.executeAsync(
      //   dbName,
      //   `SELECT COUNT(id) FROM "document-store" WHERE id LIKE '${type}-%' AND json NOT LIKE '%"deleted":true%';`,
      //   [],
      // );
      // const c = r?.item(0)?.['COUNT(id)'] ?? null;

      if (!db) throw new Error('DB is not ready.');

      // const indexDdoc = {
      //   views: {
      //     [indexName]: {
      //       map: `function (doc) { emit(doc && doc._id.startsWith('${type}' + '-')); }`,
      //     },
      //   },
      // };
      // await db
      //   .get(ddocID)
      //   .catch(() => ({ _id: ddocID }))
      //   .then(doc => db.put({ ...doc, ...indexDdoc } as any));
      // const results = await db.query(`${ddocName}/${indexName}`, {
      //   startkey: collection.id,
      //   endkey: collection.id,
      //   include_docs: false,
      // });

      if (cachedCond) {
        const ddocName = 'data_count_index';
        const ddocID = `_design/${ddocName}`;
        const indexName = `${type}--${Object.keys(cachedCond).join('-')}`;
        const condData = Object.fromEntries(
          Object.entries(cachedCond).map(([k, v]) => [
            (() => {
              switch (k) {
                case '__created_at':
                  return 'doc.created_at';
                case '__updated_at':
                  return 'doc.updated_at';
                default:
                  return `doc.data && doc.data.${k}`;
              }
            })(),
            v,
          ]),
        ) as any;

        let retries = 0;
        while (true) {
          try {
            const key = Object.values(condData).join('--');
            const results = await db.query(`${ddocName}/${indexName}`, {
              startkey: key,
              endkey: key,
              include_docs: false,
            });
            setCount(results.rows.length);
            break;
          } catch (e) {
            if (retries > 4) {
              throw e;
            }

            let shouldHandleErrorByUpdatingIndex = false;
            if (e && typeof e === 'object') {
              if ((e as any).name === 'not_found') {
                shouldHandleErrorByUpdatingIndex = true;
              }
            }

            if (shouldHandleErrorByUpdatingIndex) {
              const indexDdocView = {
                [indexName]: {
                  map: `function (doc) { emit(doc && doc._id.startsWith('${type}' + '-') && [${Object.keys(
                    condData,
                  )}].join('--')); }`,
                },
              };
              logger.info(
                `Updating design doc "${ddocID}" for counting ${type} with matched ${Object.keys(
                  cachedCond,
                )}`,
                { details: JSON.stringify({ ddocView: indexDdocView }) },
              );
              try {
                await obtainDdocUpdatingLock();
                await db
                  .get(ddocID)
                  .catch(() => {
                    return { _id: ddocID };
                  })
                  .then(doc => {
                    return db.put({
                      ...doc,
                      views: {
                        ...(doc as any).views,
                        ...indexDdocView,
                      },
                    } as any);
                  })
                  .finally(() => releaseDdocUpdatingLock());
              } catch (err) {
                logger.warn(err);
              }
            } else {
              throw e;
            }

            retries += 1;
          }
        }
      } else {
        const [idStartKey, idEndKey] = getTypeIdStartAndEndKey(type);

        const results = await db.allDocs({
          startkey: idStartKey,
          endkey: idEndKey + '\uffff',
          include_docs: false,
        });
        setCount(results.rows.length);
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setLoading(false);
    }
  }, [cachedCond, db, disable, logger, type]);

  useFocusEffect(
    useCallback(() => {
      if (disable) return;

      return LPJQ.push(loadData);

      // if (countRef.current === null) {
      //   setTimeout(() => {
      //     loadData();
      //   }, 1);
      // } else {
      //   setTimeout(() => {
      //     loadData();
      //   }, 100);
      // }
    }, [disable, loadData]),
  );

  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      loadData();
    } catch (e) {
      logger.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [loadData, logger]);

  return useMemo(
    () => ({
      loading,
      count,
      reload: loadData,
      refresh,
      refreshing,
    }),
    [count, loadData, loading, refresh, refreshing],
  );
}
