import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useDB } from '@app/db';

import useLogger from '@app/hooks/useLogger';

import DB_VIEWS, { DB_VIEWS_PREFIX } from '../db_views';
import { DataTypeName } from '../schema';
import {
  GetDataConditions,
  InvalidDataTypeWithID,
  ValidDataTypeWithID,
} from '../types';

export default function useView<
  T extends DataTypeName,
  CT extends GetDataConditions<T> | string,
>(
  viewName: keyof typeof DB_VIEWS,
  {
    key,
    disable,
    startWithLoadingState,
    showAlertOnError,
  }: {
    key?: string | ReadonlyArray<string>;
    disable?: boolean;
    startWithLoadingState?: boolean;
    showAlertOnError?: boolean;
  } = {},
): {
  loading: boolean;
  data: unknown;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  refreshing: boolean;
} {
  const logger = useLogger('useView', viewName);
  const { db } = useDB();

  const [loading, setLoading] = useState(!disable || !!startWithLoadingState);

  const [data, setData] = useState<unknown | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const hasLoaded = useRef(false);
  const loadData = useCallback(async () => {
    if (!db) return;

    try {
      let retries = 0;
      while (true) {
        try {
          const results = await db.query(`${DB_VIEWS_PREFIX}_${viewName}`, {
            key,
            include_docs: false,
          });
          setData(results);
          return;
        } catch (e) {
          if (retries > 3) {
            throw e;
          }

          if (e instanceof Error && e.message === 'missing') {
            try {
              await db.put({
                _id: `_design/${DB_VIEWS_PREFIX}_${viewName}`,
                views: {
                  [`${DB_VIEWS_PREFIX}_${viewName}`]: DB_VIEWS[viewName],
                },
              });
            } catch (ee) {
              logger.error(ee);
            }
          } else {
            throw e;
          }
          retries += 1;
        }
      }
    } catch (e) {
      logger.error(e, { showAlert: showAlertOnError });
    } finally {
      setLoading(false);
      hasLoaded.current = true;
    }
  }, [db, logger, showAlertOnError, viewName]);

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
      reload: loadData,
      refresh,
      refreshing,
    }),
    [data, loadData, loading, refresh, refreshing],
  );
}
