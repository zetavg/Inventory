import React, { useContext } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { RFIDSheetOptions } from '@app/features/rfid/RFIDSheet';

type OpenRfidSheetOptions = RFIDSheetOptions;

const RootBottomSheetsContext = React.createContext<{
  rfidSheet: React.RefObject<BottomSheetModal>;
  rfidSheetPassOptionsFn: React.RefObject<
    (options: OpenRfidSheetOptions) => void
  >;
  openRfidSheet: (options: OpenRfidSheetOptions) => void;
}>({
  rfidSheet: { current: null },
  rfidSheetPassOptionsFn: { current: null },
  openRfidSheet: () => {},
});

export function useRootBottomSheets() {
  return useContext(RootBottomSheetsContext);
}

export default RootBottomSheetsContext;
