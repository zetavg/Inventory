import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { QuickSQLite } from 'react-native-quick-sqlite';

import { selectors, useAppSelector } from '@app/redux';

import useLogger from '@app/hooks/useLogger';

import { DataTypeName } from '../schema';

/**
 * useDataCount: This uses a hacky way to get the count of documents by directly accessing the underlying database. This may not be supported on all platforms. In such case, `count` may remain `null` while `loading` being `false`. Also this might not be accurate and might has performance issues.
 */
export default function useDataCount<T extends DataTypeName>(
  type: T,
): {
  loading: boolean;
  count: number | null;
  reload: () => void;
  refresh: () => void;
  refreshing: boolean;
} {
  const logger = useLogger('useDataCount', type);
  const dbName = useAppSelector(selectors.profiles.currentDbName);

  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!dbName) return;
    setLoading(true);
    try {
      const { rows: r } = await QuickSQLite.executeAsync(
        dbName,
        `SELECT COUNT(id) FROM "document-store" WHERE id LIKE '${type}-%' AND json NOT LIKE '%"deleted":true%';`,
        [],
      );
      const c = r?.item(0)?.['COUNT(id)'] ?? null;
      setCount(c);
    } catch (e) {
      logger.error(e);
    } finally {
      setLoading(false);
    }
  }, [dbName, logger, type]);

  useFocusEffect(
    useCallback(() => {
      // if (disable) return;
      loadData();
    }, [loadData]),
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
