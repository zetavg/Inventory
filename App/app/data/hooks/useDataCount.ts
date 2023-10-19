import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { diff } from 'deep-object-diff';

import { useDB } from '@app/db';

import useLogger from '@app/hooks/useLogger';

import LPJQ from '@app/LPJQ';

import { getGetDataCount } from '../functions';
import { DataType, DataTypeName } from '../schema';
import { ConditionsObject } from '../types';

export default function useDataCount<T extends DataTypeName>(
  type: T,
  cond?: ConditionsObject<T>,
  {
    showAlertOnError = true,
    disable = false,
  }: {
    showAlertOnError?: boolean;
    disable?: boolean;
  } = {},
): {
  loading: boolean;
  count: number | null;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshing: boolean;
} {
  const logger = useLogger('useDataCount', type);
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

    // logger.debug(`Loading data count for ${type}`, {
    //   details: JSON.stringify({ conditions: cachedCond }, null, 2),
    // });

    try {
      if (!db) throw new Error('DB is not ready.');
      const getDataCount = getGetDataCount({ db, logger });
      const c = await getDataCount(type, cachedCond);
      setCount(c);
    } catch (e) {
      logger.error(e, { showAlert: showAlertOnError });
    } finally {
      setLoading(false);
    }
  }, [cachedCond, db, disable, logger, showAlertOnError, type]);

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
