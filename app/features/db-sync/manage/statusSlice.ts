import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

export type Status =
  | 'Success'
  | 'Online'
  | 'Syncing'
  | 'Offline'
  | 'Config Error'
  | 'Auth Error'
  | 'Error';

export type ConnectionStatus = {
  lastStatus?: Status;
  lastErrorMessage?: string;
  lastSuccessMessage?: string;
  lastOfflineMessage?: string;
  lastOnlineAt?: number;
  lastSyncedAt?: number;
};

export type ServerStatus = {
  db?: ConnectionStatus;
  attachments_db?: ConnectionStatus;
};

export type DBSyncStatus = {
  serverStatus?: {
    [serverName: string]: ServerStatus;
  };
  /**
   * Status version number. Any updates which the version number does not match
   * the current version number will be ignored.
   */
  v?: number;
};

export type DBSyncStatusState = {
  [profileName: string]: DBSyncStatus;
};

export const initialState: DBSyncStatusState = {};

export const dbSyncStatusSlice = createSlice({
  name: 'dbSyncStatus',
  initialState,
  reducers: {
    updateV: (
      state,
      action: PayloadAction<{ profileName: string; v: number }>,
    ) => {
      if (!state[action.payload.profileName])
        state[action.payload.profileName] = {};
      state[action.payload.profileName].v = action.payload.v;
    },
    reportStatus: (
      state,
      action: PayloadAction<{
        v: number;
        profileName: string;
        serverName: string;
        type: 'db' | 'attachments_db';
        status: Status;
        message?: string;
        timestamp?: number;
      }>,
    ) => {
      const {
        profileName,
        serverName,
        type,
        status,
        message,
        timestamp = new Date().getTime(),
      } = action.payload;

      if (!state[profileName]) state[profileName] = {};
      if (state[profileName].v !== action.payload.v) return;

      const updatedStatus = (() => {
        switch (status) {
          case 'Success':
            return {
              lastStatus: 'Online' as Status,
              lastSyncedAt: timestamp,
              lastOnlineAt: timestamp,
              lastSuccessMessage: message,
            };
          case 'Online':
            return {
              lastStatus: status,
              lastOnlineAt: timestamp,
            };
          case 'Syncing':
            return {
              lastStatus: status,
              lastOnlineAt: timestamp,
            };
          case 'Offline':
            return {
              lastStatus: status,
              lastOfflineMessage: message,
            };
          case 'Config Error':
          case 'Auth Error':
          case 'Error':
            return {
              lastStatus: status,
              lastErrorMessage: message,
            };
        }
      })();

      if (!state[profileName].serverStatus)
        state[profileName].serverStatus = {};
      const serverStatus = state[profileName].serverStatus;
      if (!serverStatus) throw new Error('Impossible');
      if (!serverStatus[serverName]) serverStatus[serverName] = {};

      serverStatus[serverName][type] = {
        ...serverStatus[serverName][type],
        ...updatedStatus,
      };
    },
    clearStatus: () => {
      return {};
    },
  },
});

// TODO: Delete data when profile or DB config is deleted

export const { updateV, reportStatus, clearStatus } = dbSyncStatusSlice.actions;

export default persistReducer(
  {
    key: 'dbSyncStatus',
    storage: AsyncStorage,
    timeout: 5000,
  },
  dbSyncStatusSlice.reducer,
);
