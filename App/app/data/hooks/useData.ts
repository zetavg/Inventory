import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { diff } from 'deep-object-diff';

import { useDB } from '@app/db';

import useLogger from '@app/hooks/useLogger';

import { getGetData, getGetDatum } from '../functions';
import { DataType, DataTypeName } from '../schema';
import {
  GetDataConditions,
  InvalidDataTypeWithID,
  SortOption,
  ValidDataTypeWithID,
} from '../types';

export default function useData<
  T extends DataTypeName,
  CT extends GetDataConditions<T> | string,
>(
  type: T,
  /** ID, array of IDs or conditions object. */
  cond: CT,
  {
    sort,
    limit = undefined,
    skip = 0,
    showAlertOnError = true,
    disable = false,
    onInitialLoad,
  }: {
    sort?: SortOption<DataType<T>>;
    limit?: number;
    skip?: number;
    showAlertOnError?: boolean;
    disable?: boolean;
    onInitialLoad?: () => void;
  } = {},
): {
  loading: boolean;
  data:
    | null
    | (CT extends string
        ? ValidDataTypeWithID<T> | InvalidDataTypeWithID<T>
        : ReadonlyArray<ValidDataTypeWithID<T> | InvalidDataTypeWithID<T>>);
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
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
  const cachedCondRef = useRef(cachedCond);
  cachedCondRef.current = cachedCond;

  const [cachedSort, setCachedSort] = useState(sort);
  useEffect(() => {
    if (
      typeof sort !== typeof cachedSort ||
      Object.keys(diff(sort as any, cachedSort as any) || {}).length > 0
    ) {
      setCachedSort(sort);
    }
  }, [sort, cachedSort]);
  const cachedSortRef = useRef(cachedSort);
  cachedSortRef.current = cachedSort;

  const limitRef = useRef(limit);
  limitRef.current = limit;
  const skipRef = useRef(skip);
  skipRef.current = skip;

  const [loading, setLoading] = useState(!disable);

  const [data, setData] = useState<
    | null
    | (CT extends string
        ? ValidDataTypeWithID<T> | InvalidDataTypeWithID<T>
        : ReadonlyArray<InvalidDataTypeWithID<T> | ValidDataTypeWithID<T>>)
  >(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const [ids, setIds] = useState<ReadonlyArray<string> | null>(null);
  const [rawData, setRawData] = useState<unknown>(null);

  const hasLoaded = useRef(false);
  const loadData = useCallback(async () => {
    if (!db) return;
    setLoading(true);

    const thisCachedCond = cachedCond;
    const thisCachedSort = cachedSort;
    const thisLimit = limit;
    const thisSkip = skip;
    const isStillValid = () =>
      thisCachedCond === cachedCondRef.current &&
      thisCachedSort === cachedSortRef.current &&
      thisLimit === limitRef.current &&
      thisSkip === skipRef.current;

    try {
      switch (true) {
        case typeof cachedCond === 'string': {
          const id: string = cachedCond as any;
          const d = await getGetDatum({ db, logger })(type, id);
          if (!isStillValid()) return;
          setIds(null);
          if (!hasLoaded.current) {
            if (typeof onInitialLoad === 'function') {
              onInitialLoad();
            }
          }
          setData(d as any);
          setRawData(d);
          break;
        }

        default: {
          const d = await getGetData({ db, logger })(type, cachedCond as any, {
            skip,
            limit,
            sort: cachedSort,
          });
          if (!isStillValid()) return;
          if (!hasLoaded.current) {
            if (typeof onInitialLoad === 'function') {
              onInitialLoad();
            }
          }
          setData(d as any);
          break;
        }
      }
    } catch (e) {
      logger.error(e, { showAlert: showAlertOnError });
    } finally {
      setLoading(false);
      hasLoaded.current = true;
    }
  }, [
    db,
    cachedCond,
    logger,
    type,
    onInitialLoad,
    skip,
    limit,
    cachedSort,
    showAlertOnError,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (disable) return;

      if (!dataRef.current) {
        loadData();
      } else {
        setTimeout(() => {
          loadData();
        }, 0);
      }
    }, [disable, loadData]),
  );

  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
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
