import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@app/redux/store';
import { persistReducer } from 'redux-persist';
import createSensitiveStorage from 'redux-persist-sensitive-storage';

export type ProfileColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink';

export type ProfileConfig = {
  color?: ProfileColor;
  dbName: string;
  attachmentsDbName: string;

  remoteDbUri?: string;
  remoteDbUsername?: string;
  remoteDbPassword?: string;

  remoteAttachmentsDbUri?: string;
  remoteAttachmentsDbUsername?: string;
  remoteAttachmentsDbPassword?: string;
};

export type ProfileSettings = {};

export type ProfileRuntimeData = {
  ready: boolean;
  ignore?: boolean;
};

type ProfilesState = {
  activeProfile?: string;
  configs: {
    [name: string]: ProfileConfig;
  };
  settings: {
    [name: string]: ProfileSettings;
  };
  runtimeData: {
    [name: string]: ProfileRuntimeData;
  };
};

const initialState: ProfilesState = {
  configs: {},
  settings: {},
  runtimeData: {},
};

export const counterSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    setupDefaultProfile: state => {
      if (state.configs.default) return;

      state.configs.default = {
        dbName: 'default',
        attachmentsDbName: 'default_attachments',
      };
    },
    createProfile: (
      state,
      action: PayloadAction<{ name: string } & Partial<ProfileConfig>>,
    ) => {
      const { name: profileName, ...config } = action.payload;
      if (state.configs[profileName]) return;

      state.configs[profileName] = {
        dbName: profileName,
        attachmentsDbName: `${profileName}_attachments`,
        ...config,
      };
    },
    deleteProfile: (
      state,
      action: PayloadAction<{ name: string } & Partial<ProfileConfig>>,
    ) => {
      const { name: profileName } = action.payload;
      const config = state.configs[profileName];
      if (!config) return;

      // TODO: Delete databases

      const configs = {
        ...state.configs,
      };
      delete configs[profileName];
      state.configs = configs;
    },
    switchProfile: (state, action: PayloadAction<string>) => {
      const profileName = action.payload;

      state.runtimeData[profileName] = { ready: false };

      if (profileName === '/dev/null') {
        state.runtimeData[profileName].ignore = true;
      }

      state.activeProfile = profileName;
    },
    prepareProfile: state => {
      const { activeProfile } = state;
      if (!activeProfile) return;

      if (!state.settings[activeProfile]) state.settings[activeProfile] = {};

      if (!state.runtimeData[activeProfile])
        state.runtimeData[activeProfile] = { ready: false };

      state.runtimeData[activeProfile].ready = true;
    },
  },
});

export const {
  setupDefaultProfile,
  createProfile,
  switchProfile,
  prepareProfile,
} = counterSlice.actions;

export const selectProfiles = (state: RootState) => state.profiles;
export const selectActiveProfileName = (state: RootState) =>
  state.profiles.activeProfile;
export const selectActiveProfileConfig = (state: RootState) =>
  state.profiles.activeProfile
    ? state.profiles.configs[state.profiles.activeProfile]
    : undefined;
export const selectActiveProfileSettings = (state: RootState) =>
  state.profiles.activeProfile
    ? state.profiles.settings[state.profiles.activeProfile]
    : undefined;
export const selectActiveProfileRuntimeData = (state: RootState) =>
  state.profiles.activeProfile
    ? state.profiles.runtimeData[state.profiles.activeProfile] || {
        ready: false,
      }
    : { ready: false };

const sensitiveStorage = createSensitiveStorage({
  keychainService: 'app',
  sharedPreferencesName: 'shared_preferences',
});

export default persistReducer(
  {
    key: 'profile-configs',
    storage: sensitiveStorage,
    whitelist: ['configs', 'settings'],
  },
  counterSlice.reducer,
);
