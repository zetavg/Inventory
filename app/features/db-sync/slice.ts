import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import appLogger from '@app/logger';

import { PersistableReducer } from '@app/redux/types';

import deepMerge from '@app/utils/deepMerge';
import mapObjectValues from '@app/utils/mapObjectValues';
import randomUniqueUuid from '@app/utils/randomUniqueUuid';
import { DeepPartial } from '@app/utils/types';

const logger = appLogger.for({ module: 'db-sync' });

export type DBSyncServerEditableData = {
  enabled: boolean;
  name: string;
  uri: string;
  username: string;
  password: string;
};

export type DBSyncServer = DBSyncServerEditableData & {};

export type DBSyncServerStatus =
  | 'Initializing'
  | '-'
  | 'Disabled'
  | 'Offline'
  | 'Syncing'
  | 'Online'
  | 'Error';
export type DBSyncServerStatusObj = {
  status?: DBSyncServerStatus;
  lastErrorMessage?: string;
  lastSyncedAt?: number;
  localDBUpdateSeq?: number;
  remoteDBUpdateSeq?: number;
  pushLastSeq?: number;
  pullLastSeq?: number;
};

// Define a type for the slice state
export interface DBSyncState {
  enable: boolean;
  servers: Record<string, DBSyncServer>;
  serverStatuses: Record<string, DBSyncServerStatusObj>;
}

export const initialServerState = {
  enabled: true,
  name: '',
  uri: '',
  username: '',
  password: '',
} as const;

export const initialServerStateObjState = {
  status: 'Initializing',
} as const;

// Define the initial state using that type
export const initialState: DBSyncState = {
  enable: true,
  servers: {},
  serverStatuses: {},
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
        ...initialServerState,
        ...action.payload,
      };
    },
    updateServer: (
      state,
      action: PayloadAction<[string, Partial<DBSyncServerEditableData>]>,
    ) => {
      const [serverId, data] = action.payload;
      const originalServerData = state.servers[serverId];
      if (!originalServerData) return;

      state.servers[serverId] = {
        ...originalServerData,
        ...data,
      };
    },
    toggleServerEnable: (state, action: PayloadAction<string>) => {
      const serverId = action.payload;
      const serverData = state.servers[serverId];
      if (!serverData) return;
      serverData.enabled = !serverData.enabled;
    },
    deleteServer: (state, action: PayloadAction<string>) => {
      const serverId = action.payload;
      if (state.servers[serverId]) {
        delete state.servers[serverId];
      }
      if (state.serverStatuses[serverId]) {
        delete state.serverStatuses[serverId];
      }
    },
    updateServerStatus: (
      state,
      action: PayloadAction<[string, DBSyncServerStatus]>,
    ) => {
      const [serverId, status] = action.payload;
      const serverStatuses = state.serverStatuses[serverId] || {};
      serverStatuses.status = status;
      state.serverStatuses[serverId] = serverStatuses;
    },
    setServerLastErrorMessage: (
      state,
      action: PayloadAction<[string, string]>,
    ) => {
      const [serverId, message] = action.payload;
      const serverStatus = state.serverStatuses[serverId] || {};
      serverStatus.lastErrorMessage = message;
      state.serverStatuses[serverId] = serverStatus;
      if (!state.servers[serverId]) return;
    },
    updateAllServerStatus: (
      state,
      action: PayloadAction<DBSyncServerStatus>,
    ) => {
      const status = action.payload;
      for (const serverId in state.servers) {
        const serverStatus = state.serverStatuses[serverId] || {};
        serverStatus.status = status;
        state.serverStatuses[serverId] = serverStatus;
      }
    },
    updateSyncProgress: (
      state,
      action: PayloadAction<
        [
          string,
          {
            localDBUpdateSeq?: number;
            remoteDBUpdateSeq?: number;
            pushLastSeq?: number;
            pullLastSeq?: number;
          },
        ]
      >,
    ) => {
      const [serverId, s] = action.payload;
      const serverStatus = state.serverStatuses[serverId] || {};
      Object.entries(s).forEach(([k, v]) => {
        if (typeof v !== 'number') return;
        (serverStatus as any)[k] = v;
      });

      // if (serverStatus.status !== 'Disabled') {
      //   if (
      //     serverStatus.localDBUpdateSeq === serverStatus.pushLastSeq &&
      //     serverStatus.remoteDBUpdateSeq === serverStatus.pullLastSeq
      //   ) {
      //     serverStatus.lastSyncedAt = new Date().getTime();
      //     serverStatus.status = 'Synced';
      //   } else {
      //     serverStatus.status = 'Syncing';
      //   }
      // }

      // if (
      //   serverStatus.localDBUpdateSeq === serverStatus.pushLastSeq &&
      //   serverStatus.remoteDBUpdateSeq === serverStatus.pullLastSeq
      // ) {
      //   serverStatus.lastSyncedAt = new Date().getTime();
      // }

      state.serverStatuses[serverId] = serverStatus;
    },
    updateLastSyncedAt: (state, action: PayloadAction<[string, number]>) => {
      const [serverId, timestamp] = action.payload;
      const serverStatus = state.serverStatuses[serverId] || {};
      serverStatus.lastSyncedAt = timestamp;
      state.serverStatuses[serverId] = serverStatus;
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
    serverStatuses: (state: DBSyncState) => state.serverStatuses,
    overallStatus: (state: DBSyncState) => {
      if (Object.keys(state.servers).length <= 0) {
        return 'Not Configured';
      }

      if (!state.enable) {
        return 'Disabled';
      }

      const serverStatuses = Object.keys(state.servers).map(
        s => state.serverStatuses[s]?.status,
      );

      if (!state.enable) {
        return 'Disabled';
      }

      if (serverStatuses.every(s => s === 'Disabled')) {
        return 'All Disabled';
      }

      if (serverStatuses.some(s => !s)) {
        return 'Initializing';
      }

      if (serverStatuses.some(s => s === '-')) {
        return 'Initializing';
      }

      if (serverStatuses.some(s => s === 'Initializing')) {
        return 'Initializing';
      }

      if (serverStatuses.some(s => s === 'Syncing')) {
        return 'Syncing';
      }

      if (serverStatuses.some(s => s === 'Error')) {
        return 'Error';
      }

      if (
        serverStatuses
          .filter(s => s !== 'Disabled' && s !== 'Offline')
          .every(s => s === 'Online')
      ) {
        return 'Online';
      }

      if (serverStatuses.some(s => s === 'Offline')) {
        return 'Offline';
      }

      const e = new Error();
      logger.warn(`Unhandled overall status for ${serverStatuses}`, {
        function: 'selectors/overallStatus',
        e,
      });

      return '-';
    },
  },
};

reducer.dehydrateSensitive = (state: DBSyncState) => {
  if (!state) return {};

  return {
    ...state,
    servers: mapObjectValues(
      state.servers as Record<
        keyof typeof state.servers,
        NonNullable<(typeof state.servers)[keyof typeof state.servers]>
      >,
      server => ({
        enabled: server.enabled,
        name: server.name,
        uri: server.uri,
        username: server.username,
        password: server.password,
      }),
    ),
    serverStatuses: mapObjectValues(
      state.serverStatuses as Record<
        keyof typeof state.serverStatuses,
        NonNullable<
          (typeof state.serverStatuses)[keyof typeof state.serverStatuses]
        >
      >,
      server => ({
        lastSyncedAt: server.lastSyncedAt,
        localDBUpdateSeq: server.localDBUpdateSeq,
        remoteDBUpdateSeq: server.remoteDBUpdateSeq,
        pushLastSeq: server.pushLastSeq,
        pullLastSeq: server.pullLastSeq,
      }),
    ),
  };
};

reducer.rehydrateSensitive = dehydratedState => {
  const state: DeepPartial<DBSyncState> = {
    ...dehydratedState,
    servers: mapObjectValues(dehydratedState.servers || {}, s => ({
      ...s,
    })),
    serverStatuses: mapObjectValues(
      dehydratedState.serverStatuses || {},
      s => ({
        ...s,
      }),
    ),
  };

  // We need to make sure that each server has a complete state since they will have no initial state to merge from.
  if (state.servers) {
    state.servers = mapObjectValues(state.servers, s =>
      deepMerge(initialServerState, s),
    );
  }

  return state;
};
