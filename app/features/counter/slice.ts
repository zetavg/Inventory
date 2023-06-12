import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

// Define a type for the slice state
interface CounterState {
  value: number;
}

// Define the initial state using that type
const initialState: CounterState = {
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

export const actions = counterSlice.actions;

export const selectors = {
  counterValue: (state: CounterState) => state.value,
};

export function getReducer(keySuffix?: string) {
  return persistReducer(
    {
      key: ['counter', keySuffix].filter(s => s).join('-'),
      storage: AsyncStorage,
      whitelist: ['value'],
      timeout: 50000,
    },
    counterSlice.reducer,
  );
}
