import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { PersistableReducer } from '@app/redux/types';

import deepMerge from '@app/utils/deepMerge';
import mapObjectValues from '@app/utils/mapObjectValues';
import { DeepPartial } from '@app/utils/types';

export type IntegrationEditableData = {
  secrets?: { [key: string]: string };
};

export type Integration = IntegrationEditableData & {};

export interface IntegrationsState {
  integrations: Record<string, Integration>;
}

export const initialIntegrationState = {
  secrets: {},
} as const;

export const initialState: IntegrationsState = {
  integrations: {},
};

export const integrationsSlice = createSlice({
  name: 'integrations',
  initialState,
  reducers: {
    updateSecrets: (
      state,
      action: PayloadAction<[string, { [key: string]: string }]>,
    ) => {
      const [integrationId, data] = action.payload;
      if (!state.integrations[integrationId]) {
        state.integrations[integrationId] = {};
      }

      state.integrations[integrationId] = {
        ...state.integrations[integrationId],
        secrets: {
          ...state.integrations[integrationId].secrets,
          ...data,
        },
      };
    },
    deleteIntegrationData: (state, action: PayloadAction<string>) => {
      const integrationId = action.payload;
      if (state.integrations[integrationId]) {
        delete state.integrations[integrationId];
      }
    },
  },
});

export const name = integrationsSlice.name;

// Export the reducer
export const reducer: PersistableReducer<typeof integrationsSlice.reducer> =
  integrationsSlice.reducer;

// Export actions
export const actions = {
  integrations: integrationsSlice.actions,
};

export const selectors = {
  integrations: {
    integrations: (state: IntegrationsState) => state.integrations,
  },
};

reducer.dehydrateSensitive = (state: IntegrationsState) => {
  if (!state) return {};

  return {
    ...state,
    integrations: mapObjectValues(
      state.integrations as Record<
        keyof typeof state.integrations,
        NonNullable<
          (typeof state.integrations)[keyof typeof state.integrations]
        >
      >,
      server => ({
        secrets: server.secrets,
      }),
    ),
  };
};

reducer.rehydrateSensitive = dehydratedState => {
  const state: DeepPartial<IntegrationsState> = {
    ...dehydratedState,
    integrations: mapObjectValues(dehydratedState.integrations || {}, s => ({
      ...s,
    })),
  };

  // We need to make sure that each server has a complete state since they will have no initial state to merge from.
  if (state.integrations) {
    state.integrations = mapObjectValues(state.integrations, s =>
      deepMerge(initialIntegrationState, s),
    );
  }

  return state;
};
