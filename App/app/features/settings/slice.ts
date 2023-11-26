import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { PersistableReducer } from '@app/redux/types';
import {
  combine,
  mapActionReducers,
  mapSelectors,
  overrideActions,
} from '@app/redux/utils';

export interface SettingsState {
  devTestValue: number;
  devTestSensitiveValue: number;
  uiColorTheme: string;
  /** Show detailed instructions on the UI or not. */
  uiShowDetailedInstructions: boolean;
  uiShowIntegrationsOnMoreScreen: boolean;
}

export const initialState: SettingsState = {
  devTestValue: 0,
  devTestSensitiveValue: 0,
  uiColorTheme: 'blue',
  uiShowDetailedInstructions: true,
  uiShowIntegrationsOnMoreScreen: true,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: combine({
    update: (
      state: SettingsState,
      action: PayloadAction<Partial<SettingsState>>,
    ) => {
      Object.entries(action.payload).forEach(([key, value]) => {
        (state as any)[key] = value;
      });
    },
    devTestIncrement: (state: SettingsState) => {
      state.devTestValue += 1;
    },
    devTestSensitiveIncrement: (state: SettingsState) => {
      state.devTestSensitiveValue += 1;
    },
    setUiColorTheme: (state: SettingsState, action: PayloadAction<string>) => {
      state.uiColorTheme = action.payload;
    },
    setUiShowDetailedInstructions: (
      state: SettingsState,
      action: PayloadAction<boolean>,
    ) => {
      state.uiShowDetailedInstructions = action.payload;
    },
    setUiShowIntegrationsOnMoreScreen: (
      state: SettingsState,
      action: PayloadAction<boolean>,
    ) => {
      state.uiShowIntegrationsOnMoreScreen = action.payload;
    },
    reset: () => initialState,
  }),
});

export const name = settingsSlice.name;

export const reducer: PersistableReducer<typeof settingsSlice.reducer> =
  settingsSlice.reducer;

export const actions = {
  settings: settingsSlice.actions,
};

export const selectors = {
  settings: {
    devTestValue: (state: SettingsState) => state.devTestValue,
    devTestSensitiveValue: (state: SettingsState) =>
      state.devTestSensitiveValue,
    uiColorTheme: (state: SettingsState | undefined) => state?.uiColorTheme,
    uiShowDetailedInstructions: (state: SettingsState) =>
      state.uiShowDetailedInstructions,
    uiShowIntegrationsOnMoreScreen: (state: SettingsState) =>
      state.uiShowIntegrationsOnMoreScreen,
  },
};

reducer.dehydrate = (state: SettingsState) => ({
  devTestValue: state?.devTestValue,
  uiColorTheme: state?.uiColorTheme,
  uiShowDetailedInstructions: state?.uiShowDetailedInstructions,
  uiShowIntegrationsOnMoreScreen: state?.uiShowIntegrationsOnMoreScreen,
});
reducer.rehydrate = dehydratedState => dehydratedState;

reducer.dehydrateSensitive = (state: SettingsState) => ({
  // value: state?.value,
  devTestSensitiveValue: state?.devTestSensitiveValue,
});
reducer.rehydrateSensitive = dehydratedState => dehydratedState;
