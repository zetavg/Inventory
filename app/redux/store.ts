import { configureStore } from '@reduxjs/toolkit';
import { persistStore } from 'redux-persist';

import logger from './middlewares/logger';

import mapObjectValues from '@app/utils/mapObjectValues';

import {
  getReducer as getCounterReducer,
  selectors as counterSelectors,
} from '@app/features/counter/slice';
import profilesReducer from '@app/features/profiles/slice';
import settingsReducer from '@app/features/settings/slice';
import dbSyncStatusReducer from '@app/features/db-sync/manage/statusSlice';
import inventoryReducer from '@app/features/inventory/slice';

export const store = configureStore({
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
        ignoredPaths: ['profiles.runtimeData'],
      },
    }).concat(logger),
  reducer: {
    counter: getCounterReducer(),
    profiles: profilesReducer,
    settings: settingsReducer,
    dbSyncStatus: dbSyncStatusReducer,
    inventory: inventoryReducer,
  },
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const selectors = {
  ...mapObjectValues(
    counterSelectors,
    selector => (state: RootState) => selector(state.counter),
  ),
};

export default store;

(global as any).reduxStore = store;
