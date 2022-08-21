import { useAppSelector } from '@app/redux';
import { selectConfig } from '../config/selectors';
import { selectSettings } from '../manage/selectors';

type DetailedStatus = {
  allServersDisabled?: boolean;
};

const EMPTY_OBJECT = {};

type ReturnValue = [string, DetailedStatus];

export default function useOverallDBSyncStatus(): ReturnValue {
  const config = useAppSelector(selectConfig);
  const settings = useAppSelector(selectSettings);

  if (!config || Object.keys(config).length <= 0) {
    return ['Not Configured', EMPTY_OBJECT];
  }

  const allServersDisabled = Object.keys(config)
    .map(serverName => (settings?.serverSettings || {})[serverName]?.disabled)
    .every(v => v === true);

  if (settings?.disabled || allServersDisabled) {
    return ['Disabled', { allServersDisabled }];
  }

  return ['Enabled', EMPTY_OBJECT];
}
