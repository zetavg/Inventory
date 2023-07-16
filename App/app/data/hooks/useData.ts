import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { diff } from 'deep-object-diff';

import { useDB } from '@app/db';

import useLogger from '@app/hooks/useLogger';

import { getDataIdFromPouchDbId, getDataTypeSelector } from '../pouchdb-utils';
import schema, { DataType, DataTypeName } from '../schema';
import { DataTypeWithAdditionalInfo } from '../types';

type Sort = Array<{ [propName: string]: 'asc' | 'desc' }>;

export function getDatumFromDoc<T extends DataTypeName>(
  type: T,
  doc: PouchDB.Core.ExistingDocument<{}> | null,
  logger: ReturnType<typeof useLogger>,
  { validate = true }: { validate?: boolean } = {},
): DataTypeWithAdditionalInfo<T> | null {
  if (!doc) return null;

  let id: undefined | string;
  if (doc._id) {
    const { type: typeName, id: iid } = getDataIdFromPouchDbId(doc._id);
    id = iid;

    if (typeName !== type) {
      logger.error(
        `Error parsing "${type}" ID "${doc._id}": document type is ${typeName}`,
        {
          details: JSON.stringify({ doc }, null, 2),
        },
      );
      return null;
    }
  }

  try {
    if (validate) {
      schema[type].parse((doc as any).data);
    }
    if (typeof (doc as any).data !== 'object') {
      throw new Error('doc.data is not an object');
    }

    return new Proxy((doc as any).data, {
      get: function (target, prop) {
        if (prop === '__type') {
          return type;
        }

        if (prop === '__id') {
          return id;
        }

        if (prop === '__rev') {
          return doc._rev;
        }

        if (prop === '__deleted') {
          return (doc as any)._deleted;
        }

        if (prop === '__created_at') {
          return (doc as any).created_at;
        }

        if (prop === '__updated_at') {
          return (doc as any).updated_at;
        }

        return target[prop];
      },
      set: function (target, prop, value) {
        if (prop === '__deleted') {
          return ((doc as any)._deleted = value);
        }

        // Only allow assigning known properties
        if (Object.keys(schema[type].shape).includes(prop as string)) {
          return (target[prop] = value);
        }
      },
    }) as any;
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : JSON.stringify(e, null, 2);
    logger.error(`Error parsing "${type}" ID "${doc._id}": ${errMsg}`, {
      details: JSON.stringify({ doc }, null, 2),
    });
    return null;
  }
}

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
          break;
        }
        case typeof cachedCond === 'object': {
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
        default: {
          const id = cachedCond;
          const doc = (await db?.get(`${type}-${id}`)) || null;
          setData(getDatumFromDoc(type, doc, logger, { validate }) as any);
          setIds(null);
          setRawData(doc);
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
