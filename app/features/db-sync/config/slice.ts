import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@app/redux/store';
import { persistReducer } from 'redux-persist';

type RemoteDBConnectionConfig = {
  uri: string;
  username: string;
  password: string;
};

type SyncConnectionConfig = {
  db: RemoteDBConnectionConfig;
  attachmentsDB: RemoteDBConnectionConfig;
};

export type DBSyncConfigState = {
  [name: string]: SyncConnectionConfig;
};

export const initialState: DBSyncConfigState = {};

export const dbSyncConfigSlice = createSlice({
  name: 'dbSyncConfig',
  initialState,
  reducers: {
    createOrUpdateSync: (
      state,
      action: PayloadAction<{
        name: string;
        syncConnectionConfig: SyncConnectionConfig;
      }>,
    ) => {
      state[action.payload.name] = action.payload.syncConnectionConfig;
    },
    removeSync: (
      state,
      action: PayloadAction<{
        name: string;
      }>,
    ) => {
      const { name } = action.payload;

      const newState = {
        ...state,
      };
      delete newState[name];
      state = newState;
      return state;
    },
  },
});

export const { createOrUpdateSync, removeSync } = dbSyncConfigSlice.actions;

export default dbSyncConfigSlice.reducer;
