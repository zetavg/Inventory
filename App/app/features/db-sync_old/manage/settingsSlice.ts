import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ServerSettings = {
  disabled?: boolean;
};

export type DBSyncSettingsState = {
  disabled?: boolean;
  loggingEnabled?: boolean;
  serverSettings?: {
    [serverName: string]: ServerSettings;
  };
};

export const initialState: DBSyncSettingsState = {};

export const dbSyncSettingsSlice = createSlice({
  name: 'dbSyncSettings',
  initialState,
  reducers: {
    setDisabled: (state, action: PayloadAction<boolean>) => {
      return {
        ...state,
        disabled: action.payload,
      };
    },
    setServerDisabled: (state, action: PayloadAction<[string, boolean]>) => {
      return {
        ...state,
        serverSettings: {
          ...state.serverSettings,
          [action.payload[0]]: {
            ...(state.serverSettings || {})[action.payload[0]],
            disabled: action.payload[1],
          },
        },
      };
    },
    setLoggingEnabled: (state, action: PayloadAction<boolean>) => {
      return {
        ...state,
        loggingEnabled: action.payload,
      };
    },
  },
});

export const { setDisabled, setServerDisabled, setLoggingEnabled } = dbSyncSettingsSlice.actions;

export default dbSyncSettingsSlice.reducer;
