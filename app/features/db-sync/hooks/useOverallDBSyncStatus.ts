import { useAppSelector } from '@app/redux';
import { selectConfig } from '../config/selectors';
import { selectDBSyncStatus, selectSettings } from '../manage/selectors';
import { isErrorStatus, reduceServerStatus } from '../manage/utils';

type DetailedStatus = {
  allServersDisabled?: boolean;
};

const EMPTY_OBJECT = {};

type ReturnValue = [string, DetailedStatus];

export default function useOverallDBSyncStatus(): ReturnValue {
  const config = useAppSelector(selectConfig);
  const settings = useAppSelector(selectSettings);
  const syncStatus = useAppSelector(selectDBSyncStatus);

  if (!config || Object.keys(config).length <= 0) {
    return ['Not Configured', EMPTY_OBJECT];
  }

  const allServersDisabled = Object.keys(config)
    .map(serverName => (settings?.serverSettings || {})[serverName]?.disabled)
    .every(v => v === true);

  if (settings?.disabled || allServersDisabled) {
    return ['Disabled', { allServersDisabled }];
  }

  const syncStatusOfEachServer = Object.keys(config).map(
    serverName =>
      reduceServerStatus(
        (syncStatus?.serverStatus || {})[serverName] || {},
        !!(settings?.serverSettings || {})[serverName]?.disabled,
        allServersDisabled,
      ).status,
  );

  if (
    syncStatusOfEachServer.every(
      s => isErrorStatus(s) || s === 'Offline' || s === 'Disabled',
    )
  ) {
    if (syncStatusOfEachServer.some(s => s === 'Offline'))
      return ['Offline', EMPTY_OBJECT];

    if (syncStatusOfEachServer.some(s => s === 'Auth Error'))
      return ['Auth Error', EMPTY_OBJECT];

    if (syncStatusOfEachServer.some(s => s === 'Config Error'))
      return ['Config Error', EMPTY_OBJECT];

    return ['Error', EMPTY_OBJECT];
  }

  return ['Enabled', EMPTY_OBJECT];
}
