import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { diff } from 'deep-object-diff';

import { useDB } from '@app/db';

import useLogger from '@app/hooks/useLogger';

import LPJQ from '@app/LPJQ';

import { getGetRelated } from '../functions';
import {
  DataRelationName,
  DataRelationType,
  DataTypeWithRelationDefsName,
  getRelationTypeAndConfig,
  RelationConfig,
  RelationType,
} from '../relations';
import { DataTypeName } from '../schema';
import { DataMeta } from '../types';

type Sort = Array<{ [propName: string]: 'asc' | 'desc' }>;

export default function useRelated<
  T extends DataTypeWithRelationDefsName,
  N extends DataRelationName<T>,
>(
  d: DataMeta<T> | null,
  relationName: N,
  {
    disable = false,
    startWithLoadingState,
    lowPriority = false,
    sort,
    onInitialLoad,
  }: {
    disable?: boolean;
    startWithLoadingState?: boolean;
    lowPriority?: boolean;
    sort?: Sort;
    onInitialLoad?: () => void;
  } = {},
): {
  loading: boolean;
  data: null | DataRelationType<T, N>;
  refresh: () => Promise<void>;
  refreshing: boolean;
  relatedTypeName: DataTypeName | null;
  foreignKey: string | null;
} {
  const logger = useLogger('useRelated', d?.__type);
  const { db } = useDB();

  const [cachedD, setCachedD] = useState(d);
  useEffect(() => {
    if (d?.__id !== cachedD?.__id || d?.__rev !== cachedD?.__rev) {
      setCachedD(d);
      return;
    }
    // if (Object.keys(diff(d as any, cachedD as any)).length > 0) {
    //   setCachedD(d);
    // }
  }, [d, cachedD]);

  const [_relationType, relationConfig] = useMemo((): [
    RelationType | null,
    RelationConfig | null,
  ] => {
    if (!cachedD?.__type) return [null, null];
    return getRelationTypeAndConfig(cachedD.__type, relationName);
  }, [relationName, cachedD]);

  const [cachedSort, setCachedSort] = useState(sort);
  useEffect(() => {
    if (Object.keys(diff(sort as any, cachedSort as any)).length > 0) {
      setCachedSort(sort);
    }
  }, [sort, cachedSort]);

  const [loading, setLoading] = useState(!disable || !!startWithLoadingState);

  const [data, setData] = useState<null | DataRelationType<T, N>>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const hasLoaded = useRef(false);
  const lastLoadedAt = useRef(0);
  const loadData = useCallback(async () => {
    if (disable) return;
    if (!cachedD) return;
    if (!db) return;

    const now = Date.now();
    if (!!lastLoadedAt.current && now - lastLoadedAt.current < 100) {
      return;
    }

    lastLoadedAt.current = now;

    setLoading(true);
    try {
      const loadedData = await getGetRelated({ db, logger })(
        cachedD,
        relationName,
        { sort: cachedSort },
      );
      if (!hasLoaded.current) {
        if (typeof onInitialLoad === 'function') {
          onInitialLoad();
        }
      }
      setData(loadedData);
    } catch (e) {
      logger.error(e);
    } finally {
      setLoading(false);
      hasLoaded.current = true;
    }
  }, [cachedD, cachedSort, db, disable, logger, onInitialLoad, relationName]);

  useFocusEffect(
    useCallback(() => {
      if (disable) return;

      if (lowPriority) {
        return LPJQ.push(loadData);
      }

      if (!dataRef.current) {
        const timer = setTimeout(() => {
          loadData();
        }, 0);
        return () => {
          clearTimeout(timer);
        };
      } else {
        const timer = setTimeout(() => {
          loadData();
        }, 2);
        return () => {
          clearTimeout(timer);
        };
      }
    }, [disable, loadData, lowPriority]),
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
      reload: loadData,
      refresh,
      refreshing,
      relatedTypeName: relationConfig?.type_name || null,
      foreignKey: relationConfig?.foreign_key || null,
    }),
    [
      data,
      loadData,
      loading,
      refresh,
      refreshing,
      relationConfig?.type_name,
      relationConfig?.foreign_key,
    ],
  );
}
