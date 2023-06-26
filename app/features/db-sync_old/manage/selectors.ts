// @ts-nocheck

import { RootState } from '@app/redux';
import { selectSettings as selectProfileSettings } from '@app/features/settings';
import { selectActiveProfileName } from '@app/features/profiles';

import { DBSyncStatus } from './statusSlice';

export const selectSettings = (state: RootState) =>
  selectProfileSettings(state)?.dbSync;

export const selectDBSyncStatus = (state: RootState): DBSyncStatus => {
  const activeProfileName = selectActiveProfileName(state);
  if (!activeProfileName) return {};

  return state.dbSyncStatus[activeProfileName];
};
