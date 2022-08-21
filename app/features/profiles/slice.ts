import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import createSensitiveStorage from 'redux-persist-sensitive-storage';

import {
  getDatabase,
  getAttachmentsDatabase,
  Database,
  AttachmentsDatabase,
  LogsDatabase,
  getLogsDatabase,
} from '@app/db';
import dbSyncConfigReducer, {
  dbSyncConfigSlice,
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
};

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
  /**
   * Returns the logs database for this profile.
   * Function prevents the whole structure from being stringified in logs or development tools.
   */
  getLogsDB?: () => LogsDatabase;
};

type ProfilesState = {
  activeProfile?: string;
  configs: {
    [name: string]: ProfileConfig;
  };
  runtimeData: {
    [name: string]: ProfileRuntimeData;
  };
};

const initialState: ProfilesState = {
  configs: {},
  runtimeData: {},
};

export const profilesSlice = createSlice({
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
      const db = getDatabase(config.dbName);
      const attachmentsDB = getAttachmentsDatabase(config.attachmentsDbName);
      const logsDB = getLogsDatabase(`${config.dbName}_logs`);
      db.destroy();
      attachmentsDB.destroy();
      logsDB.destroy();

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
      const logsDB = getLogsDatabase(`${config.dbName}_logs`);
      const getLogsDB = () => logsDB;
      getLogsDB.toJSON = () => '...';
      state.runtimeData[activeProfile].getLogsDB = getLogsDB;

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
  },
  extraReducers: builder => {
    builder.addMatcher(
      action => action.type.startsWith(dbSyncConfigSlice.name),
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
  deleteProfile,
  prepareProfile,
  updateConfig,
} = profilesSlice.actions;

const sensitiveStorage = createSensitiveStorage({
  keychainService: 'app',
  sharedPreferencesName: 'shared_preferences',
});

export default persistReducer(
  {
    key: 'profile-configs',
    storage: sensitiveStorage,
    whitelist: ['configs', 'activeProfile'],
    timeout: 50000,
  },
  profilesSlice.reducer,
);
