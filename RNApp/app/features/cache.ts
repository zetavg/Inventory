import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CacheState = Record<string, unknown>;

export const initialState: CacheState = {
  toJSON: function () {
    return JSON.stringify({ _keys: Object.keys(this) });
  },
};

export const cacheSlice = createSlice({
  name: '_cache',
  initialState,
  reducers: {
    set: (state, action: PayloadAction<[string, unknown]>) => {
      if (typeof state !== 'object') {
        state = {};
      }
      state[action.payload[0]] = action.payload[1];
      state.toJSON = initialState.toJSON;
    },
    reset: () => initialState,
  },
});

export const name = cacheSlice.name;

export const reducer = cacheSlice.reducer;

export const actions = {
  cache: cacheSlice.actions,
};

export const selectors = {
  cache: {
    cache: (state: CacheState) => state,
  },
};
