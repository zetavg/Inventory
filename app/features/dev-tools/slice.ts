import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { PersistableReducer } from '@app/redux/types';

// Define a type for the slice state
export interface DevToolsState {
  show: boolean;
}

// Define the initial state using that type
export const initialState: DevToolsState = {
  show: false,
};

export const devToolsSlice = createSlice({
  name: 'dev-tools',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    toggleShowDevTools: state => {
      state.show = !state.show;
    },
    showDevTools: state => {
      state.show = true;
    },
  },
});

// Export the reducer
export const reducer: PersistableReducer<typeof devToolsSlice.reducer> =
  devToolsSlice.reducer;

// Export actions
export const actions = devToolsSlice.actions;

// Selectors can be used to retrieve a certain part of the state. The slice
// should not know where it will be in the state tree, so this should only
// select from the slice's own state, and it will be composed as we compose
// reducers.
export const selectors = {
  showDevTools: (state: DevToolsState) => state.show,
};

// Define how the state should be persisted. The slice will not be persisted
// if `.dehydrate` and `.rehydrate` is not defined.

// Filter out parts that shouldn't be persisted, and transform the state
// (for example, convert sets to arrays) if needed.
reducer.dehydrate = (state: DevToolsState) => ({ show: state.show });

reducer.rehydrate = dehydratedState => dehydratedState;
