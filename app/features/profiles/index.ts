import beforeDeleteProfile from './beforeDeleteProfile';
export { beforeDeleteProfile };

import { selectors, store } from '@app/redux';

import {
  getDbNameFromProfileUuid,
  getLogsDbNameFromProfileUuid,
} from './slice';

export function getCurrentProfileUuid() {
  const state = store.getState();
  const currentProfileUuid = selectors.profiles.currentProfileUuid(state);
  return currentProfileUuid;
}

export function getCurrentDbName() {
  const currentProfileUuid = getCurrentProfileUuid();
  if (!currentProfileUuid) return null;

  return getDbNameFromProfileUuid(currentProfileUuid);
}

export function getCurrentLogsDbName() {
  const currentProfileUuid = getCurrentProfileUuid();
  if (!currentProfileUuid) return null;

  return getLogsDbNameFromProfileUuid(currentProfileUuid);
}
