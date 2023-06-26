import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { PersistableReducer } from '@app/redux/types';

import deepMerge from '@app/utils/deepMerge';
import mapObjectValues from '@app/utils/mapObjectValues';
import randomUniqueUuid from '@app/utils/randomUniqueUuid';
import { DeepPartial } from '@app/utils/types';

export type DBSyncServerEditableData = {
  enabled: boolean;
  name: string;
  uri: string;
  username: string;
  password: string;
};

export type DBSyncServer = DBSyncServerEditableData & {
  lastSyncedAt?: number;
};

// Define a type for the slice state
export interface DBSyncState {
  enable: boolean;
  servers: Record<string, DBSyncServer>;
}

export const initialServerState = {
  enabled: true,
  name: '',
  uri: '',
  username: '',
  password: '',
};

// Define the initial state using that type
export const initialState: DBSyncState = {
  enable: true,
  servers: {},
};

export const dbSyncSlice = createSlice({
  name: 'dbSync',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    enable: state => {
      state.enable = true;
    },
    disable: state => {
      state.enable = false;
    },
    toggleEnable: state => {
      state.enable = !state.enable;
    },
    setEnable: (state, action: PayloadAction<boolean>) => {
      state.enable = action.payload;
    },
    createServer: (state, action: PayloadAction<DBSyncServerEditableData>) => {
      const serverId = randomUniqueUuid(Object.keys(state.servers), {
        short: true,
      });
      state.servers[serverId] = {
        ...action.payload,
      };
    },
    updateServer: (
      state,
      action: PayloadAction<[string, Partial<DBSyncServerEditableData>]>,
    ) => {
      const [serverId, data] = action.payload;
      if (!state.servers[serverId]) return;
      state.servers[serverId] = {
        ...state.servers[serverId],
        ...data,
      };
    },
    toggleServerEnable: (state, action: PayloadAction<string>) => {
      const serverId = action.payload;
      if (!state.servers[serverId]) return;
      state.servers[serverId].enabled = !state.servers[serverId].enabled;
    },
    deleteServer: (state, action: PayloadAction<string>) => {
      const serverId = action.payload;
      if (!state.servers[serverId]) return;
      delete state.servers[serverId];
    },
  },
});

export const name = dbSyncSlice.name;

// Export the reducer
export const reducer: PersistableReducer<typeof dbSyncSlice.reducer> =
  dbSyncSlice.reducer;

// Export actions
export const actions = {
  dbSync: dbSyncSlice.actions,
};

// Selectors can be used to retrieve a certain part of the state. The slice
// should not know where it will be in the state tree, so this should only
// select from the slice's own state, and it will be composed as we compose
// reducers.
export const selectors = {
  dbSync: {
    dbSyncEnabled: (state: DBSyncState) => state.enable,
    servers: (state: DBSyncState) => state.servers,
  },
};

reducer.dehydrateSensitive = (state: DBSyncState) => {
  if (!state) return {};

  return {
    ...state,
    servers: mapObjectValues(state.servers, server => ({
      enabled: server.enabled,
      name: server.name,
      uri: server.uri,
      username: server.username,
      password: server.password,
      lastSyncedAt: server.lastSyncedAt,
    })),
  };
};

reducer.rehydrateSensitive = dehydratedState => {
  const state: DeepPartial<DBSyncState> = {
    ...dehydratedState,
    servers: mapObjectValues(dehydratedState.servers || {}, s => ({
      ...s,
    })),
  };

  // We need to make sure that each server has a complete state since they will have no initial state to merge from.
  if (state.servers) {
    state.servers = mapObjectValues(state.servers, s =>
      deepMerge(initialServerState, s),
    );
  }

  return state;
};
