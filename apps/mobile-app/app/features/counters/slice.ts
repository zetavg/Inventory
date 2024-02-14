import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { PersistableReducer } from '@app/redux/types';
import {
  combine,
  mapActionReducers,
  mapSelectors,
  overrideActions,
} from '@app/redux/utils';
import {
  actions as counterSliceActions,
  CounterState,
  initialState as counterInitialState,
  name as counterSliceName,
  reducer as counterReducer,
  selectors as counterSliceSelectors,
} from '@app/features/counter/slice';

import deepMerge from '@app/utils/deepMerge';
import mapObjectValues from '@app/utils/mapObjectValues';
import { DeepPartial } from '@app/utils/types';

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
  initialState,
  // The `combine` function is used to ensure composed action names will not collide.
  reducers: combine(
    // Reducers for adding, deleting, and switching counters.
    {
      newCounter: (state: CountersState, action: PayloadAction<string>) => {
        state.counters[action.payload] = counterInitialState;
      },
      setCurrentCounter: (
        state: CountersState,
        action: PayloadAction<string>,
      ) => {
        if (!state.counters[action.payload]) return;

        state.currentCounter = action.payload;
      },
      deleteCounter: (state: CountersState, action: PayloadAction<string>) => {
        if (Object.keys(state.counters).length === 1) {
          throw new Error('Cannot delete last counter');
        }
        delete state.counters[action.payload];
        if (state.currentCounter === action.payload) {
          state.currentCounter = Object.keys(state.counters)[0];
        }
      },
    },
    // Use the counter reducer to handle actions for the current counter.
    mapActionReducers(
      counterSliceActions.counter,
      actionCreator => (state: CountersState, action: any) => {
        state.counters[state.currentCounter] = counterReducer(
          state.counters[state.currentCounter],
          actionCreator(action.payload),
        );
      },
      counterSliceName,
    ),
  ),
});

export const name = countersSlice.name;

// Export the reducer
export const reducer: PersistableReducer<typeof countersSlice.reducer> =
  countersSlice.reducer;

// Export actions. Here we will re-export and override actions from composed slices.
export const actions = {
  counters: countersSlice.actions,
  counter: overrideActions(
    counterSliceActions.counter,
    countersSlice.actions,
    counterSliceName,
  ),
};

// Export selectors. Here we will re-export and override selectors from composed slices.
export const selectors = {
  counters: {
    currentCounter: (state: CountersState) => state.currentCounter,
    counterNames: (state: CountersState) => Object.keys(state.counters),
  },
  counter:
    // Use `mapSelectors` to map selectors from the counter slice.
    mapSelectors(
      counterSliceSelectors.counter,
      selector => (state: CountersState) =>
        selector(state.counters[state.currentCounter]),
    ),
};

// Define how the state should be persisted. The slice will not be persisted
// if `.dehydrate` and `.rehydrate` is not defined.

reducer.dehydrate = (state: CountersState) => ({
  ...state,
  // Compose the dehydrate functions of the composed reducers.
  ...(counterReducer.dehydrate
    ? {
        counters: mapObjectValues(state.counters, counterReducer.dehydrate),
      }
    : {}),
});

reducer.rehydrate = (dehydratedState: DeepPartial<CountersState>) => {
  const state = {
    ...dehydratedState,
    // Compose the rehydrate functions of the composed reducers.
    ...(dehydratedState.counters && counterReducer.rehydrate
      ? {
          counters: mapObjectValues(
            dehydratedState.counters,
            counterReducer.rehydrate,
          ),
        }
      : {}),
  };

  // If rehydrated counters are empty, delete it so that the default counters will not be overwritten.
  if (state.counters && Object.keys(state.counters).length < 1) {
    delete state.counters;
  }

  // We need to make sure that each counter has a complete state since they will have no initial state to merge from.
  if (state.counters) {
    state.counters = mapObjectValues(state.counters, s =>
      deepMerge(counterInitialState, s),
    );
  }

  // Ensure that a counter is selected.
  if (state.counters && !state.counters[state.currentCounter || '']) {
    state.currentCounter = Object.keys(state.counters)[0];
  }

  return state;
};
