import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useDB } from '@app/db';

import useLogger from '@app/hooks/useLogger';

import {
  getGetConfig,
  updateConfig as updateConfigFn,
} from '../functions/config';
import { ConfigType } from '../schema';

export default function useConfig(): {
  loading: boolean;
  config: ConfigType | null;
  updateConfig: (cfg: Partial<ConfigType>) => Promise<boolean>;
  reload: () => void;
  refresh: () => void;
  refreshing: boolean;
} {
  const logger = useLogger('useConfig');
  const { db } = useDB();

  const [config, setConfig] = useState<ConfigType | null>(null);
  const [loading, setLoading] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      if (!db) throw new Error('DB is not ready.');

      const cfg = await getGetConfig({ db })();
      setConfig(cfg);
    } catch (e) {
      logger.error(e);
    } finally {
      setLoading(false);
    }
  }, [db, logger]);

  useFocusEffect(
    useCallback(() => {
      loadConfig();
    }, [loadConfig]),
  );

  const updateConfig = useCallback(
    async (newCfg: Partial<ConfigType>) => {
      setLoading(true);
      try {
        if (!db) throw new Error('DB is not ready.');

        const cfg = await updateConfigFn(newCfg, { db });
        setConfig(cfg);
        return true;
      } catch (e) {
        logger.error(e, { showAlert: true });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [db, logger],
  );

  const [refreshing, setRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      loadConfig();
    } catch (e) {
      logger.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [loadConfig, logger]);

  return useMemo(
    () => ({
      loading,
      config,
      updateConfig,
      reload: loadConfig,
      refresh,
      refreshing,
    }),
    [config, updateConfig, loadConfig, loading, refresh, refreshing],
  );
}
