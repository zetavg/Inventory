import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import createSensitiveStorage from 'redux-persist-sensitive-storage';

import {
  getDatabase,
  getAttachmentsDatabase,
  Database,
  AttachmentsDatabase,
} from '@app/db';
import dbSyncConfigReducer, {
  DBSyncConfigState,
  initialState as dbSyncInitialState,
} from '@app/features/db-sync/config/slice';

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

  dbSync: DBSyncConfigState;

  // remoteDbUri?: string;
  // remoteDbUsername?: string;
  // remoteDbPassword?: string;

  // remoteAttachmentsDbUri?: string;
  // remoteAttachmentsDbUsername?: string;
  // remoteAttachmentsDbPassword?: string;
};

export type ProfileSettings = {};

export type ProfileRuntimeData = {
  /**
   * Determines if the runtime data is initialized. Main app content should not
   * be rendered if the value is `false` - dispatch the `prepareProfile` action
   * to initialize the active profile first.
   */
  ready: boolean;

  /**
   * (For development only) Tell UI to skip initialization for this profile.
   */
  ignore?: boolean;

  /**
   * Returns the database for this profile.
   * Function prevents the whole structure from being stringified in logs or development tools.
   */
  getDB?: () => Database;
  /**
   * Returns the attachments database for this profile.
   * Function prevents the whole structure from being stringified in logs or development tools.
   */
  getAttachmentsDB?: () => AttachmentsDatabase;
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
        dbSync: dbSyncInitialState,
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
        dbSync: dbSyncInitialState,
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

      const config = state.configs[activeProfile];
      if (!config) return;

      if (!state.settings[activeProfile]) state.settings[activeProfile] = {};

      if (!state.runtimeData[activeProfile])
        state.runtimeData[activeProfile] = { ready: false };

      if (activeProfile === '/dev/null') {
        state.runtimeData[activeProfile].ignore = true;
        return;
      }

      const db = getDatabase(config.dbName);
      const getDB = () => db;
      getDB.toJSON = () => '...';
      state.runtimeData[activeProfile].getDB = getDB;
      const attachmentsDB = getAttachmentsDatabase(config.attachmentsDbName);
      const getAttachmentsDB = () => attachmentsDB;
      getAttachmentsDB.toJSON = () => '...';
      state.runtimeData[activeProfile].getAttachmentsDB = getAttachmentsDB;

      state.runtimeData[activeProfile].ready = true;
    },
    updateConfig: (state, action: PayloadAction<Partial<ProfileConfig>>) => {
      const { activeProfile } = state;
      if (!activeProfile) return;

      const config = state.configs[activeProfile];
      if (!config) return;

      state.configs[activeProfile] = {
        ...config,
        ...action.payload,
      };
    },
    updateSettings: (
      state,
      action: PayloadAction<Partial<ProfileSettings>>,
    ) => {
      const { activeProfile } = state;
      if (!activeProfile) return;

      if (state.settings[activeProfile]) state.settings[activeProfile] = {};

      state.settings[activeProfile] = {
        ...state.settings[activeProfile],
        ...action.payload,
      };
    },
  },
  extraReducers: builder => {
    builder.addMatcher(
      action => action.type.startsWith('dbSyncConfig'),
      (state, action) => {
        const { activeProfile } = state;
        if (!activeProfile) return;

        const config = state.configs[activeProfile];
        if (!config) return;

        config.dbSync = dbSyncConfigReducer(config.dbSync, action);
      },
    );
  },
});

export const {
  setupDefaultProfile,
  createProfile,
  switchProfile,
  prepareProfile,
  updateConfig,
  updateSettings,
} = counterSlice.actions;

const sensitiveStorage = createSensitiveStorage({
  keychainService: 'app',
  sharedPreferencesName: 'shared_preferences',
});

export default persistReducer(
  {
    key: 'profile-configs',
    storage: sensitiveStorage,
    whitelist: ['configs', 'settings', 'activeProfile'],
  },
  counterSlice.reducer,
);
