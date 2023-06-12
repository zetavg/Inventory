import { configureStore } from '@reduxjs/toolkit';
import { persistStore } from 'redux-persist';

import logger from './middlewares/logger';

import {
  reducer as counterReducer,
  actions as counterActions,
  selectors as counterSelectors,
} from '@app/features/counter/slice';
import {
  reducer as countersReducer,
  actions as countersActions,
  selectors as countersSelectors,
} from '@app/features/counters/slice';
import profilesReducer from '@app/features/profiles/slice';
import settingsReducer from '@app/features/settings/slice';
import dbSyncStatusReducer from '@app/features/db-sync/manage/statusSlice';
import inventoryReducer from '@app/features/inventory/slice';

import { combineAndPersistReducers, mapSelectors, combine } from './utils';

const reducer = combineAndPersistReducers({
  // counter: counterReducer,
  counters: countersReducer,
  profiles: profilesReducer,
  settings: settingsReducer,
  dbSyncStatus: dbSyncStatusReducer,
  inventory: inventoryReducer,
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

export const actions = combine(
  // counterActions,
  countersActions,
);

export const selectors = combine(
  // mapSelectors(
  //   counterSelectors,
  //   selector => (state: RootState) => selector(state.counter),
  // ),
  mapSelectors(
    countersSelectors,
    selector => (state: RootState) => selector(state.counters),
  ),
);

export default store;

(global as any).reduxStore = store;
