import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { diff } from 'deep-object-diff';

import {
  GetViewDataOptions,
  ViewDataType,
  ViewName,
} from '@deps/data-storage-couchdb';

import { useDB } from '@app/db';

import useLogger from '@app/hooks/useLogger';

import { getGetViewData } from '../functions';

export default function useView<T extends ViewName>(
  viewName: T,
  options: GetViewDataOptions & {
    disable?: boolean;
    startWithLoadingState?: boolean;
    showAlertOnError?: boolean;
  } = {},
): {
  loading: boolean;
  data: null | ViewDataType<T>;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshing: boolean;
} {
  const [cachedOptions, setCachedOptions] = useState(options);
  useEffect(() => {
    if (
      Object.keys(diff(options as any, cachedOptionsRef.current as any))
        .length > 0
    ) {
      setCachedOptions(options);
    }
  }, [options]);
  const cachedOptionsRef = useRef(cachedOptions);
  cachedOptionsRef.current = cachedOptions;

  const logger = useLogger('useView', viewName);
  const { db } = useDB();

  const [loading, setLoading] = useState(
    !cachedOptions.disable || !!cachedOptions.startWithLoadingState,
  );

  const [data, setData] = useState<null | ViewDataType<T>>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const hasLoaded = useRef(false);
  const loadData = useCallback(async () => {
    if (!db) return;
    const getViewData = getGetViewData({ db, logger });

    try {
      const d = await getViewData(viewName, cachedOptions);
      setData(d);
    } catch (e) {
      logger.error(e, { showAlert: cachedOptions.showAlertOnError });
    } finally {
      setLoading(false);
      hasLoaded.current = true;
    }
  }, [db, logger, cachedOptions, viewName]);

  useFocusEffect(
    useCallback(() => {
      if (cachedOptions.disable) return;

      if (!dataRef.current) {
        loadData();
      } else {
        setTimeout(() => {
          loadData();
        }, 0);
      }
    }, [cachedOptions.disable, loadData]),
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
    }),
    [data, loadData, loading, refresh, refreshing],
  );
}
