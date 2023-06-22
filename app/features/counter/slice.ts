import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { PersistableReducer } from '@app/redux/types';

// Define a type for the slice state
export interface CounterState {
  value: number;
}

// Define the initial state using that type
export const initialState: CounterState = {
  value: 0,
};

export const counterSlice = createSlice({
  name: 'counter',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    increment: state => {
      state.value += 1;
    },
    decrement: state => {
      state.value -= 1;
    },
    // Use the PayloadAction type to declare the contents of `action.payload`
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
});

// Export the reducer
export const reducer: PersistableReducer<typeof counterSlice.reducer> =
  counterSlice.reducer;

// Export actions
export const actions = {
  counter: counterSlice.actions,
};

// Selectors can be used to retrieve a certain part of the state. The slice
// should not know where it will be in the state tree, so this should only
// select from the slice's own state, and it will be composed as we compose
// reducers.
export const selectors = {
  counter: {
    counterValue: (state: CounterState) => state.value,
  },
};

// Define how the state should be persisted. The slice will not be persisted
// if `.dehydrate` and `.rehydrate` is not defined.

// Filter out parts that shouldn't be persisted, and transform the state
// (for example, convert sets to arrays) if needed.
reducer.dehydrate = (state: CounterState) => ({ value: state.value });

reducer.rehydrate = dehydratedState => dehydratedState;
