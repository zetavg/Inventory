import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { PersistableReducer } from '@app/redux/types';

export interface InventoryState {
  recentViewedItemIds: Array<string>;
}

export const initialState: InventoryState = {
  recentViewedItemIds: [],
};

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    addRecentViewedItemId: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;

      state.recentViewedItemIds = [
        id,
        ...state.recentViewedItemIds.filter(q => q !== id),
      ];

      state.recentViewedItemIds = state.recentViewedItemIds.slice(0, 30);
    },
    clearRecentViewedItemId: state => {
      state.recentViewedItemIds = [];
    },
    reset: () => initialState,
  },
});

export const name = inventorySlice.name;

export const reducer: PersistableReducer<typeof inventorySlice.reducer> =
  inventorySlice.reducer;

export const actions = {
  inventory: inventorySlice.actions,
};

export const selectors = {
  inventory: {
    recentViewedItemIds: (state: InventoryState) => state.recentViewedItemIds,
  },
};

reducer.dehydrate = (state: InventoryState) => ({
  recentViewedItemIds: state.recentViewedItemIds,
});
reducer.rehydrate = dehydratedState => dehydratedState;
