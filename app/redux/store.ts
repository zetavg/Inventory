import { configureStore } from '@reduxjs/toolkit';
import { persistStore } from 'redux-persist';

import {
  actions as counterActions,
  reducer as counterReducer,
  selectors as counterSelectors,
} from '@app/features/counter/slice';
import {
  actions as countersActions,
  reducer as countersReducer,
  selectors as countersSelectors,
} from '@app/features/counters/slice';
import dbSyncStatusReducer from '@app/features/db-sync/manage/statusSlice';
import {
  actions as devToolsActions,
  reducer as devToolsReducer,
  selectors as devToolsSelectors,
} from '@app/features/dev-tools/slice';
import inventoryReducer from '@app/features/inventory/slice';
import profilesReducer from '@app/features/profiles/slice';
import settingsReducer from '@app/features/settings/slice';

import logger from './middlewares/logger';
import { combineAndPersistReducers, mapGroupedSelectors } from './utils';

const reducer = combineAndPersistReducers({
  // counter: counterReducer,
  counters: countersReducer,
  profiles: profilesReducer,
  settings: settingsReducer,
  dbSyncStatus: dbSyncStatusReducer,
  inventory: inventoryReducer,
  devTools: devToolsReducer,
});

export const store = configureStore({
  middleware: getDefaultMiddleware => {
    const middleware = getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
        ignoredPaths: ['profiles.runtimeData'],
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
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const actions = {
  ...counterActions,
  ...countersActions,
  ...devToolsActions,
};

export const selectors = {
  ...mapGroupedSelectors(
    counterSelectors,
    selector => (state: RootState) => selector(state.counters),
  ),
  ...mapGroupedSelectors(
    countersSelectors,
    selector => (state: RootState) => selector(state.counters),
  ),
  ...mapGroupedSelectors(
    devToolsSelectors,
    selector => (state: RootState) => selector(state.devTools),
  ),
};

export default store;

(global as any).reduxStore = store;
