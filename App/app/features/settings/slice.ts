import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { PersistableReducer } from '@app/redux/types';

export interface SettingsState {
  devTestValue: number;
  devTestSensitiveValue: number;
  uiColorTheme: string;
  /** Show detailed instructions on the UI or not. */
  uiShowDetailedInstructions: boolean;
}

export const initialState: SettingsState = {
  devTestValue: 0,
  devTestSensitiveValue: 0,
  uiColorTheme: 'blue',
  uiShowDetailedInstructions: true,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    update: (state, action: PayloadAction<Partial<SettingsState>>) => {
      Object.entries(action.payload).forEach(([key, value]) => {
        (state as any)[key] = value;
      });
    },
    devTestIncrement: state => {
      state.devTestValue += 1;
    },
    devTestSensitiveIncrement: state => {
      state.devTestSensitiveValue += 1;
    },
    setUiColorTheme: (state, action: PayloadAction<string>) => {
      state.uiColorTheme = action.payload;
    },
    setUiShowDetailedInstructions: (state, action: PayloadAction<boolean>) => {
      state.uiShowDetailedInstructions = action.payload;
    },
    reset: () => initialState,
  },
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
  },
};

reducer.dehydrate = (state: SettingsState) => ({
  devTestValue: state?.devTestValue,
  uiColorTheme: state?.uiColorTheme,
  uiShowDetailedInstructions: state?.uiShowDetailedInstructions,
});
reducer.rehydrate = dehydratedState => dehydratedState;

reducer.dehydrateSensitive = (state: SettingsState) => ({
  // value: state?.value,
  devTestSensitiveValue: state?.devTestSensitiveValue,
});
reducer.rehydrateSensitive = dehydratedState => dehydratedState;
