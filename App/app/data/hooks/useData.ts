import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { diff } from 'deep-object-diff';

import { useDB } from '@app/db';

import useLogger from '@app/hooks/useLogger';

import getDatum from '../functions/getDatum';
import { getDataTypeSelector, getDatumFromDoc } from '../pouchdb-utils';
import { DataType, DataTypeName } from '../schema';
import { DataTypeWithAdditionalInfo } from '../types';

type Sort = Array<{ [propName: string]: 'asc' | 'desc' }>;

export default function useData<
  T extends DataTypeName,
  CT extends string | ReadonlyArray<string> | Partial<DataType<T>>,
>(
  type: T,
  cond: CT,
  {
    skip = 0,
    limit = 20,
    disable = false,
    validate = true,
    sort,
  }: {
    skip?: number;
    limit?: number;
    disable?: boolean;
    /** Warning: Setting this to `false` will break type safety. */
    validate?: boolean;
    sort?: Sort;
  } = {},
): {
  loading: boolean;
  data:
    | null
    | (CT extends string
        ? DataTypeWithAdditionalInfo<T>
        : ReadonlyArray<null | DataTypeWithAdditionalInfo<T>>);
  ids: ReadonlyArray<string> | null;
  rawData: unknown;
  reload: () => void;
  refresh: () => void;
  refreshing: boolean;
} {
  const logger = useLogger('useData', type);
  const { db } = useDB();

  const [cachedCond, setCachedCond] = useState(cond);
  useEffect(() => {
    switch (true) {
      case Array.isArray(cond): {
        if (cond.length !== cachedCond.length) {
          setCachedCond(cond);
          break;
        }
        if (
          !(cond as any).every((v: any, i: any) => v === (cachedCond as any)[i])
        ) {
          setCachedCond(cond);
          break;
        }
        break;
      }
      case typeof cond === 'object': {
        if (Object.keys(diff(cond as any, cachedCond as any)).length > 0) {
          setCachedCond(cond);
        }
        break;
      }
      default: {
        if (cond !== cachedCond) {
          setCachedCond(cond);
        }
        break;
      }
    }
  }, [cond, cachedCond]);

  const [cachedSort, setCachedSort] = useState(sort);
  useEffect(() => {
    if (Object.keys(diff(sort as any, cachedSort as any)).length > 0) {
      setCachedSort(sort);
    }
  }, [sort, cachedSort]);

  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<
    | null
    | (CT extends string
        ? DataTypeWithAdditionalInfo<T>
        : ReadonlyArray<null | DataTypeWithAdditionalInfo<T>>)
  >(null);
  const [ids, setIds] = useState<ReadonlyArray<string> | null>(null);
  const [rawData, setRawData] = useState<unknown>(null);

  const loadData = useCallback(async () => {
    if (!db) return;
    setLoading(true);

    try {
      switch (true) {
        case Array.isArray(cachedCond): {
          // TODO: Support this
          break;
        }

        case typeof cachedCond === 'string': {
          const id: string = cachedCond as any;
          const { datum: d, rawDatum: rd } = await getDatum(type, id, {
            db,
            logger,
            validate,
          });
          setIds(null);
          setData(d as any);
          setRawData(rd);
          break;
        }

        default: {
          // TODO: use cachedCond to build selector (if cachedCond is object)
          const selector = {
            ...getDataTypeSelector(type),
          };

          const sortData: typeof cachedSort =
            cachedSort &&
            cachedSort.map(
              s =>
                Object.fromEntries(
                  Object.entries(s).map(([k, v]) => [
                    (() => {
                      switch (k) {
                        case '__created_at':
                          return 'created_at';
                        case '__updated_at':
                          return 'updated_at';
                        default:
                          return `data.${k}`;
                      }
                    })(),
                    v,
                  ]),
                ) as any,
            );
          if (sortData) {
            await db.createIndex({
              index: {
                fields: sortData.flatMap(s => Object.keys(s)),
              },
            });
            for (const s of sortData) {
              for (const key of Object.keys(s)) {
                selector[key] = { $exists: true };
              }
            }
          }

          const response =
            (await db
              .find({
                selector,
                skip,
                limit,
                sort: sortData || undefined,
              })
              .catch(e => {
                if (e instanceof Error) {
                  e.message = `Error loading "${type}" with ${JSON.stringify(
                    cachedCond,
                  )}: ${e.message}`;
                }
                logger.error(e, {
                  details: JSON.stringify({ selector }, null, 2),
                });
                return null;
              })) || null;
          setData(
            (response?.docs.map(d =>
              getDatumFromDoc(type, d, logger, { validate }),
            ) as any) || null,
          );
          setIds(
            response?.docs.map(d => d._id.split('-').slice(1).join('-')) ||
              null,
          );
          setRawData(response);
          break;
        }
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setLoading(false);
    }
  }, [cachedCond, db, limit, logger, skip, cachedSort, type, validate]);

  useFocusEffect(
    useCallback(() => {
      if (disable) return;
      loadData();
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
      data: data as any,
      ids,
      rawData,
      reload: loadData,
      refresh,
      refreshing,
    }),
    [data, ids, rawData, loadData, loading, refresh, refreshing],
  );
}
