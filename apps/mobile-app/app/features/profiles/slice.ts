import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import appLogger from '@app/logger';

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
  actions as dbSyncSliceActions,
  DBSyncState,
  initialState as dbSyncInitialState,
  name as dbSyncSliceName,
  reducer as dbSyncReducer,
  selectors as dbSyncSelectors,
} from '@app/features/db-sync/slice';
import {
  actions as integrationsSliceActions,
  initialState as integrationsInitialState,
  IntegrationsState,
  name as integrationsSliceName,
  reducer as integrationsReducer,
  selectors as integrationsSelectors,
} from '@app/features/integrations/slice';
import {
  actions as inventorySliceActions,
  initialState as inventoryInitialState,
  InventoryState,
  name as inventorySliceName,
  reducer as inventoryReducer,
  selectors as inventorySelectors,
} from '@app/features/inventory/slice';
import {
  actions as labelPrintersSliceActions,
  initialState as labelPrintersInitialState,
  LabelPrintersState,
  name as labelPrintersSliceName,
  reducer as labelPrintersReducer,
  selectors as labelPrintersSelectors,
} from '@app/features/label-printers/slice';
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
import removePasswordFromJSON from '@app/utils/removePasswordFromJSON';
import { DeepPartial } from '@app/utils/types';
const logger = appLogger.for({ module: 'f/profiles' });
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
  configUuid?: string;
  setupDone?: boolean;
  dbSync: DBSyncState;
  settings: SettingsState;
  inventory: InventoryState;
  integrations: IntegrationsState;
  labelPrinters: LabelPrintersState;
  integrationsCountCache?: number;
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
  dbSync: dbSyncInitialState,
  settings: settingsInitialState,
  inventory: inventoryInitialState,
  labelPrinters: labelPrintersInitialState,
  integrations: integrationsInitialState,
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
        // Database deletion is now done by the UI (beforeDeleteProfile should be called before dispatching this action).
        delete state.profiles[action.payload];
        if (state.currentProfile === action.payload) {
          state.currentProfile = Object.keys(state.profiles)[0];
        }
      },
      markCurrentProfileAsSetupDone: (
        state: ProfilesState,
        action: PayloadAction<{ configUuid: string }>,
      ) => {
        const currentProfile = state.currentProfile
          ? state.profiles[state.currentProfile]
          : null;
        if (!currentProfile) return;

        currentProfile.setupDone = true;
        currentProfile.configUuid = action.payload.configUuid;
      },
      updateIntegrationsCountCache: (
        state: ProfilesState,
        action: PayloadAction<number>,
      ) => {
        const currentProfile = state.currentProfile
          ? state.profiles[state.currentProfile]
          : null;
        if (!currentProfile) return;

        currentProfile.integrationsCountCache = action.payload;
      },
    },
    mapActionReducers(
      dbSyncSliceActions.dbSync,
      actionCreator => (state: ProfilesState, action: any) => {
        if (!state.currentProfile || !state.profiles[state.currentProfile]) {
          return;
        }

        state.profiles[state.currentProfile].dbSync = dbSyncReducer(
          state.profiles[state.currentProfile].dbSync,
          actionCreator(action.payload),
        );
      },
      dbSyncSliceName,
    ),
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
      inventorySliceActions.inventory,
      actionCreator => (state: ProfilesState, action: any) => {
        if (!state.currentProfile || !state.profiles[state.currentProfile]) {
          return;
        }

        state.profiles[state.currentProfile].inventory = inventoryReducer(
          state.profiles[state.currentProfile].inventory,
          actionCreator(action.payload),
        );
      },
      inventorySliceName,
    ),
    mapActionReducers(
      labelPrintersSliceActions.labelPrinters,
      actionCreator => (state: ProfilesState, action: any) => {
        if (!state.currentProfile || !state.profiles[state.currentProfile]) {
          return;
        }

        state.profiles[state.currentProfile].labelPrinters =
          labelPrintersReducer(
            state.profiles[state.currentProfile].labelPrinters,
            actionCreator(action.payload),
          );
      },
      labelPrintersSliceName,
    ),
    mapActionReducers(
      integrationsSliceActions.integrations,
      actionCreator => (state: ProfilesState, action: any) => {
        if (!state.currentProfile || !state.profiles[state.currentProfile]) {
          return;
        }

        state.profiles[state.currentProfile].integrations = integrationsReducer(
          state.profiles[state.currentProfile].integrations,
          actionCreator(action.payload),
        );
      },
      integrationsSliceName,
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
  dbSync: overrideActions(
    dbSyncSliceActions.dbSync,
    profilesSlice.actions,
    dbSyncSliceName,
  ),
  settings: overrideActions(
    settingsSliceActions.settings,
    profilesSlice.actions,
    settingsSliceName,
  ),
  labelPrinters: overrideActions(
    labelPrintersSliceActions.labelPrinters,
    profilesSlice.actions,
    labelPrintersSliceName,
  ),
  inventory: overrideActions(
    inventorySliceActions.inventory,
    profilesSlice.actions,
    inventorySliceName,
  ),
  integrations: overrideActions(
    integrationsSliceActions.integrations,
    profilesSlice.actions,
    integrationsSliceName,
  ),
  cache: overrideActions(
    cacheSliceActions.cache,
    profilesSlice.actions,
    cacheSliceName,
  ),
};

export const getDbNameFromProfileUuid = (profileUuid: string) =>
  `db_${profileUuid}`;

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
    isSetupNotDone: (state: ProfilesState) =>
      state.currentProfile
        ? !state.profiles[state.currentProfile || '']?.setupDone
        : false,
    integrationsCountCache: (state: ProfilesState) =>
      state.currentProfile
        ? state.profiles[state.currentProfile || '']?.integrationsCountCache ||
          0
        : 0,
  },
  dbSync: mapSelectors(
    dbSyncSelectors.dbSync,
    selector => (state: ProfilesState) =>
      selector(state.profiles[state.currentProfile || '']?.dbSync),
  ),
  settings: mapSelectors(
    settingsSelectors.settings,
    selector => (state: ProfilesState) =>
      selector(state.profiles[state.currentProfile || '']?.settings),
  ),
  labelPrinters: mapSelectors(
    labelPrintersSelectors.labelPrinters,
    selector => (state: ProfilesState) =>
      selector(state.profiles[state.currentProfile || '']?.labelPrinters),
  ),
  inventory: mapSelectors(
    inventorySelectors.inventory,
    selector => (state: ProfilesState) =>
      selector(state.profiles[state.currentProfile || '']?.inventory),
  ),
  integrations: mapSelectors(
    integrationsSelectors.integrations,
    selector => (state: ProfilesState) =>
      selector(state.profiles[state.currentProfile || '']?.integrations),
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

const loggerForPersist = logger.for({ function: 'persist' });

reducer.dehydrate = (state: ProfilesState) => {
  const dehydratedState: DeepPartial<ProfilesState> = {
    currentProfile: state.currentProfile,
    profiles: mapObjectValues(state.profiles, s => ({
      name: s.name,
      color: s.color,
      setupDone: s.setupDone,
      configUuid: s.configUuid,
      integrationsCountCache: s.integrationsCountCache,
      ...(dbSyncReducer.dehydrate
        ? { dbSync: dbSyncReducer.dehydrate(s.dbSync) }
        : {}),
      ...(settingsReducer.dehydrate
        ? { settings: settingsReducer.dehydrate(s.settings) }
        : {}),
      ...(inventoryReducer.dehydrate
        ? { inventory: inventoryReducer.dehydrate(s.inventory) }
        : {}),
      ...(labelPrintersReducer.dehydrate
        ? { labelPrinters: labelPrintersReducer.dehydrate(s.labelPrinters) }
        : {}),
      ...(integrationsReducer.dehydrate
        ? { integrations: integrationsReducer.dehydrate(s.integrations) }
        : {}),
    })),
  };

  // loggerForPersist.debug('State dehydrated.', {
  //   details: removePasswordFromJSON(
  //     JSON.stringify({ dehydratedState }, null, 2),
  //   ),
  // });
  return dehydratedState;
};

reducer.rehydrate = (dehydratedState: DeepPartial<ProfilesState>) => {
  const state: DeepPartial<ProfilesState> = {
    currentProfile: dehydratedState.currentProfile,
    profiles: mapObjectValues(dehydratedState.profiles || {}, s => ({
      ...s,
      ...(dbSyncReducer.rehydrate && s && s.dbSync
        ? { dbSync: dbSyncReducer.rehydrate(s.dbSync) }
        : {}),
      ...(settingsReducer.rehydrate && s && s.settings
        ? { settings: settingsReducer.rehydrate(s.settings) }
        : {}),
      ...(inventoryReducer.rehydrate && s && s.inventory
        ? { inventory: inventoryReducer.rehydrate(s.inventory) }
        : {}),
      ...(labelPrintersReducer.rehydrate && s && s.labelPrinters
        ? { labelPrinters: labelPrintersReducer.rehydrate(s.labelPrinters) }
        : {}),
      ...(integrationsReducer.rehydrate && s && s.integrations
        ? { integrations: integrationsReducer.rehydrate(s.integrations) }
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

  loggerForPersist.debug('State rehydrated.', {
    details: removePasswordFromJSON(JSON.stringify({ state }, null, 2)),
  });
  return state;
};

reducer.dehydrateSensitive = (state: ProfilesState) => {
  if (!state) return {};

  const dehydratedState: DeepPartial<ProfilesState> = {
    ...(state.profiles
      ? {
          profiles: mapObjectValues(state.profiles, s => ({
            ...(s.dbSync && dbSyncReducer.dehydrateSensitive
              ? { dbSync: dbSyncReducer.dehydrateSensitive(s.dbSync) }
              : {}),
            ...(s.settings && settingsReducer.dehydrateSensitive
              ? { settings: settingsReducer.dehydrateSensitive(s.settings) }
              : {}),
            ...(s.inventory && inventoryReducer.dehydrateSensitive
              ? { inventory: inventoryReducer.dehydrateSensitive(s.inventory) }
              : {}),
            ...(s.integrations && integrationsReducer.dehydrateSensitive
              ? {
                  integrations: integrationsReducer.dehydrateSensitive(
                    s.integrations,
                  ),
                }
              : {}),
          })),
        }
      : {}),
  };

  // loggerForPersist.debug('Sensitive state dehydrated.', {
  //   details: removePasswordFromJSON(
  //     JSON.stringify({ dehydratedState }, null, 2),
  //   ),
  // });
  return dehydratedState;
};

reducer.rehydrateSensitive = dehydratedState => {
  const state: DeepPartial<ProfilesState> = {
    ...(dehydratedState.profiles
      ? {
          profiles: mapObjectValues(dehydratedState.profiles, s => ({
            ...(s.dbSync && dbSyncReducer.rehydrateSensitive
              ? { dbSync: dbSyncReducer.rehydrateSensitive(s.dbSync) }
              : {}),
            ...(s.settings && settingsReducer.rehydrateSensitive
              ? { settings: settingsReducer.rehydrateSensitive(s.settings) }
              : {}),
            ...(s.inventory && inventoryReducer.rehydrateSensitive
              ? { inventory: inventoryReducer.rehydrateSensitive(s.inventory) }
              : {}),
            ...(s.integrations && integrationsReducer.rehydrateSensitive
              ? {
                  integrations: integrationsReducer.rehydrateSensitive(
                    s.integrations,
                  ),
                }
              : {}),
          })),
        }
      : {}),
  };

  loggerForPersist.debug('Sensitive state rehydrated.', {
    details: removePasswordFromJSON(JSON.stringify({ state }, null, 2)),
  });
  return state as any;
};
