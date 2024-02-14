import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import appLogger from '@app/logger';

import { PersistableReducer } from '@app/redux/types';

import deepMerge from '@app/utils/deepMerge';
import mapObjectValues from '@app/utils/mapObjectValues';
import randomUniqueUuid from '@app/utils/randomUniqueUuid';
import { DeepPartial } from '@app/utils/types';

const logger = appLogger.for({ module: 'label-printers' });

export type LabelPrinterEditableData = {
  name: string;
  printerConfig: string;
};

export type LabelPrinter = {
  savedOptions: Record<string, any>;
} & LabelPrinterEditableData;

export const INITIAL_PRINTER_CONFIG = ''.trim();

export const initialPrinterState: LabelPrinter = {
  name: '',
  printerConfig: INITIAL_PRINTER_CONFIG,
  savedOptions: {},
};

export interface LabelPrintersState {
  printers: Record<string, LabelPrinter>;
  lastUsedPrinterId?: string;
}

export const initialState: LabelPrintersState = {
  printers: {},
};

export const labelPrintersSlice = createSlice({
  name: 'labelPrinters',
  initialState,
  reducers: {
    addPrinter: (state, action: PayloadAction<LabelPrinterEditableData>) => {
      const printerId = randomUniqueUuid(Object.keys(state.printers), {
        short: true,
      });
      state.printers[printerId] = {
        ...initialPrinterState,
        ...action.payload,
      };
    },
    updatePrinter: (
      state,
      action: PayloadAction<[string, Partial<LabelPrinterEditableData>]>,
    ) => {
      const [printerId, data] = action.payload;
      const originalPrinterData = state.printers[printerId];
      if (!originalPrinterData) return;

      state.printers[printerId] = {
        ...originalPrinterData,
        ...data,
      };
    },
    deletePrinter: (state, action: PayloadAction<string>) => {
      const printerId = action.payload;
      if (state.printers[printerId]) {
        delete state.printers[printerId];
      }
    },
    setLastUsedPrinterId: (state, action: PayloadAction<string>) => {
      const printerId = action.payload;
      state.lastUsedPrinterId = printerId;
    },
    updatePrinterSavedOptions: (
      state,
      action: PayloadAction<[string, Record<string, any>]>,
    ) => {
      const [printerId, options] = action.payload;
      const printer = state.printers[printerId];
      if (!printer) return;
      printer.savedOptions = options;
    },
  },
});

export const name = labelPrintersSlice.name;

// Export the reducer
export const reducer: PersistableReducer<typeof labelPrintersSlice.reducer> =
  labelPrintersSlice.reducer;

// Export actions
export const actions = {
  labelPrinters: labelPrintersSlice.actions,
};

// Selectors can be used to retrieve a certain part of the state. The slice
// should not know where it will be in the state tree, so this should only
// select from the slice's own state, and it will be composed as we compose
// reducers.
export const selectors = {
  labelPrinters: {
    printers: (
      state: LabelPrintersState,
    ): Record<string, LabelPrinter | undefined> => state.printers,
    lastUsedPrinterId: (state: LabelPrintersState) => state.lastUsedPrinterId,
  },
};

reducer.dehydrate = (state: LabelPrintersState) => {
  if (!state) return {};

  return {
    ...state,
    printers: mapObjectValues(
      state.printers as Record<
        keyof typeof state.printers,
        NonNullable<(typeof state.printers)[keyof typeof state.printers]>
      >,
      printer => ({
        ...printer,
      }),
    ),
  };
};

reducer.rehydrate = dehydratedState => {
  const state: DeepPartial<LabelPrintersState> = {
    ...dehydratedState,
    printers: mapObjectValues(dehydratedState.printers || {}, p => ({
      ...p,
    })),
  };

  // We need to make sure that each printer has a complete state since they will have no initial state to merge from.
  if (state.printers) {
    state.printers = mapObjectValues(state.printers, s =>
      deepMerge(initialPrinterState, s),
    );
  }

  return state;
};

// const a = {
//   printerOptions: {},
//   getLabelData: item => {
//     return {
//       name: item.name,
//       collection_name: item.collection.name,
//     };
//   },
//   print: ({ printerOptions, labelData }) => {
//     console.log({ printerOptions, labelData });
//     const design = 'test-integrate-1';
//     const printer = 'Preview';
//     return Promise.all(
//       labelData.map(data => {
//         const variables = {
//           NAME_LINE_1: 'RFID UHF Tag',
//           COLLECTION: 'Sample Tag 001',
//           NAME_LINE_2: 'NXP UCODE 8',
//           QR_CODE_DATA: 'ze-inv://et/7200051178310000',
//         };
//         return fetch(
//           `http://192.168.88.32:11180/api/v1/print?design=${design}&variables=${encodeURIComponent(
//             JSON.stringify(variables),
//           )}&printer=${printer}&copies=1`,
//           { method: 'POST' },
//         );
//       }),
//     );
//   },
// };
