import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { QuickSQLite } from 'react-native-quick-sqlite';

import { selectors, useAppSelector } from '@app/redux';

import useLogger from '@app/hooks/useLogger';

import schema, { DataTypeName } from '../schema';
import { DataTypeWithAdditionalInfo } from '../types';

export function getDatumFromDoc<T extends DataTypeName>(
  type: T,
  doc: PouchDB.Core.ExistingDocument<{}> | null,
  logger: ReturnType<typeof useLogger>,
): DataTypeWithAdditionalInfo<T> | null {
  if (!doc) return null;

  const [typeName, ...idParts] = doc._id.split('-');
  const id = idParts.join('-');
  if (typeName !== type) {
    logger.error(
      `Error parsing "${type}" ID "${doc._id}": document type is ${typeName}`,
      {
        details: JSON.stringify({ doc }, null, 2),
      },
    );
    return null;
  }

  try {
    const parsedDatum = schema[type].parse((doc as any).data);
    return new Proxy(parsedDatum, {
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

        if (prop === '__created_at') {
          return (doc as any).created_at;
        }

        if (prop === '__updated_at') {
          return (doc as any).updated_at;
        }

        return (target as any)[prop];
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
