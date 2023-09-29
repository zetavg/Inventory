import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { PersistableReducer } from '@app/redux/types';
import {
  combine,
  mapActionReducers,
  mapSelectors,
  overrideActions,
} from '@app/redux/utils';
import {
  actions as labelPrintersSliceActions,
  initialState as labelPrintersInitialState,
  LabelPrintersState,
  name as labelPrintersSliceName,
  reducer as labelPrintersReducer,
  selectors as labelPrintersSelectors,
} from '@app/features/label-printers/slice';

export interface SettingsState {
  devTestValue: number;
  devTestSensitiveValue: number;
  uiColorTheme: string;
  /** Show detailed instructions on the UI or not. */
  uiShowDetailedInstructions: boolean;
  labelPrinters: LabelPrintersState;
}

export const initialState: SettingsState = {
  devTestValue: 0,
  devTestSensitiveValue: 0,
  uiColorTheme: 'blue',
  uiShowDetailedInstructions: true,
  labelPrinters: labelPrintersInitialState,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: combine(
    {
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
      setUiColorTheme: (
        state: SettingsState,
        action: PayloadAction<string>,
      ) => {
        state.uiColorTheme = action.payload;
      },
      setUiShowDetailedInstructions: (
        state: SettingsState,
        action: PayloadAction<boolean>,
      ) => {
        state.uiShowDetailedInstructions = action.payload;
      },
      reset: () => initialState,
    },
    mapActionReducers(
      labelPrintersSliceActions.labelPrinters,
      actionCreator => (state: SettingsState, action: any) => {
        state.labelPrinters = labelPrintersReducer(
          state.labelPrinters,
          actionCreator(action.payload),
        );
      },
      labelPrintersSliceName,
    ),
  ),
});

export const name = settingsSlice.name;

export const reducer: PersistableReducer<typeof settingsSlice.reducer> =
  settingsSlice.reducer;

export const actions = {
  settings: settingsSlice.actions,
  labelPrinters: overrideActions(
    labelPrintersSliceActions.labelPrinters,
    settingsSlice.actions,
    labelPrintersSliceName,
  ),
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
  labelPrinters: mapSelectors(
    labelPrintersSelectors.labelPrinters,
    selector => (state: SettingsState) => selector(state.labelPrinters),
  ),
};

reducer.dehydrate = (state: SettingsState) => ({
  devTestValue: state?.devTestValue,
  uiColorTheme: state?.uiColorTheme,
  uiShowDetailedInstructions: state?.uiShowDetailedInstructions,
  ...(labelPrintersReducer.dehydrate
    ? { labelPrinters: labelPrintersReducer.dehydrate(state.labelPrinters) }
    : {}),
});
reducer.rehydrate = dehydratedState => dehydratedState;

reducer.dehydrateSensitive = (state: SettingsState) => ({
  // value: state?.value,
  devTestSensitiveValue: state?.devTestSensitiveValue,
});
reducer.rehydrateSensitive = dehydratedState => dehydratedState;
