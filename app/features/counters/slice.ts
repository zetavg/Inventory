import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { PersistableReducer } from '@app/redux/types';
import { combine, mapActionReducers, mapSelectors } from '@app/redux/utils';
import {
  actions as counterActions,
  CounterState,
  initialState as counterInitialState,
  reducer as counterReducer,
  selectors as counterSelectors,
} from '@app/features/counter/slice';

import mapObjectValues from '@app/utils/mapObjectValues';

// Here we will define a slice that manages multiple counters.
// We will use the counter slice we defined earlier, and compose them.

// Define a type for the slice state
interface CountersState {
  currentCounter: string;
  counters: {
    [key: string]: CounterState;
  };
}

// Define the initial state using that type
const initialState: CountersState = {
  currentCounter: 'default',
  counters: {
    default: counterInitialState,
  },
};

export const countersSlice = createSlice({
  name: 'counters',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    // Reducers for adding, deleting, and switching counters.
    newCounter: (state, action: PayloadAction<string>) => {
      state.counters[action.payload] = counterInitialState;
    },
    setCurrentCounter: (state, action: PayloadAction<string>) => {
      state.currentCounter = action.payload;
    },
    deleteCounter: (state, action: PayloadAction<string>) => {
      if (Object.keys(state.counters).length === 1) {
        throw new Error('Cannot delete last counter');
      }
      delete state.counters[action.payload];
      if (state.currentCounter === action.payload) {
        state.currentCounter = Object.keys(state.counters)[0];
      }
    },
    // Use the counter reducer to handle actions for the current counter.
    ...mapActionReducers(
      counterActions,
      actionCreator => (state: CountersState, action: any) => {
        state.counters[state.currentCounter] = counterReducer(
          state.counters[state.currentCounter],
          (actionCreator as any)(action.payload),
        );
      },
    ),
  },
});

// Export the reducer
export const reducer: PersistableReducer<typeof countersSlice.reducer> =
  countersSlice.reducer;

// Export actions
export const actions = countersSlice.actions;

// Selectors, the `combine` function can detect and prevent collisions.
export const selectors = combine(
  {
    currentCounter: (state: CountersState) => state.currentCounter,
    counterNames: (state: CountersState) => Object.keys(state.counters),
  },
  // Use `mapSelectors` to map selectors from the counter slice.
  mapSelectors(
    counterSelectors,
    selector => (state: CountersState) =>
      selector(state.counters[state.currentCounter]),
  ),
);

// Define how the state should be persisted. The slice will not be persisted
// if `.dehydrate` and `.rehydrate` is not defined.
// Remember to call the dehydrate and rehydrate functions of the composed
// reducers.

// Filter out parts that shouldn't be persisted, and transform the state
// (for example, convert sets to arrays) if needed.
reducer.dehydrate = (state: CountersState) => {
  let dehydratedState: Partial<CountersState> = {};

  const counterReducerDehydrate = counterReducer.dehydrate;
  if (counterReducerDehydrate) {
    dehydratedState.counters = mapObjectValues(state.counters, s =>
      counterReducerDehydrate(s),
    );
  }

  // We will not persist the current counter.

  return dehydratedState;
};

reducer.rehydrate = dehydratedState => {
  let state: Partial<CountersState> = {};

  const counterReducerRehydrate = counterReducer.rehydrate;
  if (counterReducerRehydrate) {
    state.counters = mapObjectValues(dehydratedState.counters, s =>
      counterReducerRehydrate(s),
    );
  }

  if (state.counters) {
    if (Object.keys(state.counters).length < 1) {
      delete state.counters;
    } else {
      state.currentCounter = Object.keys(state.counters)[0];
    }
  }

  return { ...initialState, ...state };
};
