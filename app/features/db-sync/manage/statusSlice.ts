import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

export type Status =
  | 'Success'
  | 'Online'
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
  lastUpdatedAt?: number;
};

export type ServerStatus = {
  db?: ConnectionStatus;
  attachments_db?: ConnectionStatus;
};

export type DBSyncStatus = {
  serverStatus?: {
    [serverName: string]: ServerStatus;
  };
};

export type DBSyncStatusState = {
  [profileName: string]: DBSyncStatus;
};

export const initialState: DBSyncStatusState = {};

export const dbSyncStatusSlice = createSlice({
  name: 'dbSyncStatus',
  initialState,
  reducers: {
    reportStatus: (
      state,
      action: PayloadAction<{
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

      const updatedStatus = (() => {
        switch (status) {
          case 'Success':
            return {
              lastStatus: status,
              lastUpdatedAt: timestamp,
              lastOnlineAt: timestamp,
              lastSuccessMessage: message,
            };
          case 'Online':
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

      if (!state[profileName]) state[profileName] = {};
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

export const { reportStatus, clearStatus } = dbSyncStatusSlice.actions;

export default persistReducer(
  {
    key: 'dbSyncStatus',
    storage: AsyncStorage,
    timeout: 5000,
  },
  dbSyncStatusSlice.reducer,
);
