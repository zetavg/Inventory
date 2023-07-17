import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { diff } from 'deep-object-diff';

import { useDB } from '@app/db';

import useLogger from '@app/hooks/useLogger';

import getData from '../functions/getData';
import getDatum from '../functions/getDatum';
import { getDataTypeSelector, getDatumFromDoc } from '../pouchdb-utils';
import { DataType, DataTypeName } from '../schema';
import {
  DataTypeWithAdditionalInfo,
  InvalidDataTypeWithAdditionalInfo,
} from '../types';

type Sort = Array<{ [propName: string]: 'asc' | 'desc' }>;

export default function useData<
  T extends DataTypeName,
  CT extends string | ReadonlyArray<string> | Partial<DataType<T>>,
>(
  type: T,
  cond: CT,
  {
    skip = 0,
    limit = undefined,
    disable = false,
    sort,
  }: {
    skip?: number;
    limit?: number;
    disable?: boolean;
    sort?: Sort;
  } = {},
): {
  loading: boolean;
  data:
    | null
    | (CT extends string
        ? DataTypeWithAdditionalInfo<T> | InvalidDataTypeWithAdditionalInfo<T>
        : ReadonlyArray<
            DataTypeWithAdditionalInfo<T> | InvalidDataTypeWithAdditionalInfo<T>
          >);
  // Deprecated
  // ids: ReadonlyArray<string> | null;
  // rawData: unknown;
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
        ? DataTypeWithAdditionalInfo<T> | InvalidDataTypeWithAdditionalInfo<T>
        : ReadonlyArray<
            InvalidDataTypeWithAdditionalInfo<T> | DataTypeWithAdditionalInfo<T>
          >)
  >(null);
  const [ids, setIds] = useState<ReadonlyArray<string> | null>(null);
  const [rawData, setRawData] = useState<unknown>(null);

  const loadData = useCallback(async () => {
    if (!db) return;
    setLoading(true);

    try {
      switch (true) {
        case typeof cachedCond === 'string': {
          const id: string = cachedCond as any;
          const d = await getDatum(type, id, {
            db,
            logger,
          });
          setIds(null);
          setData(d as any);
          setRawData(d);
          break;
        }

        default: {
          const d = await getData(
            type,
            cachedCond as any,
            { skip, limit, sort: cachedSort },
            { db, logger },
          );
          setData(d as any);
          break;
        }
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setLoading(false);
    }
  }, [cachedCond, db, limit, logger, skip, cachedSort, type]);

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
