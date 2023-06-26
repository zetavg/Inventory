import { configureStore } from '@reduxjs/toolkit';
import { persistStore } from 'redux-persist';

import {
  actions as counterSliceActions,
  // reducer as counterReducer,
  selectors as counterSliceSelectors,
} from '@app/features/counter/slice';
import {
  actions as countersSliceActions,
  // reducer as countersReducer,
  selectors as countersSliceSelectors,
} from '@app/features/counters/slice';
import {
  actions as devToolsSliceActions,
  reducer as devToolsReducer,
  selectors as devToolsSliceSelectors,
} from '@app/features/dev-tools/slice';
import {
  actions as profilesSliceActions,
  reducer as profilesReducer,
  selectors as profilesSliceSelectors,
} from '@app/features/profiles/slice';
import {
  actions as settingsSliceActions,
  reducer as settingsReducer,
  selectors as settingsSliceSelectors,
} from '@app/features/settings/slice';

import logger from './middlewares/logger';
import { combineAndPersistReducers, mapGroupedSelectors } from './utils';

export const reducers = {
  settings: settingsReducer,
  profiles: profilesReducer,
  devTools: devToolsReducer,
  // For development demonstration
  // counter: counterReducer,
  // counters: countersReducer,

  // Old
  // profiles: profilesReducer,
  // dbSyncStatus: dbSyncStatusReducer,
  // inventory: inventoryReducer,
};

// Combine all reducers.
export const reducer = combineAndPersistReducers(reducers);

// Collect actions from all slices.
export const actions = {
  ...counterSliceActions,
  ...countersSliceActions,
  ...settingsSliceActions,
  ...profilesSliceActions,
  ...devToolsSliceActions,
};

// Collect selectors from all slices.
// We need to map the selectors to select values from the root state.
export const selectors = {
  ...mapGroupedSelectors(
    counterSliceSelectors,
    selector => (state: RootState) => selector((state as any).counter),
  ),
  ...mapGroupedSelectors(
    countersSliceSelectors,
    selector => (state: RootState) => selector((state as any).counters),
  ),
  ...mapGroupedSelectors(
    settingsSliceSelectors,
    selector => (state: RootState) => selector(state.settings),
  ),
  ...mapGroupedSelectors(
    profilesSliceSelectors,
    selector => (state: RootState) => selector(state.profiles),
  ),
  ...mapGroupedSelectors(
    devToolsSliceSelectors,
    selector => (state: RootState) => selector(state.devTools),
  ),
  rehydratedKeys: (state: RootState): ReadonlyArray<string> => {
    const keys = (state as any)._rehydrated_keys;

    if (Array.isArray(keys)) {
      return keys;
    } else if (typeof keys === 'object') {
      return Object.values(keys);
    }

    return [];
  },
};

export const store = configureStore({
  middleware: getDefaultMiddleware => {
    const middleware = getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          '_cache/set',
          'profiles/_cache_set',
        ],
        ignoredPaths: [/_cache/],
      },
    }).concat(logger);

    if (__DEV__) {
      const reduxDebugger = require('redux-middleware-flipper').default;
      middleware.push(
        reduxDebugger({
          actionsBlacklist: [],
          actionsWhitelist: [],
          actionReplayDelay: 500,
        }),
      );
    }

    return middleware;
  },
  reducer,
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;

// Add the store to the global scope for debugging purposes.
(global as any).reduxStore = store;
