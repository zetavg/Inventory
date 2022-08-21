import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAction, Action } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import {
  deleteProfile,
  selectActiveProfileConfig,
} from '@app/features/profiles';

import dbSyncSettingsReducer, {
  dbSyncSettingsSlice,
  DBSyncSettingsState,
} from '@app/features/db-sync/manage/settingsSlice';

const NAME = 'settings';

export type Settings = {
  dbSync?: DBSyncSettingsState;
};

type SettingsState = {
  [profileName: string]: Settings;
};

const initialState: SettingsState = {};

export const updateSettings = createAction<Partial<Settings>>(
  `${NAME}/updateSettings`,
);

export const resetSettings = createAction<Partial<Settings>>(
  `${NAME}/resetSettings`,
);

export function settingsReducer(
  state = initialState,
  action: Action,
  rootState: any,
) {
  // Delete settings if the profile is deleted
  if (deleteProfile.match(action)) {
    const { name: profileName } = action.payload;
    const newState = { ...state };
    delete newState[profileName];
    return newState;
  }

  // Actions handled below are specific to the active profile
  const activeProfile = rootState?.profiles?.activeProfile;
  if (!activeProfile) return state;

  if (updateSettings.match(action)) {
    return {
      ...state,
      [activeProfile]: {
        ...state[activeProfile],
        ...action.payload,
      },
    };
  } else if (resetSettings.match(action)) {
    return {
      ...state,
      [activeProfile]: {},
    };
  } else if (action.type.startsWith(dbSyncSettingsSlice.name)) {
    // Immer may not work in these reducers
    return {
      ...state,
      [activeProfile]: {
        ...state[activeProfile],
        dbSync: dbSyncSettingsSlice.reducer(
          state[activeProfile]?.dbSync,
          action,
        ),
      },
    };
  } else {
    return state;
  }
}

export default persistReducer(
  {
    key: 'settings',
    storage: AsyncStorage,
    timeout: 50000,
  },
  settingsReducer,
);
