import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { PersistableReducer } from '@app/redux/types';
import {
  combine,
  mapActionReducers,
  mapSelectors,
  overrideActions,
} from '@app/redux/utils';
import {
  actions as cacheSliceActions,
  CacheState,
  initialState as cacheInitialState,
  name as cacheSliceName,
  reducer as cacheReducer,
  selectors as cacheSelectors,
} from '@app/features/cache';
import {
  actions as settingsSliceActions,
  initialState as settingsInitialState,
  name as settingsSliceName,
  reducer as settingsReducer,
  selectors as settingsSelectors,
  SettingsState,
} from '@app/features/settings/slice';

import { deepMerge } from '@app/utils/deepMerge';
import mapObjectValues from '@app/utils/mapObjectValues';
import randomUniqueUuid from '@app/utils/randomUniqueUuid';
import { DeepPartial } from '@app/utils/types';

export const COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'indigo',
  'purple',
  'pink',
] as const;

export type ProfileColor = (typeof COLORS)[number];

interface ProfileState {
  name: string;
  color: ProfileColor;
  settings: SettingsState;
  [cacheSliceName]: CacheState;
}

interface ProfilesState {
  currentProfile?: string | undefined;
  profiles: {
    [key: string]: ProfileState;
  };
}

const profileInitialState: ProfileState = {
  name: 'New Profile',
  color: 'blue' as const,
  settings: settingsInitialState,
  [cacheSliceName]: cacheInitialState,
};

const initialState: ProfilesState = {
  currentProfile: '',
  profiles: {},
};

export const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: combine(
    {
      newProfile: (
        state: ProfilesState,
        action: PayloadAction<{ name: string; color: ProfileColor }>,
      ) => {
        const profileId = randomUniqueUuid(Object.keys(state.profiles), {
          short: true,
        });
        state.profiles[profileId] = {
          ...profileInitialState,
          ...action.payload,
        };

        if (!state.currentProfile) {
          state.currentProfile = profileId;
        }
      },
      switchProfile: (state: ProfilesState, action: PayloadAction<string>) => {
        if (!state.profiles[action.payload]) return;

        state.currentProfile = action.payload;
      },
      updateProfile: (
        state: ProfilesState,
        action: PayloadAction<{
          uuid: string;
          name: string;
          color: ProfileColor;
        }>,
      ) => {
        const profile = state.profiles[action.payload.uuid];
        if (!profile) return;
        profile.name = action.payload.name;
        profile.color = action.payload.color;
      },
      deleteProfile: (state: ProfilesState, action: PayloadAction<string>) => {
        delete state.profiles[action.payload];
        if (state.currentProfile === action.payload) {
          state.currentProfile = Object.keys(state.profiles)[0];
        }
        // TODO: delete database etc.
      },
    },
    mapActionReducers(
      settingsSliceActions.settings,
      actionCreator => (state: ProfilesState, action: any) => {
        if (!state.currentProfile || !state.profiles[state.currentProfile]) {
          return;
        }

        state.profiles[state.currentProfile].settings = settingsReducer(
          state.profiles[state.currentProfile].settings,
          actionCreator(action.payload),
        );
      },
      settingsSliceName,
    ),
    mapActionReducers(
      cacheSliceActions.cache,
      actionCreator => (state: ProfilesState, action: any) => {
        if (!state.currentProfile || !state.profiles[state.currentProfile]) {
          return;
        }

        state.profiles[state.currentProfile][cacheSliceName] = cacheReducer(
          state.profiles[state.currentProfile][cacheSliceName],
          actionCreator(action.payload),
        );
      },
      cacheSliceName,
    ),
  ),
});

export const name = profilesSlice.name;

export const reducer: PersistableReducer<typeof profilesSlice.reducer> =
  profilesSlice.reducer;

export const actions = {
  profiles: profilesSlice.actions,
  settings: overrideActions(
    settingsSliceActions.settings,
    profilesSlice.actions,
    settingsSliceName,
  ),
  cache: overrideActions(
    cacheSliceActions.cache,
    profilesSlice.actions,
    cacheSliceName,
  ),
};

export const getDbNameFromProfileUuid = (profileUuid: string) =>
  `db_${profileUuid}`;
export const getLogsDbNameFromProfileUuid = (profileUuid: string) =>
  `db_${profileUuid}_logs`;

export const selectors = {
  profiles: {
    currentProfileUuid: (state: ProfilesState) => state.currentProfile,
    currentProfileName: (state: ProfilesState) =>
      state.profiles[state.currentProfile || '']?.name,
    currentProfileColor: (state: ProfilesState) =>
      state.profiles[state.currentProfile || '']?.color,
    profileUuidAndNames: (state: ProfilesState) =>
      Object.fromEntries(
        Object.entries(state.profiles).map(([uuid, profile]) => [
          uuid,
          profile.name,
        ]),
      ),
    profiles: (state: ProfilesState) => state.profiles,
    currentDbName: (state: ProfilesState) =>
      state.currentProfile
        ? getDbNameFromProfileUuid(state.currentProfile)
        : null,
    currentLogsDbName: (state: ProfilesState) =>
      state.currentProfile
        ? getLogsDbNameFromProfileUuid(state.currentProfile)
        : null,
  },
  settings: mapSelectors(
    settingsSelectors.settings,
    selector => (state: ProfilesState) =>
      selector(state.profiles[state.currentProfile || '']?.settings),
  ),
  cache: mapSelectors(
    cacheSelectors.cache,
    selector => (state: ProfilesState) =>
      selector(
        state.profiles[state.currentProfile || ''] &&
          state.profiles[state.currentProfile || ''][cacheSliceName],
      ),
  ),
};

reducer.dehydrate = (state: ProfilesState) => {
  const dehydratedState: DeepPartial<ProfilesState> = {
    currentProfile: state.currentProfile,
    profiles: mapObjectValues(state.profiles, s => ({
      name: s.name,
      color: s.color,
      ...(settingsReducer.dehydrate
        ? { settings: settingsReducer.dehydrate(s.settings) }
        : {}),
    })),
  };

  return dehydratedState;
};

reducer.rehydrate = (dehydratedState: DeepPartial<ProfilesState>) => {
  const state: DeepPartial<ProfilesState> = {
    currentProfile: dehydratedState.currentProfile,
    profiles: mapObjectValues(dehydratedState.profiles || {}, s => ({
      ...s,
      ...(settingsReducer.rehydrate && s && s.settings
        ? { settings: settingsReducer.rehydrate(s.settings) }
        : {}),
    })),
  };

  // We need to make sure that each profile has a complete state since they will have no initial state to merge from.
  if (state.profiles) {
    state.profiles = mapObjectValues(state.profiles, s =>
      deepMerge(profileInitialState, s),
    );
  }

  // Ensure that a profile is selected.
  if (state.profiles && !state.profiles[state.currentProfile || '']) {
    state.currentProfile = Object.keys(state.currentProfile || {})[0];
  }

  return state;
};

reducer.dehydrateSensitive = (state: ProfilesState) => {
  if (!state) return {};

  const dehydratedState: DeepPartial<ProfilesState> = {
    ...(state.profiles
      ? {
          profiles: mapObjectValues(state.profiles, s => ({
            ...(s.settings && settingsReducer.dehydrateSensitive
              ? { settings: settingsReducer.dehydrateSensitive(s.settings) }
              : {}),
          })),
        }
      : {}),
  };

  return dehydratedState;
};

reducer.rehydrateSensitive = dehydratedState => {
  const state: DeepPartial<ProfilesState> = {
    ...(dehydratedState.profiles
      ? {
          profiles: mapObjectValues(dehydratedState.profiles, s => ({
            ...(s.settings && settingsReducer.rehydrateSensitive
              ? { settings: settingsReducer.rehydrateSensitive(s.settings) }
              : {}),
          })),
        }
      : {}),
  };

  return state as any;
};

// /////////////////

// import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { persistReducer } from 'redux-persist';
// import createSensitiveStorage from 'redux-persist-sensitive-storage';

// import {
//   getDatabase,
//   getAttachmentsDatabase,
//   Database,
//   AttachmentsDatabase,
//   LogsDatabase,
//   getLogsDatabase,
// } from '@app/db/pouchdb';
// import dbSyncConfigReducer, {
//   dbSyncConfigSlice,
//   DBSyncConfigState,
//   initialState as dbSyncInitialState,
// } from '@app/features/db-sync/config/slice';

// export type ProfileColor =
//   | 'red'
//   | 'orange'
//   | 'yellow'
//   | 'green'
//   | 'teal'
//   | 'blue'
//   | 'indigo'
//   | 'purple'
//   | 'pink';

// export type ProfileConfig = {
//   color?: ProfileColor;
//   dbName: string;
//   attachmentsDbName: string;

//   dbSync: DBSyncConfigState;
// };

// export type ProfileRuntimeData = {
//   /**
//    * Determines if the runtime data is initialized. Main app content should not
//    * be rendered if the value is `false` - dispatch the `prepareProfile` action
//    * to initialize the active profile first.
//    */
//   ready: boolean;

//   /**
//    * (For development only) Tell UI to skip initialization for this profile.
//    */
//   ignore?: boolean;

//   /**
//    * Returns the database for this profile.
//    * Function prevents the whole structure from being stringified in logs or development tools.
//    */
//   getDB?: () => Database;
//   /**
//    * Returns the attachments database for this profile.
//    * Function prevents the whole structure from being stringified in logs or development tools.
//    */
//   getAttachmentsDB?: () => AttachmentsDatabase;
//   /**
//    * Returns the logs database for this profile.
//    * Function prevents the whole structure from being stringified in logs or development tools.
//    */
//   getLogsDB?: () => LogsDatabase;
// };

// type ProfilesState = {
//   activeProfile?: string;
//   configs: {
//     [name: string]: ProfileConfig;
//   };
//   runtimeData: {
//     [name: string]: ProfileRuntimeData;
//   };
// };

// const initialState: ProfilesState = {
//   configs: {},
//   runtimeData: {},
// };

// export const profilesSlice = createSlice({
//   name: 'profiles',
//   initialState,
//   reducers: {
//     setupDefaultProfile: state => {
//       if (state.configs.default) return;

//       state.configs.default = {
//         dbName: 'default',
//         attachmentsDbName: 'default_attachments',
//         dbSync: dbSyncInitialState,
//       };
//     },
//     createProfile: (
//       state,
//       action: PayloadAction<{ name: string } & Partial<ProfileConfig>>,
//     ) => {
//       const { name: profileName, ...config } = action.payload;
//       if (state.configs[profileName]) return;

//       state.configs[profileName] = {
//         dbName: profileName,
//         attachmentsDbName: `${profileName}_attachments`,
//         dbSync: dbSyncInitialState,
//         ...config,
//       };
//     },
//     deleteProfile: (
//       state,
//       action: PayloadAction<{ name: string } & Partial<ProfileConfig>>,
//     ) => {
//       const { name: profileName } = action.payload;
//       const config = state.configs[profileName];
//       if (!config) return;

//       // TODO: Delete databases
//       const db = getDatabase(config.dbName);
//       const attachmentsDB = getAttachmentsDatabase(config.attachmentsDbName);
//       const logsDB = getLogsDatabase(`${config.dbName}_logs`);
//       db.destroy();
//       attachmentsDB.destroy();
//       logsDB.destroy();

//       const configs = {
//         ...state.configs,
//       };
//       delete configs[profileName];
//       state.configs = configs;
//     },
//     switchProfile: (state, action: PayloadAction<string>) => {
//       const profileName = action.payload;

//       state.runtimeData[profileName] = { ready: false };

//       if (profileName === '/dev/null') {
//         state.runtimeData[profileName].ignore = true;
//       }

//       state.activeProfile = profileName;
//     },
//     prepareProfile: state => {
//       const { activeProfile } = state;
//       if (!activeProfile) return;

//       const config = state.configs[activeProfile];
//       if (!config) return;

//       if (!state.runtimeData[activeProfile])
//         state.runtimeData[activeProfile] = { ready: false };

//       if (activeProfile === '/dev/null') {
//         state.runtimeData[activeProfile].ignore = true;
//         return;
//       }

//       const db = getDatabase(config.dbName);
//       const getDB = () => db;
//       getDB.toJSON = () => '...';
//       state.runtimeData[activeProfile].getDB = getDB;
//       const attachmentsDB = getAttachmentsDatabase(config.attachmentsDbName);
//       const getAttachmentsDB = () => attachmentsDB;
//       getAttachmentsDB.toJSON = () => '...';
//       state.runtimeData[activeProfile].getAttachmentsDB = getAttachmentsDB;
//       const logsDB = getLogsDatabase(`${config.dbName}_logs`);
//       const getLogsDB = () => logsDB;
//       getLogsDB.toJSON = () => '...';
//       state.runtimeData[activeProfile].getLogsDB = getLogsDB;

//       state.runtimeData[activeProfile].ready = true;
//     },
//     updateConfig: (state, action: PayloadAction<Partial<ProfileConfig>>) => {
//       const { activeProfile } = state;
//       if (!activeProfile) return;

//       const config = state.configs[activeProfile];
//       if (!config) return;

//       state.configs[activeProfile] = {
//         ...config,
//         ...action.payload,
//       };
//     },
//   },
//   extraReducers: builder => {
//     builder.addMatcher(
//       action => action.type.startsWith(dbSyncConfigSlice.name),
//       (state, action) => {
//         const { activeProfile } = state;
//         if (!activeProfile) return;

//         const config = state.configs[activeProfile];
//         if (!config) return;

//         config.dbSync = dbSyncConfigReducer(config.dbSync, action);
//       },
//     );
//   },
// });

// export const {
//   setupDefaultProfile,
//   createProfile,
//   switchProfile,
//   deleteProfile,
//   prepareProfile,
//   updateConfig,
// } = profilesSlice.actions;

// const sensitiveStorage = createSensitiveStorage({
//   keychainService: 'app',
//   sharedPreferencesName: 'shared_preferences',
// });

// export default persistReducer(
//   {
//     key: 'profile-configs',
//     storage: sensitiveStorage,
//     whitelist: ['configs', 'activeProfile'],
//     timeout: 50000,
//   },
//   profilesSlice.reducer,
// );
