import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { diff } from 'deep-object-diff';

import { useDB } from '@app/db';

import useLogger from '@app/hooks/useLogger';

import getRelated from '../functions/getRelated';
import {
  DataRelationName,
  DataRelationType,
  DataTypeWithRelationDefsName,
  getRelationTypeAndConfig,
  RelationConfig,
  RelationType,
} from '../relations';
import { DataTypeName } from '../schema';
import { DataTypeWithAdditionalInfo } from '../types';

export default function useRelated<
  T extends DataTypeWithRelationDefsName,
  N extends DataRelationName<T>,
>(
  d: DataTypeWithAdditionalInfo<T> | null,
  relationName: N,
  {
    disable = false,
  }: {
    disable?: boolean;
  } = {},
): {
  loading: boolean;
  data: null | DataRelationType<T, N>;
  refresh: () => void;
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

  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<null | DataRelationType<T, N>>(null);

  const loadData = useCallback(async () => {
    if (!cachedD) return;
    if (!db) return;

    setLoading(true);
    try {
      setData(await getRelated(cachedD, relationName, { db, logger }));
    } catch (e) {
      logger.error(e);
    } finally {
      setLoading(false);
    }
  }, [cachedD, db, logger, relationName]);

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
