import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@app/redux/store';
import { persistReducer } from 'redux-persist';
import { selectActiveProfileName } from '@app/features/profiles/selectors';

// Define a type for the slice state
interface InventoryState {
  [profileName: string]:
    | {
        recentSearchQueries?: Array<string>;
      }
    | undefined;
}

// Define the initial state using that type
const initialState: InventoryState = {};

export const inventorySlice = createSlice({
  name: 'inventory',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    addRecentSearchQuery: (
      state,
      action: PayloadAction<{ query: string; activeProfileName?: string }>,
    ) => {
      const { activeProfileName, query } = action.payload;
      if (!activeProfileName) return;
      if (!query) return;

      if (!state[activeProfileName]) {
        state[activeProfileName] = {};
      }

      const s = state[activeProfileName];
      if (!s) return;

      if (!s.recentSearchQueries) {
        s.recentSearchQueries = [];
      }

      s.recentSearchQueries = [
        query,
        ...s.recentSearchQueries.filter(q => q !== query),
      ];

      s.recentSearchQueries = s.recentSearchQueries.slice(0, 30);
    },
    removeRecentSearchQuery: (
      state,
      action: PayloadAction<{ query: string; activeProfileName?: string }>,
    ) => {
      const { activeProfileName } = action.payload;
      if (!activeProfileName) return;

      const s = state[activeProfileName];
      if (!s) return;
      if (!s.recentSearchQueries) return;

      s.recentSearchQueries = s.recentSearchQueries.filter(
        q => q !== action.payload.query,
      );
    },
    clearRecentSearchQueries: (
      state,
      action: PayloadAction<{ activeProfileName?: string }>,
    ) => {
      const { activeProfileName } = action.payload;
      if (!activeProfileName) return;

      const s = state[activeProfileName];
      if (!s) return;

      s.recentSearchQueries = [];
    },
  },
});

export const {
  addRecentSearchQuery,
  removeRecentSearchQuery,
  clearRecentSearchQueries,
} = Object.fromEntries(
  Object.entries(inventorySlice.actions).map(([name, fn]) => [
    name,
    (payload: any) => {
      const store = (global as any).reduxStore;
      if (!store) throw new Error('Store is not ready');

      const activeProfileName = selectActiveProfileName(store.getState());
      return fn({
        ...payload,
        activeProfileName: payload.activeProfileName || activeProfileName,
      });
    },
  ]),
) as typeof inventorySlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectRecentSearchQueries = (state: RootState) => {
  const activeProfileName = selectActiveProfileName(state);
  return (
    (state.inventory[activeProfileName || ''] || {}).recentSearchQueries || []
  );
};

export default persistReducer(
  {
    key: 'inventory',
    storage: AsyncStorage,
    timeout: 50000,
  },
  inventorySlice.reducer,
);
